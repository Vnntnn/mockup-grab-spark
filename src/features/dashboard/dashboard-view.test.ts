import { describe, expect, it } from 'vitest'
import { getHeroPartnershipSummary } from './dashboard-helpers'
import { createInitialState } from '@/app/reducer'

describe('getHeroPartnershipSummary', () => {
  it('extracts hero active or pending partnership data with <5s scan focal points', () => {
    const state = createInitialState('2026-10-14')
    const hero = getHeroPartnershipSummary(state)
    expect(hero).toBeDefined()
    expect(hero?.partnerName).toBe('ร้านข้าวหอม')
    expect(hero?.costBaht).toBe(0)
    expect(hero?.ctaRoute).toContain('/plans/plan-m-khaohom')
  })
})
