import type { FairnessCheck, FairnessReport, GrowthPlan } from './types'

/**
 * Deterministic fairness gate (principles C, D, E, F, H). A plan that fails never reaches the merchant.
 * A condition that cannot be verified is "unresolved" and is never treated as safe.
 */
export function validateGrowthPlan(plan: GrowthPlan): FairnessReport {
  const [selfId] = plan.participatingMerchantIds
  const lines = plan.costTermsByMerchant[selfId]?.lines ?? []
  // Every party's cost terms must be present. Absent terms are "cannot verify" (unresolved), never "no cost".
  const missingTerms = plan.participatingMerchantIds.filter((id) => !plan.costTermsByMerchant[id])
  const allLines = plan.participatingMerchantIds.flatMap((id) => plan.costTermsByMerchant[id]?.lines ?? [])
  const checks: FairnessCheck[] = []

  // A discount or revenue share can also be expressed as a cost line charged to the small merchant. That is the same
  // forced obligation under another name, so it is checked here too, however well it is "explained".
  const chargedToSelf = (lineId: string) => lines.some((l) => l.id === lineId && l.payer === 'smallMerchant' && (l.amountBaht ?? 0) > 0)
  const forcedDiscount = plan.discountTerms.requiredFromSmallMerchant || chargedToSelf('discount')
  const forcedShare = plan.revenueSharingTerms.mandatory || chargedToSelf('revshare')

  checks.push({
    id: 'no-forced-discount',
    label: 'ไม่บังคับให้ร้านเล็กลดราคา',
    status: forcedDiscount ? 'fail' : 'pass',
    detail: forcedDiscount ? 'แผนนี้กำหนดให้ลดราคา' : 'ร้านคุณกำหนดราคาเอง',
  })
  checks.push({
    id: 'no-revenue-sharing',
    label: 'ไม่บังคับแบ่งยอดขาย',
    status: forcedShare ? 'fail' : 'pass',
    detail: forcedShare ? 'แผนนี้กำหนดให้แบ่งยอดขาย' : 'ยอดขายเป็นของแต่ละร้าน',
  })

  const unresolved = allLines.filter((l) => l.amountBaht === null)
  const undisclosed = allLines.filter((l) => l.amountBaht !== null && l.amountBaht > 0 && (!l.trigger || !l.cap))
  const unknown = unresolved.length > 0 || missingTerms.length > 0
  checks.push({
    id: 'costs-explained',
    label: 'ค่าใช้จ่ายทุกข้อระบุชัดเจน',
    status: unknown ? 'unresolved' : undisclosed.length ? 'fail' : 'pass',
    detail: unknown
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
