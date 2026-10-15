import { describe, expect, it } from 'vitest'
import { createInitialState as createGemBondState, reduce as gemBondReduce } from '@/app/reducer'
import { merchants, SELF_ID } from '@/data/merchants'
import { readHandoff, useGemHunterHandoff } from '../handoff-view'
import { GEMHUNTER_STORAGE_KEY } from '../store'
import { createSeedCampaign } from '../data/seed'
import { apply, createInitialState, reduce, STATE_VERSION, type Action } from './reducer'
import { campaignMetrics } from './metrics'
import { HANDOFF_SCOPE, HANDOFF_SCHEMA_VERSION, buildHandoff } from './handoff'
import { approvableItems, validateSuggestion } from './menu-audit'
import { approvedPhotos, rewardFor, storefrontPhotos } from './submissions'
import { evidenceOf } from './graduation'
import type { GemHunterState } from './types'

/** Source text of every module, so structural rules (who imports whom, which storage key) are checked without Node typings. */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const sourceOf = (path: string) => sources[`/src/${path}`] ?? ''

const T = '2026-10-14'
const T2 = '2026-11-02'
const run = (s: GemHunterState, ...a: Action[]) => a.reduce(reduce, s)
const fresh = () => createInitialState()
const self = merchants.find((m) => m.id === SELF_ID)!
const MENU = self.sampleMenu.map((m) => m.name)

const startReview: Action = { type: 'startMenuReview' }
const decideAll: Action[] = [
  { type: 'decideMenu', itemId: 'menu-1', decision: 'accepted' },
  { type: 'decideMenu', itemId: 'menu-2', decision: 'kept' },
  { type: 'decideMenu', itemId: 'menu-3', decision: 'accepted' },
]
const live = () => run(fresh(), startReview, ...decideAll, { type: 'startCampaign' })
const submit = (hunterId: string, menuItemName = MENU[0], rating = 5): Action => ({
  type: 'submit',
  at: T,
  hunterId,
  menuItemName,
  rating,
  reviewText: 'อร่อยมาก ได้ของตรงตามรูป',
  imageUseConsent: true,
  photoLabel: 'รูปอาหาร',
})
const demoReviewed = () => run(live(), { type: 'demoSeedSubmissions' }, { type: 'demoModeratePending' })
const photoReady = () =>
  run(
    demoReviewed(),
    { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'approved' },
    { type: 'decidePhoto', submissionId: 'demo-sub-02', decision: 'approved' },
    { type: 'setStorefront', submissionId: 'demo-sub-01', on: true },
    { type: 'setStorefront', submissionId: 'demo-sub-02', on: true },
  )
const ready = () => run(photoReady(), { type: 'checkGraduation' })
const withHandoff = () => run(ready(), { type: 'createHandoff', at: T, consent: true })

const rejected = (s: GemHunterState, a: Action) => {
  const r = apply(s, a)
  expect(r.ok).toBe(false)
  expect(reduce(s, a)).toBe(s)
  return r.ok ? null : r
}

/** cover ⊆ storefront ⊆ fully approved. Checked after every step of the sequence tests. */
function expectPhotoInvariants(s: GemHunterState) {
  const c = s.campaign
  const approved = new Set(approvedPhotos(c).map((p) => p.id))
  const storefront = storefrontPhotos(c).map((p) => p.id)
  for (const sub of c.submissions) if (sub.photo.onStorefront) expect(approved.has(sub.photo.id)).toBe(true)
  for (const id of storefront) expect(approved.has(id)).toBe(true)
  if (c.coverPhotoId !== null) expect(storefront).toContain(c.coverPhotoId)
}

describe('state version', () => {
  it('was bumped so old localStorage shapes are discarded', () => {
    expect(STATE_VERSION).toBeGreaterThan(1)
    expect(fresh().version).toBe(STATE_VERSION)
  })
})

