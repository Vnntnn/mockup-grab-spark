import { createSeedCampaign, DEMO_ID_PREFIX, DEMO_SUBMITTED_AT, demoSubmissionInputs, merchantOf } from '../data/seed'
import { approveAllSuggestions, decideMenuItem, editMenuItem } from './menu-audit'
import { buildHandoff, openHandoff } from './handoff'
import { eligibilityChecks, resume, transition } from './lifecycle'
import { addSubmission, decidePhoto, moderateSubmission, pendingSubmissions, setCover, setStorefront, withValidCover } from './submissions'
import type { SubmissionInput } from './submissions'
import { ok, reject } from './types'
import type { GemHunterCampaign, GemHunterPhase, GemHunterState, Result } from './types'

/** 2: handoff contract v1, cover photo, menu history, voucher range. Older saved states are discarded. */
export const STATE_VERSION = 2

export type Action =
  | { type: 'startMenuReview' }
  | { type: 'decideMenu'; itemId: string; decision: 'accepted' | 'kept' }
  | { type: 'editMenu'; itemId: string; title: string }
  | { type: 'startCampaign' }
  | ({ type: 'submit'; at: string } & SubmissionInput)
  | { type: 'moderate'; submissionId: string; result: 'approved' | 'rejected'; note?: string }
  | { type: 'decidePhoto'; submissionId: string; decision: 'approved' | 'rejected'; reason?: string }
  | { type: 'setStorefront'; submissionId: string; on: boolean }
  /** `on` defaults to true. `on: false` clears the cover if this photo is the cover. */
  | { type: 'setCover'; submissionId: string; on?: boolean }
  | { type: 'approveAllSuggestions' }
  | { type: 'checkGraduation' }
  /** `consent` must be exactly true: the merchant's explicit agreement to share the listed summary. */
  | { type: 'createHandoff'; at: string; consent?: boolean }
  | { type: 'openHandoff' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'cancel' }
  | { type: 'demoSeedSubmissions' }
  | { type: 'demoModeratePending' }
  | { type: 'reset' }

export function createInitialState(): GemHunterState {
  return { version: STATE_VERSION, campaign: createSeedCampaign() }
}

/** Submissions can be taken and moderated from the moment the campaign is live until the handoff is built. */
const SUBMISSION_PHASES: GemHunterPhase[] = ['active_campaign', 'submission_review', 'graduation_check']

type Step = Result<GemHunterCampaign>

const inPhase = (c: GemHunterCampaign, phases: GemHunterPhase[]): Step | null =>
  phases.includes(c.phase) ? null : reject('wrong_phase', 'ทำรายการนี้ไม่ได้ในขั้นตอนปัจจุบัน')

/** The first moderated item moves the campaign into submission review. */
const startReviewing = (c: GemHunterCampaign): Step => (c.phase === 'active_campaign' ? transition(c, 'submission_review') : ok(c))

