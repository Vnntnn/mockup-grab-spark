import { AREAS } from '@/data/merchants'
import { DEFAULT_TEMPLATE, PARTNER_TEMPLATE, TEMPLATES } from '@/data/templates'
import { generateGrowthPlan } from './plans'
import { validateGrowthPlan } from './fairness'
import type { FailedRule, GrowthPlan, MatchReason, Merchant, PartnerRecommendation } from './types'

/**
 * Illustrative weights. They were chosen by hand for this demo and were NOT trained on any marketplace data.
 * Revenue, size, reviews and ad budget are deliberately absent.
 */
export const MATCH_WEIGHTS = {
  complementarity: 0.35,
  proximity: 0.2,
  hours: 0.2,
  readiness: 0.15,
  preference: 0.1,
} as const

export const MIN_OVERLAP_MINUTES = 180

interface Pairing {
  score: number
  forYou: string
  forPartner: string
}

/** Category pairs that complement each other (symmetric by lookup on both sides). */
const COMPLEMENT: { a: string; b: string; pairing: Pairing }[] = [
  {
    a: 'ปิ้งย่างและอาหารทานเล่น',
    b: 'อาหารจานหลัก',
    pairing: {
      score: 0.9,
      forYou: 'ลูกค้าที่สั่งอาหารจานหลักอาจอยากได้ของทานเล่นเพิ่ม และรู้จักร้านคุณมากขึ้น',
      forPartner: 'ลูกค้ามีเมนูเสริมให้เลือกมากขึ้น โดยร้านไม่ต้องทำเมนูใหม่เอง',
    },
  },
  {
    a: 'ปิ้งย่างและอาหารทานเล่น',
    b: 'เครื่องดื่ม',
    pairing: {
      score: 0.85,
      forYou: 'คนที่มองหาเครื่องดื่มอาจอยากหาของทานเล่นคู่กัน และรู้จักร้านคุณ',
      forPartner: 'ลูกค้ามีของทานเล่นให้จับคู่กับเครื่องดื่มของร้าน',
    },
  },
  {
    a: 'ปิ้งย่างและอาหารทานเล่น',
    b: 'ของหวาน',
    pairing: {
      score: 0.7,
      forYou: 'ลูกค้าที่ชอบของหวานอาจอยากลองของคาวทานเล่นด้วย',
      forPartner: 'ลูกค้ามีของคาวให้ทานก่อนของหวาน',
    },
  },
]

function pairingFor(a: string, b: string): Pairing | null {
  const hit = COMPLEMENT.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))
  return hit ? hit.pairing : null
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function span(h: { open: string; close: string }): [number, number] {
  const o = toMin(h.open)
  let c = toMin(h.close)
  if (c <= o) c += 1440
  return [o, c]
}

export function hoursOverlapMinutes(a: Merchant['operatingHours'], b: Merchant['operatingHours']): number {
  const [ao, ac] = span(a)
  const [bo, bc] = span(b)
  let total = 0
  for (const shift of [-1440, 0, 1440]) {
    total += Math.max(0, Math.min(ac, bc + shift) - Math.max(ao, bo + shift))
  }
  return Math.min(total, ac - ao, bc - bo)
}

function proximity(a: string, b: string): number {
  if (a === b) return 1
  const near = (x: string, y: string) =>
    (x === AREAS.center && y === AREAS.next) || (x === AREAS.next && y === AREAS.center)
  return near(a, b) ? 0.6 : 0
}

const READINESS = { ready: 1, almost: 0.5, not_ready: 0 } as const
const PREFERENCE = { open: 1, selective: 0.7, not_now: 0 } as const

export function checkEligibility(self: Merchant, other: Merchant): FailedRule[] {
  const failed: FailedRule[] = []
  if (!pairingFor(self.category, other.category)) failed.push({ id: 'complementarity', label: 'หมวดอาหารไม่เสริมกัน' })
  // Complementary shops must not sell the same thing: overlapping menu categories would make them compete (cannibalisation).
  if (self.menuCategories.some((c) => other.menuCategories.includes(c))) failed.push({ id: 'menu_overlap', label: 'เมนูของสองร้านซ้อนกัน' })
  if (proximity(self.neighborhood, other.neighborhood) === 0) failed.push({ id: 'proximity', label: 'อยู่ไกลกันเกินไป' })
  if (hoursOverlapMinutes(self.operatingHours, other.operatingHours) < MIN_OVERLAP_MINUTES)
    failed.push({ id: 'hours', label: 'เวลาเปิดขายซ้อนกันน้อยเกินไป' })
  if (other.readinessStatus === 'not_ready') failed.push({ id: 'readiness', label: 'ร้านยังไม่พร้อม' })
  if (other.participationPreference === 'not_now' || self.participationPreference === 'not_now')
    failed.push({ id: 'preference', label: 'มีร้านที่ยังไม่ต้องการร่วมกิจกรรม' })
  if (other.policyStatus !== 'clear' || self.policyStatus !== 'clear')
    failed.push({ id: 'policy', label: 'ยังไม่ผ่านการตรวจนโยบาย' })
  return failed
}

