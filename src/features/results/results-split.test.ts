import { describe, expect, it } from 'vitest'
import { calculateCampaignResults, orderImpactBreakdown } from '@/domain/calculations'
import { MERCHANT_BASELINE, RESULTS_SEEDS } from '@/data/results'
import { addDays } from '@/lib/dates'
import { canShowOrderSplit } from './waterfall-helpers'
import type { Campaign, ResultsSeed } from '@/domain/types'

const START = '2026-10-15'
const campaignOf = (days: number): Campaign => ({
  id: 'c',
  planId: 'p',
  planVersion: 1,
  startDate: START,
  endDate: addDays(START, days - 1),
  status: 'completed',
  agreedResponsibilities: {},
  measurementConfiguration: { baselineDays: 7, comparison: 'similar_stores', attribution: 'campaign_link' },
})
const run = (seed: ResultsSeed, days: number) => calculateCampaignResults(seed, MERCHANT_BASELINE, campaignOf(days), 38)
const KHAOHOM = RESULTS_SEEDS['m-khaohom']

describe('Results split: baseline + expected anyway + estimated from the campaign = campaign orders', () => {
  it('10-day campaign (the 7-day pattern repeats): 201 + 12 + 26 = 239', () => {
    const r = run(KHAOHOM, 10)
    expect(r.derived.campaignDays).toBe(10)
    expect(r.orders.campaign).toBe(239) // 22+25+24+27+28+21+21 + 22+25+24
    expect(r.derived.baselineOrdersScaled).toBeCloseTo((141 / 7) * 10, 10) // baseline per day (20.14) scaled to 10 days
    const i = orderImpactBreakdown(r)!
    expect(i).toEqual({ observed: 38, expectedAnyway: 12, fromCampaign: 26 })
    // what the hero bar is given: the scaled baseline, rounded once, so the three parts add up exactly
    const barBaseline = r.orders.campaign - i.observed
    expect(barBaseline).toBe(201)
    expect(barBaseline + i.expectedAnyway + i.fromCampaign).toBe(r.orders.campaign)
  })

  it('7-day campaign: baseline is not rescaled (141 + 8 + 19 = 168)', () => {
    const r = run(KHAOHOM, 7)
    const i = orderImpactBreakdown(r)!
    expect(r.derived.baselineOrdersScaled).toBeCloseTo(141, 10)
    expect(i).toEqual({ observed: 27, expectedAnyway: 8, fromCampaign: 19 })
    expect(r.orders.campaign - i.observed + i.expectedAnyway + i.fromCampaign).toBe(168)
  })

  it('holds for every campaign length from 1 to 21 days and every seed that can be estimated, with whole non-NaN numbers', () => {
    for (const seed of Object.values(RESULTS_SEEDS)) {
      for (let days = 1; days <= 21; days++) {
        const r = run(seed, days)
        const i = orderImpactBreakdown(r)
        if (i === null) continue
        expect(Object.values(i).every((n) => Number.isInteger(n) && !Object.is(n, -0))).toBe(true)
        expect(r.orders.campaign - i.observed + i.expectedAnyway + i.fromCampaign).toBe(r.orders.campaign)
        // the baseline share never strays more than a whole order from the unrounded scaled baseline
        expect(Math.abs(r.orders.campaign - i.observed - r.derived.baselineOrdersScaled)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('gives no split when there is nothing honest to split: incomplete data, or no comparison group', () => {
    expect(orderImpactBreakdown(run(RESULTS_SEEDS['m-tea'], 7))).toBeNull() // reports 4 of 7 days, no comparison group
    expect(orderImpactBreakdown(run({ ...KHAOHOM, comparisonGroup: null }, 7))).toBeNull()
    expect(canShowOrderSplit(null)).toBe(false)
  })

  it('the bar is only drawn when every part is a non-negative count and orders actually rose', () => {
    expect(canShowOrderSplit({ observed: 38, expectedAnyway: 12, fromCampaign: 26 })).toBe(true)
    expect(canShowOrderSplit({ observed: 0, expectedAnyway: 0, fromCampaign: 0 })).toBe(false) // no rise
    expect(canShowOrderSplit({ observed: -5, expectedAnyway: -2, fromCampaign: -3 })).toBe(false) // a fall
    expect(canShowOrderSplit({ observed: 10, expectedAnyway: 14, fromCampaign: -4 })).toBe(false) // rise smaller than the comparison group's
    expect(canShowOrderSplit({ observed: 10, expectedAnyway: -3, fromCampaign: 13 })).toBe(false) // comparison group fell
    // and a real case that lands there: the comparison group grew faster than this shop
    const r = run({ ...KHAOHOM, comparisonGroup: { label: 'x', storeCount: 5, ordersChangePct: 30 } }, 7)
    const i = orderImpactBreakdown(r)!
    expect(i.fromCampaign).toBeLessThan(0)
    expect(canShowOrderSplit(i)).toBe(false)
  })
})
