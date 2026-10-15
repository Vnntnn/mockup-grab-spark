import type { Merchant } from '@/domain/types'
import { evidenceOf } from './graduation'
import { isMenuAuditComplete } from './menu-audit'
import { ok, reject } from './types'
import type { GemHunterCampaign, GemHunterPhase, Result } from './types'

/** Linear flow. Pause and cancel are reachable from any non-terminal phase; resume goes back to where the campaign paused. */
const FLOW: Record<GemHunterPhase, GemHunterPhase[]> = {
  eligibility_check: ['menu_review'],
  menu_review: ['active_campaign'],
  active_campaign: ['submission_review'],
  submission_review: ['graduation_check'],
  graduation_check: ['gembond_handoff'],
  gembond_handoff: ['completed'],
  completed: [],
  paused: [],
  cancelled: [],
}

export const isTerminal = (p: GemHunterPhase) => p === 'completed' || p === 'cancelled'

export function canTransition(from: GemHunterPhase, to: GemHunterPhase): boolean {
  if (isTerminal(from) || from === to) return false
  if (to === 'cancelled') return true
  if (to === 'paused') return from !== 'paused'
  return FLOW[from].includes(to)
}

type LifecycleCode = 'illegal_transition' | 'menu_incomplete' | 'not_eligible' | 'handoff_not_opened' | 'not_paused'

/** Moves one step, enforcing the guard for the phase being entered. A failed guard leaves the campaign untouched. */
export function transition(c: GemHunterCampaign, to: GemHunterPhase): Result<GemHunterCampaign, LifecycleCode> {
  if (!canTransition(c.phase, to)) return reject('illegal_transition', 'ขั้นตอนนี้ยังไปต่อไม่ได้ในตอนนี้')
  if (to === 'active_campaign' && !isMenuAuditComplete(c.menuAudit)) return reject('menu_incomplete', 'ตัดสินใจชื่อเมนูให้ครบก่อนเริ่มแคมเปญ')
  if (to === 'gembond_handoff') {
    const ev = evidenceOf(c)
    if (!ev.eligible) return reject('not_eligible', `ยังไม่ครบเกณฑ์: ${ev.unmet.join(' / ')}`)
  }
  if (to === 'completed' && c.handoff?.status !== 'opened') return reject('handoff_not_opened', 'ต้องเปิด GemBond ก่อนจึงจะจบแคมเปญได้')
  if (to === 'paused') return ok({ ...c, phase: to, pausedFrom: c.phase })
  return ok({ ...c, phase: to, pausedFrom: undefined })
}

export function resume(c: GemHunterCampaign): Result<GemHunterCampaign, LifecycleCode> {
  if (c.phase !== 'paused' || !c.pausedFrom) return reject('not_paused', 'แคมเปญนี้ไม่ได้หยุดไว้')
  return ok({ ...c, phase: c.pausedFrom, pausedFrom: undefined })
}

/** Joining needs a ready store with a clear policy status. Not a ranking, just a yes/no gate. */
export function eligibilityChecks(merchant: Merchant) {
  return [
    {
      id: 'readiness',
      label: 'ร้านพร้อมรับออเดอร์',
      passed: merchant.readinessStatus !== 'not_ready',
      detail: merchant.readinessStatus !== 'not_ready' ? 'ร้านพร้อมรับออเดอร์ตามปกติ' : 'ร้านยังไม่พร้อมรับออเดอร์',
    },
    {
      id: 'policy',
      label: 'ร้านไม่มีเรื่องที่รอตรวจสอบตามนโยบาย',
      passed: merchant.policyStatus === 'clear',
      detail: merchant.policyStatus === 'clear' ? 'ไม่พบเรื่องที่รอตรวจสอบ' : 'มีเรื่องที่ยังรอตรวจสอบ',
    },
  ]
}
