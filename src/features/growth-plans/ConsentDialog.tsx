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
        <div className="my-1 border-y border-border py-4">
          <span className="block text-[14px] text-muted-foreground">ข้อผูกพันทางการเงินของร้านคุณ:</span>
          <p className="figure my-1 text-[30px] font-bold text-ink tabular-nums">
            {total === null ? 'ยังไม่ทราบ' : baht(total)}
          </p>
          <ul className="mt-3 space-y-2.5 text-[15px] leading-snug text-ink">
            <li className="flex items-start gap-2.5">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-link" />
              <span>{plan.discountTerms.requiredFromSmallMerchant ? 'ต้องลดราคา' : 'ไม่ต้องลดราคา ร้านคุณกำหนดราคาเอง 100%'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-link" />
              <span>{plan.revenueSharingTerms.mandatory ? 'ต้องแบ่งยอดขาย' : 'ไม่ต้องแบ่งยอดขายให้ร้านคู่ค้า'}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-link" />
              <span>ระยะเวลา {plan.durationDays} วัน ยกเลิกได้ตลอดเวลาโดยไม่มีค่าปรับ</span>
            </li>
          </ul>
        </div>

        {/* Accept collaboration terms checkbox with balanced padding and top-aligned checkbox */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3.5">
          <Checkbox id="ack" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5 size-5 shrink-0" />
          <Label htmlFor="ack" className="block flex-1 cursor-pointer text-[15px] leading-snug font-medium text-ink">
            ฉันอ่านค่าใช้จ่าย ข้อมูลที่ร้านคู่ค้าเห็น และสิทธิการยกเลิกแล้ว
          </Label>
        </div>

        <p className="px-0.5 text-[14px] leading-relaxed text-muted-foreground">
          นี่เป็นการยืนยันของร้านคุณเท่านั้น แคมเปญจะยังไม่เริ่มจนกว่า{partnerName}จะยืนยันเงื่อนไขฉบับเดียวกัน
        </p>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <span>กลับไปอ่านต่อ</span>
          </Button>
          <Button
            disabled={!checked}
            onClick={() => { onConfirm([...ACKS]); setChecked(false) }}
          >
            <span>สนใจและยืนยันเงื่อนไข</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
