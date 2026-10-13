import { hasValidConsent, refreshPlan, type PlanResult } from './plans'
import type { GrowthPlan, MerchantId } from './types'

export interface ConsentValidation {
  ok: boolean
  missing: MerchantId[]
  staleVersion: MerchantId[]
}

/** Every participant must have accepted the same, current terms version. */
export function validateConsent(plan: GrowthPlan): ConsentValidation {
  const missing: MerchantId[] = []
  const staleVersion: MerchantId[] = []
  for (const id of plan.participatingMerchantIds) {
    if (hasValidConsent(plan, id)) continue
    const r = plan.consentRecords.find((c) => c.merchantId === id)
    if (r && r.consentStatus === 'accepted' && r.termsVersion !== plan.planVersion) staleVersion.push(id)
    else missing.push(id)
  }
  return { ok: !missing.length && !staleVersion.length, missing, staleVersion }
}

const open = (plan: GrowthPlan) => ['awaiting', 'interested', 'ready'].includes(plan.lifecycleStatus)

/** One merchant's consent only ever touches that merchant's own record. */
export function acceptPlan(plan: GrowthPlan, merchantId: MerchantId, acks: string[], now: string): PlanResult {
  if (!plan.participatingMerchantIds.includes(merchantId)) return { ok: false, reason: 'ร้านนี้ไม่ได้อยู่ในแผน' }
  if (!open(plan)) return { ok: false, reason: 'แผนนี้ไม่เปิดให้ยืนยันแล้ว' }
  if (plan.fairnessCheckStatus !== 'passed') return { ok: false, reason: 'แผนยังไม่ผ่านการตรวจความเป็นธรรม' }
  const consentRecords = plan.consentRecords.map((r) =>
    r.merchantId === merchantId
      ? { ...r, termsVersion: plan.planVersion, consentStatus: 'accepted' as const, timestamp: now, relevantDisclosureAcknowledgements: acks }
      : r,
  )
  return { ok: true, plan: refreshPlan({ ...plan, consentRecords }, now) }
}

/** Declining touches only this plan's consent. It never changes selling rights. */
export function declinePlan(plan: GrowthPlan, merchantId: MerchantId, now: string): PlanResult {
  if (!open(plan)) return { ok: false, reason: 'แผนนี้เริ่มไปแล้ว ใช้การยกเลิกแทน' }
  const consentRecords = plan.consentRecords.map((r) =>
    r.merchantId === merchantId
      ? { ...r, consentStatus: 'declined' as const, timestamp: now, relevantDisclosureAcknowledgements: [] }
      : r,
  )
  return { ok: true, plan: refreshPlan({ ...plan, consentRecords }, now) }
}

/** Merchant changes their mind after declining. */
export function reopenPlan(plan: GrowthPlan, merchantId: MerchantId, now: string): PlanResult {
  const r = plan.consentRecords.find((c) => c.merchantId === merchantId)
  if (!r || r.consentStatus !== 'declined') return { ok: false, reason: 'แผนนี้ไม่ได้ถูกปฏิเสธ' }
  const consentRecords = plan.consentRecords.map((c) =>
    c.merchantId === merchantId ? { ...c, consentStatus: 'pending' as const, timestamp: null } : c,
  )
  return { ok: true, plan: refreshPlan({ ...plan, consentRecords }, now) }
}
