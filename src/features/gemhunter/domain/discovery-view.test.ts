import { describe, expect, it } from 'vitest'
import { getSimulationNoticeText } from './discovery-helpers'

describe('getSimulationNoticeText', () => {
  it('returns explicit simulated content disclosure string with no emojis', () => {
    const text = getSimulationNoticeText()
    expect(text).toContain('ภาพจำลอง')
    expect(text).toContain('เพื่อการสาธิตการจัดหน้าร้าน')
    expect(text).not.toMatch(/[\u{1F300}-\u{1F6FF}]/u)
  })
})
