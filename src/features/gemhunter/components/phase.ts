import type { GemHunterPhase } from '../domain/types'

/** Plain-Thai campaign status. Always shown as words (and an icon where it appears as a badge). */
export const PHASE_LABEL_SHORT: Record<GemHunterPhase, string> = {
  eligibility_check: 'ตรวจคุณสมบัติร้าน',
  menu_review: 'ตรวจชื่อเมนู',
  active_campaign: 'แคมเปญเปิดรับรีวิว',
  submission_review: 'กำลังตรวจรีวิวและรูป',
  graduation_check: 'ตรวจเกณฑ์ผ่านแคมเปญ',
  gembond_handoff: 'พร้อมเปิด GemBond',
  completed: 'แคมเปญเสร็จสิ้น',
  paused: 'พักแคมเปญไว้',
  cancelled: 'ยกเลิกแคมเปญแล้ว',
}

/** The five steps. They are the navigation: `short` is the label that fits a phone. */
export const STEPS: { to: string; end?: boolean; label: string; full: string }[] = [
  { to: '/gemhunter', end: true, label: 'คำเชิญ', full: 'คำเชิญเข้าร่วม' },
  { to: '/gemhunter/menu', label: 'เมนู', full: 'ตรวจชื่อเมนู' },
  { to: '/gemhunter/discover', label: 'หน้าลูกค้า', full: 'หน้าที่ลูกค้าเห็น' },
  { to: '/gemhunter/photos', label: 'รูปรีวิว', full: 'รูปและรีวิว' },
  { to: '/gemhunter/results', label: 'ผลลัพธ์', full: 'ผลลัพธ์' },
]

/** Where "ทำต่อ" should take the merchant for a given phase. */
export function continuePath(phase: GemHunterPhase): string {
  switch (phase) {
    case 'eligibility_check':
      return '/gemhunter'
    case 'menu_review':
      return '/gemhunter/menu'
    case 'active_campaign':
      return '/gemhunter/discover'
    case 'submission_review':
      return '/gemhunter/photos'
    default:
      return '/gemhunter/results'
  }
}
