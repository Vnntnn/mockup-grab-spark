import type { DailySeries, MerchantId, ResultsSeed } from '@/domain/types'

/**
 * Synthetic demo data. The merchant has ONE pre-campaign history (7 days), shared by the dashboard and every
 * campaign report. Partner seeds only describe what happened during that partner's campaign.
 * Totals are always computed, never typed in.
 */
export const MERCHANT_BASELINE: DailySeries = {
  orders: [19, 21, 20, 22, 23, 18, 18],
  revenueBaht: [3510, 3885, 3700, 4070, 4255, 3330, 3330],
}

export const RESULTS_SEEDS: Record<MerchantId, ResultsSeed> = {
  'm-khaohom': {
    campaign: { orders: [22, 25, 24, 27, 28, 21, 21], revenueBaht: [4092, 4650, 4464, 5022, 5208, 3906, 3906] },
    clicks: 412,
    attributedOrders: 38,
    promotionalCostsBaht: 0,
    comparisonGroup: { label: 'ร้านลักษณะใกล้เคียงที่ไม่ได้ร่วมแคมเปญ', storeCount: 12, ordersChangePct: 6 },
  },
  // many clicks, few orders -> "review the menu" advice
  'm-dessert': {
    campaign: { orders: [21, 22, 20, 23, 22, 18, 18], revenueBaht: [3885, 4070, 3700, 4255, 4070, 3330, 3330] },
    clicks: 380,
    attributedOrders: 6,
    promotionalCostsBaht: 0,
    comparisonGroup: { label: 'ร้านลักษณะใกล้เคียงที่ไม่ได้ร่วมแคมเปญ', storeCount: 9, ordersChangePct: 4 },
  },
  // report only covers 4 of 7 days and there is no comparison group -> data-insufficient path
  'm-tea': {
    campaign: { orders: [22, 24, 23, 25], revenueBaht: [4070, 4440, 4255, 4625] },
    reportedDays: 4,
    clicks: 96,
    attributedOrders: 9,
    promotionalCostsBaht: 0,
    comparisonGroup: null,
  },
}

/**
 * Used when a partner has no results data at all. It reports zero days of data, so the calculation lands on
 * "campaign_incomplete" (ข้อมูลยังไม่เพียงพอ) instead of borrowing another partner's numbers.
 */
export const NO_DATA_SEED: ResultsSeed = {
  campaign: { orders: [0], revenueBaht: [0] },
  reportedDays: 0,
  clicks: 0,
  attributedOrders: 0,
  promotionalCostsBaht: 0,
  comparisonGroup: null,
}