describe('handoff contract v1', () => {
  it('needs the merchant to explicitly share: no consent, no handoff, state untouched', () => {
    expect(rejected(ready(), { type: 'createHandoff', at: T })).toMatchObject({ code: 'consent_required' })
    expect(rejected(ready(), { type: 'createHandoff', at: T, consent: false })).toMatchObject({ code: 'consent_required' })
    expect(ready().campaign.handoff).toBeNull()
  })

  it('records the consent with its time and the exact scope that is shared', () => {
    const h = withHandoff().campaign.handoff!
    expect(h.shareConsent).toEqual({ granted: true, at: T, scope: HANDOFF_SCOPE.map((s) => s.id) })
    expect(h).toMatchObject({ schemaVersion: 1, readiness: 'graduated', status: 'ready', createdAt: T, merchantId: SELF_ID, sourceCampaignId: 'gh-campaign-m-satay' })
    expect(HANDOFF_SCHEMA_VERSION).toBe(1)
  })

  it('still refuses an ineligible campaign even with consent (consent never waives the graduation rule)', () => {
    const notYet = run(live(), submit('a'), { type: 'moderate', submissionId: 'sub-1', result: 'approved' }, { type: 'checkGraduation' })
    expect(rejected(notYet, { type: 'createHandoff', at: T, consent: true })).toMatchObject({ code: 'not_eligible' })
    expect(buildHandoff(notYet.campaign, self.name, T, true)).toMatchObject({ ok: false, code: 'not_eligible' })
  })

  it('has a deterministic id that never depends on time', () => {
    const a = run(ready(), { type: 'createHandoff', at: T, consent: true }).campaign.handoff!
    const b = run(ready(), { type: 'createHandoff', at: T2, consent: true }).campaign.handoff!
    expect(a.handoffId).toBe('handoff-gh-campaign-m-satay-v1')
    expect(b.handoffId).toBe('handoff-gh-campaign-m-satay-v1')
    expect(b.createdAt).toBe(T2)
  })

  it('is idempotent: creating again is refused as already_exists and changes nothing', () => {
    const s = withHandoff()
    expect(rejected(s, { type: 'createHandoff', at: T2, consent: true })).toMatchObject({ code: 'already_exists' })
    expect(s.campaign.handoff?.createdAt).toBe(T)
    const opened = run(s, { type: 'openHandoff' })
    expect(rejected(opened, { type: 'createHandoff', at: T2, consent: true })).toMatchObject({ code: 'already_exists' })
  })

  it('opening twice is refused with a named code and the handoff stays opened', () => {
    const opened = run(withHandoff(), { type: 'openHandoff' })
    expect(opened.campaign.handoff?.status).toBe('opened')
    expect(rejected(opened, { type: 'openHandoff' })).toMatchObject({ code: 'already_opened' })
  })

  it('carries only fully approved photo ids: moderation alone, or merchant approval alone, is not enough', () => {
    const base = photoReady()
    expect(withHandoff().campaign.handoff!.payload.approvedPhotoIds).toEqual(['demo-photo-01', 'demo-photo-02'])
    // demo-sub-03 is moderated-approved but the merchant never approved the photo
    expect(base.campaign.submissions.find((x) => x.id === 'demo-sub-03')!.photo).toMatchObject({ moderation: 'approved', merchantDecision: 'pending' })
    // tamper: merchant approved but image-use consent missing -> must not be shared
    const tampered: GemHunterState = {
      ...base,
      campaign: {
        ...base.campaign,
        submissions: base.campaign.submissions.map((x) => (x.id === 'demo-sub-02' ? { ...x, photo: { ...x.photo, imageUseConsent: false } } : x)),
      },
    }
    const h = run(tampered, { type: 'checkGraduation' }, { type: 'createHandoff', at: T, consent: true }).campaign.handoff!
    expect(h.payload.approvedPhotoIds).toEqual(['demo-photo-01'])
  })

  it('puts the cover photo and a badge meaning in the payload; the badge is a campaign badge, not a certification', () => {
    const noCover = withHandoff().campaign.handoff!.payload
    expect(noCover.coverPhotoId).toBeNull()
    const withCover = run(ready(), { type: 'setCover', submissionId: 'demo-sub-02' }, { type: 'createHandoff', at: T, consent: true }).campaign.handoff!.payload
    expect(withCover.coverPhotoId).toBe('demo-photo-02')
    expect(withCover.badge).toBe('gemhunter_graduate')
    expect(withCover.badgeMeaning).toContain('แคมเปญ')
    expect(withCover.badgeMeaning).toMatch(/ไม่ใช่.*(ความปลอดภัยทางอาหาร|สุขอนามัย|ฮาลาล)/)
    expect(withCover.badgeMeaning).toContain('ไม่ใช่การรับประกัน') // only ever appears negated
  })

  it('payload keys are exactly the contract', () => {
    const h = withHandoff().campaign.handoff!
    expect(Object.keys(h).sort()).toEqual(['createdAt', 'excluded', 'handoffId', 'merchantId', 'merchantName', 'payload', 'readiness', 'schemaVersion', 'shareConsent', 'sourceCampaignId', 'status'])
    expect(Object.keys(h.payload).sort()).toEqual(['approvedMenuTitles', 'approvedPhotoIds', 'averageRating', 'badge', 'badgeMeaning', 'coverPhotoId', 'validReviewCount'])
  })

  it('a handoff can be created later once an ineligible check becomes eligible (failed check is not permanent)', () => {
    let s = run(live(), ...Array.from({ length: 9 }, (_, i): Action[] => [submit(`h${i}`, MENU[i % 3], 5), { type: 'moderate', submissionId: `sub-${i + 1}`, result: 'approved' }]).flat(), { type: 'checkGraduation' })
    expect(s.campaign.phase).toBe('graduation_check')
    expect(rejected(s, { type: 'createHandoff', at: T, consent: true })).toMatchObject({ code: 'not_eligible' })
    s = run(s, submit('h9', MENU[0], 5), { type: 'moderate', submissionId: 'sub-10', result: 'approved' })
    expect(evidenceOf(s.campaign).eligible).toBe(true)
    expect(run(s, { type: 'createHandoff', at: T, consent: true }).campaign.phase).toBe('gembond_handoff')
  })
})

