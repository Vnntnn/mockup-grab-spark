import { describe, expect, it } from 'vitest'
import { formatGuaranteeBaht } from './primitives-data'

describe('Primitives and formatting helpers', () => {
  it('formats baht amounts with tabular figures format', () => {
    expect(formatGuaranteeBaht(0)).toBe('฿ 0 บาท')
    expect(formatGuaranteeBaht(1500)).toBe('฿ 1,500 บาท')
  })
})
