import { describe, expect, it } from 'vitest'
import { createInitialState, reduce, type Action } from '@/app/reducer'
import { deriveActivity, matching, recentPeriod, resultsFor } from '@/app/selectors'
import { MERCHANT_BASELINE, NO_DATA_SEED } from '@/data/results'
import { calculateCampaignResults, recommendNextAction } from './calculations'
import { activateCampaign, checkActivation } from './campaign-lifecycle'
import { checkEligibility } from './matching'
import { checkInvariants } from './invariants'
import type { AppState } from './types'

// Regression tests for the audit findings F-1, F-4, F-5 and requirement GB-005 (docs/REQUIREMENTS-TRACEABILITY.md).

const T = '2026-10-14'
const K = 'plan-m-khaohom'
const TEA = 'plan-m-tea'
const SELF = 'm-satay'
const fresh = () => createInitialState(T)
const run = (s: AppState, ...a: Action[]) => a.reduce(reduce, s)
const accept = (planId: string): Action => ({ type: 'accept', planId, acks: ['cost', 'data', 'rights'] })
const partner = (planId: string): Action => ({ type: 'demoPartnerConsent', planId })
const ready = (planId: string): Action[] => [accept(planId), partner(planId)]
const merchantsOf = (s: AppState) => Object.values(s.merchants)

describe('F-1: baseline dates describe the data that was really used', () => {
  // khaohom runs 14-20 Oct, the demo clock moves to 21 Oct, then the tea shop campaign runs 21-27 Oct.
  const both = () =>
    run(
      fresh(),
      ...ready(K),
      { type: 'activate', planId: K },
      { type: 'demoComplete', planId: K },
      ...ready(TEA),
      { type: 'activate', planId: TEA },
      { type: 'demoComplete', planId: TEA },
    )

  it('a single campaign keeps the 7 days before it (unchanged behaviour)', () => {
    const s = run(fresh(), ...ready(K), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K })
    const r = resultsFor(s, s.campaigns[K])!
    expect(r.baselinePeriod).toEqual({ start: '2026-10-07', end: '2026-10-13' })
    expect(r.derived.baselineBeforeEarlierCampaign).toBe(false)
  })

  it('a later campaign is not told its baseline is the week before it when an earlier campaign ran in between', () => {
    const s = both()
    expect(s.campaigns[TEA].startDate).toBe('2026-10-21')
    const first = resultsFor(s, s.campaigns[K])!
    const second = resultsFor(s, s.campaigns[TEA])!
    // the second report points at the same pre-campaign history as the first, never at 14-20 Oct (the first campaign's own days)
    expect(second.baselinePeriod).toEqual(first.baselinePeriod)
    expect(second.derived.baselineBeforeEarlierCampaign).toBe(true)
    expect(first.derived.baselineBeforeEarlierCampaign).toBe(false)
    for (const c of Object.values(s.campaigns).filter((c) => c.startDate && c.endDate)) {
      const overlaps = second.baselinePeriod.start <= c.endDate! && c.startDate! <= second.baselinePeriod.end
      expect(overlaps).toBe(false)
    }
  })

  it('the number of baseline days still matches the reported period length', () => {
    const s = both()
    const r = resultsFor(s, s.campaigns[TEA])!
    const days = (new Date(r.baselinePeriod.end).getTime() - new Date(r.baselinePeriod.start).getTime()) / 86400000 + 1
    expect(days).toBe(r.derived.baselineDays)
  })

  it('an anchor that is not earlier than the start is ignored', () => {
    const s = run(fresh(), ...ready(K), { type: 'activate', planId: K })
    const camp = s.campaigns[K]
    const seed = { campaign: { orders: [20], revenueBaht: [3700] }, clicks: 1, attributedOrders: 0, promotionalCostsBaht: 0, comparisonGroup: null }
    expect(calculateCampaignResults(seed, MERCHANT_BASELINE, camp, 38, '2026-10-20').baselinePeriod).toEqual({ start: '2026-10-07', end: '2026-10-13' })
  })
})

