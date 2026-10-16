import type { Merchant, MenuItem } from '@/domain/types'
import { getLang } from '@/i18n/lang'
import { translate } from '@/i18n/translate'

/**
 * The customer-facing demo network: which fixture restaurants take part in GemBond pairings, and how they are drawn.
 *
 * What is real fixture data: names, categories, neighbourhood labels, opening hours, blurbs, dishes and prices all come
 * from `src/data/merchants.ts`. What is synthetic and exists only here: the four pairings (only the first has a
 * campaign in the merchant app), and the schematic map positions, which are NOT geographic coordinates.
 */

export const DEMO_NETWORK_NOTE =
  'ร้าน เมนู ราคา เวลาเปิด และตำแหน่งบนแผนที่เป็นข้อมูลสมมติเพื่อสาธิตต้นแบบ ไม่ใช่ร้านหรือที่ตั้งจริง'
export const MAP_LEGEND_NOTE =
  'แต่ละจุดคือร้านหนึ่งร้าน เส้นและสัญลักษณ์ตรงกลางแสดงว่าสองร้านจับคู่กัน ไม่ใช่เส้นทางหรือระยะทาง'
export const MAP_POSITION_NOTE = 'ตำแหน่งบนแผนที่เป็นตำแหน่งสมมติเพื่อสาธิต ไม่ใช่พิกัดจริง'

/** What a customer picks from a restaurant ("เลือก{pick}จาก…") and how its section is titled on the result. */
export interface RoleCopy {
  pick: string
  section: string
}

export const ROLES: Record<string, RoleCopy> = {
  'm-khaohom': { pick: 'จานหลัก', section: 'อาหารจานหลัก' },
  'm-satay': { pick: 'ของว่าง', section: 'ของว่างทานเล่น' },
  'm-tea': { pick: 'เครื่องดื่ม', section: 'เครื่องดื่ม' },
  'm-dessert': { pick: 'ของหวาน', section: 'ของหวาน' },
}

/** Schematic position in a 0..100 box, plus which side of the marker its name sits. */
export interface MapPlace {
  x: number
  y: number
  labelSide: 'above' | 'below'
}

/** One distinct letter per marker (two shop names start with ข, so the first letter alone would repeat). */
export const GLYPHS: Record<string, string> = {
  'm-khaohom': 'ข',
  'm-satay': 'ส',
  'm-tea': 'ช',
  'm-dessert': 'ค',
}

export const MAP_PLACES: Record<string, MapPlace> = {
  'm-khaohom': { x: 46, y: 22, labelSide: 'below' },
  'm-satay': { x: 17, y: 52, labelSide: 'below' },
  'm-tea': { x: 83, y: 52, labelSide: 'below' },
  'm-dessert': { x: 46, y: 74, labelSide: 'below' },
}

/** Zones are drawn from the fixtures' own neighbourhood labels. */
export const MAP_ZONES = [
  { neighborhood: 'ย่านออฟฟิศกลางกรุง', x: 0, width: 66 },
  { neighborhood: 'ย่านออฟฟิศข้างเคียง', x: 66, width: 34 },
] as const

/** `restaurantIds` is in choosing order: the first restaurant is step 2, the second is step 3. */
export interface DemoPairing {
  id: string
  restaurantIds: [string, string]
  /** Only the approved fixture pair has a validated sample result. */
  hasSample?: boolean
}

export const DEMO_PAIRINGS: DemoPairing[] = [
  { id: 'camp-plan-m-khaohom', restaurantIds: ['m-khaohom', 'm-satay'], hasSample: true },
  { id: 'pair-khaohom-tea', restaurantIds: ['m-khaohom', 'm-tea'] },
  { id: 'pair-satay-dessert', restaurantIds: ['m-satay', 'm-dessert'] },
  { id: 'pair-tea-dessert', restaurantIds: ['m-tea', 'm-dessert'] },
]

/**
 * What is picked from a restaurant, as a word inside a sentence. In English it is the lower-case singular ("drink"), because the
 * Thai word is shared with the plural category name ("Drinks") that the dictionary gives for the same Thai text elsewhere.
 */
export function pickText(pick: string): string {
  return getLang() === 'th' ? pick : translate(pick).toLowerCase().replace(/s$/, '')
}

export function shortName(name: string): string {
  return name.replace(/^ร้าน/, '')
}

