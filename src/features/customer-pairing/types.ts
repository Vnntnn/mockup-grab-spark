import type { Merchant } from '@/domain/types'
import type { RoleCopy } from './network'

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
  /** What is picked from each restaurant, in Thai ("จานหลัก", "ของว่าง", "เครื่องดื่ม", "ของหวาน"). */
  roleA: RoleCopy
  roleB: RoleCopy
  /** Only the approved fixture pair has a validated sample pairing. */
  hasSample: boolean
}