describe('F-4: one running campaign at a time', () => {
  const bothReady = () => run(fresh(), ...ready(K), ...ready(TEA))

  it('with two agreed plans, starting the second is refused while the first runs, and the reason is shown', () => {
    const s = run(bothReady(), { type: 'activate', planId: K })
    expect(s.campaigns[K].status).toBe('active')
    expect(s.plans[TEA].lifecycleStatus).toBe('ready')
    const checks = checkActivation(s.plans[TEA], merchantsOf(s), Object.values(s.campaigns))
    expect(checks.find((c) => c.id === 'one-at-a-time')).toMatchObject({ passed: false })
    const r = activateCampaign(s.plans[TEA], s.campaigns[TEA], merchantsOf(s), T, Object.values(s.campaigns))
    expect(r).toMatchObject({ ok: false })
    // through the reducer the state is unchanged, so the UI can report failure honestly
    expect(reduce(s, { type: 'activate', planId: TEA })).toBe(s)
    expect(checkInvariants(s)).toEqual([])
  })

  it('the second campaign can start after the first completes or is cancelled', () => {
    const afterComplete = run(bothReady(), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K }, { type: 'activate', planId: TEA })
    expect(afterComplete.campaigns[TEA].status).toBe('active')
    const afterCancel = run(bothReady(), { type: 'activate', planId: K }, { type: 'cancel', planId: K }, { type: 'activate', planId: TEA })
    expect(afterCancel.campaigns[TEA].status).toBe('active')
  })

  it('adds no extra check when nothing else is running (still the four documented conditions)', () => {
    const s = bothReady()
    expect(checkActivation(s.plans[K], merchantsOf(s), Object.values(s.campaigns))).toHaveLength(4)
    expect(checkActivation(s.plans[K], merchantsOf(s))).toHaveLength(4)
  })

  it('a campaign never blocks itself', () => {
    const s = run(bothReady(), { type: 'activate', planId: K })
    const self = checkActivation(s.plans[K], merchantsOf(s), Object.values(s.campaigns))
    expect(self.find((c) => c.id === 'one-at-a-time')).toBeUndefined()
  })
})

describe('F-5: a partner with no results data never borrows another partner\'s numbers', () => {
  it('gives an insufficient-data result with no profit and no invented orders', () => {
    const done = run(fresh(), ...ready(K), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K })
    const unseeded: AppState = { ...done, plans: { ...done.plans, [K]: { ...done.plans[K], participatingMerchantIds: [SELF, 'm-unknown'] } } }
    const r = resultsFor(unseeded, unseeded.campaigns[K])!
    expect(r.derived.insufficientReason).toBe('campaign_incomplete')
    expect(r.orders.campaign).toBe(0)
    expect(r.derived.contribution).toBeNull()
    expect(r.derived.incrementalContribution).toBeNull()
    expect(recommendNextAction(r).kind).toBe('need_data')
  })

  it('NO_DATA_SEED reports zero attributed clicks and no comparison group', () => {
    expect(NO_DATA_SEED.reportedDays).toBe(0)
    expect(NO_DATA_SEED.comparisonGroup).toBeNull()
    expect(NO_DATA_SEED.clicks).toBe(0)
  })
})

describe('GB-005: complementary shops must not sell the same menu categories', () => {
  it('rejects a pair whose menu categories overlap, with a stated reason', () => {
    const s = fresh()
    const self = { ...s.merchants[SELF], menuCategories: ['ปิ้งย่าง', 'ของหวาน'] }
    const failed = checkEligibility(self, s.merchants['m-dessert']).map((f) => f.id)
    expect(failed).toContain('menu_overlap')
  })

  it('the seed pairs do not overlap, so the default recommendations are unchanged', () => {
    const s = fresh()
    expect(matching(s).recommendations.map((r) => r.partnerMerchantId)).toEqual(['m-khaohom', 'm-tea', 'm-dessert'])
    for (const id of ['m-khaohom', 'm-tea', 'm-dessert']) {
      expect(checkEligibility(s.merchants[SELF], s.merchants[id]).map((f) => f.id)).not.toContain('menu_overlap')
    }
  })

  it('editing the store menu to overlap removes that partner from the recommendations', () => {
    const s = run(fresh(), { type: 'updateMerchant', patch: { menuCategories: ['ปิ้งย่าง', 'ของหวาน'] } })
    const m = matching(s)
    expect(m.recommendations.map((r) => r.partnerMerchantId)).not.toContain('m-dessert')
    expect(m.rejected.find((r) => r.merchantId === 'm-dessert')).toMatchObject({ stage: 'eligibility', reasons: expect.arrayContaining(['เมนูของสองร้านซ้อนกัน']) })
    expect(m.recommendations.map((r) => r.partnerMerchantId)).toContain('m-khaohom')
  })
})

