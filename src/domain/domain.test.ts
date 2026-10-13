import { describe, expect, it } from 'vitest'
import { createInitialState, reduce, type Action } from '@/app/reducer'
import { campaignPlans, deriveActivity, demoTargets, headlinePlan, matching, recentPeriod, resultsFor } from '@/app/selectors'
import { MERCHANT_BASELINE, RESULTS_SEEDS } from '@/data/results'
import { calculateCampaignResults, recommendNextAction } from './calculations'
import { activateCampaign, cancelCampaign, checkActivation, completeCampaign } from './campaign-lifecycle'
import { acceptPlan, declinePlan, reopenPlan, validateConsent } from './consent'
import { canPartnerAccess, validateGrowthPlan } from './fairness'
import { checkInvariants } from './invariants'
import { applyTermsChange, deriveLifecycle, refreshPlan, totalCommitmentBaht } from './plans'
import type { AppState, GrowthPlan, PlanLifecycle } from './types'

const T = '2026-10-14'
const K = 'plan-m-khaohom'
const SELF = 'm-satay'
const PARTNER = 'm-khaohom'
const fresh = () => createInitialState(T)
const run = (s: AppState, ...a: Action[]) => a.reduce(reduce, s)
const accept = (planId = K): Action => ({ type: 'accept', planId, acks: ['cost', 'data', 'rights'] })
const partnerOk = (planId = K): Action => ({ type: 'demoPartnerConsent', planId })
const clone = (p: GrowthPlan) => structuredClone(p)

/** Run a plan all the way to a completed campaign. */
const completed = (planId = K) =>
  run(fresh(), accept(planId), partnerOk(planId), { type: 'activate', planId }, { type: 'demoComplete', planId })

describe('fairness', () => {
  it('rejects mandatory-discount proposals before they reach the merchant', () => {
    const m = matching(fresh())
    expect(m.recommendations.map((r) => r.partnerMerchantId)).not.toContain('m-jumbo')
    expect(m.rejected.find((r) => r.merchantId === 'm-jumbo')).toMatchObject({ stage: 'fairness' })
    expect(Object.keys(fresh().plans)).not.toContain('plan-m-jumbo')
  })

  it('every offered plan has no forced discount, no revenue share, no private data exposed', () => {
    for (const p of Object.values(fresh().plans)) {
      expect(p.discountTerms.requiredFromSmallMerchant).toBe(false)
      expect(p.revenueSharingTerms.mandatory).toBe(false)
      expect(p.dataPermissions.filter((d) => d.sensitivity === 'private').every((d) => !d.partnerCanSee)).toBe(true)
      expect(totalCommitmentBaht(p, SELF)).toBe(0)
    }
  })

  it('a revenue-share or forced-discount plan fails; unresolved cost is "unresolved", not safe', () => {
    const base = fresh().plans[K]
    const rs = clone(base); rs.revenueSharingTerms.mandatory = true
    const fd = clone(base); fd.discountTerms.requiredFromSmallMerchant = true
    const un = clone(base); un.costTermsByMerchant[SELF].lines[0].amountBaht = null
    const undisclosed = clone(base); undisclosed.costTermsByMerchant[SELF].lines[0].amountBaht = 50
    expect(validateGrowthPlan(rs).status).toBe('failed')
    expect(validateGrowthPlan(fd).status).toBe('failed')
    expect(validateGrowthPlan(un).status).toBe('unresolved')
    expect(validateGrowthPlan(undisclosed).status).toBe('failed') // money without trigger/cap is unexplained
    expect(totalCommitmentBaht(un, SELF)).toBeNull()
  })

  it('unresolved cost blocks acceptance and activation', () => {
    const un = clone(fresh().plans[K]); un.costTermsByMerchant[SELF].lines[0].amountBaht = null
    const plan = refreshPlan(un, T)
    expect(acceptPlan(plan, SELF, [], T)).toMatchObject({ ok: false })
    // even with both consents forced in, lifecycle must not reach "ready" and activation must refuse
    const forced = refreshPlan({ ...plan, consentRecords: plan.consentRecords.map((r) => ({ ...r, consentStatus: 'accepted' as const, termsVersion: 1 })) }, T)
    expect(forced.lifecycleStatus).not.toBe('ready')
    const s = fresh()
    expect(activateCampaign({ ...forced, lifecycleStatus: 'ready' }, s.campaigns[K], Object.values(s.merchants), T)).toMatchObject({ ok: false })
  })

  it('partner access to merchant data goes through one permission check; private and unknown fields are denied', () => {
    const p = fresh().plans[K]
    expect(canPartnerAccess(p, 'name-menu')).toBe(true)
    for (const id of ['cost-profit', 'sales-detail', 'customer-identity', 'does-not-exist']) expect(canPartnerAccess(p, id)).toBe(false)
    const leaky = clone(p); leaky.dataPermissions.find((d) => d.id === 'cost-profit')!.partnerCanSee = true
    expect(canPartnerAccess(leaky, 'cost-profit')).toBe(false)
    expect(validateGrowthPlan(leaky).status).toBe('failed')
  })

  it('declining or cancelling never changes selling status or touches other plans', () => {
    const s = run(fresh(), { type: 'decline', planId: K })
    expect(s.sellingStatus).toBe('normal')
    expect(s.plans['plan-m-tea'].lifecycleStatus).toBe('awaiting')
    const c = run(fresh(), accept(), partnerOk(), { type: 'cancel', planId: K })
    expect(c.sellingStatus).toBe('normal')
    expect(checkInvariants(c)).toEqual([])
  })
})