describe('readHandoff: the narrow GemBond boundary', () => {
  it('returns nothing before a handoff exists', () => {
    expect(readHandoff(fresh(), SELF_ID)).toBeNull()
    expect(readHandoff(ready(), SELF_ID)).toBeNull()
  })

  it('returns the contract for the matching merchant, ready or opened', () => {
    const s = withHandoff()
    expect(readHandoff(s, SELF_ID)).toEqual(s.campaign.handoff)
    expect(readHandoff(run(s, { type: 'openHandoff' }), SELF_ID)?.status).toBe('opened')
  })

  it('returns null for a different merchant (merchant mismatch)', () => {
    expect(readHandoff(withHandoff(), 'm-khaohom')).toBeNull()
    expect(readHandoff(withHandoff(), '')).toBeNull()
  })

  it('returns null for an unknown schemaVersion', () => {
    const s = withHandoff()
    const bad = { ...s, campaign: { ...s.campaign, handoff: { ...s.campaign.handoff!, schemaVersion: 2 } } } as unknown as GemHunterState
    expect(readHandoff(bad, SELF_ID)).toBeNull()
  })

  it('returns null when consent is missing or not granted', () => {
    const s = withHandoff()
    const noConsent = { ...s, campaign: { ...s.campaign, handoff: { ...s.campaign.handoff!, shareConsent: { ...s.campaign.handoff!.shareConsent, granted: false } } } } as unknown as GemHunterState
    expect(readHandoff(noConsent, SELF_ID)).toBeNull()
  })

  it('exposes only contract fields: extra data hiding on the record never crosses the boundary', () => {
    const s = withHandoff()
    const h = s.campaign.handoff!
    const dirty = {
      ...s,
      campaign: {
        ...s.campaign,
        handoff: { ...h, hunterIds: ['นักล่ามะลิ'], payload: { ...h.payload, reviewTexts: ['x'] } },
      },
    } as unknown as GemHunterState
    const out = readHandoff(dirty, SELF_ID)!
    expect(JSON.stringify(out)).not.toMatch(/hunterIds|reviewTexts|นักล่ามะลิ/)
    expect(out).toEqual(h)
  })

  it('exports a hook for GemBond to use instead of the whole GemHunter state', () => {
    expect(typeof useGemHunterHandoff).toBe('function')
  })
})

