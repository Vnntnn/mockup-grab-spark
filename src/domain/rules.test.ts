import { describe, expect, it } from 'vitest'
import { createInitialState, reduce, type Action } from '@/app/reducer'
import { matching, resultsFor } from '@/app/selectors'
import { MERCHANT_BASELINE, RESULTS_SEEDS } from '@/data/results'
import { TEMPLATES } from '@/data/templates'
import { calculateCampaignResults, INSUFFICIENT_TEXT, orderImpactBreakdown, recommendNextAction } from './calculations'
import { activateCampaign, checkActivation } from './campaign-lifecycle'
import { acceptPlan, declinePlan, validateConsent } from './consent'
import { canPartnerAccess, validateGrowthPlan } from './fairness'
import { checkInvariants } from './invariants'
import { applyTermsChange, generateGrowthPlan, isMaterialChange, refreshPlan, totalCommitmentBaht } from './plans'
import type { AppState, GrowthPlan, InsufficientReason, ResultsSeed } from './types'

/**
 * Rule-by-rule coverage for the product principles (CLAUDE.md C-H) that domain.test.ts does not already pin down.
 * Expected values come from the written rules and worked arithmetic, not from re-running the implementation.
 */
const T = '2026-10-14'
const K = 'plan-m-khaohom'
const SELF = 'm-satay'
const PARTNER = 'm-khaohom'
const fresh = () => createInitialState(T)
const run = (s: AppState, ...a: Action[]) => a.reduce(reduce, s)
const clone = (p: GrowthPlan) => structuredClone(p)
const accept = (planId = K): Action => ({ type: 'accept', planId, acks: ['cost', 'data', 'rights'] })
const partnerOk = (planId = K): Action => ({ type: 'demoPartnerConsent', planId })
const activate = (planId = K): Action => ({ type: 'activate', planId })
const agreed = () => run(fresh(), accept(), partnerOk())
const active = () => run(agreed(), activate())
const merchantsOf = (s: AppState) => Object.values(s.merchants)
const withSetup = (p: GrowthPlan, patch: Partial<GrowthPlan>): GrowthPlan => ({ ...p, ...patch })
/** Both parties "accepted" at the given versions, stored fairness forged to passed: isolates a single activation check. */
const forgedReady = (p: GrowthPlan, selfVersion: number, partnerVersion: number): GrowthPlan =>
  withSetup(p, {
    fairnessCheckStatus: 'passed',
    lifecycleStatus: 'ready',
    consentRecords: p.consentRecords.map((r) => ({
      ...r,
      consentStatus: 'accepted' as const,
      termsVersion: r.merchantId === SELF ? selfVersion : partnerVersion,
    })),
  })

describe('principles C/D: no forced discount, no mandatory revenue sharing (every channel)', () => {
  it('a discount or revenue share smuggled in as a disclosed cost line still fails fairness', () => {
    const base = fresh().plans[K]
    for (const id of ['discount', 'revshare'] as const) {
      const p = clone(base)
      const line = p.costTermsByMerchant[SELF].lines.find((l) => l.id === id)!
      Object.assign(line, { amountBaht: 30, trigger: 'ทุกออเดอร์ที่มาจากแคมเปญ', cap: 'ไม่เกิน 500 บาท' }) // fully "explained", so costs-explained passes
      const report = validateGrowthPlan(p)
      expect(report.status, id).toBe('failed')
      expect(report.checks.find((c) => c.id === (id === 'discount' ? 'no-forced-discount' : 'no-revenue-sharing'))?.status, id).toBe('fail')
    }
  })

  it('the forced-discount template is rejected at generation and can never be accepted or activated', () => {
    const s = fresh()
    const bad = generateGrowthPlan(s.merchants[SELF], s.merchants['m-jumbo'], TEMPLATES['bundle-discount'], T)
    expect(bad.discountTerms.requiredFromSmallMerchant).toBe(true)
    expect(bad.fairnessCheckStatus).toBe('failed')
    expect(acceptPlan(bad, SELF, ['x'], T)).toMatchObject({ ok: false })
    // even if it were injected into state and both consents were forged, the reducer refuses every path to active
    const injected: AppState = { ...s, plans: { ...s.plans, [bad.id]: bad }, campaigns: { ...s.campaigns, [bad.id]: { ...s.campaigns[K], id: `camp-${bad.id}`, planId: bad.id } } }
    expect(reduce(injected, accept(bad.id))).toBe(injected)
    expect(reduce(injected, partnerOk(bad.id))).toBe(injected)
    const forged = withSetup(bad, { lifecycleStatus: 'ready', consentRecords: bad.consentRecords.map((r) => ({ ...r, consentStatus: 'accepted' as const })) })
    const r = activateCampaign(forged, injected.campaigns[bad.id], merchantsOf(s), T)
    expect(r.ok).toBe(false)
    expect(checkActivation(forged, merchantsOf(s)).find((c) => c.id === 'fairness')?.passed).toBe(false)
  })
})

