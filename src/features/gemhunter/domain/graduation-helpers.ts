export interface GraduationStepDetail {
  id: string
  label: string
  description: string
}

export function getGraduationStepDetails(): GraduationStepDetail[] {
  return [
    {
      id: 'thresholds',
      label: 'เกณฑ์ขั้นต่ำผ่าน',
      description: 'คะแนนเฉลี่ย รีวิวที่ยืนยัน และรูปภาพผ่านเกณฑ์มาตรฐานทั้งหมด',
    },
    {
      id: 'consent',
      label: 'ยินยอมแชร์ข้อมูลกับคู่ค้า',
      description: 'เลือกแชร์ข้อมูลสถิติที่จำเป็นตามความสมัครใจ ไม่มีผลกระทบหากปฏิเสธ',
    },
    {
      id: 'unlocked',
      label: 'ปลดล็อกพันธมิตร GemBond',
      description: 'ค้นหาและจับคู่ร้านอาหารเกื้อหนุนในย่านเดียวกันเพื่อเติบโตร่วมกัน',
    },
  ]
}
