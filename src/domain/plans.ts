import { validateGrowthPlan } from './fairness'
import type {
  CampaignTemplate,
  ConsentRecord,
  FairnessStatus,
  GrowthPlan,
  Merchant,
  MerchantId,
  PlanLifecycle,
} from './types'

export const planIdFor = (partnerId: MerchantId) => `plan-${partnerId}`

const isValidConsent = (plan: GrowthPlan, r: ConsentRecord | undefined) =>
  !!r && r.consentStatus === 'accepted' && r.termsVersion === plan.planVersion

export function consentOf(plan: GrowthPlan, merchantId: MerchantId): ConsentRecord | undefined {
  return plan.consentRecords.find((r) => r.merchantId === merchantId)
}

export function hasValidConsent(plan: GrowthPlan, merchantId: MerchantId): boolean {
  return isValidConsent(plan, consentOf(plan, merchantId))
}

/** Lifecycle before activation follows consent only. Active/completed/cancelled are set by explicit transitions. */
export function deriveLifecycle(plan: GrowthPlan, fairness: FairnessStatus = plan.fairnessCheckStatus): PlanLifecycle {
  const fixed: PlanLifecycle[] = ['active', 'completed', 'cancelled']
  if (fixed.includes(plan.lifecycleStatus)) return plan.lifecycleStatus
  if (plan.consentRecords.some((r) => r.consentStatus === 'declined')) return 'declined'
  const [selfId, partnerId] = plan.participatingMerchantIds
  const self = hasValidConsent(plan, selfId)
  const partner = hasValidConsent(plan, partnerId)
  if (self && partner && fairness === 'passed') return 'ready'
  if (self) return 'interested'
  return 'awaiting'
}

/** Recompute everything that is derived. Call after every plan change. */
export function refreshPlan(plan: GrowthPlan, now: string): GrowthPlan {
  const fairness = validateGrowthPlan(plan).status
  return { ...plan, fairnessCheckStatus: fairness, lifecycleStatus: deriveLifecycle(plan, fairness), updatedAt: now }
}

export function generateGrowthPlan(
  self: Merchant,
  partner: Merchant,
  template: CampaignTemplate,
  today: string,
): GrowthPlan {
  const id = planIdFor(partner.id)
  const forced = template.kind === 'bundle-discount'
  const zeroLine = (lid: string, label: string, trigger: string) => ({
    id: lid,
    label,
    amountBaht: 0,
    payer: 'smallMerchant' as const,
    trigger,
  })
  const plan: GrowthPlan = {
    id,
    participatingMerchantIds: [self.id, partner.id],
    campaignTemplateId: template.id,
    planVersion: 1,
    title: 'ให้ลูกค้ารู้จักร้านของคุณมากขึ้น',
    summary: `GemBond แนะนำให้ร้านของคุณร่วมแคมเปญประชาสัมพันธ์กับ${partner.name} (${partner.category}) ในย่านใกล้กัน เพื่อเพิ่มโอกาสให้ลูกค้ากลุ่มใหม่ค้นพบร้านของคุณ`,
    durationDays: template.durationDays,
    responsibilitiesByMerchant: {
      [self.id]: [
        'เลือกเมนูที่พร้อมขายเข้าร่วมแคมเปญ',
        'เตรียมสินค้าและให้บริการตามปกติ',
        'ไม่จำเป็นต้องลดราคาตามข้อเสนอของร้านคู่ค้า',
        'ไม่จำเป็นต้องซื้อโฆษณาเพิ่มเติมสำหรับแผนตัวอย่างนี้',
        'สามารถดูผลลัพธ์ของแคมเปญได้หลังจบกิจกรรม',
      ],
      [partner.id]: [
        'ช่วยประชาสัมพันธ์ร้านคู่ค้าตามขอบเขตของแผน',
        'ไม่สามารถกำหนดราคาหรือสั่งให้ร้านเล็กเปลี่ยนเมนูได้',
        'ไม่สามารถเข้าถึงข้อมูลต้นทุนและกำไรส่วนตัวของร้านเล็กโดยอัตโนมัติ',
      ],
    },
    gembondResponsibilities: [
      'จัดทำข้อเสนอแคมเปญให้',
      'ตรวจสอบความเหมาะสมและความเป็นธรรมของแผน',
      'ประสานการขอความยินยอมจากแต่ละร้านแยกกัน',
      'รายงานผลแคมเปญ',
      'ช่วยให้ร้านเรียนรู้จากผลลัพธ์',
    ],
    costTermsByMerchant: {
      [self.id]: {
        merchantId: self.id,
        lines: [
          zeroLine('ad', 'ค่าโฆษณาเพิ่มเติม', 'ไม่มี — แผนนี้ไม่ให้ร้านคุณซื้อโฆษณา'),
          zeroLine('discount', 'ส่วนลดที่ต้องให้ลูกค้า', 'ไม่มี — ร้านคุณกำหนดราคาเอง'),
          zeroLine('revshare', 'ส่วนแบ่งยอดขายให้ร้านคู่ค้า', 'ไม่มี — ยอดขายเป็นของแต่ละร้าน'),
          zeroLine('fee', 'ค่าบริการแคมเปญของ GemBond', 'ไม่มี — ในแผนตัวอย่างนี้'),
        ],
        outsideScopeNote:
          'ค่าธรรมเนียมแพลตฟอร์มปกติและต้นทุนการทำร้านของคุณไม่เปลี่ยน และไม่รวมอยู่ในแผนนี้',
      },
      [partner.id]: {
        merchantId: partner.id,
        lines: [zeroLine('media', 'ค่าทำสื่อประชาสัมพันธ์ของร้านคู่ค้า', 'ร้านคู่ค้าดูแลเอง')],
        outsideScopeNote: '',
      },
    },
    discountTerms: forced
      ? { requiredFromSmallMerchant: true, note: 'ร้านเล็กต้องลดราคา 15% ตลอดแคมเปญ' }
      : { requiredFromSmallMerchant: false, note: 'ไม่มีส่วนลดบังคับ ร้านคุณกำหนดราคาเอง' },
    revenueSharingTerms: { mandatory: false, note: 'ไม่มีการแบ่งยอดขายระหว่างร้าน' },
    dataPermissions: [
      { id: 'name-menu', label: 'ชื่อร้าน เมนูที่เลือกร่วมแคมเปญ และรูปที่ร้านเตรียมไว้', sensitivity: 'shared', partnerCanSee: true },
      { id: 'campaign-stats', label: 'จำนวนคลิกลิงก์แคมเปญ (ภาพรวม)', sensitivity: 'shared', partnerCanSee: true },
      { id: 'cost-profit', label: 'ต้นทุนและกำไรของร้านคุณ', sensitivity: 'private', partnerCanSee: false },
      { id: 'sales-detail', label: 'ยอดขายรายออเดอร์และรายวัน', sensitivity: 'private', partnerCanSee: false },
      { id: 'customer-identity', label: 'ชื่อ เบอร์ หรือที่อยู่ลูกค้า', sensitivity: 'private', partnerCanSee: false },
    ],
    safeguards: { renewConsentOnMaterialChange: true, noPenaltyForDeclining: true },
    cancellationTerms: [
      'ร้านคุณขอยกเลิกได้ทุกเมื่อ ไม่มีค่าธรรมเนียมหรือค่าปรับ',
      'เมื่อยกเลิก แคมเปญจะหยุดแสดงร้านคุณ และคุณยังดูผลลัพธ์ที่เก็บได้จนถึงวันนั้น',
      'การยกเลิกไม่กระทบสิทธิการขายตามปกติของร้านคุณ',
    ],
    changeLog: [{ version: 1, at: today, summary: 'ข้อเสนอแรกจาก GemBond' }],
    fairnessCheckStatus: 'unresolved',
    consentRecords: [self.id, partner.id].map((merchantId) => ({
      merchantId,
      planId: id,
      termsVersion: 1,
      consentStatus: 'pending',
      timestamp: null,
      relevantDisclosureAcknowledgements: [],
    })),
    lifecycleStatus: 'awaiting',
    updatedAt: today,
  }
  return refreshPlan(plan, today)
}