describe('consent', () => {
  it('is stored per merchant with the exact terms version; one consent is not everyone\'s', () => {
    let s = run(fresh(), accept())
    const rec = (id: string) => s.plans[K].consentRecords.find((r) => r.merchantId === id)!
    expect(rec(SELF)).toMatchObject({ consentStatus: 'accepted', termsVersion: 1, relevantDisclosureAcknowledgements: ['cost', 'data', 'rights'] })
    expect(rec(PARTNER)).toMatchObject({ consentStatus: 'pending', timestamp: null })
    expect(validateConsent(s.plans[K]).missing).toEqual([PARTNER])
    s = run(s, { type: 'activate', planId: K })
    expect(s.campaigns[K].status).toBe('awaiting_consent')
    expect(s.plans[K].lifecycleStatus).toBe('interested')
  })

  it('partner consenting first does not consent for the merchant', () => {
    const s = run(fresh(), partnerOk())
    expect(s.plans[K].lifecycleStatus).toBe('awaiting')
    expect(s.plans[K].consentRecords.find((r) => r.merchantId === SELF)!.consentStatus).toBe('pending')
    expect(reduce(s, { type: 'activate', planId: K })).toBe(s)
  })

  it('terms change on an agreed-but-not-started plan: both consents invalidated, activation blocked until both re-consent', () => {
    let s = run(fresh(), accept())
    expect(s.plans[K].consentRecords[0].termsVersion).toBe(1)
    s = run(s, partnerOk())
    expect(s.plans[K].lifecycleStatus).toBe('ready')
    expect(checkActivation(s.plans[K], Object.values(s.merchants)).every((c) => c.passed)).toBe(true)

    s = run(s, { type: 'demoChangeTerms', planId: K })
    const p = s.plans[K]
    expect(p.planVersion).toBe(2)
    expect(p.durationDays).toBe(10)
    expect(p.consentRecords.map((r) => r.consentStatus)).toEqual(['invalidated', 'invalidated'])
    expect(p.lifecycleStatus).toBe('awaiting')
    expect(s.campaigns[K].status).toBe('awaiting_consent')
    expect(s.campaigns[K].planVersion).toBe(2)
    expect(reduce(s, { type: 'activate', planId: K })).toBe(s)
    // one re-consent is not enough
    const one = run(s, accept())
    expect(one.plans[K].lifecycleStatus).toBe('interested')
    expect(reduce(one, { type: 'activate', planId: K })).toBe(one)
    // both on v2 -> ready -> active
    const both = run(one, partnerOk(), { type: 'activate', planId: K })
    expect(both.campaigns[K].status).toBe('active')
    expect(both.plans[K].consentRecords.every((r) => r.termsVersion === 2)).toBe(true)
    expect(checkInvariants(both)).toEqual([])
  })

  it('old (version 1) confirmations can never reactivate a version 2 plan, even if the lifecycle is forced to ready', () => {
    const s = run(fresh(), accept(), partnerOk())
    const v1 = s.plans[K]
    const stale: GrowthPlan = { ...v1, planVersion: 2, lifecycleStatus: 'ready' } // records still say accepted@1
    expect(validateConsent(stale).staleVersion).toEqual([SELF, PARTNER])
    expect(deriveLifecycle({ ...stale, lifecycleStatus: 'awaiting' })).toBe('awaiting')
    const r = activateCampaign(stale, s.campaigns[K], Object.values(s.merchants), T)
    expect(r).toMatchObject({ ok: false })
  })

  it('terms of an active, completed or cancelled campaign cannot be rewritten by one side', () => {
    const active = run(fresh(), accept(), partnerOk(), { type: 'activate', planId: K })
    expect(applyTermsChange(active.plans[K], { durationDays: 14 }, 'x', T)).toMatchObject({ ok: false })
    expect(reduce(active, { type: 'demoChangeTerms', planId: K })).toBe(active) // rejected, state untouched
    expect(run(active, { type: 'demoChangeTerms', planId: K }).plans[K].planVersion).toBe(1)
    const done = run(active, { type: 'demoComplete', planId: K })
    expect(run(done, { type: 'demoChangeTerms', planId: K }).plans[K].planVersion).toBe(1)
  })

  it('reset cannot leave a stale ready/active state', () => {
    const active = run(fresh(), accept(), partnerOk(), { type: 'activate', planId: K })
    const s = run(active, { type: 'reset', today: T })
    expect(Object.values(s.plans).every((p) => p.lifecycleStatus === 'awaiting')).toBe(true)
    expect(Object.values(s.campaigns).some((c) => c.status === 'active' || c.status === 'ready')).toBe(false)
    expect(checkInvariants(s)).toEqual([])
  })

  it('decline from ready leaves a consistent campaign; changing your mind restores the awaiting state', () => {
    let s = run(fresh(), accept(), partnerOk(), { type: 'decline', planId: K })
    expect(s.plans[K].lifecycleStatus).toBe('declined')
    expect(s.campaigns[K].status).not.toBe('ready')
    expect(checkInvariants(s)).toEqual([])
    s = run(s, { type: 'reopen', planId: K })
    expect(s.plans[K].lifecycleStatus).toBe('awaiting') // own consent cleared, partner's still valid
    expect(reopenPlan(s.plans[K], SELF, T)).toMatchObject({ ok: false })
  })
})

