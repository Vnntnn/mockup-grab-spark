import { Link } from 'react-router-dom'
import { ArrowRight, Smartphone, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { APPROVED_SAMPLE_PAIR, DEFAULT_CAMPAIGN_ID } from '@/features/customer-pairing/data'

const SAMPLE_RESULT = `/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=${APPROVED_SAMPLE_PAIR.dishASlug}&dishB=${APPROVED_SAMPLE_PAIR.dishBSlug}&sample=true`

/** Demo-tools shortcut to the customer side, so a presenter can show it without going through the merchant steps. */
export function DemoCustomerLinks() {
  return (
    <section aria-labelledby="demo-customer-side" className="flex flex-col gap-2 border-y border-border py-4">
      <h3 id="demo-customer-side" className="flex items-center gap-2 text-[17px] font-bold">
        <Smartphone className="size-5 text-link" aria-hidden="true" />
        ฝั่งลูกค้า
      </h3>
      <SheetClose asChild>
        <Button asChild className="h-auto min-h-12 justify-start px-4 py-2 text-left text-[15px] whitespace-normal">
          <Link to="/pair">
            <Users data-icon="inline-start" />
            <span>เปิดการเดินทางของลูกค้า GemBond</span>
          </Link>
        </Button>
      </SheetClose>
      <SheetClose asChild>
        <Button asChild variant="outline" className="h-auto min-h-11 justify-start px-4 py-2 text-left text-[15px] whitespace-normal">
          <Link to={SAMPLE_RESULT}>
            <ArrowRight data-icon="inline-start" />
            <span>ดูผลคู่เมนูตัวอย่างทันที</span>
          </Link>
        </Button>
      </SheetClose>
      <p className="text-sm text-muted-foreground">เปิดหน้าที่ลูกค้าใช้เลือกคู่ร้านและจับคู่เมนู ไม่ต้องผ่านขั้นตอนฝั่งร้านค้า</p>
    </section>
  )
}