describe('principle: no unresolved financial obligation is ever treated as approved', () => {
  it('missing cost terms are "unresolved", never silently zero', () => {
    const base = fresh().plans[K]
    for (const missing of [SELF, PARTNER]) {
      const p = clone(base)
      delete p.costTermsByMerchant[missing]
      expect(validateGrowthPlan(p).status, `no terms for ${missing}`).toBe('unresolved')
      expect(totalCommitmentBaht(p, missing), `no terms for ${missing}`).toBeNull()
    }
  })

  it('an unresolved cost on the partner side also blocks the plan; activation re-checks even a forged "passed" status', () => {
    const base = fresh().plans[K]
    const p = clone(base)
    p.costTermsByMerchant[PARTNER].lines[0].amountBaht = null
    expect(validateGrowthPlan(p).status).toBe('unresolved')
    expect(acceptPlan(refreshPlan(p, T), SELF, [], T)).toMatchObject({ ok: false })

    const noPartnerTerms = clone(base)
    delete noPartnerTerms.costTermsByMerchant[PARTNER]
    const forged = forgedReady(noPartnerTerms, 1, 1)
    expect(checkActivation(forged, merchantsOf(fresh())).find((c) => c.id === 'conditions')?.passed).toBe(false)
    expect(activateCampaign(forged, fresh().campaigns[K], merchantsOf(fresh()), T)).toMatchObject({ ok: false })
  })

  it('a participant who is not ready (or under policy review) blocks activation even with valid consent', () => {
    const s = agreed()
    for (const patch of [{ readinessStatus: 'not_ready' as const }, { policyStatus: 'under_review' as const }]) {
      const merchants = { ...s.merchants, [PARTNER]: { ...s.merchants[PARTNER], ...patch } }
      const blocked: AppState = { ...s, merchants }
      expect(checkActivation(blocked.plans[K], Object.values(merchants)).find((c) => c.id === 'conditions')?.passed).toBe(false)
      expect(reduce(blocked, activate())).toBe(blocked)
    }
  })
})

describe('principle E: activation needs every consent on the same CURRENT terms version', () => {
  it('mixed versions (one side on v2, other still on v1) cannot activate', () => {
    const s = agreed()
    const mixed = forgedReady({ ...s.plans[K], planVersion: 2 }, 2, 1)
    expect(validateConsent(mixed)).toMatchObject({ ok: false, staleVersion: [PARTNER], missing: [] })
    const checks = checkActivation(mixed, merchantsOf(s))
    expect(checks.find((c) => c.id === 'same-version')?.passed).toBe(false)
    expect(activateCampaign(mixed, s.campaigns[K], merchantsOf(s), T)).toMatchObject({ ok: false })
  })

  it('reducer: a stale-consent plan forced to "ready" is refused and state is returned untouched', () => {
    const s = agreed()
    const stale: AppState = { ...s, plans: { ...s.plans, [K]: { ...s.plans[K], planVersion: 2, changeLog: [...s.plans[K].changeLog, { version: 2, at: T, summary: 'x' }] } } }
    expect(reduce(stale, activate())).toBe(stale)
  })

  it('consent can be bound to the version the merchant actually reviewed; a newer version is not accepted blindly', () => {
    const changed = run(fresh(), { type: 'demoChangeTerms', planId: K }).plans[K]
    expect(changed.planVersion).toBe(2)
    expect(acceptPlan(changed, SELF, ['cost'], T, 1)).toMatchObject({ ok: false }) // reviewed v1, plan is now v2
    const ok = acceptPlan(changed, SELF, ['cost'], T, 2)
    expect(ok.ok && ok.plan.consentRecords.find((r) => r.merchantId === SELF)).toMatchObject({ consentStatus: 'accepted', termsVersion: 2 })
    const v2 = run(fresh(), { type: 'demoChangeTerms', planId: K })
    const stale = reduce(v2, { type: 'accept', planId: K, acks: [], reviewedVersion: 1 })
    expect(stale).toBe(v2) // refused, nothing recorded
    expect(reduce(v2, { type: 'accept', planId: K, acks: [], reviewedVersion: 2 }).plans[K].lifecycleStatus).toBe('interested')
  })

  it('a consent only ever changes the accepting merchant\'s own record, and outsiders cannot consent', () => {
    const p = fresh().plans[K]
    expect(acceptPlan(p, 'm-tea', [], T)).toMatchObject({ ok: false })
    const r = acceptPlan(p, SELF, ['a'], T)
    expect(r.ok && r.plan.consentRecords.find((c) => c.merchantId === PARTNER)).toEqual(p.consentRecords.find((c) => c.merchantId === PARTNER))
  })
})

