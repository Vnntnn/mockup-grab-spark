import type { FairnessCheck, FairnessReport, GrowthPlan } from './types'

/**
 * Deterministic fairness gate (principles C, D, E, F, H). A plan that fails never reaches the merchant.
 * A condition that cannot be verified is "unresolved" and is never treated as safe.
 */
export function validateGrowthPlan(plan: GrowthPlan): FairnessReport {
  const [selfId] = plan.participatingMerchantIds
  const lines = plan.costTermsByMerchant[selfId]?.lines ?? []
  const checks: FairnessCheck[] = []

  checks.push({
    id: 'no-forced-discount',
    label: 'ไม่บังคับให้ร้านเล็กลดราคา',
    status: plan.discountTerms.requiredFromSmallMerchant ? 'fail' : 'pass',
    detail: plan.discountTerms.requiredFromSmallMerchant ? 'แผนนี้กำหนดให้ลดราคา' : 'ร้านคุณกำหนดราคาเอง',
  })
  checks.push({
    id: 'no-revenue-sharing',
    label: 'ไม่บังคับแบ่งยอดขาย',
    status: plan.revenueSharingTerms.mandatory ? 'fail' : 'pass',
    detail: plan.revenueSharingTerms.mandatory ? 'แผนนี้กำหนดให้แบ่งยอดขาย' : 'ยอดขายเป็นของแต่ละร้าน',
  })

  const unresolved = lines.filter((l) => l.amountBaht === null)
  const undisclosed = lines.filter((l) => l.amountBaht !== null && l.amountBaht > 0 && (!l.trigger || !l.cap))
  checks.push({
    id: 'costs-explained',
    label: 'ค่าใช้จ่ายทุกข้อระบุชัดเจน',
    status: unresolved.length ? 'unresolved' : undisclosed.length ? 'fail' : 'pass',
    detail: unresolved.length
      ? 'มีค่าใช้จ่ายที่ยังไม่ทราบจำนวน จึงยังไม่ถือว่าอนุมัติ'
      : undisclosed.length
        ? 'มีค่าใช้จ่ายที่ไม่ระบุเงื่อนไขการจ่ายหรือเพดาน'
        : 'ไม่มีค่าใช้จ่ายที่ไม่ได้อธิบาย',
  })

  const leaked = plan.dataPermissions.filter((d) => d.sensitivity === 'private' && d.partnerCanSee)
  checks.push({
    id: 'private-data-protected',
    label: 'ข้อมูลส่วนตัวของร้านไม่ถูกเปิดให้ร้านคู่ค้า',
    status: leaked.length ? 'fail' : 'pass',
    detail: leaked.length ? `เปิดข้อมูล: ${leaked.map((l) => l.label).join(', ')}` : 'ต้นทุน กำไร และข้อมูลลูกค้าไม่ถูกแชร์',
  })
  checks.push({
    id: 'renew-consent',
    label: 'เปลี่ยนเงื่อนไขสำคัญต้องขอยืนยันใหม่',
    status: plan.safeguards.renewConsentOnMaterialChange ? 'pass' : 'fail',
    detail: 'ระบบล้างการยืนยันเดิมเมื่อเงื่อนไขสำคัญเปลี่ยน',
  })
  checks.push({
    id: 'no-penalty',
    label: 'การปฏิเสธไม่ถูกลงโทษ',
    status: plan.safeguards.noPenaltyForDeclining ? 'pass' : 'fail',
    detail: 'สิทธิการขายตามปกติไม่เปลี่ยนเมื่อปฏิเสธ',
  })

  const status = checks.some((c) => c.status === 'fail')
    ? 'failed'
    : checks.some((c) => c.status === 'unresolved')
      ? 'unresolved'
      : 'passed'
  return { status, checks }
}

/** The only door to a merchant's data for the partner. Unknown fields and private fields are denied. */
export function canPartnerAccess(plan: GrowthPlan, permissionId: string): boolean {
  const p = plan.dataPermissions.find((d) => d.id === permissionId)
  return !!p && p.sensitivity === 'shared' && p.partnerCanSee
}
