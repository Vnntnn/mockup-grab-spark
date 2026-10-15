import type { AppState, GrowthPlan, Merchant, PlanLifecycle } from '@/domain/types'
import { headlinePlan, partnerOf, selfOf } from '@/app/selectors'
import { totalCommitmentBaht } from '@/domain/plans'

export interface HeroPartnershipSummary {
  planId: string
  title: string
  status: PlanLifecycle
  partner: Merchant
  partnerName: string
  /** What the owner pays for this plan; null while any line is unresolved (never shown as 0). */
  costBaht: number | null
  ctaLabel: string
  ctaRoute: string
  /** The plan was sent back for renewed consent after a terms change. */
  renewal: boolean
}

const CTA: Partial<Record<PlanLifecycle, { label: string; to: (p: GrowthPlan) => string }>> = {
  interested: { label: 'ดูสถานะแผน', to: (p) => `/plans/${p.id}` },
  ready: { label: 'ไปเริ่มแคมเปญ', to: () => '/campaigns' },
  active: { label: 'ดูแคมเปญ', to: () => '/campaigns' },
  completed: { label: 'ดูผลลัพธ์', to: () => '/results' },
  cancelled: { label: 'ดูร้านอื่นที่น่าสนใจ', to: () => '/opportunities' },
  declined: { label: 'ดูร้านอื่นที่น่าสนใจ', to: () => '/opportunities' },
}

/** The one plan the dashboard talks about, with the single action that moves it forward. Uses the same selector as every other screen so status never disagrees. */
export function getHeroPartnershipSummary(state: AppState): HeroPartnershipSummary | null {
  const plan = headlinePlan(state)
  if (!plan) return null
  const me = selfOf(state)
  const partner = partnerOf(state, plan)
  const renewal = plan.lifecycleStatus === 'awaiting' && plan.consentRecords.some((r) => r.merchantId === me.id && r.consentStatus === 'invalidated')
  const cta = renewal
    ? { label: 'ดูเงื่อนไขใหม่', to: (p: GrowthPlan) => `/plans/${p.id}` }
    : plan.lifecycleStatus === 'awaiting'
      ? { label: 'ดูแผนที่แนะนำ', to: (p: GrowthPlan) => `/plans/${p.id}` }
      : CTA[plan.lifecycleStatus]
  return {
    planId: plan.id,
    title: plan.title,
    status: plan.lifecycleStatus,
    partner,
    partnerName: partner.name,
    costBaht: totalCommitmentBaht(plan, me.id),
    ctaLabel: cta?.label ?? 'ดูแผน',
    ctaRoute: cta ? cta.to(plan) : `/plans/${plan.id}`,
    renewal,
  }
}