describe('principle E: material term changes (what counts as material)', () => {
  const base = () => fresh().plans[K]
  it('duration, costs, discount, revenue share, data permissions, responsibilities, cancellation terms, safeguards, template are material', () => {
    const edits: [string, (p: GrowthPlan) => void][] = [
      ['duration', (p) => { p.durationDays = 14 }],
      ['cost line', (p) => { p.costTermsByMerchant[SELF].lines[0].amountBaht = 99 }],
      ['discount terms', (p) => { p.discountTerms.note = 'เปลี่ยน' }],
      ['revenue sharing', (p) => { p.revenueSharingTerms.note = 'เปลี่ยน' }],
      ['data permission', (p) => { p.dataPermissions[0].partnerCanSee = false }],
      ['responsibilities', (p) => { p.responsibilitiesByMerchant[SELF].push('งานใหม่') }],
      ['cancellation terms', (p) => { p.cancellationTerms = ['ยกเลิกต้องเสียค่าปรับ'] }],
      ['safeguards', (p) => { p.safeguards.noPenaltyForDeclining = false }],
      ['template', (p) => { p.campaignTemplateId = 'bundle-discount' }],
    ]
    for (const [name, edit] of edits) {
      const next = clone(base())
      edit(next)
      expect(isMaterialChange(base(), next), name).toBe(true)
    }
  })

  it('title/summary wording is not material', () => {
    const next = clone(base())
    next.title = 'ชื่อใหม่'
    next.summary = 'สรุปใหม่'
    expect(isMaterialChange(base(), next)).toBe(false)
  })

  it('a duration that cannot run is rejected instead of producing an end date before the start date', () => {
    for (const bad of [0, -3, 2.5, NaN]) {
      expect(applyTermsChange(base(), { durationDays: bad }, 'x', T), String(bad)).toMatchObject({ ok: false })
    }
  })
})

describe('principle F: declining / cancelling never touches selling rights or the merchant record', () => {
  const selfBefore = fresh().merchants[SELF]
  const paths: [string, Action[]][] = [
    ['decline from awaiting', [{ type: 'decline', planId: K }]],
    ['decline after interest', [accept(), { type: 'decline', planId: K }]],
    ['decline then change mind', [{ type: 'decline', planId: K }, { type: 'reopen', planId: K }]],
    ['cancel when ready', [accept(), partnerOk(), { type: 'cancel', planId: K }]],
    ['cancel when active', [accept(), partnerOk(), activate(), { type: 'cancel', planId: K }]],
    ['decline every plan', Object.keys(fresh().plans).map((planId) => ({ type: 'decline', planId }) as Action)],
  ]
  for (const [name, steps] of paths) {
    it(name, () => {
      const s = run(fresh(), ...steps)
      expect(s.sellingStatus).toBe('normal')
      expect(s.merchants[SELF]).toEqual(selfBefore) // readiness, policy, preference, hours: unchanged
      expect(checkInvariants(s)).toEqual([])
    })
  }

  it('declining does not change what is recommended or how it is scored', () => {
    const before = matching(fresh()).recommendations.map((r) => [r.partnerMerchantId, r.matchScore])
    const after = matching(run(fresh(), { type: 'decline', planId: K })).recommendations.map((r) => [r.partnerMerchantId, r.matchScore])
    expect(after).toEqual(before)
  })

  it('declining takes effect only on the plan before it starts; a running campaign must be cancelled instead', () => {
    expect(declinePlan(active().plans[K], SELF, T)).toMatchObject({ ok: false })
  })
})