describe('photos: cover ⊆ storefront ⊆ approved', () => {
  it('starts with no cover', () => {
    expect(fresh().campaign.coverPhotoId).toBeNull()
  })

  it('a cover can only be a storefront photo', () => {
    const s = demoReviewed()
    // moderated-approved but merchant has not approved: not even on the storefront
    expect(rejected(s, { type: 'setCover', submissionId: 'demo-sub-01' })).toMatchObject({ code: 'not_on_storefront' })
    const approvedOnly = run(s, { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'approved' })
    expect(rejected(approvedOnly, { type: 'setCover', submissionId: 'demo-sub-01' })).toMatchObject({ code: 'not_on_storefront' })
    expect(rejected(approvedOnly, { type: 'setCover', submissionId: 'nope' })).toMatchObject({ code: 'unknown_submission' })
    const ok = run(approvedOnly, { type: 'setStorefront', submissionId: 'demo-sub-01', on: true }, { type: 'setCover', submissionId: 'demo-sub-01' })
    expect(ok.campaign.coverPhotoId).toBe('demo-photo-01')
  })

  it('there is a single cover: choosing another replaces it; turning it off clears it', () => {
    let s = run(photoReady(), { type: 'setCover', submissionId: 'demo-sub-01' }, { type: 'setCover', submissionId: 'demo-sub-02' })
    expect(s.campaign.coverPhotoId).toBe('demo-photo-02')
    s = run(s, { type: 'setCover', submissionId: 'demo-sub-02', on: false })
    expect(s.campaign.coverPhotoId).toBeNull()
    // turning off a photo that is not the cover leaves the real cover alone
    s = run(s, { type: 'setCover', submissionId: 'demo-sub-01' }, { type: 'setCover', submissionId: 'demo-sub-02', on: false })
    expect(s.campaign.coverPhotoId).toBe('demo-photo-01')
  })

  it('taking a cover photo off the storefront clears the cover; other storefront photos are untouched', () => {
    let s = run(photoReady(), { type: 'setCover', submissionId: 'demo-sub-01' }, { type: 'setStorefront', submissionId: 'demo-sub-02', on: false })
    expect(s.campaign.coverPhotoId).toBe('demo-photo-01')
    s = run(s, { type: 'setStorefront', submissionId: 'demo-sub-01', on: false })
    expect(s.campaign.coverPhotoId).toBeNull()
    expectPhotoInvariants(s)
  })

  it('merchant rejecting a storefront cover photo clears storefront AND cover (the likeliest bug)', () => {
    const s = run(photoReady(), { type: 'setCover', submissionId: 'demo-sub-01' }, { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'rejected', reason: 'ไม่ใช้รูปนี้' })
    const photo = s.campaign.submissions.find((x) => x.id === 'demo-sub-01')!.photo
    expect(photo).toMatchObject({ onStorefront: false, merchantDecision: 'rejected' })
    expect(s.campaign.coverPhotoId).toBeNull()
    expect(storefrontPhotos(s.campaign).map((p) => p.id)).toEqual(['demo-photo-02'])
    expectPhotoInvariants(s)
  })

  it('rejecting a different photo leaves the cover alone', () => {
    const s = run(photoReady(), { type: 'setCover', submissionId: 'demo-sub-01' }, { type: 'decidePhoto', submissionId: 'demo-sub-02', decision: 'rejected' })
    expect(s.campaign.coverPhotoId).toBe('demo-photo-01')
  })

  it('holds after any mix of photo actions', () => {
    const steps: Action[] = [
      { type: 'setCover', submissionId: 'demo-sub-01' },
      { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'rejected' },
      { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'approved' },
      { type: 'setCover', submissionId: 'demo-sub-01' }, // approved again but not on storefront: refused
      { type: 'setStorefront', submissionId: 'demo-sub-01', on: true },
      { type: 'setCover', submissionId: 'demo-sub-01' },
      { type: 'setStorefront', submissionId: 'demo-sub-02', on: false },
      { type: 'decidePhoto', submissionId: 'demo-sub-02', decision: 'rejected' },
      { type: 'setCover', submissionId: 'demo-sub-02' },
      { type: 'setStorefront', submissionId: 'demo-sub-01', on: false },
    ]
    let s = photoReady()
    for (const a of steps) {
      s = reduce(s, a)
      expectPhotoInvariants(s)
    }
    expect(s.campaign.coverPhotoId).toBeNull()
  })

  it('cover actions are only possible while submissions are open', () => {
    expect(rejected(fresh(), { type: 'setCover', submissionId: 'demo-sub-01' })).toMatchObject({ code: 'wrong_phase' })
  })
})