export function findDemoPairing(id: string | null | undefined): DemoPairing | undefined {
  return id ? DEMO_PAIRINGS.find((p) => p.id === id) : undefined
}

export interface NetRestaurant {
  id: string
  name: string
  shortName: string
  glyph: string
  category: string
  neighborhood: string
  hours: string
  blurb: string
  menu: MenuItem[]
  role: RoleCopy
  place: MapPlace
  pairingIds: string[]
}

export interface NetPairing {
  id: string
  first: NetRestaurant
  second: NetRestaurant
  hasSample: boolean
}

export interface DemoNetwork {
  restaurants: NetRestaurant[]
  pairings: NetPairing[]
}

/** A merchant fixture as a network restaurant. Unknown ids fall back to neutral role and position, never to invented facts. */
export function toNetRestaurant(m: Merchant): NetRestaurant {
  return {
    id: m.id,
    name: m.name,
    shortName: shortName(m.name),
    glyph: GLYPHS[m.id] ?? shortName(m.name).charAt(0),
    category: m.category,
    neighborhood: m.neighborhood,
    hours: `${m.operatingHours.open}–${m.operatingHours.close}`,
    blurb: m.blurb,
    menu: m.sampleMenu,
    role: ROLES[m.id] ?? { pick: 'จานหลัก', section: m.category },
    place: MAP_PLACES[m.id] ?? { x: 50, y: 50, labelSide: 'below' },
    pairingIds: [],
  }
}

/** Builds the network from the merchant fixtures. Pairings whose restaurants are missing are dropped, never invented. */
export function buildNetwork(merchants: Record<string, Merchant>): DemoNetwork {
  const toRestaurant = toNetRestaurant

  const byId = new Map<string, NetRestaurant>()
  const usable = DEMO_PAIRINGS.filter((p) =>
    p.restaurantIds.every((id) => merchants[id] && ROLES[id] && MAP_PLACES[id] && merchants[id].sampleMenu.length > 0),
  )
  for (const p of usable) {
    for (const id of p.restaurantIds) if (!byId.has(id)) byId.set(id, toRestaurant(merchants[id]))
  }
  const pairings: NetPairing[] = usable.map((p) => {
    const first = byId.get(p.restaurantIds[0])!
    const second = byId.get(p.restaurantIds[1])!
    first.pairingIds.push(p.id)
    second.pairingIds.push(p.id)
    return { id: p.id, first, second, hasSample: !!p.hasSample }
  })
  return { restaurants: [...byId.values()], pairings }
}

// ---------- discovery URL state: /pair?pairing=<id>&restaurant=<id>&view=list ----------
// The schematic map is the main way to choose; `view=list` is the map-free alternative.

export interface DiscoverySelection {
  restaurantId: string | null
  pairingId: string | null
  view: 'map' | 'list'
}

/** Unknown ids are dropped (and `canonical` says so), so a stale or tampered link degrades to "nothing selected". */
export function parseDiscoveryParams(
  params: URLSearchParams,
  network: DemoNetwork,
): DiscoverySelection & { canonical: string; needsCanonicalization: boolean } {
  const pairingParam = params.get('pairing')
  const restaurantParam = params.get('restaurant')
  const viewParam = params.get('view')

  const pairingId = network.pairings.some((p) => p.id === pairingParam) ? pairingParam : null
  // a pairing already names both restaurants, so a separate restaurant id only matters without one
  const restaurantId = !pairingId && network.restaurants.some((r) => r.id === restaurantParam) ? restaurantParam : null
  const view: 'map' | 'list' = viewParam === 'list' ? 'list' : 'map'

  const canonical = buildDiscoveryUrl({ restaurantId, pairingId, view })
  const current = params.toString()
  const canonicalQuery = canonical.includes('?') ? canonical.split('?')[1] : ''
  return { restaurantId, pairingId, view, canonical, needsCanonicalization: current !== canonicalQuery }
}

export function buildDiscoveryUrl(sel: DiscoverySelection): string {
  const q = new URLSearchParams()
  if (sel.pairingId) q.set('pairing', sel.pairingId)
  else if (sel.restaurantId) q.set('restaurant', sel.restaurantId)
  if (sel.view === 'list') q.set('view', 'list')
  const s = q.toString()
  return s ? `/pair?${s}` : '/pair'
}
