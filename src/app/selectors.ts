import { MERCHANT_BASELINE, RESULTS_SEEDS, NO_DATA_SEED } from '@/data/results'
import { getEligiblePartners, type MatchingOutcome } from '@/domain/matching'
import { calculateCampaignResults, campaignSeries } from '@/domain/calculations'
import type { AppState, Campaign, CampaignResults, GrowthPlan, Merchant, PlanLifecycle } from '@/domain/types'
import { addDays, fmtFull } from '@/lib/dates'
import { hasValidConsent } from '@/domain/plans'

export const selfOf = (s: AppState): Merchant => s.merchants[s.selfId]
export const partnerOf = (s: AppState, plan: GrowthPlan): Merchant => s.merchants[plan.participatingMerchantIds[1]]

export const matching = (s: AppState): MatchingOutcome =>
  getEligiblePartners(selfOf(s), Object.values(s.merchants), s.today)

/** Plans the merchant can see: currently recommended, or already in motion. */
export function visiblePlans(s: AppState): GrowthPlan[] {
  const recIds = matching(s).recommendations.map((r) => r.proposedPlanId)
  const order = (id: string) => (recIds.includes(id) ? recIds.indexOf(id) : 99)
  return Object.values(s.plans)
    .filter((p) => recIds.includes(p.id) || !['awaiting', 'declined'].includes(p.lifecycleStatus))
    .sort((a, b) => order(a.id) - order(b.id))
}

const INFLIGHT: PlanLifecycle[] = ['active', 'ready', 'interested', 'completed']

/** The one plan the dashboard talks about. */
export function headlinePlan(s: AppState): GrowthPlan | undefined {
  const vis = visiblePlans(s)
  for (const st of INFLIGHT) {
    const hit = vis.find((p) => p.lifecycleStatus === st)
    if (hit) return hit
  }
  return vis.find((p) => p.lifecycleStatus === 'awaiting')
}

/** Plans the merchant has engaged with. A plan sent back to "awaiting" by a terms change stays listed. */
export const campaignPlans = (s: AppState) =>
  Object.values(s.plans).filter(
    (p) =>
      ['interested', 'ready', 'active', 'completed', 'cancelled'].includes(p.lifecycleStatus) ||
      (p.lifecycleStatus === 'awaiting' && p.consentRecords.some((r) => r.merchantId === s.selfId && r.consentStatus === 'invalidated')),
  )

export const seedFor = (s: AppState, planId: string) =>
  RESULTS_SEEDS[s.plans[planId].participatingMerchantIds[1]] ?? NO_DATA_SEED

export function resultsFor(s: AppState, campaign: Campaign): CampaignResults | null {
  if (campaign.status !== 'completed') return null
  const plan = s.plans[campaign.planId]
  const seed = seedFor(s, plan.id)
  // MERCHANT_BASELINE is the merchant's history before their FIRST campaign. A later campaign must not label it as the days just before it.
  const starts = Object.values(s.campaigns).flatMap((c) => (c.startDate ? [c.startDate] : []))
  const firstStart = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : undefined
  return calculateCampaignResults(seed, MERCHANT_BASELINE, campaign, s.variableCostPct, firstStart)
}

export interface ActivityItem {
  id: string
  at: string
  text: string
  href: string
  tone: 'info' | 'wait' | 'good' | 'quiet'
}

