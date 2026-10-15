import { CheckCircle2, CircleDashed, Clock, Handshake, PlayCircle, XCircle, Ban, type LucideIcon } from 'lucide-react'
import type { PlanLifecycle, SupportCategoryId } from '@/domain/types'

export const DEMO_NOTE =
  'ต้นแบบสาธิต: ร้าน ข้อมูล และตัวเลขทั้งหมดเป็นข้อมูลตัวอย่าง ไม่ได้เชื่อมต่อบัญชีร้านจริง และไม่ได้เริ่มแคมเปญจริง'

export const DEMO_NOTE_SHORT = 'ข้อมูลตัวอย่างเพื่อสาธิต ไม่ได้เชื่อมต่อบัญชีร้านจริง'

export const STATUS: Record<PlanLifecycle, { label: string; icon: LucideIcon; tone: 'neutral' | 'wait' | 'good' | 'quiet' }> = {
  awaiting: { label: 'รอการตัดสินใจจากร้านของคุณ', icon: CircleDashed, tone: 'neutral' },
  interested: { label: 'คุณสนใจแล้ว — รอร้านคู่ค้ายืนยัน', icon: Clock, tone: 'wait' },
  ready: { label: 'ร้านทั้งสองฝ่ายยืนยันแล้ว — พร้อมเริ่มแคมเปญ', icon: Handshake, tone: 'good' },
  active: { label: 'แคมเปญกำลังดำเนินการ', icon: PlayCircle, tone: 'good' },
  completed: { label: 'แคมเปญเสร็จสิ้น', icon: CheckCircle2, tone: 'good' },
  cancelled: { label: 'แผนถูกยกเลิก', icon: Ban, tone: 'quiet' },
  declined: { label: 'คุณเลือกยังไม่เข้าร่วม', icon: XCircle, tone: 'quiet' },
}

export const SUPPORT_CATEGORIES: { id: SupportCategoryId; label: string; hint: string }[] = [
  { id: 'not_understand', label: 'ฉันไม่เข้าใจเงื่อนไข', hint: 'บอกว่าข้อไหนอ่านแล้วยังไม่ชัด' },
  { id: 'unexpected_cost', label: 'ฉันพบค่าใช้จ่ายที่ไม่คาดคิด', hint: 'บอกว่าเห็นที่ไหนและเท่าไร' },
  { id: 'unfair_terms', label: 'ฉันรู้สึกว่าได้รับเงื่อนไขที่ไม่เป็นธรรม', hint: 'เล่าสั้น ๆ ว่าข้อไหนที่รู้สึกไม่เป็นธรรม' },
  { id: 'cancel_plan', label: 'ฉันต้องการยกเลิกแผน', hint: 'ยกเลิกเองได้ที่หน้าแคมเปญ ไม่มีค่าปรับ' },
  { id: 'other', label: 'ฉันมีปัญหาอื่น', hint: 'เล่าได้ตามสะดวก' },
]

export const READINESS_LABEL = { ready: 'พร้อมรับแคมเปญ', almost: 'เกือบพร้อม', not_ready: 'ยังไม่พร้อม' } as const
export const PREFERENCE_LABEL = {
  open: 'สนใจกิจกรรมร่วมกัน',
  selective: 'เลือกเฉพาะที่เหมาะสม',
  not_now: 'ยังไม่ต้องการตอนนี้',
} as const
