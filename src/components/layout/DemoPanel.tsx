import { FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { StatusBadge } from '@/components/status/StatusBadge'
import { ResetButton } from './ResetButton'
import { useApp } from '@/app/store'
import { demoTargets, headlinePlan, partnerOf } from '@/app/selectors'

/** Presenter-only controls. Kept in a closed drawer so the merchant UI stays simple. */
export function DemoPanel() {
  const { state, dispatch } = useApp()
  const head = headlinePlan(state)
  const { partner: partnerTarget, change: changeTarget, complete: activeTarget } = demoTargets(state)
  const row = (
    label: string,
    enabled: boolean,
    why: string,
    run: () => boolean,
    done: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        className="h-11 justify-start px-4 text-[15px]"
        disabled={!enabled}
        onClick={() => {
          if (run()) toast.info(done)
          else toast.error('ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน')
        }}
      >
        {label}
      </Button>
      {!enabled && <p className="text-sm text-muted-foreground">{why}</p>}
    </div>
  )
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed right-4 bottom-[88px] z-40 h-12 rounded-full bg-forest px-5 text-[15px] shadow-lg hover:bg-forest/90 md:bottom-6"
          aria-label="เปิดเครื่องมือสาธิต"
        >
          <FlaskConical data-icon="inline-start" />
          เครื่องมือสาธิต
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-5">
        <SheetHeader className="p-0">
          <SheetTitle className="text-xl font-semibold text-forest">เครื่องมือสาธิต</SheetTitle>
          <SheetDescription className="text-[15px]">
            สำหรับผู้นำเสนอเท่านั้น ใช้จำลองสิ่งที่ฝั่งร้านคู่ค้าและเวลาจะทำ ไม่ใช่ฟังก์ชันของร้านจริง
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5">
          {head && (
            <div className="rounded-xl bg-sage p-3">
              <p className="mb-2 text-sm text-muted-foreground">แผนที่กำลังสาธิต: {partnerOf(state, head).name}</p>
              <StatusBadge status={head.lifecycleStatus} />
            </div>
          )}
          {row(
            'จำลองการยืนยันจากร้านคู่ค้า',
            !!partnerTarget,
            'ใช้ได้เมื่อแผนที่กำลังสาธิตยังรอร้านคู่ค้ายืนยัน',
            () => dispatch({ type: 'demoPartnerConsent', planId: partnerTarget!.id }),
            'ร้านคู่ค้ายืนยันเงื่อนไขแล้ว (จำลอง)',
          )}
          {row(
            'จำลองร้านคู่ค้าขอเปลี่ยนเงื่อนไข',
            !!changeTarget,
            'ใช้ได้ก่อนแคมเปญเริ่ม — แคมเปญที่เริ่มแล้วถูกแก้ฝ่ายเดียวไม่ได้',
            () => dispatch({ type: 'demoChangeTerms', planId: changeTarget!.id }),
            'เงื่อนไขเปลี่ยนเป็นฉบับใหม่ การยืนยันเดิมถูกล้าง (จำลอง)',
          )}
          {row(
            'จำลองการจบแคมเปญ',
            !!activeTarget,
            'ใช้ได้เมื่อแคมเปญกำลังดำเนินการ (เริ่มได้ที่หน้า "แคมเปญ")',
            () => dispatch({ type: 'demoComplete', planId: activeTarget!.id }),
            'แคมเปญจบแล้ว (จำลอง) ดูผลที่หน้า "ผลลัพธ์"',
          )}
          <ResetButton />
          <p className="text-sm text-muted-foreground">การกด "เริ่มแคมเปญ" เป็นการตัดสินใจของร้านคุณ ทำได้ที่หน้า "แคมเปญ" หลังทั้งสองร้านยืนยัน</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