const hh = (m: number) => (m / 60).toFixed(m % 60 ? 1 : 0)

export function scorePair(self: Merchant, other: Merchant): { score: number; reasons: MatchReason[]; pairing: Pairing | null } {
  const pairing = pairingFor(self.category, other.category)
  const overlap = hoursOverlapMinutes(self.operatingHours, other.operatingHours)
  const minSpan = Math.min(
    span(self.operatingHours)[1] - span(self.operatingHours)[0],
    span(other.operatingHours)[1] - span(other.operatingHours)[0],
  )
  const prox = proximity(self.neighborhood, other.neighborhood)
  const parts = {
    complementarity: pairing?.score ?? 0,
    proximity: prox,
    hours: minSpan ? overlap / minSpan : 0,
    readiness: READINESS[other.readinessStatus],
    preference: PREFERENCE[other.participationPreference],
  }
  const reasons: MatchReason[] = [
    {
      factor: 'complementarity',
      label: 'เมนูเสริมกัน',
      detail: `${other.category} กับ ${self.category} ช่วยให้ลูกค้ามีตัวเลือกครบมื้อขึ้น`,
      score: parts.complementarity,
      weight: MATCH_WEIGHTS.complementarity,
    },
    {
      factor: 'proximity',
      label: 'อยู่ใกล้กัน',
      detail: prox === 1 ? `อยู่ในย่านเดียวกัน (${other.neighborhood})` : `อยู่ย่านใกล้เคียงกัน (${other.neighborhood})`,
      score: parts.proximity,
      weight: MATCH_WEIGHTS.proximity,
    },
    {
      factor: 'hours',
      label: 'เปิดขายเวลาตรงกัน',
      detail: `เปิดขายซ้อนกันประมาณ ${hh(overlap)} ชั่วโมงต่อวัน`,
      score: parts.hours,
      weight: MATCH_WEIGHTS.hours,
    },
    {
      factor: 'readiness',
      label: 'ความพร้อมของร้าน',
      detail: other.readinessStatus === 'ready' ? 'ร้านพร้อมรับแคมเปญแล้ว' : 'ร้านยังเตรียมตัวไม่ครบ จึงได้คะแนนส่วนนี้น้อยลง',
      score: parts.readiness,
      weight: MATCH_WEIGHTS.readiness,
    },
    {
      factor: 'preference',
      label: 'ความสนใจร่วมกิจกรรม',
      detail: other.participationPreference === 'open' ? 'ร้านนี้เปิดรับกิจกรรมร่วมกัน' : 'ร้านนี้เลือกร่วมเฉพาะกิจกรรมที่เหมาะสม',
      score: parts.preference,
      weight: MATCH_WEIGHTS.preference,
    },
  ]
  const score = reasons.reduce((s, r) => s + r.score * r.weight, 0) * 100
  return { score: Math.round(score), reasons, pairing }
}

export interface RejectedCandidate {
  merchantId: string
  stage: 'eligibility' | 'fairness'
  reasons: string[]
}

export interface MatchingOutcome {
  recommendations: PartnerRecommendation[]
  plans: GrowthPlan[]
  rejected: RejectedCandidate[]
}

/**
 * Eligibility -> plan generation -> fairness. A candidate that fails either stage
 * never reaches the merchant. A match score is not authorisation to participate.
 */
export function getEligiblePartners(self: Merchant, all: Merchant[], today: string): MatchingOutcome {
  const recommendations: PartnerRecommendation[] = []
  const plans: GrowthPlan[] = []
  const rejected: RejectedCandidate[] = []

  for (const other of all) {
    if (other.id === self.id) continue
    const failed = checkEligibility(self, other)
    if (failed.length) {
      rejected.push({ merchantId: other.id, stage: 'eligibility', reasons: failed.map((f) => f.label) })
      continue
    }
    const template = TEMPLATES[PARTNER_TEMPLATE[other.id] ?? DEFAULT_TEMPLATE]
    const plan = generateGrowthPlan(self, other, template, today)
    const fairness = validateGrowthPlan(plan)
    if (fairness.status !== 'passed') {
      rejected.push({
        merchantId: other.id,
        stage: 'fairness',
        reasons: fairness.checks.filter((c) => c.status !== 'pass').map((c) => c.label),
      })
      continue
    }
    const { score, reasons, pairing } = scorePair(self, other)
    recommendations.push({
      id: `rec-${other.id}`,
      sourceMerchantId: self.id,
      partnerMerchantId: other.id,
      matchScore: score,
      matchReasons: reasons,
      eligibilityStatus: 'eligible',
      proposedPlanId: plan.id,
      benefitForYou: pairing?.forYou ?? '',
      benefitForPartner: pairing?.forPartner ?? '',
    })
    plans.push(plan)
  }
  recommendations.sort((a, b) => b.matchScore - a.matchScore || a.partnerMerchantId.localeCompare(b.partnerMerchantId))
  return { recommendations, plans, rejected }
}
