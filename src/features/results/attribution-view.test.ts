import { describe, expect, it } from 'vitest'
import { computeWaterfallSegments } from './waterfall-helpers'

describe('computeWaterfallSegments', () => {
  it('computes proportional widths for baseline, market, and gemBond uplift', () => {
    const segments = computeWaterfallSegments({ baseline: 120, marketTrend: 15, gemBondUplift: 45 })
    expect(segments.total).toBe(180)
    expect(segments.baselinePercent).toBeCloseTo(66.67, 1)
    expect(segments.marketPercent).toBeCloseTo(8.33, 1)
    expect(segments.boostPercent).toBeCloseTo(25.0, 1)
  })
})
