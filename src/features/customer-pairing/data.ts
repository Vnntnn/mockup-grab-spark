import type { Campaign, GrowthPlan, Merchant } from '@/domain/types'
import type { PairingCampaignData, PairingDish } from './types'
import { DEMO_PAIRINGS, ROLES, findDemoPairing } from './network'

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
  'ชาไทยเย็น': 'thai-iced-tea',
  'ชามะนาว': 'lemon-tea',
  'ชาเขียวนมสด': 'green-milk-tea',
  'บัวลอยไข่หวาน': 'bua-loi',
  'ข้าวเหนียวมะม่วง': 'mango-sticky-rice',
  'ลอดช่องน้ำกะทิ': 'lod-chong',
}

const SLUG_TO_DISH_NAME: Record<string, string> = {
  'khao-man-gai-tom': 'ข้าวมันไก่ต้ม',
  'khao-man-gai-tod': 'ข้าวมันไก่ทอด',
  'khao-na-gai': 'ข้าวหน้าไก่เทอริยากิ',
  'moo-satay-10': 'หมูสะเต๊ะ 10 ไม้',
  'gai-yang': 'ไก่ย่างสมุนไพร',
  'peek-gai-tod': 'ปีกไก่ทอดน้ำปลา',
  'thai-iced-tea': 'ชาไทยเย็น',
  'lemon-tea': 'ชามะนาว',
  'green-milk-tea': 'ชาเขียวนมสด',
  'bua-loi': 'บัวลอยไข่หวาน',
  'mango-sticky-rice': 'ข้าวเหนียวมะม่วง',
  'lod-chong': 'ลอดช่องน้ำกะทิ',
}

export function dishNameToSlug(name: string): string {
  return DISH_NAME_TO_SLUG[name] ?? ''
}

export function slugToDishName(slug: string): string {
  return SLUG_TO_DISH_NAME[slug] ?? ''
}

function toDishes(m: Merchant, role: 'main' | 'complement'): PairingDish[] {
  return m.sampleMenu.map((item) => ({
    slug: dishNameToSlug(item.name),
    name: item.name,
    priceBaht: item.priceBaht,
    restaurantId: m.id,
    restaurantName: m.name,
    restaurantRole: role,
  }))
}

/**
 * Resolves a pairing id to the wizard's data. The approved campaign comes from the merchant app's own campaign
 * (unchanged path, so existing links and tests keep working). Other demo pairings are built from the same merchant
 * fixtures and have no campaign behind them.
 */
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

  if (!campaign) {
    const demo = findDemoPairing(campaignId)
    if (!demo || demo.id === DEFAULT_CAMPAIGN_ID) return null
    const [first, second] = demo.restaurantIds.map((id) => merchants[id])
    if (!first || !second || !ROLES[first.id] || !ROLES[second.id]) return null
    if (first.sampleMenu.length === 0 || second.sampleMenu.length === 0) return null
    return {
      campaignId: demo.id,
      planId: `demo-${demo.id}`,
      restaurantA: first,
      restaurantB: second,
      menuA: toDishes(first, 'main'),
      menuB: toDishes(second, 'complement'),
      roleA: ROLES[first.id],
      roleB: ROLES[second.id],
      hasSample: false,
    }
  }

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

  return {
    campaignId: campaign.id,
    planId: plan.id,
    restaurantA,
    restaurantB,
    menuA: toDishes(restaurantA, 'main'),
    menuB: toDishes(restaurantB, 'complement'),
    roleA: ROLES[restaurantA.id] ?? { pick: 'จานหลัก', section: 'อาหารจานหลัก' },
    roleB: ROLES[restaurantB.id] ?? { pick: 'ของว่าง', section: 'ของว่างทานเล่น' },
    hasSample: campaign.id === DEFAULT_CAMPAIGN_ID,
  }
}

export const DEMO_PAIRING_IDS = DEMO_PAIRINGS.map((p) => p.id)
