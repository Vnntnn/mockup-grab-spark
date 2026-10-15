import { describe, expect, it } from 'vitest'
import { getGraduationStepDetails } from './graduation-helpers'

describe('getGraduationStepDetails', () => {
  it('returns clean step progression labels and verification gates', () => {
    const steps = getGraduationStepDetails()
    expect(steps).toHaveLength(3)
    expect(steps[0].label).toBe('เกณฑ์ขั้นต่ำผ่าน')
    expect(steps[1].label).toBe('ยินยอมแชร์ข้อมูลกับคู่ค้า')
    expect(steps[2].label).toBe('ปลดล็อกพันธมิตร GemBond')
  })
})
