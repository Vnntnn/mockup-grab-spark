import type { Campaign, CampaignResults, DailySeries, InsufficientReason, NextAction, ResultsSeed } from './types'
import { addDays, daysBetween } from '@/lib/dates'

export const MIN_BASELINE_DAYS = 7
export const LOW_CLICKS = 150
export const LOW_CLICK_TO_ORDER_PCT = 5

const sum = (a: number[]) => a.reduce((s, n) => s + n, 0)
const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0)
const okNum = (n: number) => Number.isFinite(n) && n >= 0
const validSeries = (s: DailySeries) => s.orders.length === s.revenueBaht.length && [...s.orders, ...s.revenueBaht].every(okNum)
const validCostPct = (p: number | null): p is number => p !== null && Number.isFinite(p) && p >= 0 && p <= 100

/** The campaign's daily series for `days` days: the seed pattern repeated as needed. */
export function campaignSeries(seed: ResultsSeed, days: number): DailySeries {
  const n = seed.campaign.orders.length
  const at = (a: number[]) => Array.from({ length: days }, (_, i) => a[i % n])
  return { orders: at(seed.campaign.orders), revenueBaht: at(seed.campaign.revenueBaht) }
}

/**
 * contribution = revenue − relevant variable costs − promotional costs
 * incremental  = campaign contribution − estimated baseline contribution
 * Periods are compared per day, so unequal lengths can never inflate a change.
 * Revenue is never treated as profit. Missing or invalid inputs yield null, never a guess.
 */
export function calculateCampaignResults(
  seed: ResultsSeed,
  baseline: DailySeries,
  campaign: Campaign,
  variableCostPct: number | null,
): CampaignResults {
  const start = campaign.startDate ?? ''
  const end = campaign.endDate ?? start
  const periodDays = start ? daysBetween(start, end) + 1 : 0
  const cur = campaignSeries(seed, Math.min(seed.reportedDays ?? periodDays, periodDays))
  const bDays = baseline.orders.length
  const cDays = cur.orders.length
  const bOrders = sum(baseline.orders)
  const bRevenue = sum(baseline.revenueBaht)
  const cOrders = sum(cur.orders)
  const cRevenue = sum(cur.revenueBaht)

  const reason: InsufficientReason | null =
    !validSeries(baseline) || !validSeries(seed.campaign) || ![seed.clicks, seed.attributedOrders, seed.promotionalCostsBaht].every(okNum) || seed.attributedOrders > seed.clicks
      ? 'invalid_values'
      : bDays < MIN_BASELINE_DAYS
        ? 'baseline_short'
        : cDays < periodDays
          ? 'campaign_incomplete'
          : bOrders === 0 || bRevenue === 0
            ? 'baseline_zero'
            : null

  const group = seed.comparisonGroup && Number.isFinite(seed.comparisonGroup.ordersChangePct) ? seed.comparisonGroup : null
  const canEstimate = reason === null && group !== null
  const growth = group ? 1 + group.ordersChangePct / 100 : 1
  const ratio = validCostPct(variableCostPct) ? variableCostPct / 100 : null
  const haveProfitInputs = reason === null && ratio !== null

  const perDayPct = (now: number[], before: number[]) => (avg(before) > 0 ? ((avg(now) - avg(before)) / avg(before)) * 100 : 0)
  const contribution = haveProfitInputs ? cRevenue * (1 - ratio) - seed.promotionalCostsBaht : null
  const expectedBaselineContribution = haveProfitInputs && canEstimate ? avg(baseline.revenueBaht) * growth * cDays * (1 - ratio) : null
  const expectedOrders = canEstimate ? avg(baseline.orders) * growth * cDays : null

  return {
    campaignId: campaign.id,
    reportingPeriod: { start, end },
    baselinePeriod: { start: addDays(start, -bDays), end: addDays(start, -1) },
    orders: { baseline: bOrders, campaign: cOrders },
    revenue: { baseline: bRevenue, campaign: cRevenue },
    promotionalCosts: seed.promotionalCostsBaht,
    relevantVariableCosts: haveProfitInputs ? cRevenue * ratio : null,
    attributableClicks: seed.clicks,
    attributedOrders: seed.attributedOrders,
    dataQualityStatus: reason ? 'insufficient' : group ? 'sufficient' : 'limited',
    derived: {
      baselineDays: bDays,
      campaignDays: cDays,
      periodDays,
      insufficientReason: reason,
      ordersChangePct: perDayPct(cur.orders, baseline.orders),
      revenueChangePct: perDayPct(cur.revenueBaht, baseline.revenueBaht),
      clickToOrderPct: seed.clicks > 0 ? (seed.attributedOrders / seed.clicks) * 100 : 0,
      baselineOrdersScaled: avg(baseline.orders) * cDays,
      expectedOrders,
      estimatedIncrementalOrders: expectedOrders === null ? null : cOrders - expectedOrders,
      contribution,
      expectedBaselineContribution,
      incrementalContribution: contribution === null || expectedBaselineContribution === null ? null : contribution - expectedBaselineContribution,
      comparisonLabel: group ? `${group.label} ${group.storeCount} ร้าน` : null,
    },
  }
}