describe('no post-agreement unilateral change (every action on a running, finished or cancelled plan)', () => {
  const cases: [string, () => AppState][] = [
    ['active', active],
    ['completed', () => run(active(), { type: 'demoComplete', planId: K })],
    ['cancelled', () => run(agreed(), { type: 'cancel', planId: K })],
  ]
  for (const [name, make] of cases) {
    it(`${name}: terms, consent and status are frozen against accept / decline / reopen / partner consent / terms change`, () => {
      const s = make()
      for (const a of [accept(), { type: 'decline', planId: K } as Action, { type: 'reopen', planId: K } as Action, partnerOk(), { type: 'demoChangeTerms', planId: K } as Action]) {
        expect(reduce(s, a), `${name} / ${a.type}`).toBe(s)
      }
    })
  }

  it('an active campaign keeps the version and responsibilities it was agreed under', () => {
    const s = active()
    expect(s.campaigns[K].planVersion).toBe(s.plans[K].planVersion)
    expect(s.campaigns[K].agreedResponsibilities).toEqual(s.plans[K].responsibilitiesByMerchant)
    expect(applyTermsChange(s.plans[K], {}, 'no-op', T)).toMatchObject({ ok: false })
  })
})

describe('principle H: the partner sees only explicitly shared fields', () => {
  it('every seeded plan: only "shared" + partnerCanSee is visible; each private field is denied', () => {
    for (const p of Object.values(fresh().plans)) {
      for (const d of p.dataPermissions) {
        expect(canPartnerAccess(p, d.id), `${p.id}/${d.id}`).toBe(d.sensitivity === 'shared' && d.partnerCanSee)
      }
      for (const id of ['cost-profit', 'sales-detail', 'customer-identity']) expect(canPartnerAccess(p, id), `${p.id}/${id}`).toBe(false)
    }
  })

  it('a plan that opens any private field to the partner fails fairness and cannot be accepted', () => {
    for (const id of ['cost-profit', 'sales-detail', 'customer-identity']) {
      const p = clone(fresh().plans[K])
      p.dataPermissions.find((d) => d.id === id)!.partnerCanSee = true
      expect(validateGrowthPlan(p).status, id).toBe('failed')
      expect(acceptPlan(refreshPlan(p, T), SELF, [], T), id).toMatchObject({ ok: false })
    }
  })

  it('removing a permission row can only reduce access (absence is denial, not consent)', () => {
    const p = clone(fresh().plans[K])
    p.dataPermissions = p.dataPermissions.filter((d) => d.id !== 'name-menu')
    expect(canPartnerAccess(p, 'name-menu')).toBe(false)
  })
})

