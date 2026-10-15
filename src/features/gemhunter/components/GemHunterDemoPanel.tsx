import { useState } from 'react'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { apply, type Action } from '../domain'
import { useGemHunter } from '../store'
import { PhaseBadge } from './PhaseBadge'
import { useHunterAction } from './useHunterAction'

/** Why a sim action is unavailable right now, in plain Thai. */
function whyNot(action: Action, state: ReturnType<typeof useGemHunter>['state']): string | null {
  const r = apply(state, action)
  if (r.ok) return null
  if (r.code === 'wrong_phase') return 'ใช้ได้เมื่อแคมเปญเริ่มแล้ว (ตรวจชื่อเมนูครบและกด "เริ่มแคมเปญ") และยังไม่ถึงขั้นเปิด GemBond'
  return r.reason
}

/** Presenter-only controls, kept in a closed drawer and labelled as simulation. Never part of the merchant's product UI. */
export function GemHunterDemoPanel() {
  const { state, dispatch } = useGemHunter()
  const run = useHunterAction()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const seed: Action = { type: 'demoSeedSubmissions' }
  const moderate: Action = { type: 'demoModeratePending' }

  const sim = (label: string, action: Action, done: string) => {
    const why = whyNot(action, state)
    return (
      <div className="flex flex-col gap-1.5">
        <Button variant="outline" className="h-11 justify-start px-4 text-[15px]" disabled={why !== null} aria-describedby={why ? `why-${action.type}` : undefined} onClick={() => run(action, done)}>
          {label}
        </Button>
        {why && (
          <p id={`why-${action.type}`} className="text-[14px] text-muted-foreground">
            {why}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-11 shrink-0 gap-2 px-3 text-[15px] sm:px-4" aria-label="เปิดเครื่องมือสาธิต GemHunter">
            <FlaskConical className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">เครื่องมือสาธิต</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto p-5">
          <SheetHeader className="p-0 pr-10">
            <SheetTitle className="text-xl font-bold">เครื่องมือสาธิต GemHunter</SheetTitle>
            <SheetDescription className="text-[15px]">สำหรับผู้นำเสนอเท่านั้น ใช้จำลองสิ่งที่ลูกค้าและผู้ตรวจสอบจะทำ ไม่ใช่ฟังก์ชันของร้านจริง</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6">
            <p className="flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
              สถานะตอนนี้ <PhaseBadge phase={state.campaign.phase} />
            </p>

            <section aria-labelledby="gh-sim" className="flex flex-col gap-3">
              <h3 id="gh-sim" className="text-[17px] font-bold">
                จำลองเหตุการณ์
              </h3>
              {sim('จำลองลูกค้าส่งรีวิว 10 รายการ', seed, 'เพิ่มรีวิวตัวอย่าง 10 รายการ ตอนนี้ยังรอตรวจสอบ (จำลอง)')}
              {sim('จำลองตรวจสอบรีวิวที่รออยู่', moderate, 'ตรวจสอบรีวิวที่รออยู่แล้ว (จำลอง) รีวิวที่ผ่านจึงนับในผลลัพธ์')}
              <p className="text-[14px] text-muted-foreground">รีวิวและรูปไม่ได้มาจากลูกค้าจริง และไม่ได้ตรวจสอบการซื้อจริง</p>
            </section>

            <div className="flex flex-col gap-2 border-t pt-5">
              <Button variant="outline" className="h-11 justify-start px-4 text-[15px]" onClick={() => setConfirmReset(true)}>
                <RotateCcw data-icon="inline-start" />
                รีเซ็ตเดโม GemHunter
              </Button>
              <Button asChild variant="ghost" className="h-11 justify-start px-4 text-[15px]">
                <Link to="/dashboard">กลับไปต้นแบบ GemBond</Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตเดโม GemHunter</DialogTitle>
            <DialogDescription>
              ข้อมูลที่ลองทำไว้ (การเลือกชื่อเมนู รีวิว รูป) จะกลับเป็นค่าเริ่มต้น ข้อมูลของ GemBond จะไม่ถูกเปลี่ยน และไม่มีข้อมูลจริงถูกลบ
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11 text-[15px]" onClick={() => setConfirmReset(false)}>
              ไม่รีเซ็ต
            </Button>
            <Button
              className="h-11 text-[15px]"
              onClick={() => {
                dispatch({ type: 'reset' })
                setConfirmReset(false)
                setOpen(false)
                navigate('/gemhunter')
                toast.success('รีเซ็ตเดโม GemHunter แล้ว')
              }}
            >
              รีเซ็ตเดโม GemHunter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