/** Sum of what the merchant must pay. null if any line is unresolved. */
export function totalCommitmentBaht(plan: GrowthPlan, merchantId: MerchantId): number | null {
  const lines = plan.costTermsByMerchant[merchantId]?.lines ?? []
  if (lines.some((l) => l.amountBaht === null)) return null
  return lines.reduce((s, l) => s + (l.amountBaht ?? 0), 0)
}

/** Terms whose change requires every party to consent again. */
const materialSnapshot = (p: GrowthPlan) =>
  JSON.stringify([
    p.durationDays,
    p.costTermsByMerchant,
    p.discountTerms,
    p.revenueSharingTerms,
    p.dataPermissions,
    p.responsibilitiesByMerchant,
  ])

export const isMaterialChange = (a: GrowthPlan, b: GrowthPlan) => materialSnapshot(a) !== materialSnapshot(b)

export type PlanResult = { ok: true; plan: GrowthPlan } | { ok: false; reason: string }

/**
 * A partner-proposed change. Material changes bump the version and invalidate accepted consents.
 * Not allowed once the campaign is running: agreed terms cannot be rewritten unilaterally.
 */
export function applyTermsChange(
  plan: GrowthPlan,
  patch: Partial<Pick<GrowthPlan, 'durationDays'>>,
  summary: string,
  now: string,
): PlanResult {
  if (['active', 'completed', 'cancelled'].includes(plan.lifecycleStatus)) {
    return { ok: false, reason: 'เงื่อนไขที่ตกลงแล้วไม่สามารถถูกแก้ฝ่ายเดียว' }
  }
  const next = { ...plan, ...patch }
  if (!isMaterialChange(plan, next)) return { ok: true, plan }
  const version = plan.planVersion + 1
  const updated: GrowthPlan = {
    ...next,
    planVersion: version,
    changeLog: [...plan.changeLog, { version, at: now, summary }],
    consentRecords: plan.consentRecords.map((r) =>
      r.consentStatus === 'accepted' ? { ...r, consentStatus: 'invalidated' } : r,
    ),
  }
  return { ok: true, plan: refreshPlan(updated, now) }
}
