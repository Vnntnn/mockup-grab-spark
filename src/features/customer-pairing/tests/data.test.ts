import { describe, it, expect } from 'vitest'
import {
  resolvePairingCampaign,
  dishNameToSlug,
  slugToDishName,
  DEFAULT_CAMPAIGN_ID,
  APPROVED_SAMPLE_PAIR,
} from '../data'
import { createInitialState } from '@/app/reducer'

describe('customer-pairing data resolvers', () => {
  const state = createInitialState('2026-10-16')

  it('maps dish names to deterministic URL slugs bi-directionally', () => {
    expect(dishNameToSlug('ข้าวมันไก่ต้ม')).toBe('khao-man-gai-tom')
    expect(dishNameToSlug('ข้าวมันไก่ทอด')).toBe('khao-man-gai-tod')
    expect(dishNameToSlug('ข้าวหน้าไก่เทอริยากิ')).toBe('khao-na-gai')
    expect(dishNameToSlug('หมูสะเต๊ะ 10 ไม้')).toBe('moo-satay-10')
    expect(dishNameToSlug('ไก่ย่างสมุนไพร')).toBe('gai-yang')
    expect(dishNameToSlug('ปีกไก่ทอดน้ำปลา')).toBe('peek-gai-tod')

    expect(slugToDishName('khao-man-gai-tom')).toBe('ข้าวมันไก่ต้ม')
    expect(slugToDishName('khao-man-gai-tod')).toBe('ข้าวมันไก่ทอด')
    expect(slugToDishName('khao-na-gai')).toBe('ข้าวหน้าไก่เทอริยากิ')
    expect(slugToDishName('moo-satay-10')).toBe('หมูสะเต๊ะ 10 ไม้')
    expect(slugToDishName('gai-yang')).toBe('ไก่ย่างสมุนไพร')
    expect(slugToDishName('peek-gai-tod')).toBe('ปีกไก่ทอดน้ำปลา')

    // Unknown dishes return empty string
    expect(dishNameToSlug('เมนูที่ไม่มีอยู่')).toBe('')
    expect(slugToDishName('unknown-dish')).toBe('')
  })

  it('resolves verified active campaign fixture for camp-plan-m-khaohom', () => {
    const data = resolvePairingCampaign(DEFAULT_CAMPAIGN_ID, state.merchants, state.plans, state.campaigns)
    expect(data).not.toBeNull()
    expect(data?.campaignId).toBe('camp-plan-m-khaohom')
    expect(data?.planId).toBe('plan-m-khaohom')
    expect(data?.restaurantA.name).toBe('ร้านข้าวหอม')
    expect(data?.restaurantB.name).toBe('ร้านหมูสะเต๊ะบ้านสวน')

    // Menu A (Restaurant A - Main role)
    expect(data?.menuA.length).toBe(3)
    expect(data?.menuA).toEqual([
      {
        slug: 'khao-man-gai-tom',
        name: 'ข้าวมันไก่ต้ม',
        priceBaht: 65,
        restaurantId: 'm-khaohom',
        restaurantName: 'ร้านข้าวหอม',
        restaurantRole: 'main',
      },
      {
        slug: 'khao-man-gai-tod',
        name: 'ข้าวมันไก่ทอด',
        priceBaht: 70,
        restaurantId: 'm-khaohom',
        restaurantName: 'ร้านข้าวหอม',
        restaurantRole: 'main',
      },
      {
        slug: 'khao-na-gai',
        name: 'ข้าวหน้าไก่เทอริยากิ',
        priceBaht: 85,
        restaurantId: 'm-khaohom',
        restaurantName: 'ร้านข้าวหอม',
        restaurantRole: 'main',
      },
    ])

    // Menu B (Restaurant B - Complement role)
    expect(data?.menuB.length).toBe(3)
    expect(data?.menuB).toEqual([
      {
        slug: 'moo-satay-10',
        name: 'หมูสะเต๊ะ 10 ไม้',
        priceBaht: 120,
        restaurantId: 'm-satay',
        restaurantName: 'ร้านหมูสะเต๊ะบ้านสวน',
        restaurantRole: 'complement',
      },
      {
        slug: 'gai-yang',
        name: 'ไก่ย่างสมุนไพร',
        priceBaht: 95,
        restaurantId: 'm-satay',
        restaurantName: 'ร้านหมูสะเต๊ะบ้านสวน',
        restaurantRole: 'complement',
      },
      {
        slug: 'peek-gai-tod',
        name: 'ปีกไก่ทอดน้ำปลา',
        priceBaht: 85,
        restaurantId: 'm-satay',
        restaurantName: 'ร้านหมูสะเต๊ะบ้านสวน',
        restaurantRole: 'complement',
      },
    ])
  })

  it('returns null for an invalid or unknown campaign ID', () => {
    const data = resolvePairingCampaign('camp-non-existent', state.merchants, state.plans, state.campaigns)
    expect(data).toBeNull()

    const undefinedData = resolvePairingCampaign(undefined, state.merchants, state.plans, state.campaigns)
    expect(undefinedData).toBeNull()

    const emptyData = resolvePairingCampaign('', state.merchants, state.plans, state.campaigns)
    expect(emptyData).toBeNull()
  })

  it('defines the approved sample pairing fixture correctly', () => {
    expect(APPROVED_SAMPLE_PAIR.dishASlug).toBe('khao-man-gai-tom')
    expect(APPROVED_SAMPLE_PAIR.dishBSlug).toBe('moo-satay-10')
  })
})
