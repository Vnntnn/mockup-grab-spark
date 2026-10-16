import { describe, expect, it } from 'vitest'
import { createInitialState } from '@/app/reducer'
import { DEFAULT_CAMPAIGN_ID, dishNameToSlug, resolvePairingCampaign } from '../data'
import {
  DEMO_PAIRINGS,
  GLYPHS,
  MAP_PLACES,
  ROLES,
  buildDiscoveryUrl,
  buildNetwork,
  parseDiscoveryParams,
} from '../network'

const state = createInitialState('2026-10-16')
const network = buildNetwork(state.merchants)

describe('demo network fixtures', () => {
  it('has at least four restaurants and three pairings, all built from the merchant fixtures', () => {
    expect(network.restaurants.length).toBeGreaterThanOrEqual(4)
    expect(network.pairings.length).toBeGreaterThanOrEqual(3)
    for (const r of network.restaurants) {
      const m = state.merchants[r.id]
      expect(r.name).toBe(m.name)
      expect(r.menu).toEqual(m.sampleMenu)
      expect(r.hours).toBe(`${m.operatingHours.open}–${m.operatingHours.close}`)
    }
  })

  it('keeps the approved pair, its campaign id, dishes and prices', () => {
    const p = network.pairings[0]
    expect(p.id).toBe(DEFAULT_CAMPAIGN_ID)
    expect(p.first.name).toBe('ร้านข้าวหอม')
    expect(p.second.name).toBe('ร้านหมูสะเต๊ะบ้านสวน')
    expect(p.first.menu.map((m) => [m.name, m.priceBaht])).toEqual([['ข้าวมันไก่ต้ม', 65], ['ข้าวมันไก่ทอด', 70], ['ข้าวหน้าไก่เทอริยากิ', 85]])
    expect(p.second.menu.map((m) => [m.name, m.priceBaht])).toEqual([['หมูสะเต๊ะ 10 ไม้', 120], ['ไก่ย่างสมุนไพร', 95], ['ปีกไก่ทอดน้ำปลา', 85]])
    expect(p.hasSample).toBe(true)
  })

  it('every restaurant is in at least one pairing, no pairing repeats a restaurant, ids are unique', () => {
    expect(new Set(DEMO_PAIRINGS.map((p) => p.id)).size).toBe(DEMO_PAIRINGS.length)
    for (const r of network.restaurants) expect(r.pairingIds.length).toBeGreaterThan(0)
    for (const p of network.pairings) expect(p.first.id).not.toBe(p.second.id)
  })

  it('has a role, a distinct marker glyph and a schematic position for every restaurant', () => {
    const glyphs = network.restaurants.map((r) => r.glyph)
    expect(new Set(glyphs).size).toBe(glyphs.length)
    for (const r of network.restaurants) {
      expect(ROLES[r.id]).toBeTruthy()
      expect(GLYPHS[r.id]).toBeTruthy()
      const place = MAP_PLACES[r.id]
      expect(place.x).toBeGreaterThanOrEqual(0)
      expect(place.x).toBeLessThanOrEqual(100)
      expect(place.y).toBeGreaterThanOrEqual(0)
      expect(place.y).toBeLessThanOrEqual(100)
    }
  })

  it('every dish of every restaurant maps to an illustration slug and every pairing resolves for the wizard', () => {
    for (const r of network.restaurants) for (const m of r.menu) expect(dishNameToSlug(m.name), m.name).not.toBe('')
    for (const p of network.pairings) {
      const data = resolvePairingCampaign(p.id, state.merchants, state.plans, state.campaigns)
      expect(data, p.id).not.toBeNull()
      expect(data!.restaurantA.id).toBe(p.first.id)
      expect(data!.restaurantB.id).toBe(p.second.id)
      expect(data!.menuA.length).toBe(3)
      expect(data!.menuB.length).toBe(3)
      expect(data!.hasSample).toBe(p.hasSample)
    }
  })

  it('does not invent pairings: an unknown id resolves to nothing', () => {
    expect(resolvePairingCampaign('pair-nope', state.merchants, state.plans, state.campaigns)).toBeNull()
  })
})

describe('discovery URL state', () => {
  const parse = (q: string) => parseDiscoveryParams(new URLSearchParams(q), network)

  it('reads a pairing, a restaurant and the view', () => {
    expect(parse('pairing=pair-khaohom-tea').pairingId).toBe('pair-khaohom-tea')
    expect(parse('restaurant=m-tea&view=list')).toMatchObject({ restaurantId: 'm-tea', pairingId: null, view: 'list' })
  })

  it('a pairing wins over a restaurant id (it already names both restaurants)', () => {
    const s = parse('pairing=pair-khaohom-tea&restaurant=m-satay')
    expect(s.pairingId).toBe('pair-khaohom-tea')
    expect(s.restaurantId).toBeNull()
    expect(s.needsCanonicalization).toBe(true)
  })

  it('drops unknown ids and stray params instead of trusting them', () => {
    const s = parse('pairing=nope&restaurant=m-jumbo&foo=1')
    expect(s).toMatchObject({ pairingId: null, restaurantId: null, view: 'map', canonical: '/pair', needsCanonicalization: true })
  })

  it('a canonical URL needs no rewrite and round-trips', () => {
    for (const q of ['', 'pairing=pair-tea-dessert', 'restaurant=m-khaohom&view=list', 'view=list']) {
      const s = parse(q)
      expect(s.needsCanonicalization, q).toBe(false)
      expect(buildDiscoveryUrl(s)).toBe(q ? `/pair?${q}` : '/pair')
    }
  })
})