describe('menu audit: trail, provenance, one-click approve', () => {
  const inReview = () => run(fresh(), startReview)

  it('every attribute is verified, carries a provenance tag, and appears in the suggested title', () => {
    for (const i of fresh().campaign.menuAudit.items) {
      expect(validateSuggestion(i)).toEqual({ ok: true })
      expect(i.suggestionAttributes.length).toBeGreaterThan(0)
      for (const a of i.suggestionAttributes) {
        expect(i.verifiedAttributes).toContain(a)
        expect(i.suggestedTitle).toContain(a)
      }
      for (const a of i.verifiedAttributes) expect(['shop_profile', 'merchant_confirmed']).toContain(i.attributeSource[a])
      expect(Object.keys(i.attributeSource).sort()).toEqual([...i.verifiedAttributes].sort())
      expect(i.history).toEqual([])
    }
  })

  it('an attribute that is listed as verified but has no provenance tag is not usable', () => {
    const item = { ...fresh().campaign.menuAudit.items[0], attributeSource: {} }
    expect(validateSuggestion(item)).toMatchObject({ ok: false, code: 'invalid_attributes' })
  })

  it('keeps an audit trail of every decision, with the original title preserved', () => {
    const s = run(
      inReview(),
      { type: 'decideMenu', itemId: 'menu-3', decision: 'accepted' },
      { type: 'editMenu', itemId: 'menu-3', title: 'ปีกไก่ทอด สูตรบ้านสวน' },
      { type: 'decideMenu', itemId: 'menu-3', decision: 'kept' },
    )
    const item = s.campaign.menuAudit.items[2]
    expect(item.currentTitle).toBe('ปีกไก่ทอดน้ำปลา')
    expect(item.publishedTitle).toBe('ปีกไก่ทอดน้ำปลา')
    expect(item.history).toEqual([
      { action: 'accepted', from: 'ปีกไก่ทอดน้ำปลา', to: item.suggestedTitle },
      { action: 'edited', from: item.suggestedTitle, to: 'ปีกไก่ทอด สูตรบ้านสวน' },
      { action: 'kept', from: 'ปีกไก่ทอด สูตรบ้านสวน', to: 'ปีกไก่ทอดน้ำปลา' },
    ])
  })

  it('a refused decision leaves no trace in the trail', () => {
    const s = inReview()
    expect(rejected(s, { type: 'editMenu', itemId: 'menu-1', title: '  ' })).toMatchObject({ code: 'empty_title' })
    expect(s.campaign.menuAudit.items[0].history).toEqual([])
  })

  it('approves every pending suggestion that passes validation, with a trail entry each', () => {
    const s = run(inReview(), { type: 'approveAllSuggestions' })
    for (const i of s.campaign.menuAudit.items) {
      expect(i).toMatchObject({ decision: 'accepted', publishedTitle: i.suggestedTitle })
      expect(i.history).toHaveLength(1)
      expect(i.history[0]).toEqual({ action: 'accepted', from: i.currentTitle, to: i.suggestedTitle })
    }
    expect(approvableItems(inReview().campaign.menuAudit)).toHaveLength(3)
  })

  it('skips invalid suggestions and decisions the merchant already made', () => {
    const base = run(inReview(), { type: 'decideMenu', itemId: 'menu-2', decision: 'kept' })
    const items = base.campaign.menuAudit.items
    const tampered: GemHunterState = {
      ...base,
      campaign: { ...base.campaign, menuAudit: { items: [{ ...items[0], suggestionAttributes: ['ทำสดทุกเช้า', 'เนื้อวากิว'] }, items[1], items[2]] } },
    }
    const s = run(tampered, { type: 'approveAllSuggestions' })
    const [a, k, c] = s.campaign.menuAudit.items
    expect(a).toMatchObject({ decision: 'pending', publishedTitle: a.currentTitle, history: [] }) // invalid: untouched
    expect(k).toMatchObject({ decision: 'kept', publishedTitle: k.currentTitle }) // merchant's own choice stays
    expect(c).toMatchObject({ decision: 'accepted', publishedTitle: c.suggestedTitle })
    expect(approvableItems(tampered.campaign.menuAudit).map((i) => i.id)).toEqual(['menu-3'])
  })

  it('is refused when there is nothing to approve, so the UI never reports a success that did not happen', () => {
    const decided = run(inReview(), { type: 'approveAllSuggestions' })
    expect(rejected(decided, { type: 'approveAllSuggestions' })).toMatchObject({ code: 'nothing_to_approve' })
  })

  it('does nothing outside menu_review', () => {
    expect(rejected(fresh(), { type: 'approveAllSuggestions' })).toMatchObject({ code: 'wrong_phase' })
    expect(rejected(live(), { type: 'approveAllSuggestions' })).toMatchObject({ code: 'wrong_phase' })
    const paused = run(inReview(), { type: 'pause' })
    expect(rejected(paused, { type: 'approveAllSuggestions' })).toMatchObject({ code: 'wrong_phase' })
  })

  it('is reversible: every item can still be changed afterwards and the original title comes back', () => {
    const s = run(inReview(), { type: 'approveAllSuggestions' }, { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' }, { type: 'editMenu', itemId: 'menu-2', title: 'ไก่ย่างของบ้านสวน' })
    const [one, two, three] = s.campaign.menuAudit.items
    expect(one).toMatchObject({ decision: 'kept', publishedTitle: 'หมูสะเต๊ะ 10 ไม้' })
    expect(two).toMatchObject({ decision: 'edited', publishedTitle: 'ไก่ย่างของบ้านสวน' })
    expect(three.decision).toBe('accepted')
    expect(one.history.map((h) => h.action)).toEqual(['accepted', 'kept'])
    expect(run(s, { type: 'startCampaign' }).campaign.phase).toBe('active_campaign')
  })
})

describe('submissions: incentive disclosure and reward', () => {
  it('every submission records that the reviewer was shown the illustrative voucher, and the purchase is still only simulated', () => {
    const s = run(live(), submit('a'))
    expect(s.campaign.submissions[0]).toMatchObject({ incentiveDisclosed: true, purchaseCheck: 'simulated' })
    for (const x of run(live(), { type: 'demoSeedSubmissions' }).campaign.submissions) expect(x.incentiveDisclosed).toBe(true)
  })

  it('the reward is identical for a 1 star and a 5 star review', () => {
    const s = run(live(), submit('a', MENU[0], 1), submit('b', MENU[0], 5), submit('c', MENU[1], 3))
    const [one, five, three] = s.campaign.submissions
    expect(rewardFor(one)).toEqual(rewardFor(five))
    expect(rewardFor(three)).toEqual(rewardFor(five))
    expect(rewardFor(one)).toMatchObject({ eligible: true, valueRangeBaht: { min: 30, max: 50 }, fundedBy: 'platform', merchantCostBaht: 0, illustrative: true })
  })

  it('moderation outcome about content may withhold the voucher, a low rating never does', () => {
    const s = run(live(), submit('a', MENU[0], 1), submit('b', MENU[1], 5), { type: 'moderate', submissionId: 'sub-1', result: 'approved' }, { type: 'moderate', submissionId: 'sub-2', result: 'rejected', note: 'รูปไม่ตรงกับเมนู' })
    expect(rewardFor(s.campaign.submissions[0]).eligible).toBe(true)
    expect(rewardFor(s.campaign.submissions[1]).eligible).toBe(false)
  })

  it('image-use permission stays separate from the review: still required to submit', () => {
    const noConsent = { ...submit('a'), imageUseConsent: false } as Action
    expect(rejected(live(), noConsent)).toMatchObject({ code: 'no_image_consent' })
  })

  it('the voucher is a range, platform-funded, and uses a clearly non-scannable placeholder', () => {
    expect(fresh().campaign.mission.voucher).toMatchObject({
      valueRangeBaht: { min: 30, max: 50 },
      fundedBy: 'platform',
      merchantCostBaht: 0,
      illustrative: true,
      qrPlaceholder: true,
    })
  })
})

describe('campaignMetrics', () => {
  it('is all zero before anything happens; the approval rate is null (not 0, not NaN) when nothing is moderated', () => {
    expect(campaignMetrics(fresh().campaign)).toEqual({
      enrolled: false,
      menuAuditCompletion: { decided: 0, total: 3 },
      approvedPhotos: 0,
      validReviews: 0,
      missionCompletions: 0,
      graduationEligible: false,
      handoffCompleted: false,
      moderation: { approved: 0, rejected: 0, pending: 0, approvalRatePct: null },
    })
  })

  it('counts partial progress from state', () => {
    let s = run(fresh(), startReview, { type: 'decideMenu', itemId: 'menu-1', decision: 'kept' })
    expect(campaignMetrics(s.campaign)).toMatchObject({ enrolled: true, menuAuditCompletion: { decided: 1, total: 3 } })
    s = run(s, { type: 'decideMenu', itemId: 'menu-2', decision: 'kept' }, { type: 'decideMenu', itemId: 'menu-3', decision: 'kept' }, { type: 'startCampaign' }, { type: 'demoSeedSubmissions' })
    for (let i = 1; i <= 7; i++) s = run(s, { type: 'moderate', submissionId: `demo-sub-${String(i).padStart(2, '0')}`, result: 'approved' })
    s = run(s, { type: 'moderate', submissionId: 'demo-sub-08', result: 'rejected', note: 'รูปไม่ตรงกับเมนู' }, { type: 'decidePhoto', submissionId: 'demo-sub-01', decision: 'approved' })
    expect(campaignMetrics(s.campaign)).toEqual({
      enrolled: true,
      menuAuditCompletion: { decided: 3, total: 3 },
      approvedPhotos: 1,
      validReviews: 7,
      missionCompletions: 10,
      graduationEligible: false,
      handoffCompleted: false,
      moderation: { approved: 7, rejected: 1, pending: 2, approvalRatePct: 88 }, // 7 of 8 moderated = 87.5, rounded
    })
  })

  it('reports eligibility and a completed handoff', () => {
    expect(campaignMetrics(withHandoff().campaign)).toMatchObject({ graduationEligible: true, handoffCompleted: false })
    const opened = run(withHandoff(), { type: 'openHandoff' })
    expect(campaignMetrics(opened.campaign)).toMatchObject({ graduationEligible: true, handoffCompleted: true, validReviews: 10, missionCompletions: 10 })
  })

  it('a paused campaign keeps the enrolment of the phase it paused from; cancelling before joining is not enrolment', () => {
    expect(campaignMetrics(run(live(), { type: 'pause' }).campaign).enrolled).toBe(true)
    expect(campaignMetrics(run(fresh(), { type: 'pause' }).campaign).enrolled).toBe(false)
    expect(campaignMetrics(run(fresh(), { type: 'cancel' }).campaign).enrolled).toBe(false)
    expect(campaignMetrics(run(live(), { type: 'cancel' }).campaign).enrolled).toBe(true)
  })

  it('has no duplicate rate: rejected duplicate attempts are never stored, so it cannot be computed honestly', () => {
    expect(Object.keys(campaignMetrics(fresh().campaign)).sort()).toEqual([
      'approvedPhotos',
      'enrolled',
      'graduationEligible',
      'handoffCompleted',
      'menuAuditCompletion',
      'missionCompletions',
      'moderation',
      'validReviews',
    ])
  })
})

describe('graduation improvement guidance', () => {
  it('failing a check is never permanent and each unmet check has a next step', () => {
    const ev = evidenceOf(live().campaign)
    expect(ev.eligible).toBe(false)
    expect(ev.improvement.permanent).toBe(false)
    expect(ev.improvement.text).toContain('ไม่ใช่การตัดสิทธิ์ถาวร')
    expect(ev.improvement.nextSteps.map((n) => n.checkId).sort()).toEqual(['rating', 'reviews'])
    expect(ev.improvement.nextSteps.find((n) => n.checkId === 'reviews')!.text).toContain('10')
  })

  it('names the exact shortfall, and never suggests chasing good ratings', () => {
    const c = run(live(), ...Array.from({ length: 9 }, (_, i): Action[] => [submit(`h${i}`, MENU[i % 3], 5), { type: 'moderate', submissionId: `sub-${i + 1}`, result: 'approved' }]).flat()).campaign
    const ev = evidenceOf(c)
    expect(ev.improvement.nextSteps).toHaveLength(1)
    expect(ev.improvement.nextSteps[0]).toMatchObject({ checkId: 'reviews' })
    expect(ev.improvement.nextSteps[0].text).toContain('1 รีวิว')
    for (const s of evidenceOf(live().campaign).improvement.nextSteps) expect(s.text).not.toMatch(/ให้ 5 ดาว|รีวิวดี|เพิ่มคะแนน/)
  })

  it('an unfinished menu audit gets its own next step', () => {
    const ev = evidenceOf(fresh().campaign)
    expect(ev.improvement.nextSteps.find((n) => n.checkId === 'menu')!.text).toContain('3')
  })

  it('has no next steps once eligible, and is still not described as permanent either way', () => {
    const ev = evidenceOf(ready().campaign)
    expect(ev.eligible).toBe(true)
    expect(ev.improvement).toMatchObject({ permanent: false, nextSteps: [] })
  })

  it('the improvement check is offered when not eligible: checkGraduation never requires passing', () => {
    const s = run(live(), { type: 'checkGraduation' })
    expect(s.campaign.phase).toBe('graduation_check')
    expect(evidenceOf(s.campaign).eligible).toBe(false)
  })
})

describe('reset isolation between GemHunter and GemBond', () => {
  it('GemHunter reset returns its own seed and never produces or mutates GemBond state', () => {
    const gemBondBefore = structuredClone(createGemBondState(T))
    const dirty = run(withHandoff(), { type: 'openHandoff' })
    const reset = reduce(dirty, { type: 'reset' })
    expect(reset).toEqual(createInitialState())
    expect(JSON.stringify(reset)).not.toMatch(/plan-m-|consentRecords|selfId/)
    expect(createGemBondState(T)).toEqual(gemBondBefore)
  })

  it('GemBond reset leaves GemHunter state (and its handoff) alone', () => {
    const hunter = run(withHandoff(), { type: 'openHandoff' })
    const snapshot = structuredClone(hunter)
    const gb = gemBondReduce(createGemBondState(T), { type: 'accept', planId: 'plan-m-khaohom', acks: ['cost', 'data', 'rights'] })
    const reset = gemBondReduce(gb, { type: 'reset', today: T })
    expect(reset.plans['plan-m-khaohom'].lifecycleStatus).toBe('awaiting')
    expect(hunter).toEqual(snapshot)
    expect(readHandoff(hunter, SELF_ID)?.status).toBe('opened')
  })

  it('the two demos persist under different localStorage keys', () => {
    expect(GEMHUNTER_STORAGE_KEY).toBe('gembond.gemhunter.v1')
    const gemBondKey = /const KEY = '([^']+)'/.exec(sourceOf('app/store.tsx'))?.[1]
    expect(gemBondKey).toBe('gembond.demo.v1')
    expect(GEMHUNTER_STORAGE_KEY).not.toBe(gemBondKey)
  })

  it('GemHunter state code never imports the GemBond app layer, and GemBond state code never imports GemHunter', () => {
    const hunterFiles = Object.keys(sources).filter(
      (f) => /^\/src\/features\/gemhunter\/(domain\/[^/]+|data\/seed|store|handoff-view)\.tsx?$/.test(f) && !f.endsWith('.test.ts'),
    )
    expect(hunterFiles.length).toBeGreaterThan(8)
    for (const f of hunterFiles) expect(sources[f], f).not.toMatch(/from '@\/app\/|from '@\/features\/dashboard/)
    for (const f of ['app/reducer.ts', 'app/store.tsx']) {
      expect(sourceOf(f).length, f).toBeGreaterThan(0)
      expect(sourceOf(f), f).not.toMatch(/gemhunter/i)
    }
  })
})

describe('seed integrity', () => {
  it('a fresh campaign is valid under the new invariants', () => {
    const c = createSeedCampaign()
    expect(c.coverPhotoId).toBeNull()
    expect(c.menuAudit.items.every((i) => i.history.length === 0 && i.decision === 'pending')).toBe(true)
  })
})
