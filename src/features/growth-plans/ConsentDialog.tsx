import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { totalCommitmentBaht } from '@/domain/plans'
import { baht } from '@/lib/format'
import type { GrowthPlan } from '@/domain/types'

export const ACKS = ['cost', 'data', 'rights'] as const

export function ConsentDialog({ open, onOpenChange, plan, partnerName, onConfirm }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  plan: GrowthPlan
  partnerName: string
  onConfirm: (acks: string[]) => void
}) {
  const [checked, setChecked] = useState(false)
  const total = totalCommitmentBaht(plan, plan.participatingMerchantIds[0])
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setChecked(false) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[20px]">ยืนยันเงื่อนไขฉบับที่ {plan.planVersion}</DialogTitle>
          <DialogDescription className="text-[16px]">ทวนอีกครั้งก่อนกดยืนยัน คุณยังเปลี่ยนใจได้ภายหลังก่อนแคมเปญเริ่ม</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 rounded-xl bg-sage p-4 text-[16px]">
          <li>ค่าใช้จ่ายเพิ่มของร้านคุณ: <strong>{total === null ? 'ยังไม่ทราบ' : baht(total)}</strong> (ข้อสมมุติของแผนตัวอย่าง)</li>
          <li>{plan.discountTerms.requiredFromSmallMerchant ? 'ต้องลดราคา' : 'ไม่ต้องลดราคา ร้านคุณกำหนดราคาเอง'}</li>
          <li>{plan.revenueSharingTerms.mandatory ? 'ต้องแบ่งยอดขาย' : 'ไม่ต้องแบ่งยอดขายให้ร้านคู่ค้า'}</li>
          <li>ระยะเวลา {plan.durationDays} วัน ยกเลิกได้โดยไม่มีค่าปรับ</li>
        </ul>
        <div className="flex items-start gap-3">
          <Checkbox id="ack" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-1 size-6" />
          <Label htmlFor="ack" className="text-[16px] leading-relaxed font-normal">
            ฉันอ่านค่าใช้จ่าย ข้อมูลที่ร้านคู่ค้าเห็น และสิทธิของร้านแล้ว
          </Label>
        </div>
        <p className="text-[15px] text-muted-foreground">
          นี่เป็นการยืนยันของร้านคุณเท่านั้น แคมเปญจะยังไม่เริ่มจนกว่า{partnerName}จะยืนยันเงื่อนไขฉบับเดียวกัน
        </p>
        <DialogFooter>
          <Button variant="outline" className="h-12 text-[16px]" onClick={() => onOpenChange(false)}>
            กลับไปอ่านต่อ
          </Button>
          <Button className="h-12 text-[16px]" disabled={!checked} onClick={() => { onConfirm([...ACKS]); setChecked(false) }}>
            สนใจและยืนยันเงื่อนไข
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
