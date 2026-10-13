import { merchants as seedMerchants, SELF_ID } from '@/data/merchants'
import { acceptPlan, declinePlan, reopenPlan } from '@/domain/consent'
import { activateCampaign, cancelCampaign, completeCampaign, createCampaign, syncCampaign } from '@/domain/campaign-lifecycle'
import { getEligiblePartners } from '@/domain/matching'
import { applyTermsChange } from '@/domain/plans'
import type {
  AppState,
  GrowthPlan,
  Merchant,
  SupportCategoryId,
} from '@/domain/types'
import { addDays } from '@/lib/dates'

export const STATE_VERSION = 2

export type Action =
  | { type: 'accept'; planId: string; acks: string[] }
  | { type: 'decline'; planId: string }
  | { type: 'reopen'; planId: string }
  | { type: 'activate'; planId: string }
  | { type: 'cancel'; planId: string }
  | { type: 'demoPartnerConsent'; planId: string }
  | { type: 'demoChangeTerms'; planId: string }
  | { type: 'demoComplete'; planId: string }
  | { type: 'updateMerchant'; patch: Partial<Merchant> }
  | { type: 'setVariableCostPct'; value: number | null }
  | { type: 'submitSupport'; category: SupportCategoryId; note: string; planId: string | null }
  | { type: 'reset'; today: string }

export function createInitialState(today: string): AppState {
  const merchants = Object.fromEntries(seedMerchants.map((m) => [m.id, m]))
  const state: AppState = {
    version: STATE_VERSION,
    today,
    selfId: SELF_ID,
    merchants,
    sellingStatus: 'normal',
    variableCostPct: 38,
    plans: {},
    campaigns: {},
    supportRequests: [],
  }
  return seedPlans(state)
}

/** Make sure every currently eligible, fairness-passed partner has a plan. Existing plans are never replaced. */
function seedPlans(state: AppState): AppState {
  const { plans } = getEligiblePartners(state.merchants[state.selfId], Object.values(state.merchants), state.today)
  const next = { ...state, plans: { ...state.plans }, campaigns: { ...state.campaigns } }
  for (const plan of plans) {
    if (next.plans[plan.id]) continue
    next.plans[plan.id] = plan
    next.campaigns[plan.id] = createCampaign(plan)
  }
  return next
}

function commit(state: AppState, plan: GrowthPlan): AppState {
  return {
    ...state,
    plans: { ...state.plans, [plan.id]: plan },
    campaigns: { ...state.campaigns, [plan.id]: syncCampaign(plan, state.campaigns[plan.id]) },
  }
}

export function reduce(state: AppState, action: Action): AppState {
  const { today, selfId } = state
  const plan = 'planId' in action && action.planId ? state.plans[action.planId] : undefined

  switch (action.type) {
    case 'accept': {
      if (!plan) return state
      const r = acceptPlan(plan, selfId, action.acks, today)
      return r.ok ? commit(state, r.plan) : state
    }
    case 'decline': {
      if (!plan) return state
      const r = declinePlan(plan, selfId, today)
      // selling rights are deliberately untouched: sellingStatus stays 'normal'
      return r.ok ? commit(state, r.plan) : state
    }
    case 'reopen': {
      if (!plan) return state
      const r = reopenPlan(plan, selfId, today)
      return r.ok ? commit(state, r.plan) : state
    }
    case 'activate': {
      if (!plan) return state
      const r = activateCampaign(plan, state.campaigns[plan.id], Object.values(state.merchants), today)
      return r.ok ? { ...state, plans: { ...state.plans, [plan.id]: r.plan }, campaigns: { ...state.campaigns, [plan.id]: r.campaign } } : state
    }
    case 'cancel': {
      if (!plan) return state
      const r = cancelCampaign(plan, state.campaigns[plan.id], today)
      return r.ok ? { ...state, plans: { ...state.plans, [plan.id]: r.plan }, campaigns: { ...state.campaigns, [plan.id]: r.campaign } } : state
    }
    case 'demoPartnerConsent': {
      if (!plan) return state
      const r = acceptPlan(plan, plan.participatingMerchantIds[1], ['demo-partner'], today)
      return r.ok ? commit(state, r.plan) : state
    }
    case 'demoChangeTerms': {
      if (!plan) return state
      const days = plan.durationDays === 7 ? 10 : 7
      const r = applyTermsChange(plan, { durationDays: days }, `ร้านคู่ค้าขอปรับระยะเวลาเป็น ${days} วัน`, today)
      return r.ok ? commit(state, r.plan) : state
    }
    case 'demoComplete': {
      if (!plan) return state
      const camp = state.campaigns[plan.id]
      const r = completeCampaign(plan, camp)
      if (!r.ok || !camp.endDate) return state
      return {
        ...state,
        today: addDays(camp.endDate, 1),
        plans: { ...state.plans, [plan.id]: r.plan },
        campaigns: { ...state.campaigns, [plan.id]: r.campaign },
      }
    }
    case 'updateMerchant': {
      const merchants = { ...state.merchants, [selfId]: { ...state.merchants[selfId], ...action.patch } }
      return seedPlans({ ...state, merchants })
    }
    case 'setVariableCostPct':
      return { ...state, variableCostPct: action.value }
    case 'submitSupport':
      return {
        ...state,
        supportRequests: [
          { id: `sr-${state.supportRequests.length + 1}`, category: action.category, note: action.note, planId: action.planId, createdAt: today },
          ...state.supportRequests,
        ],
      }
    case 'reset':
      return createInitialState(action.today)
  }
}