describe('measurement: per-day normalisation and data-insufficient states', () => {
  const camp = () => active().campaigns[K] // 7-day window starting T
  const seed = RESULTS_SEEDS[PARTNER]
  const twice = (a: number[]) => [...a, ...a]
  const baseline14 = { orders: twice(MERCHANT_BASELINE.orders), revenueBaht: twice(MERCHANT_BASELINE.revenueBaht) }

  it('a baseline twice as long (same daily pattern) gives the same per-day comparison and estimate', () => {
    const r7 = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    const r14 = calculateCampaignResults(seed, baseline14, camp(), 38)
    expect(r14.orders.baseline).toBe(282) // raw total doubles ...
    expect(r14.derived.baselineDays).toBe(14)
    expect(r14.baselinePeriod).toEqual({ start: '2026-09-30', end: '2026-10-13' })
    expect(r14.derived.baselineOrdersScaled).toBe(141) // ... but is scaled back to the 7-day campaign window
    expect(r14.derived.ordersChangePct).toBeCloseTo(r7.derived.ordersChangePct, 9)
    expect(r14.derived.revenueChangePct).toBeCloseTo(r7.derived.revenueChangePct, 9)
    expect(r14.derived.estimatedIncrementalOrders!).toBeCloseTo(r7.derived.estimatedIncrementalOrders!, 9)
    expect(r14.derived.incrementalContribution!).toBeCloseTo(r7.derived.incrementalContribution!, 6)
  })

  it('a campaign twice as long as the baseline is not read as growth when the daily pattern is the same', () => {
    const longCamp = { ...camp(), endDate: '2026-10-27' } // 14 days
    const flat: ResultsSeed = { ...seed, campaign: { orders: MERCHANT_BASELINE.orders, revenueBaht: MERCHANT_BASELINE.revenueBaht }, comparisonGroup: null }
    const r = calculateCampaignResults(flat, MERCHANT_BASELINE, longCamp, 38)
    expect(r.derived.periodDays).toBe(14)
    expect(r.orders.campaign).toBe(282) // raw total is double ...
    expect(r.derived.ordersChangePct).toBeCloseTo(0, 9) // ... yet no per-day change
    expect(r.derived.revenueChangePct).toBeCloseTo(0, 9)
  })

  it('missing or non-numeric costs / clicks / attribution are data-insufficient, never silently zero', () => {
    const bad: [string, ResultsSeed][] = [
      ['promotional cost missing', { ...seed, promotionalCostsBaht: undefined as unknown as number }],
      ['attribution missing', { ...seed, attributedOrders: undefined as unknown as number }],
      ['clicks missing', { ...seed, clicks: NaN }],
      ['negative cost', { ...seed, promotionalCostsBaht: -1 }],
    ]
    for (const [name, s] of bad) {
      const r = calculateCampaignResults(s, MERCHANT_BASELINE, camp(), 38)
      expect(r.dataQualityStatus, name).toBe('insufficient')
      expect(r.derived.insufficientReason, name).toBe('invalid_values')
      // exactly the two values the "ข้อมูลยังไม่เพียงพอสำหรับการประเมินกำไร" panel is gated on
      expect(r.derived.contribution, name).toBeNull()
      expect(r.derived.incrementalContribution, name).toBeNull()
      expect(r.derived.estimatedIncrementalOrders, name).toBeNull()
      expect(recommendNextAction(r).kind, name).toBe('need_data')
    }
  })

  it('every insufficiency reason has plain-Thai text for the data-insufficient panels', () => {
    const reasons: InsufficientReason[] = ['baseline_short', 'campaign_incomplete', 'baseline_zero', 'invalid_values']
    for (const reason of reasons) expect(INSUFFICIENT_TEXT[reason].length, reason).toBeGreaterThan(5)
  })

  it('no cost assumption, or one outside 0-100%, means no profit figure but observed counts remain', () => {
    for (const pct of [null, -1, 101, NaN]) {
      const r = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), pct)
      expect(r.derived.contribution, String(pct)).toBeNull()
      expect(r.derived.incrementalContribution, String(pct)).toBeNull()
      expect(r.relevantVariableCosts, String(pct)).toBeNull()
      expect(r.orders.campaign, String(pct)).toBe(168)
    }
  })
})