describe('campaign lifecycle: explicit transition rules', () => {
  const s0 = fresh()
  const plan = s0.plans[K]
  const camp = s0.campaigns[K]
  const ms = Object.values(s0.merchants)

  it('rejects invalid transitions with a reason', () => {
    expect(activateCampaign(plan, camp, ms, T)).toMatchObject({ ok: false }) // awaiting
    expect(completeCampaign(plan, camp)).toMatchObject({ ok: false }) // not active
    expect(cancelCampaign(plan, camp, T)).toMatchObject({ ok: false }) // nothing agreed yet: use decline
    const done = completed()
    expect(activateCampaign(done.plans[K], done.campaigns[K], ms, T)).toMatchObject({ ok: false })
    expect(cancelCampaign(done.plans[K], done.campaigns[K], T)).toMatchObject({ ok: false })
    expect(declinePlan(done.plans[K], SELF, T)).toMatchObject({ ok: false })
    expect(acceptPlan(done.plans[K], SELF, [], T)).toMatchObject({ ok: false })
    const cancelled = run(fresh(), accept(), partnerOk(), { type: 'cancel', planId: K })
    expect(run(cancelled, accept(), { type: 'reopen', planId: K }, { type: 'activate', planId: K }).plans[K].lifecycleStatus).toBe('cancelled')
  })

  it('walks awaiting -> interested -> ready -> active -> completed with matching dates', () => {
    let s = fresh()
    const seen: PlanLifecycle[] = [s.plans[K].lifecycleStatus]
    for (const a of [accept(), partnerOk(), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K }] as Action[]) {
      s = reduce(s, a)
      seen.push(s.plans[K].lifecycleStatus)
    }
    expect(seen).toEqual(['awaiting', 'interested', 'ready', 'active', 'completed'])
    expect(s.campaigns[K]).toMatchObject({ status: 'completed', startDate: T, endDate: '2026-10-20' })
    expect(s.today).toBe('2026-10-21') // demo clock moves past the campaign
  })

  it('ready and active campaigns can be cancelled without penalty', () => {
    for (const steps of [[accept(), partnerOk()], [accept(), partnerOk(), { type: 'activate', planId: K } as Action]]) {
      const s = run(fresh(), ...steps, { type: 'cancel', planId: K })
      expect(s.plans[K].lifecycleStatus).toBe('cancelled')
      expect(s.campaigns[K].status).toBe('cancelled')
      expect(s.sellingStatus).toBe('normal')
    }
  })
})

