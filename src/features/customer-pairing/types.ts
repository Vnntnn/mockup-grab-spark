import type { Merchant } from '@/domain/types'

export interface PairingDish {
  slug: string
  name: string
  priceBaht: number
  restaurantId: string
  restaurantName: string
  restaurantRole: 'main' | 'complement'
}

export interface PairingCampaignData {
  campaignId: string
  planId: string
  restaurantA: Merchant
  restaurantB: Merchant
  menuA: PairingDish[]
  menuB: PairingDish[]
}