describe('F-1 (dashboard): "latest campaign" figures name the latest campaign and a baseline that matches the data', () => {
  const both = () =>
    run(
      fresh(),
      ...ready(K),
      { type: 'activate', planId: K },
      { type: 'demoComplete', planId: K },
      ...ready(TEA),
      { type: 'activate', planId: TEA },
      { type: 'demoComplete', planId: TEA },
    )

  it('after two campaigns with complete data, the summary is the later one, not the first stored', () => {
    const DES = 'plan-m-dessert'
    const s = run(
      fresh(),
      ...ready(K),
      { type: 'activate', planId: K },
      { type: 'demoComplete', planId: K },
      ...ready(DES),
      { type: 'activate', planId: DES },
      { type: 'demoComplete', planId: DES },
    )
    expect(s.campaigns[DES].startDate! > s.campaigns[K].endDate!).toBe(true)
    expect(recentPeriod(s).range).toEqual({ start: s.campaigns[DES].startDate, end: s.campaigns[DES].endDate })
    expect(recentPeriod(s).label).toContain('แคมเปญล่าสุด')
  })

  it('when the latest campaign reported only part of its days (tea: 4 of 7), the fallback does not fall back to the FIRST campaign\'s figures', () => {
    const s = both()
    const p = recentPeriod(s)
    expect(p.label).toContain('ก่อนแคมเปญแรก')
    expect(p.range).not.toEqual({ start: s.campaigns[K].startDate, end: s.campaigns[K].endDate })
  })

  it('with a single completed campaign the summary is unchanged', () => {
    const s = run(fresh(), ...ready(K), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K })
    expect(recentPeriod(s).range).toEqual({ start: s.campaigns[K].startDate, end: s.campaigns[K].endDate })
  })

  it('when the latest campaign has incomplete data, the fallback names the pre-first-campaign week and overlaps no campaign', () => {
    // tea reports 4 of 7 days, so the dashboard falls back to the baseline figures
    const s = both()
    const tea = s.campaigns[TEA]
    // force the fallback branch by shortening the tea report through its seed key being absent
    const unseeded: AppState = { ...s, plans: { ...s.plans, [TEA]: { ...s.plans[TEA], participatingMerchantIds: [SELF, 'm-unknown'] } } }
    const p = recentPeriod(unseeded)
    expect(tea.status).toBe('completed')
    expect(p.label).toContain('ก่อนแคมเปญแรก')
    for (const c of Object.values(s.campaigns).filter((c) => c.startDate && c.endDate)) {
      expect(p.range.start <= c.endDate! && c.startDate! <= p.range.end).toBe(false)
    }
    expect(p.orders).toBe(MERCHANT_BASELINE.orders.reduce((a, b) => a + b, 0))
  })
})

describe('INV-1: at most one active campaign in any state', () => {
  it('the invariant checker flags two active campaigns and stays clean for a normal run', () => {
    const s = run(fresh(), ...ready(K), ...ready(TEA), { type: 'activate', planId: K })
    expect(checkInvariants(s)).toEqual([])
    const forged: AppState = { ...s, campaigns: { ...s.campaigns, [TEA]: { ...s.campaigns[TEA], status: 'active' } } }
    expect(checkInvariants(forged).some((m) => m.includes('more than one active campaign'))).toBe(true)
  })

  it('a ready plan says it must wait while another campaign is running', () => {
    const s = run(fresh(), ...ready(K), ...ready(TEA), { type: 'activate', planId: K })
    const t = deriveActivity(s).find((a) => a.id === `${TEA}-ready`)!.text
    expect(t).toContain('เริ่มได้เมื่อแคมเปญที่กำลังดำเนินการจบ')
    const alone = run(fresh(), ...ready(TEA))
    expect(deriveActivity(alone).find((a) => a.id === `${TEA}-ready`)!.text).toContain('กดเริ่มแคมเปญได้')
  })
})
