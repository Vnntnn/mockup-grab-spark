import type { Campaign, GrowthPlan, Merchant } from '@/domain/types'
import type { PairingCampaignData, PairingDish } from './types'

export const DEFAULT_CAMPAIGN_ID = 'camp-plan-m-khaohom'

export const APPROVED_SAMPLE_PAIR = {
  dishASlug: 'khao-man-gai-tom',
  dishBSlug: 'moo-satay-10',
} as const

const DISH_NAME_TO_SLUG: Record<string, string> = {
  'ข้าวมันไก่ต้ม': 'khao-man-gai-tom',
  'ข้าวมันไก่ทอด': 'khao-man-gai-tod',
  'ข้าวหน้าไก่เทอริยากิ': 'khao-na-gai',
  'หมูสะเต๊ะ 10 ไม้': 'moo-satay-10',
  'ไก่ย่างสมุนไพร': 'gai-yang',
  'ปีกไก่ทอดน้ำปลา': 'peek-gai-tod',
}

const SLUG_TO_DISH_NAME: Record<string, string> = {
  'khao-man-gai-tom': 'ข้าวมันไก่ต้ม',
  'khao-man-gai-tod': 'ข้าวมันไก่ทอด',
  'khao-na-gai': 'ข้าวหน้าไก่เทอริยากิ',
  'moo-satay-10': 'หมูสะเต๊ะ 10 ไม้',
  'gai-yang': 'ไก่ย่างสมุนไพร',
  'peek-gai-tod': 'ปีกไก่ทอดน้ำปลา',
}

export function dishNameToSlug(name: string): string {
  return DISH_NAME_TO_SLUG[name] ?? ''
}

export function slugToDishName(slug: string): string {
  return SLUG_TO_DISH_NAME[slug] ?? ''
}

export function resolvePairingCampaign(
  campaignId: string | undefined,
  merchants: Record<string, Merchant>,
  plans: Record<string, GrowthPlan>,
  campaigns: Record<string, Campaign>,
): PairingCampaignData | null {
  if (!campaignId) return null

  const campaign =
    campaigns[campaignId] ??
    Object.values(campaigns).find((c) => c.id === campaignId)

  if (!campaign) return null

  const plan = plans[campaign.planId]
  if (!plan) return null

  const [id1, id2] = plan.participatingMerchantIds
  const m1 = merchants[id1]
  const m2 = merchants[id2]
  if (!m1 || !m2) return null

  const isMainCategory = (m: Merchant) =>
    m.category === 'อาหารจานหลัก' || m.menuCategories.includes('อาหารจานหลัก')

  let restaurantA: Merchant
  let restaurantB: Merchant

  if (isMainCategory(m2) && !isMainCategory(m1)) {
    restaurantA = m2
    restaurantB = m1
  } else {
    restaurantA = m1
    restaurantB = m2
  }

  const menuA: PairingDish[] = restaurantA.sampleMenu.map((item) => ({
    slug: dishNameToSlug(item.name),
    name: item.name,
    priceBaht: item.priceBaht,
    restaurantId: restaurantA.id,
    restaurantName: restaurantA.name,
    restaurantRole: 'main',
  }))

  const menuB: PairingDish[] = restaurantB.sampleMenu.map((item) => ({
    slug: dishNameToSlug(item.name),
    name: item.name,
    priceBaht: item.priceBaht,
    restaurantId: restaurantB.id,
    restaurantName: restaurantB.name,
    restaurantRole: 'complement',
  }))

  return {
    campaignId: campaign.id,
    planId: plan.id,
    restaurantA,
    restaurantB,
    menuA,
    menuB,
  }
}