export const INSUFFICIENT_TEXT: Record<InsufficientReason, string> = {
  baseline_short: 'ข้อมูลก่อนแคมเปญสั้นกว่า 7 วัน',
  campaign_incomplete: 'ข้อมูลช่วงแคมเปญยังมาไม่ครบทุกวัน',
  baseline_zero: 'ช่วงก่อนแคมเปญไม่มียอดให้เทียบ',
  invalid_values: 'ข้อมูลบางส่วนผิดปกติ',
}

/** Conditional suggestions only. The merchant decides. */
export function recommendNextAction(r: CampaignResults): NextAction {
  const d = r.derived
  if (d.insufficientReason) {
    return {
      kind: 'need_data',
      title: 'รอข้อมูลให้ครบก่อนตัดสินใจ',
      body: `${INSUFFICIENT_TEXT[d.insufficientReason]} จึงยังบอกไม่ได้ว่าแคมเปญคุ้มหรือไม่ ถ้าจะลองอีกครั้ง ควรมีข้อมูลก่อนและระหว่างแคมเปญครบอย่างน้อย 7 วัน`,
    }
  }
  if (r.attributableClicks < LOW_CLICKS) {
    return {
      kind: 'change_message',
      title: 'ถ้าอยากลองต่อ ลองเปลี่ยนข้อความแนะนำร้าน',
      body: 'คนกดลิงก์ไม่มาก ข้อความหรือรูปที่ใช้อาจยังไม่ดึงความสนใจ ลองให้ GemBond เตรียมข้อความใหม่แล้วเทียบอีกครั้ง',
    }
  }
  if (d.clickToOrderPct < LOW_CLICK_TO_ORDER_PCT) {
    return {
      kind: 'review_menu',
      title: 'ถ้าอยากลองต่อ ลองทบทวนเมนูที่เลือกมาร่วม',
      body: 'มีคนสนใจกดเข้ามาเยอะ แต่สั่งซื้อน้อย เมนูหรือราคาที่เห็นอาจยังไม่ตรงใจ คุณยังกำหนดราคาและเมนูเองได้ทั้งหมด',
    }
  }
  if (d.contribution === null) {
    return {
      kind: 'add_costs',
      title: 'ใส่ต้นทุนโดยประมาณ เพื่อดูว่าคุ้มหรือไม่',
      body: 'ตอนนี้ดูได้แค่ยอดขายและออเดอร์ ซึ่งยังไม่ใช่กำไร ใส่ต้นทุนวัตถุดิบโดยประมาณได้ที่หน้า "ร้านของฉัน" (ไม่บังคับ)',
    }
  }
  if (d.incrementalContribution === null) {
    return {
      kind: 'need_data',
      title: 'ยังไม่มีข้อมูลเปรียบเทียบที่พอ',
      body: 'ยังไม่มีกลุ่มร้านเปรียบเทียบ จึงยังบอกไม่ได้ว่าส่วนที่เพิ่มมาจากแคมเปญเท่าไร ตัดสินใจจากตัวเลขที่เห็นจริงได้ แต่ควรระวังการสรุปเกินจริง',
    }
  }
  if (d.incrementalContribution > 0) {
    return {
      kind: 'continue',
      title: 'ถ้าสะดวก ลองต่อแคมเปญอีกรอบ',
      body: `ผลเบื้องต้นดูมีแนวโน้มดี${r.promotionalCosts === 0 ? 'และไม่มีค่าใช้จ่ายเพิ่ม' : 'แม้หักค่าใช้จ่ายของแคมเปญแล้ว'} แต่ยังไม่ใช่ข้อสรุปว่าแคมเปญเป็นเหตุทั้งหมด การต่อรอบสองจะช่วยยืนยันได้มากขึ้น`,
    }
  }
  return {
    kind: 'revise',
    title: 'ถ้ายังไม่คุ้ม ลองหยุดหรือปรับแผนก่อน',
    body: 'ประมาณการผลต่างกำไรยังไม่เป็นบวกเมื่อรวมค่าใช้จ่ายแล้ว คุณเลือกหยุดหรือขอแผนใหม่ได้ ไม่มีผลต่อการขายปกติของร้าน',
  }
}
