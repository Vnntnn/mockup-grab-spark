import type { CampaignTemplate, MerchantId } from '@/domain/types'

export const TEMPLATES: Record<string, CampaignTemplate> = {
  'awareness-cobrand': {
    id: 'awareness-cobrand',
    kind: 'awareness-cobrand',
    name: 'แคมเปญแนะนำร้านร่วมกัน',
    durationDays: 7,
  },
  // A template that asks the small shop to discount. The fairness module must always reject it.
  'bundle-discount': {
    id: 'bundle-discount',
    kind: 'bundle-discount',
    name: 'แพ็กเกจลดราคาร่วมกัน',
    durationDays: 14,
  },
}

/** Which template each candidate partner proposes. */
export const PARTNER_TEMPLATE: Record<MerchantId, string> = {
  'm-jumbo': 'bundle-discount',
}
export const DEFAULT_TEMPLATE = 'awareness-cobrand'