/** Independent specification of every allowed change in plan lifecycle (written from the product rules, not the code). */
const ALLOWED: Record<PlanLifecycle, PlanLifecycle[]> = {
  awaiting: ['awaiting', 'interested', 'ready', 'declined'],
  interested: ['interested', 'awaiting', 'ready', 'declined'],
  ready: ['ready', 'awaiting', 'active', 'declined', 'cancelled'],
  active: ['active', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  declined: ['declined', 'awaiting'],
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('randomised walk (seeded, includes bad plan ids)', () => {
  it('never violates an invariant or makes a transition outside the specified table', () => {
    const visited = new Set<string>()
    for (let seed = 1; seed <= 150; seed++) {
      const rnd = mulberry32(seed)
      const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]
      let s = fresh()
      for (let step = 0; step < 60; step++) {
        const planId = pick([K, K, K, 'plan-m-tea', 'plan-m-dessert', 'plan-m-jumbo', 'nope'])
        const action = pick<Action>([
          accept(planId), accept(planId), partnerOk(planId), partnerOk(planId),
          { type: 'decline', planId }, { type: 'reopen', planId },
          { type: 'activate', planId }, { type: 'activate', planId }, { type: 'cancel', planId },
          { type: 'demoChangeTerms', planId }, { type: 'demoComplete', planId }, { type: 'demoComplete', planId },
          { type: 'updateMerchant', patch: { participationPreference: pick(['open', 'selective', 'not_now'] as const) } },
          { type: 'updateMerchant', patch: { operatingHours: { open: pick(['06:00', '10:00', '15:00']), close: pick(['12:00', '20:00', '23:00']) } } },
          { type: 'setVariableCostPct', value: pick([null, 0, 38, 100, 150, -5, NaN]) },
          { type: 'reset', today: T },
        ])
        const next = reduce(s, action)
        for (const [id, p] of Object.entries(next.plans)) {
          const before = s.plans[id]?.lifecycleStatus
          if (before && action.type !== 'reset') {
            expect(ALLOWED[before], `${before} -> ${p.lifecycleStatus} via ${action.type} (seed ${seed})`).toContain(p.lifecycleStatus)
            visited.add(`${before}>${p.lifecycleStatus}`)
          }
        }
        expect(checkInvariants(next), `after ${action.type} (seed ${seed}, step ${step})`).toEqual([])
        s = next
      }
    }
    // the walk must actually exercise the interesting edges, otherwise it proves little
    for (const edge of ['awaiting>interested', 'interested>ready', 'ready>active', 'active>completed', 'ready>awaiting', 'awaiting>declined', 'declined>awaiting', 'active>cancelled']) {
      expect(visited, edge).toContain(edge)
    }
  })
})

describe('visible-plan scoping of demo controls', () => {
  it('demo targets are the headline plan only; hidden plans are never touched', () => {
    const s = fresh()
    expect(demoTargets(s).partner?.id).toBe(headlinePlan(s)?.id)
    const hidden = run(s, { type: 'updateMerchant', patch: { participationPreference: 'not_now' } })
    expect(matching(hidden).recommendations).toHaveLength(0)
    expect(demoTargets(hidden)).toEqual({})
    expect(campaignPlans(hidden)).toEqual([])
  })

  it('a terms change the merchant never agreed to does not surface in Campaigns or tell them to re-confirm', () => {
    const s = run(fresh(), partnerOk(), { type: 'demoChangeTerms', planId: K })
    expect(campaignPlans(s)).toEqual([])
    const texts = deriveActivity(s).map((a) => a.text).join('\n')
    expect(texts).not.toContain('ต้องยืนยันใหม่')
    const own = run(fresh(), accept(), { type: 'demoChangeTerms', planId: K })
    expect(campaignPlans(own).map((p) => p.id)).toEqual([K])
    expect(deriveActivity(own).map((a) => a.text).join('\n')).toContain('ต้องยืนยันใหม่')
  })

  it('a plan sent back for renewed consent is an engaged campaign everywhere (dashboard tile cannot say "no campaign")', () => {
    const s = run(fresh(), accept(), partnerOk(), { type: 'demoChangeTerms', planId: K })
    expect(headlinePlan(s)?.id).toBe(K)
    expect(campaignPlans(s).map((p) => p.id)).toContain(K)
  })

  it('plan, campaign and dashboard read one status', () => {
    const s = run(fresh(), accept(), partnerOk())
    expect(headlinePlan(s)?.lifecycleStatus).toBe('ready')
    expect(s.plans[K].lifecycleStatus).toBe('ready')
    expect(s.campaigns[K].status).toBe('ready')
  })
})

describe('results and calculations', () => {
  it('computes from the shared model: revenue is not profit, estimate is below the raw change', () => {
    const s = completed()
    const r = resultsFor(s, s.campaigns[K])!
    expect(r.orders).toEqual({ baseline: 141, campaign: 168 })
    expect(r.revenue).toEqual({ baseline: 26080, campaign: 31248 })
    expect(r.derived.expectedOrders).toBeCloseTo(149.46, 2)
    expect(r.derived.estimatedIncrementalOrders).toBeCloseTo(18.54, 2)
    expect(r.derived.estimatedIncrementalOrders!).toBeLessThan(168 - 141)
    expect(r.derived.contribution).toBeCloseTo(31248 * 0.62, 2)
    expect(r.derived.contribution!).toBeLessThan(r.revenue.campaign)
    expect(r.derived.incrementalContribution).toBeCloseTo(31248 * 0.62 - 26080 * 1.06 * 0.62, 2)
    expect(r.reportingPeriod).toEqual({ start: T, end: '2026-10-20' })
    expect(r.baselinePeriod).toEqual({ start: '2026-10-07', end: '2026-10-13' })
    expect(recommendNextAction(r).kind).toBe('continue')
  })

  it('profit follows the store-profile cost assumption; missing or invalid costs give no profit', () => {
    const base = completed()
    const at = (pct: number | null) => resultsFor({ ...base, variableCostPct: pct }, base.campaigns[K])!.derived
    expect(at(50).contribution).toBeCloseTo(31248 * 0.5, 2)
    expect(at(50).contribution).not.toBe(at(38).contribution)
    for (const bad of [null, -20, 150, NaN]) {
      expect(at(bad).contribution, String(bad)).toBeNull()
      expect(at(bad).incrementalContribution, String(bad)).toBeNull()
    }
    expect(recommendNextAction(resultsFor({ ...base, variableCostPct: null }, base.campaigns[K])!).kind).toBe('add_costs')
  })

  it('there is ONE baseline: dashboard figures equal every campaign report\'s baseline', () => {
    expect(recentPeriod(fresh()).orders).toBe(141)
    const camp = completed().campaigns[K]
    for (const seed of Object.values(RESULTS_SEEDS)) {
      const r = calculateCampaignResults(seed, MERCHANT_BASELINE, camp, 38)
      expect(r.orders.baseline).toBe(141)
      expect(r.revenue.baseline).toBe(26080)
    }
  })

  it('incomplete campaign data is compared per day and flagged insufficient, never as a huge fake uplift', () => {
    const s = completed('plan-m-tea')
    const r = resultsFor(s, s.campaigns['plan-m-tea'])!
    expect(r.dataQualityStatus).toBe('insufficient')
    expect(r.derived).toMatchObject({ insufficientReason: 'campaign_incomplete', baselineDays: 7, campaignDays: 4, periodDays: 7 })
    expect(Math.abs(r.derived.ordersChangePct)).toBeLessThan(25) // 4 vs 7 days must not read as +70%
    expect(r.derived.estimatedIncrementalOrders).toBeNull()
    expect(r.derived.contribution).toBeNull()
    expect(recommendNextAction(r).kind).toBe('need_data')
    expect(recentPeriod(s).label).toContain('ยังมาไม่ครบ') // dashboard does not present a partial period as a full one
  })

  it('a campaign lengthened to 10 days by a renegotiated version is still fully measured (per-day comparison)', () => {
    const base = run(fresh(), accept(), partnerOk(), { type: 'demoChangeTerms', planId: K }, accept(), partnerOk(), { type: 'activate', planId: K }, { type: 'demoComplete', planId: K })
    expect(base.plans[K].durationDays).toBe(10)
    const r = resultsFor(base, base.campaigns[K])!
    expect(r.derived).toMatchObject({ baselineDays: 7, campaignDays: 10, periodDays: 10, insufficientReason: null })
    expect(r.dataQualityStatus).toBe('sufficient')
    expect(r.derived.ordersChangePct).toBeCloseTo(18.65, 1)
    expect(recentPeriod(base).label).toBe('10 วันของแคมเปญล่าสุด')
    // the three steps of the estimate must all use the baseline scaled to 10 days (141/7*10), never the 7-day total
    const d = r.derived
    expect(d.baselineOrdersScaled).toBeCloseTo(201.43, 2)
    const observed = r.orders.campaign - d.baselineOrdersScaled // 239 - 201.43
    const expectedAnyway = d.expectedOrders! - d.baselineOrdersScaled // 6% of 201.43
    expect(observed).toBeCloseTo(37.57, 2)
    expect(expectedAnyway).toBeCloseTo(12.09, 2)
    expect(observed - expectedAnyway).toBeCloseTo(d.estimatedIncrementalOrders!, 6)
    expect(d.estimatedIncrementalOrders).toBeCloseTo(25.49, 2)
  })

  it('click-heavy/order-light campaigns advise a menu review', () => {
    const s = completed('plan-m-dessert')
    const r = resultsFor(s, s.campaigns['plan-m-dessert'])!
    expect(recommendNextAction(r).kind).toBe('review_menu')
    expect(r.derived.clickToOrderPct).toBeLessThan(5)
  })

  it('handles zero baselines and invalid series without fabricating results', () => {
    const camp = completed().campaigns[K]
    const zero = { ...RESULTS_SEEDS[PARTNER] }
    const zeroBase = { orders: [0, 0, 0, 0, 0, 0, 0], revenueBaht: [0, 0, 0, 0, 0, 0, 0] }
    expect(calculateCampaignResults(zero, zeroBase, camp, 38).derived.insufficientReason).toBe('baseline_zero')
    const neg = { ...zero, campaign: { ...zero.campaign, orders: [-1, 2, 3, 4, 5, 6, 7] } }
    const r = calculateCampaignResults(neg, MERCHANT_BASELINE, camp, 38)
    expect(r.derived.insufficientReason).toBe('invalid_values')
    expect(r.derived.contribution).toBeNull()
    const noisy = { ...zero, attributedOrders: zero.clicks + 1 }
    expect(calculateCampaignResults(noisy, MERCHANT_BASELINE, camp, 38).derived.insufficientReason).toBe('invalid_values')
    const short = calculateCampaignResults(zero, { orders: [20, 20, 20], revenueBaht: [3700, 3700, 3700] }, camp, 38)
    expect(short.derived.insufficientReason).toBe('baseline_short')
  })

  it('no comparison group: observed change only, no incremental claim', () => {
    const camp = completed().campaigns[K]
    const r = calculateCampaignResults({ ...RESULTS_SEEDS[PARTNER], comparisonGroup: null }, MERCHANT_BASELINE, camp, 38)
    expect(r.dataQualityStatus).toBe('limited')
    expect(r.derived.estimatedIncrementalOrders).toBeNull()
    expect(r.derived.incrementalContribution).toBeNull()
    expect(r.derived.contribution).not.toBeNull()
    expect(recommendNextAction(r).kind).toBe('need_data')
  })
})