/** Activity is derived from real state, never typed in. */
export function deriveActivity(s: AppState): ActivityItem[] {
  const out: ActivityItem[] = []
  const headId = headlinePlan(s)?.id
  for (const p of Object.values(s.plans)) {
    const partner = partnerOf(s, p)
    const href = `/plans/${p.id}`
    const pc = p.consentRecords.find((r) => r.merchantId === partner.id)
    const sc = p.consentRecords.find((r) => r.merchantId === s.selfId)
    const camp = s.campaigns[p.id]
    if (p.lifecycleStatus === 'declined') {
      out.push({ id: `${p.id}-declined`, at: sc?.timestamp ?? p.updatedAt, text: `คุณเลือกยังไม่เข้าร่วมแผนกับ${partner.name} เปลี่ยนใจได้ทุกเมื่อ`, href, tone: 'quiet' })
      continue
    }
    if (p.lifecycleStatus === 'awaiting' && p.id !== headId && p.changeLog.length === 1) continue
    if (p.changeLog.length > 1 && !['active', 'completed', 'cancelled'].includes(p.lifecycleStatus)) {
      const last = p.changeLog[p.changeLog.length - 1]
      const mustRenew = sc?.consentStatus === 'invalidated'
      out.push({ id: `${p.id}-v${last.version}`, at: last.at, text: `เงื่อนไขเปลี่ยนเป็นฉบับที่ ${last.version} (${last.summary})${mustRenew ? ' การยืนยันของคุณถูกล้าง ต้องยืนยันใหม่' : ''}`, href, tone: 'wait' })
    }
    if (p.lifecycleStatus === 'awaiting') {
      out.push({ id: `${p.id}-await`, at: p.updatedAt, text: `แผน "${p.title}" กับ${partner.name} รอการตัดสินใจจากคุณ`, href, tone: 'info' })
    }
    if (sc && hasValidConsent(p, s.selfId)) {
      out.push({ id: `${p.id}-self`, at: sc.timestamp ?? p.updatedAt, text: `คุณสนใจแผนกับ${partner.name} และยืนยันเงื่อนไขฉบับที่ ${sc.termsVersion}`, href, tone: 'good' })
    }
    if (pc && hasValidConsent(p, partner.id)) {
      out.push({ id: `${p.id}-partner`, at: pc.timestamp ?? p.updatedAt, text: `${partner.name} ยืนยันเงื่อนไขฉบับที่ ${pc.termsVersion} แล้ว`, href, tone: 'good' })
    } else if (p.lifecycleStatus === 'interested') {
      out.push({ id: `${p.id}-wait`, at: p.updatedAt, text: `${partner.name} ยังไม่ได้ยืนยัน แผนจึงยังไม่เริ่ม`, href, tone: 'wait' })
    }
    if (p.lifecycleStatus === 'ready') {
      const otherRunning = Object.values(s.campaigns).some((c) => c.status === 'active' && c.planId !== p.id)
      out.push({ id: `${p.id}-ready`, at: p.updatedAt, text: otherRunning ? 'ร้านทั้งสองยืนยันแล้ว เริ่มได้เมื่อแคมเปญที่กำลังดำเนินการจบ' : 'ร้านทั้งสองยืนยันแล้ว กดเริ่มแคมเปญได้', href: '/campaigns', tone: 'info' })
    }
    if (camp.status === 'active' && camp.startDate) out.push({ id: `${p.id}-active`, at: camp.startDate, text: `แคมเปญกับ${partner.name} กำลังดำเนินการ ถึง ${fmtFull(camp.endDate ?? camp.startDate)}`, href: '/campaigns', tone: 'good' })
    if (camp.status === 'completed') out.push({ id: `${p.id}-done`, at: p.updatedAt, text: `แคมเปญกับ${partner.name} เสร็จสิ้น ดูผลลัพธ์ได้แล้ว`, href: '/results', tone: 'good' })
    if (camp.status === 'cancelled') out.push({ id: `${p.id}-cancel`, at: p.updatedAt, text: `แผนกับ${partner.name} ถูกยกเลิก ไม่มีผลต่อการขายปกติ`, href, tone: 'quiet' })
  }
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

export interface RecentPeriod {
  label: string
  range: { start: string; end: string }
  orders: number
  revenue: number
}

const total = (a: number[]) => a.reduce((x, y) => x + y, 0)

/** Dashboard figures. One shared 7-day history; after a COMPLETE campaign it shows that campaign's 7 days instead. */
export function recentPeriod(s: AppState): RecentPeriod {
  // the most recently finished campaign (not simply the first one stored)
  const done = Object.values(s.campaigns)
    .filter((c) => c.status === 'completed' && c.startDate && c.endDate)
    .sort((a, b) => b.endDate!.localeCompare(a.endDate!))[0]
  if (done) {
    const seed = seedFor(s, done.planId)
    const days = s.plans[done.planId].durationDays
    if ((seed.reportedDays ?? days) >= days) {
      const cur = campaignSeries(seed, days)
      return { label: `${days} วันของแคมเปญล่าสุด`, range: { start: done.startDate!, end: done.endDate! }, orders: total(cur.orders), revenue: total(cur.revenueBaht) }
    }
    // MERCHANT_BASELINE is the history before the FIRST campaign, so that is the period to name, even when a later campaign is the latest
    const starts = Object.values(s.campaigns).flatMap((c) => (c.startDate ? [c.startDate] : []))
    const anchor = starts.reduce((a, b) => (a < b ? a : b), done.startDate!)
    const start = addDays(anchor, -MERCHANT_BASELINE.orders.length)
    return { label: '7 วันก่อนแคมเปญแรก (ข้อมูลช่วงแคมเปญล่าสุดยังมาไม่ครบ)', range: { start, end: addDays(anchor, -1) }, orders: total(MERCHANT_BASELINE.orders), revenue: total(MERCHANT_BASELINE.revenueBaht) }
  }
  return {
    label: '7 วันล่าสุดก่อนมีแคมเปญ',
    range: { start: addDays(s.today, -MERCHANT_BASELINE.orders.length), end: addDays(s.today, -1) },
    orders: total(MERCHANT_BASELINE.orders),
    revenue: total(MERCHANT_BASELINE.revenueBaht),
  }
}

export type DemoTargets = { partner?: GrowthPlan; change?: GrowthPlan; complete?: GrowthPlan }

/** Demo controls act ONLY on the plan the merchant can see in the dashboard (the headline plan), never on hidden ones. */
export function demoTargets(s: AppState): DemoTargets {
  const head = headlinePlan(s)
  if (!head) return {}
  const open = ['awaiting', 'interested', 'ready'].includes(head.lifecycleStatus)
  return {
    partner: ['awaiting', 'interested'].includes(head.lifecycleStatus) && !hasValidConsent(head, head.participatingMerchantIds[1]) ? head : undefined,
    change: open ? head : undefined,
    complete: head.lifecycleStatus === 'active' ? head : undefined,
  }
}
