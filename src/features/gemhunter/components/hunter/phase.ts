import type { GemHunterPhase, HunterSubmission } from '../../domain'

/**
 * Phases where hunters can submit and the photo bank can be worked on.
 * Mirrors the reducer's rule (the reducer is the authority and still rejects anything else); kept here so the UI can explain instead of showing a dead control.
 */
export const SUBMISSION_PHASES: readonly GemHunterPhase[] = ['active_campaign', 'submission_review', 'graduation_check']

/** Phases where the campaign is live for customers (the mission is visible). */
export const MISSION_LIVE_PHASES: readonly GemHunterPhase[] = [...SUBMISSION_PHASES, 'gembond_handoff']

export const acceptsSubmissions = (p: GemHunterPhase) => SUBMISSION_PHASES.includes(p)
export const isMissionLive = (p: GemHunterPhase) => MISSION_LIVE_PHASES.includes(p)

export const PHASE_LABEL: Record<GemHunterPhase, string> = {
  eligibility_check: 'ตรวจสอบสิทธิ์เข้าร่วม',
  menu_review: 'ตรวจสอบชื่อเมนู',
  active_campaign: 'แคมเปญเปิดรับรีวิว',
  submission_review: 'ตรวจสอบรีวิวและรูป',
  graduation_check: 'ตรวจเกณฑ์จบแคมเปญ',
  gembond_handoff: 'เตรียมส่งต่อไป GemBond',
  completed: 'แคมเปญเสร็จสิ้น',
  paused: 'แคมเปญหยุดชั่วคราว',
  cancelled: 'แคมเปญถูกยกเลิก',
}

/**
 * Overall progress is counted in the SAME five steps as the campaign navigation (เชิญร่วม, เมนู, ลูกค้านักล่า, รูปและรีวิว, ผลลัพธ์),
 * so "ขั้นตอนที่ n จาก 5" always matches the step the merchant sees in the menu. Paused/cancelled are not steps.
 */
export const CAMPAIGN_STEP_COUNT = 5
export const CAMPAIGN_STEP_OF_PHASE: Record<Exclude<GemHunterPhase, 'paused' | 'cancelled'>, number> = {
  eligibility_check: 1,
  menu_review: 2,
  active_campaign: 3,
  submission_review: 4,
  graduation_check: 5,
  gembond_handoff: 5,
  completed: 5,
}

/** Plain-Thai reason why submissions are closed right now, or null when they are open. */
export function closedReason(p: GemHunterPhase): string | null {
  if (acceptsSubmissions(p)) return null
  switch (p) {
    case 'eligibility_check':
    case 'menu_review':
      return 'แคมเปญยังไม่เริ่ม จึงยังไม่เปิดรับรีวิว'
    case 'paused':
      return 'แคมเปญหยุดชั่วคราว จึงยังไม่รับรีวิวใหม่'
    case 'gembond_handoff':
    case 'completed':
      return 'แคมเปญปิดรับรีวิวแล้ว'
    case 'cancelled':
      return 'แคมเปญนี้ถูกยกเลิกแล้ว การขายตามปกติของร้านไม่ได้รับผลกระทบ'
    default:
      return 'ขั้นตอนนี้ยังไม่เปิดรับรีวิว'
  }
}

/** Which group of the photo bank a submission belongs to: needs the merchant, waits on the platform, or already settled. */
export function bankGroup(s: HunterSubmission): 'mine' | 'wait' | 'done' {
  if (s.moderation === 'pending') return 'wait'
  if (s.moderation === 'approved' && s.photo.imageUseConsent && s.photo.merchantDecision === 'pending') return 'mine'
  return 'done'
}