function step(c: GemHunterCampaign, action: Action): Step {
  switch (action.type) {
    case 'startMenuReview': {
      const merchant = merchantOf(c.merchantId)
      if (!merchant || !eligibilityChecks(merchant).every((x) => x.passed)) return reject('not_eligible', 'ร้านยังไม่ผ่านเงื่อนไขเข้าร่วม')
      return transition(c, 'menu_review')
    }
    case 'decideMenu': {
      const wrong = inPhase(c, ['menu_review'])
      if (wrong) return wrong
      const r = decideMenuItem(c.menuAudit, action.itemId, action.decision)
      return r.ok ? ok({ ...c, menuAudit: r.value }) : r
    }
    case 'editMenu': {
      const wrong = inPhase(c, ['menu_review'])
      if (wrong) return wrong
      const r = editMenuItem(c.menuAudit, action.itemId, action.title)
      return r.ok ? ok({ ...c, menuAudit: r.value }) : r
    }
    case 'approveAllSuggestions': {
      const wrong = inPhase(c, ['menu_review'])
      if (wrong) return wrong
      const r = approveAllSuggestions(c.menuAudit)
      return r.ok ? ok({ ...c, menuAudit: r.value }) : r
    }
    case 'startCampaign':
      return transition(c, 'active_campaign')
    case 'submit': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const names = c.menuAudit.items.map((i) => i.menuItemName)
      const r = addSubmission(c.submissions, action, names, action.at)
      return r.ok ? ok({ ...c, submissions: [...c.submissions, r.value] }) : r
    }
    case 'moderate': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const r = moderateSubmission(c.submissions, action.submissionId, action.result, action.note)
      return r.ok ? startReviewing({ ...c, submissions: r.value }) : r
    }
    case 'decidePhoto': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const r = decidePhoto(c.submissions, action.submissionId, action.decision, action.reason)
      return r.ok ? ok(withValidCover({ ...c, submissions: r.value })) : r
    }
    case 'setStorefront': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const r = setStorefront(c.submissions, action.submissionId, action.on)
      return r.ok ? ok(withValidCover({ ...c, submissions: r.value })) : r
    }
    case 'setCover': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const r = setCover(c, action.submissionId, action.on ?? true)
      return r.ok ? ok({ ...c, coverPhotoId: r.value }) : r
    }
    case 'checkGraduation': {
      // Checking never requires passing: unmet reasons are shown from the evidence. Only phases that can reach the check are allowed.
      const wrong = inPhase(c, ['active_campaign', 'submission_review'])
      if (wrong) return wrong
      const reviewing = startReviewing(c)
      return reviewing.ok ? transition(reviewing.value, 'graduation_check') : reviewing
    }
    case 'createHandoff': {
      // Checked before the phase: once a handoff exists the campaign has moved on, and a repeat must say "already exists", not "wrong phase".
      if (c.handoff) return reject('already_exists', 'มีข้อมูลที่เตรียมส่งต่อให้ GemBond แล้ว')
      const wrong = inPhase(c, ['graduation_check'])
      if (wrong) return wrong
      const h = buildHandoff(c, merchantOf(c.merchantId)?.name ?? '', action.at, action.consent)
      if (!h.ok) return h
      const t = transition(c, 'gembond_handoff')
      return t.ok ? ok({ ...t.value, handoff: h.value }) : t
    }
    case 'openHandoff':
      return openHandoff(c)
    case 'pause':
      return transition(c, 'paused')
    case 'resume':
      return resume(c)
    case 'cancel':
      // Only the GemHunter campaign stops. GemBond state and the merchant's normal selling rights are not touched.
      return transition(c, 'cancelled')
    case 'demoSeedSubmissions': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      if (c.submissions.some((s) => s.id.startsWith(DEMO_ID_PREFIX))) return reject('already_seeded', 'เพิ่มรีวิวตัวอย่างไปแล้ว')
      const names = c.menuAudit.items.map((i) => i.menuItemName)
      let subs = c.submissions
      for (const [i, input] of demoSubmissionInputs(names).entries()) {
        const r = addSubmission(subs, input, names, DEMO_SUBMITTED_AT, `${DEMO_ID_PREFIX}${String(i + 1).padStart(2, '0')}`)
        if (!r.ok) return r
        subs = [...subs, r.value]
      }
      return ok({ ...c, submissions: subs })
    }
    case 'demoModeratePending': {
      const wrong = inPhase(c, SUBMISSION_PHASES)
      if (wrong) return wrong
      const pending = pendingSubmissions(c)
      if (pending.length === 0) return reject('nothing_pending', 'ไม่มีรายการที่รอตรวจสอบ')
      let subs = c.submissions
      for (const s of pending) {
        const r = moderateSubmission(subs, s.id, 'approved')
        if (!r.ok) return r
        subs = r.value
      }
      return startReviewing({ ...c, submissions: subs })
    }
    case 'reset':
      return ok(createSeedCampaign())
  }
}

/** Like `reduce`, but says why an action was refused. */
export function apply(state: GemHunterState, action: Action): Result<GemHunterState> {
  const r = step(state.campaign, action)
  return r.ok ? ok({ ...state, campaign: r.value }) : r
}

/** Returns the SAME state reference when the action is rejected, so the store can report `false`. */
export function reduce(state: GemHunterState, action: Action): GemHunterState {
  const r = apply(state, action)
  return r.ok ? r.value : state
}
