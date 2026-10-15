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
          <DialogTitle className="text-[22px]">ยืนยันเงื่อนไขฉบับที่ {plan.planVersion}</DialogTitle>
          <DialogDescription className="text-[15px]">ทวนอีกครั้งก่อนกดยืนยัน คุณยังเปลี่ยนใจได้ภายหลังก่อนแคมเปญเริ่ม</DialogDescription>
        </DialogHeader>

        {/* Clean section without nested card */}
        <div className="my-2 border-y border-border py-4">
          <span className="block text-[14px] text-muted-foreground">ข้อผูกพันทางการเงินของร้านคุณ:</span>
          <p className="text-[30px] font-bold text-ink tabular-nums figure my-1">
            {total === null ? 'ยังไม่ทราบ' : baht(total)}
          </p>
          <ul className="mt-3 space-y-2 text-[15px] text-ink">
            <li className="flex items-center gap-2.5">
              <span className="size-2 shrink-0 rounded-full bg-link" />
              <span>{plan.discountTerms.requiredFromSmallMerchant ? 'ต้องลดราคา' : 'ไม่ต้องลดราคา ร้านคุณกำหนดราคาเอง 100%'}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-2 shrink-0 rounded-full bg-link" />
              <span>{plan.revenueSharingTerms.mandatory ? 'ต้องแบ่งยอดขาย' : 'ไม่ต้องแบ่งยอดขายให้ร้านคู่ค้า'}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-2 shrink-0 rounded-full bg-link" />
              <span>ระยะเวลา {plan.durationDays} วัน ยกเลิกได้ตลอดเวลาโดยไม่มีค่าปรับ</span>
            </li>
          </ul>
        </div>

        {/* Checkbox without redundant card container */}
        <div className="flex items-start gap-3 py-1">
          <Checkbox id="ack" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-1 size-5" />
          <Label htmlFor="ack" className="flex-1 cursor-pointer text-[15px] leading-relaxed font-medium text-ink">
            ฉันอ่านค่าใช้จ่าย ข้อมูลที่ร้านคู่ค้าเห็น และสิทธิการยกเลิกแล้ว
          </Label>
        </div>

        <p className="text-[14px] text-muted-foreground">
          นี่เป็นการยืนยันของร้านคุณเท่านั้น แคมเปญจะยังไม่เริ่มจนกว่า{partnerName}จะยืนยันเงื่อนไขฉบับเดียวกัน
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            กลับไปอ่านต่อ
          </Button>
          <Button
            disabled={!checked}
            onClick={() => { onConfirm([...ACKS]); setChecked(false) }}
          >
            สนใจและยืนยันเงื่อนไข
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
