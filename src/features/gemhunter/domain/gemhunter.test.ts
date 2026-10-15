import { describe, expect, it } from 'vitest'
import { createInitialState as createGemBondState, reduce as gemBondReduce, type Action as GemBondAction } from '@/app/reducer'
import { merchants, SELF_ID } from '@/data/merchants'
import { createSeedCampaign } from '../data/seed'
import { apply, createInitialState, reduce, type Action } from './reducer'
import { canTransition, eligibilityChecks, transition } from './lifecycle'
import { MAX_TITLE_LENGTH, validateEditedTitle, validateSuggestion } from './menu-audit'
import { validateSubmission } from './submissions'
import { approvedPhotos, pendingSubmissions, storefrontPhotos } from './submissions'
import { evidenceOf } from './graduation'
import { buildHandoff } from './handoff'
import type { GemHunterPhase, GemHunterState } from './types'

const T = '2026-10-14'
const fresh = () => createInitialState()
const run = (s: GemHunterState, ...a: Action[]) => a.reduce(reduce, s)
const self = merchants.find((m) => m.id === SELF_ID)!
const MENU = self.sampleMenu.map((m) => m.name)

const startReview: Action = { type: 'startMenuReview' }
const decideAll: Action[] = [
  { type: 'decideMenu', itemId: 'menu-1', decision: 'accepted' },
  { type: 'decideMenu', itemId: 'menu-2', decision: 'kept' },
  { type: 'editMenu', itemId: 'menu-3', title: '  ปีกไก่ทอดน้ำปลา สูตรบ้านสวน  ' },
]
/** Campaign is live: eligibility passed, menu fully decided, campaign started. */
const live = () => run(fresh(), startReview, ...decideAll, { type: 'startCampaign' })

const submit = (hunterId: string, menuItemName = MENU[0], rating = 5, over: Partial<Extract<Action, { type: 'submit' }>> = {}): Action => ({
  type: 'submit',
  at: T,
  hunterId,
  menuItemName,
  rating,
  reviewText: 'อร่อยมาก ได้ของตรงตามรูป',
  imageUseConsent: true,
  photoLabel: 'รูปอาหาร',
  ...over,
})

/** Live campaign with one approved review per rating given. */
function withApproved(ratings: number[]): GemHunterState {
  let s = live()
  ratings.forEach((r, i) => {
    s = run(s, submit(`h${i}`, MENU[i % MENU.length], r))
    s = run(s, { type: 'moderate', submissionId: `sub-${i + 1}`, result: 'approved' })
  })
  return s
}

const rejected = (s: GemHunterState, a: Action) => {
  const r = apply(s, a)
  expect(r.ok).toBe(false)
  expect(reduce(s, a)).toBe(s) // same reference, so the store reports false
  return r.ok ? null : r
}

