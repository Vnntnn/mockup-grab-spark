import { STATUS } from '@/lib/copy'
import type { PlanLifecycle } from '@/domain/types'

export interface DecisionDockState {
  /** The one forward action. Null when the owner has nothing to do on this screen. */
  primaryActionLabel: string | null
  /** The exact status wording shared with every other screen. */
  statusBadgeText: string
  requiresConsent: boolean
  /** Declining is offered next to the primary action, same size. */
  canDecline: boolean
  declineLabel: string
  isReadOnly: boolean
}

/**
 * What the decision area offers for each state of a plan.
 * Accepting is only "interested + confirm terms": the campaign stays inactive until both shops agree.
 * Cancelling a running campaign lives on the campaign page, where its consequences are listed.
 */
export function getDecisionDockState(status: PlanLifecycle, selfAccepted: boolean): DecisionDockState {
  const effective: PlanLifecycle = status === 'awaiting' && selfAccepted ? 'interested' : status
  const statusBadgeText = STATUS[effective].label
  const base = { statusBadgeText, requiresConsent: false, canDecline: false, declineLabel: 'ยังไม่เข้าร่วม', isReadOnly: false }
  switch (effective) {
    case 'awaiting':
      return { ...base, primaryActionLabel: 'สนใจและยืนยันเงื่อนไข', requiresConsent: true, canDecline: true }
    case 'interested':
      return { ...base, primaryActionLabel: null, canDecline: true, declineLabel: 'ถอนความสนใจ (ยังไม่เข้าร่วม)' }
    case 'ready':
      return { ...base, primaryActionLabel: 'ไปเริ่มแคมเปญ', canDecline: true }
    case 'active':
      return { ...base, primaryActionLabel: 'ดูแคมเปญ' }
    case 'completed':
      return { ...base, primaryActionLabel: 'ดูผลลัพธ์', isReadOnly: true }
    default:
      return { ...base, primaryActionLabel: null, isReadOnly: true }
  }
}
