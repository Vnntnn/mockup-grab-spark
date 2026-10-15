import { evidenceOf } from './graduation'
import { approvedPhotos } from './submissions'
import type { GemHunterCampaign, GemHunterPhase } from './types'

/** Show next to every metric below. These are demo-campaign activity counts, not business outcomes (no sales, profit or customer growth). */
export const METRICS_NOTE = 'ตัวเลขเหล่านี้คือความคืบหน้าของแคมเปญตัวอย่าง (การจำลอง) ไม่ใช่ผลลัพธ์ทางธุรกิจ เช่น ยอดขายหรือกำไร'

export interface CampaignMetrics {
  /** the merchant has moved past the eligibility check */
  enrolled: boolean
  menuAuditCompletion: { decided: number; total: number }
  approvedPhotos: number
  validReviews: number
  /** every submission is one simulated mission completion. Simulated engagement, not real orders. */
  missionCompletions: number
  graduationEligible: boolean
  handoffCompleted: boolean
  moderation: {
    approved: number
    rejected: number
    pending: number
    /** approved / (approved + rejected), rounded to a whole percent. null until something has been moderated. */
    approvalRatePct: number | null
  }
}

/**
 * Pure, derived from campaign state only. There is deliberately no duplicate rate: a duplicate attempt is refused and never stored,
 * so any rate would have to be invented.
 */
export function campaignMetrics(c: GemHunterCampaign): CampaignMetrics {
  const subs = c.submissions
  const approved = subs.filter((s) => s.moderation === 'approved').length
  const rejected = subs.filter((s) => s.moderation === 'rejected').length
  const moderated = approved + rejected
  const ev = evidenceOf(c)
  return {
    enrolled: isEnrolled(c),
    menuAuditCompletion: { decided: c.menuAudit.items.filter((i) => i.decision !== 'pending').length, total: c.menuAudit.items.length },
    approvedPhotos: approvedPhotos(c).length,
    validReviews: ev.validReviews,
    missionCompletions: subs.length,
    graduationEligible: ev.eligible,
    handoffCompleted: c.handoff?.status === 'opened',
    moderation: {
      approved,
      rejected,
      pending: subs.length - moderated,
      approvalRatePct: moderated === 0 ? null : Math.round((approved / moderated) * 100),
    },
  }
}

const BEFORE_ENROLMENT: GemHunterPhase[] = ['eligibility_check']

/** Paused counts as the phase it paused from. A cancelled campaign counts only if the merchant had already done something in it. */
function isEnrolled(c: GemHunterCampaign): boolean {
  if (c.phase === 'cancelled') return c.menuAudit.items.some((i) => i.decision !== 'pending') || c.submissions.length > 0
  const effective = c.phase === 'paused' ? (c.pausedFrom ?? 'eligibility_check') : c.phase
  return !BEFORE_ENROLMENT.includes(effective)
}