describe('seed', () => {
  it('is one campaign for the GemBond merchant, built from the existing merchant data', () => {
    const c = fresh().campaign
    expect(c.merchantId).toBe(SELF_ID)
    expect(c.phase).toBe('eligibility_check')
    expect(c.menuAudit.items.map((i) => i.menuItemName)).toEqual(MENU)
    expect(c.submissions).toEqual([])
    expect(c.handoff).toBeNull()
  })

  it('every seeded suggestion is valid, undecided and unpublished', () => {
    for (const i of fresh().campaign.menuAudit.items) {
      expect(validateSuggestion(i)).toEqual({ ok: true })
      expect(i.decision).toBe('pending')
      expect(i.publishedTitle).toBe(i.currentTitle)
      expect([...i.suggestedTitle].length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
    }
  })

  it('the voucher is platform-funded, illustrative and costs the merchant nothing', () => {
    expect(fresh().campaign.mission.voucher).toMatchObject({ valueRangeBaht: { min: 30, max: 50 }, fundedBy: 'platform', merchantCostBaht: 0, illustrative: true, qrPlaceholder: true })
    expect(fresh().campaign.mission.orderChannel).toBe('existing_store_channel')
  })
})

describe('menu audit', () => {
  it('accept publishes the suggestion, keep leaves the title, edit publishes the trimmed text', () => {
    const s = live()
    const [a, k, e] = s.campaign.menuAudit.items
    expect(a).toMatchObject({ decision: 'accepted', publishedTitle: a.suggestedTitle })
    expect(k).toMatchObject({ decision: 'kept', publishedTitle: k.currentTitle })
    expect(e).toMatchObject({ decision: 'edited', editedTitle: 'ปีกไก่ทอดน้ำปลา สูตรบ้านสวน', publishedTitle: 'ปีกไก่ทอดน้ำปลา สูตรบ้านสวน' })
  })

  it('the storefront title does not change before the merchant approves', () => {
    const s = run(fresh(), startReview)
    for (const i of s.campaign.menuAudit.items) expect(i.publishedTitle).toBe(i.currentTitle)
    // an edit that is rejected does not leak into the published title either
    const bad = run(s, { type: 'editMenu', itemId: 'menu-1', title: '   ' })
    expect(bad).toBe(s)
  })

  it('a decision can be changed while reviewing: accept then keep restores the original title', () => {
    const s = run(fresh(), startReview, { type: 'decideMenu', itemId: 'menu-1', decision: 'accepted' }, { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' })
    expect(s.campaign.menuAudit.items[0]).toMatchObject({ decision: 'kept', publishedTitle: 'หมูสะเต๊ะ 10 ไม้' })
  })

  it('refuses a suggestion that uses an attribute nobody verified; keep is still possible', () => {
    const s = run(fresh(), startReview)
    const item = { ...s.campaign.menuAudit.items[0], suggestionAttributes: ['ทำสดทุกเช้า', 'เนื้อวากิว'] }
    expect(validateSuggestion(item)).toMatchObject({ ok: false, code: 'invalid_attributes' })
    const tampered: GemHunterState = { ...s, campaign: { ...s.campaign, menuAudit: { items: [item, ...s.campaign.menuAudit.items.slice(1)] } } }
    expect(rejected(tampered, { type: 'decideMenu', itemId: 'menu-1', decision: 'accepted' })).toMatchObject({ code: 'invalid_attributes' })
    expect(run(tampered, { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' }).campaign.menuAudit.items[0].decision).toBe('kept')
    expect(validateSuggestion({ ...item, suggestionAttributes: [] })).toMatchObject({ ok: false }) // nothing backs the claim
  })

  it('rejects empty and over-long edited titles, accepts exactly the limit', () => {
    expect(validateEditedTitle('   ')).toMatchObject({ ok: false, code: 'empty_title' })
    expect(validateEditedTitle('ก'.repeat(MAX_TITLE_LENGTH + 1))).toMatchObject({ ok: false, code: 'title_too_long' })
    expect(validateEditedTitle('ก'.repeat(MAX_TITLE_LENGTH))).toMatchObject({ ok: true })
    const s = run(fresh(), startReview)
    expect(rejected(s, { type: 'editMenu', itemId: 'menu-1', title: 'ก'.repeat(61) })).toMatchObject({ code: 'title_too_long' })
    expect(rejected(s, { type: 'decideMenu', itemId: 'nope', decision: 'kept' })).toMatchObject({ code: 'unknown_item' })
  })

  it('menu decisions are only possible during menu review', () => {
    expect(rejected(fresh(), { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' })).toMatchObject({ code: 'wrong_phase' })
    expect(rejected(live(), { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' })).toMatchObject({ code: 'wrong_phase' })
  })

  it('the campaign cannot start until every menu item is decided', () => {
    const s = run(fresh(), startReview, { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' })
    expect(rejected(s, { type: 'startCampaign' })).toMatchObject({ code: 'menu_incomplete' })
  })

  it('store eligibility gates entry to menu review', () => {
    expect(eligibilityChecks(self).every((c) => c.passed)).toBe(true)
    expect(eligibilityChecks({ ...self, readinessStatus: 'not_ready' }).some((c) => !c.passed)).toBe(true)
    expect(eligibilityChecks({ ...self, policyStatus: 'under_review' }).some((c) => !c.passed)).toBe(true)
  })
})

describe('submissions and moderation', () => {
  it('a valid submission starts pending, simulated purchase, and is not counted', () => {
    const s = run(live(), submit('นักล่าทดสอบ'))
    const sub = s.campaign.submissions[0]
    expect(sub).toMatchObject({ moderation: 'pending', purchaseCheck: 'simulated' })
    expect(sub.photo).toMatchObject({ moderation: 'pending', merchantDecision: 'pending', onStorefront: false })
    expect(pendingSubmissions(s.campaign)).toHaveLength(1)
    expect(evidenceOf(s.campaign)).toMatchObject({ validReviews: 0, averageRating: null, approvedPhotos: 0 })
  })

  it('moderation moves pending to approved or rejected, once, and only approved reviews count', () => {
    let s = run(live(), submit('a', MENU[0], 5), submit('b', MENU[1], 4))
    s = run(s, { type: 'moderate', submissionId: 'sub-1', result: 'approved' }, { type: 'moderate', submissionId: 'sub-2', result: 'rejected', note: 'รูปไม่ตรงกับเมนู' })
    expect(s.campaign.submissions.map((x) => x.moderation)).toEqual(['approved', 'rejected'])
    expect(s.campaign.submissions[1].photo).toMatchObject({ moderation: 'rejected', rejectionReason: 'รูปไม่ตรงกับเมนู' })
    expect(evidenceOf(s.campaign)).toMatchObject({ validReviews: 1, averageRating: 5 })
    expect(rejected(s, { type: 'moderate', submissionId: 'sub-1', result: 'rejected' })).toMatchObject({ code: 'already_moderated' })
    expect(rejected(s, { type: 'moderate', submissionId: 'zzz', result: 'approved' })).toMatchObject({ code: 'unknown_submission' })
  })

  it('rejects duplicate and invalid submissions without changing state', () => {
    const s = run(live(), submit('a', MENU[0]))
    expect(rejected(s, submit('a', MENU[0], 4))).toMatchObject({ code: 'duplicate' })
    expect(run(s, submit('a', MENU[1])).campaign.submissions).toHaveLength(2) // same hunter, other dish is fine
    for (const rating of [0, 6, 3.5, NaN]) expect(rejected(s, submit('c', MENU[0], rating))).toMatchObject({ code: 'invalid_rating' })
    expect(rejected(s, submit('c', MENU[0], 5, { reviewText: '  ดีมาก  ' }))).toMatchObject({ code: 'review_too_short' })
    expect(rejected(s, submit('c', MENU[0], 5, { imageUseConsent: false }))).toMatchObject({ code: 'no_image_consent' })
    expect(rejected(s, submit('c', MENU[0], 5, { photoLabel: ' ' }))).toMatchObject({ code: 'no_photo' })
    expect(rejected(s, submit('c', 'เมนูที่ไม่มี'))).toMatchObject({ code: 'unknown_menu_item' })
    expect(validateSubmission([], { hunterId: '', menuItemName: MENU[0], rating: 5, reviewText: 'อร่อยมากเลย', imageUseConsent: true, photoLabel: 'x' }, MENU)).toMatchObject({ code: 'invalid_hunter' })
  })

  it('submissions are closed before the campaign starts', () => {
    expect(rejected(run(fresh(), startReview), submit('a'))).toMatchObject({ code: 'wrong_phase' })
  })

  it('merchant photo approval needs prior moderation; the storefront needs an approved photo', () => {
    let s = run(live(), submit('a'))
    expect(rejected(s, { type: 'decidePhoto', submissionId: 'sub-1', decision: 'approved' })).toMatchObject({ code: 'photo_not_approved' })
    expect(rejected(s, { type: 'setStorefront', submissionId: 'sub-1', on: true })).toMatchObject({ code: 'photo_not_approved' })
    s = run(s, { type: 'moderate', submissionId: 'sub-1', result: 'approved' })
    expect(approvedPhotos(s.campaign)).toHaveLength(0) // moderation alone is not enough
    expect(rejected(s, { type: 'setStorefront', submissionId: 'sub-1', on: true })).toMatchObject({ code: 'photo_not_approved' })
    s = run(s, { type: 'decidePhoto', submissionId: 'sub-1', decision: 'approved' }, { type: 'setStorefront', submissionId: 'sub-1', on: true })
    expect(approvedPhotos(s.campaign)).toHaveLength(1)
    expect(storefrontPhotos(s.campaign)).toHaveLength(1)
    s = run(s, { type: 'decidePhoto', submissionId: 'sub-1', decision: 'rejected', reason: 'ไม่ใช้รูปนี้' })
    expect(storefrontPhotos(s.campaign)).toHaveLength(0)
    expect(approvedPhotos(s.campaign)).toHaveLength(0)
  })

  it('a rejected review never reaches the photo bank', () => {
    const s = run(live(), submit('a'), { type: 'moderate', submissionId: 'sub-1', result: 'rejected' })
    expect(rejected(s, { type: 'decidePhoto', submissionId: 'sub-1', decision: 'approved' })).toMatchObject({ code: 'photo_not_approved' })
  })
})

describe('graduation threshold', () => {
  const eligible = (ratings: number[]) => evidenceOf(withApproved(ratings).campaign)

  it('exactly 10 reviews with average exactly 4.2 is NOT eligible (strictly greater)', () => {
    const ev = eligible([5, 5, 5, 5, 5, 4, 4, 3, 3, 3]) // sum 42
    expect(ev).toMatchObject({ validReviews: 10, averageRating: 4.2, eligible: false })
    expect(ev.unmet).toHaveLength(1)
    expect(ev.unmet[0]).toContain('4.2')
  })

  it('10 reviews with average 4.3 is eligible', () => {
    expect(eligible([5, 5, 5, 5, 5, 4, 4, 4, 3, 3])).toMatchObject({ validReviews: 10, averageRating: 4.3, eligible: true, unmet: [] })
  })

  it('9 reviews is not eligible even at 5 stars, and says exactly how many are missing', () => {
    const ev = eligible(Array(9).fill(5))
    expect(ev).toMatchObject({ validReviews: 9, averageRating: 5, eligible: false })
    expect(ev.unmet).toEqual(['ยังมีรีวิวที่ผ่านการตรวจสอบ 9 จาก 10'])
  })

  it('0 reviews gives a null average, never NaN, and is not eligible', () => {
    const ev = evidenceOf(live().campaign)
    expect(ev.averageRating).toBeNull()
    expect(ev.eligible).toBe(false)
    expect(ev.unmet).toHaveLength(2)
    expect(JSON.stringify(ev)).not.toContain('NaN')
  })

  it('low ratings are counted, not filtered out', () => {
    expect(eligible([1])).toMatchObject({ validReviews: 1, averageRating: 1 })
    expect(eligible([5, 5, 5, 5, 5, 5, 5, 5, 5, 1])).toMatchObject({ validReviews: 10, averageRating: 4.6, eligible: true })
  })

  it('an unfinished menu audit blocks graduation and is listed as unmet', () => {
    const c = { ...withApproved(Array(10).fill(5)).campaign, menuAudit: createSeedCampaign().menuAudit }
    const ev = evidenceOf(c)
    expect(ev.eligible).toBe(false)
    expect(ev.unmet).toEqual(['ยังตัดสินใจชื่อเมนูไม่ครบ (0 จาก 3 รายการ)'])
  })

  it('the thresholds are configurable', () => {
    const c = { ...withApproved([5, 5, 5]).campaign, config: { minValidReviews: 3, minAverageRatingExclusive: 4.9 } }
    expect(evidenceOf(c).eligible).toBe(true)
  })

  it('partial moderation shows unmet requirements with exact numbers', () => {
    let s = live()
    s = run(s, { type: 'demoSeedSubmissions' })
    for (let i = 1; i <= 7; i++) s = run(s, { type: 'moderate', submissionId: `demo-sub-${String(i).padStart(2, '0')}`, result: 'approved' })
    expect(evidenceOf(s.campaign).unmet).toEqual(['ยังมีรีวิวที่ผ่านการตรวจสอบ 7 จาก 10'])
  })
})

describe('demo data', () => {
  it('seeds 10 pending submissions, idempotently', () => {
    const s = run(live(), { type: 'demoSeedSubmissions' })
    expect(s.campaign.submissions).toHaveLength(10)
    expect(s.campaign.submissions.every((x) => x.moderation === 'pending')).toBe(true)
    expect(evidenceOf(s.campaign).validReviews).toBe(0)
    expect(rejected(s, { type: 'demoSeedSubmissions' })).toMatchObject({ code: 'already_seeded' })
    expect(JSON.stringify(run(live(), { type: 'demoSeedSubmissions' }))).toBe(JSON.stringify(s)) // deterministic
    expect(new Set(s.campaign.submissions.map((x) => x.hunterId)).size).toBe(10)
  })

  it('once moderated, the demo reviews make the evidence eligible above 4.2 and include low ratings', () => {
    const seeded = run(live(), { type: 'demoSeedSubmissions' })
    const s = run(seeded, { type: 'demoModeratePending' })
    expect(s.campaign.phase).toBe('submission_review')
    expect(pendingSubmissions(s.campaign)).toHaveLength(0)
    const ev = evidenceOf(s.campaign)
    expect(ev).toMatchObject({ validReviews: 10, eligible: true })
    expect(ev.averageRating).toBeGreaterThan(4.2)
    expect(s.campaign.submissions.some((x) => x.rating <= 3)).toBe(true)
    expect(rejected(s, { type: 'demoModeratePending' })).toMatchObject({ code: 'nothing_pending' })
  })
})

describe('lifecycle', () => {
  const phases: GemHunterPhase[] = ['eligibility_check', 'menu_review', 'active_campaign', 'submission_review', 'graduation_check', 'gembond_handoff', 'completed', 'paused', 'cancelled']

  it('only the forward step is legal; skipping, going back and leaving terminal phases are not', () => {
    expect(canTransition('eligibility_check', 'menu_review')).toBe(true)
    expect(canTransition('graduation_check', 'gembond_handoff')).toBe(true)
    expect(canTransition('eligibility_check', 'active_campaign')).toBe(false)
    expect(canTransition('active_campaign', 'gembond_handoff')).toBe(false)
    expect(canTransition('submission_review', 'menu_review')).toBe(false)
    for (const to of phases) {
      expect(canTransition('completed', to)).toBe(false)
      expect(canTransition('cancelled', to)).toBe(false)
    }
    expect(canTransition('paused', 'paused')).toBe(false)
    expect(canTransition('gembond_handoff', 'paused')).toBe(true)
  })

  it('illegal actions are refused with the state untouched', () => {
    expect(rejected(fresh(), { type: 'startCampaign' })).toMatchObject({ code: 'illegal_transition' })
    expect(rejected(fresh(), { type: 'checkGraduation' })).toMatchObject({ code: 'wrong_phase' })
    expect(rejected(live(), { type: 'startMenuReview' })).toMatchObject({ code: 'illegal_transition' })
    expect(rejected(live(), { type: 'openHandoff' })).toMatchObject({ code: 'no_handoff' })
  })

  it('cannot enter the handoff phase, or complete, without meeting the guards', () => {
    const c = withApproved([5, 5, 5]).campaign
    const atCheck = { ...c, phase: 'graduation_check' as const }
    expect(transition(atCheck, 'gembond_handoff')).toMatchObject({ ok: false, code: 'not_eligible' })
    expect(transition({ ...atCheck, phase: 'gembond_handoff' }, 'completed')).toMatchObject({ ok: false, code: 'handoff_not_opened' })
  })

  it('pause blocks work, resume returns to the same phase, cancel is final', () => {
    let s = live()
    s = run(s, { type: 'pause' })
    expect(s.campaign).toMatchObject({ phase: 'paused', pausedFrom: 'active_campaign' })
    expect(rejected(s, submit('a'))).toMatchObject({ code: 'wrong_phase' })
    expect(rejected(s, { type: 'pause' })).toMatchObject({ code: 'illegal_transition' })
    s = run(s, { type: 'resume' })
    expect(s.campaign.phase).toBe('active_campaign')
    expect(s.campaign.pausedFrom).toBeUndefined()
    expect(rejected(s, { type: 'resume' })).toMatchObject({ code: 'not_paused' })
    s = run(s, { type: 'pause' }, { type: 'cancel' })
    expect(s.campaign.phase).toBe('cancelled')
    for (const a of [{ type: 'resume' }, { type: 'pause' }, { type: 'cancel' }, submit('a')] as Action[]) rejected(s, a)
  })

  it('cancelling from any live phase works and leaves GemBond selling status alone', () => {
    for (const s of [fresh(), run(fresh(), startReview), live()]) {
      expect(run(s, { type: 'cancel' }).campaign.phase).toBe('cancelled')
    }
    expect(createGemBondState(T).sellingStatus).toBe('normal')
  })

  it('reset returns the seed from any state', () => {
    const s = run(live(), { type: 'demoSeedSubmissions' }, { type: 'demoModeratePending' }, { type: 'cancel' })
    const r = reduce(s, { type: 'reset' })
    expect(r).not.toBe(s)
    expect(r).toEqual(createInitialState())
  })
})

describe('handoff', () => {
  /** Eligible campaign sitting in graduation_check. */
  const ready = () => run(live(), { type: 'demoSeedSubmissions' }, { type: 'demoModeratePending' }, { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'approved' }, { type: 'setStorefront', submissionId: 'demo-sub-01', on: true }, { type: 'checkGraduation' })
  const handoffState = () => run(ready(), { type: 'createHandoff', at: T, consent: true })

  it('is refused until the graduation rule passes', () => {
    const notYet = run(live(), submit('a'), { type: 'moderate', submissionId: 'sub-1', result: 'approved' }, { type: 'checkGraduation' })
    expect(notYet.campaign.phase).toBe('graduation_check')
    expect(buildHandoff(notYet.campaign, self.name, T, true)).toMatchObject({ ok: false, code: 'not_eligible' })
    expect(rejected(notYet, { type: 'createHandoff', at: T, consent: true })).toMatchObject({ code: 'not_eligible' })
    expect(rejected(live(), { type: 'createHandoff', at: T, consent: true })).toMatchObject({ code: 'wrong_phase' })
  })

  it('carries only the whitelisted summary: no hunters, review text, costs, orders or unapproved media', () => {
    const s = handoffState()
    const h = s.campaign.handoff!
    expect(s.campaign.phase).toBe('gembond_handoff')
    expect(Object.keys(h).sort()).toEqual(['createdAt', 'excluded', 'handoffId', 'merchantId', 'merchantName', 'payload', 'readiness', 'schemaVersion', 'shareConsent', 'sourceCampaignId', 'status'])
    expect(Object.keys(h.payload).sort()).toEqual(['approvedMenuTitles', 'approvedPhotoIds', 'averageRating', 'badge', 'badgeMeaning', 'coverPhotoId', 'validReviewCount'])
    expect(h.payload).toMatchObject({ validReviewCount: 10, badge: 'gemhunter_graduate', approvedPhotoIds: ['demo-photo-01'] })
    expect(h.payload.approvedMenuTitles).toHaveLength(3)

    const keys: string[] = []
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object')
        for (const [k, x] of Object.entries(v)) {
          keys.push(k)
          walk(x)
        }
    }
    walk(h)
    expect(keys.filter((k) => /hunter|reviewText|cost|order|submission|plan/i.test(k))).toEqual([])
    const json = JSON.stringify(h)
    for (const sub of s.campaign.submissions) {
      expect(json).not.toContain(sub.hunterId)
      expect(json).not.toContain(sub.reviewText)
    }
    expect(h.excluded.length).toBeGreaterThan(0)
  })

  it('keeps the same merchant identity as GemBond', () => {
    const h = handoffState().campaign.handoff!
    expect(h.merchantId).toBe(SELF_ID)
    expect(h.merchantId).toBe(createGemBondState(T).selfId)
    expect(h.merchantName).toBe(createGemBondState(T).merchants[SELF_ID].name)
  })

  it('opening it completes GemHunter and never touches GemBond plans or campaigns', () => {
    const gemBondBefore = structuredClone(createGemBondState(T))
    const opened = run(handoffState(), { type: 'openHandoff' })
    expect(opened.campaign).toMatchObject({ phase: 'completed' })
    expect(opened.campaign.handoff?.status).toBe('opened')
    expect(rejected(opened, { type: 'openHandoff' })).toMatchObject({ code: 'already_opened' })

    const gemBondAfter = createGemBondState(T)
    expect(gemBondAfter).toEqual(gemBondBefore)
    expect(Object.values(gemBondAfter.plans).every((p) => p.lifecycleStatus === 'awaiting')).toBe(true)
    expect(Object.values(gemBondAfter.campaigns).every((c) => c.status === 'awaiting_consent')).toBe(true)
    expect(JSON.stringify(opened)).not.toMatch(/plan-m-|consentRecords/)
  })
})

describe('existing GemBond workflow preservation', () => {
  it('accept -> partner consent -> activate -> complete still works with the unchanged GemBond reducer', () => {
    const K = 'plan-m-khaohom'
    const a = (...x: GemBondAction[]) => x.reduce(gemBondReduce, createGemBondState(T))
    const accepted = a({ type: 'accept', planId: K, acks: ['cost', 'data', 'rights'] })
    expect(accepted.plans[K].lifecycleStatus).toBe('interested')
    expect(gemBondReduce(accepted, { type: 'activate', planId: K })).toBe(accepted) // one consent never activates
    const done = gemBondReduce(
      gemBondReduce(gemBondReduce(accepted, { type: 'demoPartnerConsent', planId: K }), { type: 'activate', planId: K }),
      { type: 'demoComplete', planId: K },
    )
    expect(done.plans[K].lifecycleStatus).toBe('completed')
    expect(done.campaigns[K].status).toBe('completed')
    expect(done.sellingStatus).toBe('normal')
  })
})