describe('measurement: observed change, link clicks and purchases are kept apart', () => {
  const camp = () => active().campaigns[K]
  const seed = RESULTS_SEEDS[PARTNER]

  it('clicks and link-attributed orders never move the observed or estimated order change', () => {
    const a = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    const b = calculateCampaignResults({ ...seed, clicks: seed.clicks * 10, attributedOrders: 1 }, MERCHANT_BASELINE, camp(), 38)
    expect(b.orders).toEqual(a.orders)
    expect(b.derived.ordersChangePct).toBe(a.derived.ordersChangePct)
    expect(b.derived.estimatedIncrementalOrders).toBe(a.derived.estimatedIncrementalOrders)
    expect(b.derived.incrementalContribution).toBe(a.derived.incrementalContribution)
  })

  it('a click is not a purchase: conversion is attributed orders ÷ clicks (38/412 ≈ 9.2%), and attributed orders can never exceed clicks', () => {
    const r = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    expect(r.derived.clickToOrderPct).toBeCloseTo(9.223, 3)
    const impossible = calculateCampaignResults({ ...seed, attributedOrders: seed.clicks + 1 }, MERCHANT_BASELINE, camp(), 38)
    expect(impossible.dataQualityStatus).toBe('insufficient')
  })

  it('the estimated campaign effect is smaller than the raw uplift, and absent without a comparison group', () => {
    const r = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    expect(r.derived.estimatedIncrementalOrders!).toBeLessThan(r.orders.campaign - r.orders.baseline)
    const none = calculateCampaignResults({ ...seed, comparisonGroup: null }, MERCHANT_BASELINE, camp(), 38)
    expect(none.derived.estimatedIncrementalOrders).toBeNull()
    expect(none.derived.expectedOrders).toBeNull()
  })

  it('campaign costs reduce contribution one-for-one, and a costly campaign is not advised to continue', () => {
    const free = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    const paid = calculateCampaignResults({ ...seed, promotionalCostsBaht: 500 }, MERCHANT_BASELINE, camp(), 38)
    expect(free.derived.contribution! - paid.derived.contribution!).toBeCloseTo(500, 6)
    expect(free.derived.incrementalContribution! - paid.derived.incrementalContribution!).toBeCloseTo(500, 6)
    const ruinous = calculateCampaignResults({ ...seed, promotionalCostsBaht: 50000 }, MERCHANT_BASELINE, camp(), 38)
    expect(ruinous.derived.incrementalContribution!).toBeLessThan(0)
    expect(recommendNextAction(ruinous).kind).toBe('revise')
  })

  it('results exist only for a COMPLETED campaign; an active one shows none', () => {
    const s = active()
    expect(resultsFor(s, s.campaigns[K])).toBeNull()
  })
})

describe('measurement: the three displayed order figures always add up', () => {
  const camp = () => active().campaigns[K]
  const seed = RESULTS_SEEDS[PARTNER]

  it('10-day campaign: unrounded 37.57 - 12.09 = 25.49 is shown as 38 - 12 = 26, never 38 - 12 = 25', () => {
    const r = calculateCampaignResults(seed, MERCHANT_BASELINE, { ...camp(), endDate: '2026-10-23' }, 38) // 10 days
    expect(r.derived.campaignDays).toBe(10)
    expect(orderImpactBreakdown(r)).toEqual({ observed: 38, expectedAnyway: 12, fromCampaign: 26 })
  })

  it('7-day campaign: 27 observed, 8 expected anyway, 19 from the campaign (worked by hand: 168-141, 6% of 141, difference)', () => {
    const r = calculateCampaignResults(seed, MERCHANT_BASELINE, camp(), 38)
    expect(orderImpactBreakdown(r)).toEqual({ observed: 27, expectedAnyway: 8, fromCampaign: 19 })
  })

  it('the difference is always derived from the rounded parts, for any comparison-group change', () => {
    for (const pct of [-20, -3.5, 0, 1.2, 6, 9.9, 33]) {
      const r = calculateCampaignResults({ ...seed, comparisonGroup: { label: 'x', storeCount: 5, ordersChangePct: pct } }, MERCHANT_BASELINE, { ...camp(), endDate: '2026-10-23' }, 38)
      const b = orderImpactBreakdown(r)!
      expect(b.observed - b.expectedAnyway, `pct ${pct}`).toBe(b.fromCampaign)
      expect(Math.abs(b.fromCampaign - r.derived.estimatedIncrementalOrders!), `pct ${pct}`).toBeLessThanOrEqual(1)
    }
  })

  it('no comparison group or insufficient data: no breakdown is invented', () => {
    const noGroup = calculateCampaignResults({ ...seed, comparisonGroup: null }, MERCHANT_BASELINE, camp(), 38)
    expect(orderImpactBreakdown(noGroup)).toBeNull()
    const short = calculateCampaignResults(RESULTS_SEEDS['m-tea'], MERCHANT_BASELINE, camp(), 38)
    expect(orderImpactBreakdown(short)).toBeNull()
  })
})
