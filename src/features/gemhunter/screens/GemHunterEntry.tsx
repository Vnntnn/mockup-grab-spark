import { useState } from 'react'
import { ArrowRight, Check, CircleX, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { INCENTIVE_NOTE } from '../components/copy'
import { Disclose, EmptyNote, H2 } from '../components/ghui'
import { PhaseBadge } from '../components/PhaseBadge'
import { continuePath } from '../components/phase'
import { PhotoTile } from '../components/hunter/PhotoTile'
import { useHunterAction } from '../components/useHunterAction'
import { merchantOf } from '../data/seed'
import { eligibilityChecks, isTerminal } from '../domain'
import { useGemHunter } from '../store'

const RIGHTS = [
  'คุณเป็นผู้กำหนดราคาและเมนูของตัวเอง',
  'ชื่อเมนูใหม่จะขึ้นหน้าร้านก็ต่อเมื่อคุณอนุมัติเท่านั้น',
  'รูปและรีวิวจะแสดงเฉพาะที่ผ่านการตรวจสอบและคุณอนุมัติแล้ว',
  'คุณพักหรือยกเลิกแคมเปญได้ทุกเมื่อ',
  'การไม่เข้าร่วมหรือยกเลิกจะไม่ลดสิทธิการขายตามปกติของร้านคุณ',
  'ถ้าผ่านเกณฑ์ คุณเลือกเปิด GemBond ต่อได้เอง ระบบไม่เริ่มให้อัตโนมัติ',
]

const cta = 'h-14 px-5 text-[17px] sm:px-7'

export function GemHunterEntry() {
  const { state } = useGemHunter()
  const { campaign } = state
  const run = useHunterAction()
  const navigate = useNavigate()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const merchant = merchantOf(campaign.merchantId)
  if (!merchant) {
    return (
      <EmptyNote Icon={Info}>ไม่พบข้อมูลร้านตัวอย่าง ลองรีเซ็ตเดโมจากเครื่องมือสาธิต</EmptyNote>
    )
  }

  const checks = eligibilityChecks(merchant)
  const eligible = checks.every((c) => c.passed)
  const { voucher } = campaign.mission
  const { phase } = campaign
  const menuCount = campaign.menuAudit.items.length
  const invited = phase === 'eligibility_check'

  const headline = invited
    ? 'ร้านคุณได้รับเชิญเข้าร่วม GemHunter'
    : phase === 'paused'
      ? 'คุณพักแคมเปญไว้'
      : phase === 'cancelled'
        ? 'แคมเปญนี้ยกเลิกแล้ว'
        : phase === 'completed'
          ? 'แคมเปญ GemHunter เสร็จสิ้นแล้ว'
          : 'แคมเปญ GemHunter กำลังดำเนินอยู่'

  const lead = invited
    ? 'ลูกค้าในย่านลองสั่งอาหารจากร้านคุณ แล้วส่งรูปและรีวิวมาให้ ไม่รับประกันว่าจะมีลูกค้าเพิ่ม'
    : phase === 'paused'
      ? 'ร้านของคุณขายตามปกติ กลับมาทำต่อเมื่อพร้อมได้'
      : phase === 'cancelled'
        ? 'ร้านของคุณขายตามปกติ ในต้นแบบนี้ ผู้นำเสนอเริ่มใหม่ได้จาก “เครื่องมือสาธิต”'
        : phase === 'completed'
          ? 'ดูสรุปได้ที่หน้าผลลัพธ์'
          : 'ทำต่อจากขั้นตอนล่าสุดได้เลย'

  const actions = () => {
    if (invited) {
      return (
        <div className="flex flex-wrap gap-3">
          <Button
            className={`${cta} flex-1 sm:flex-none`}
            disabled={!eligible}
            onClick={() => {
              if (run({ type: 'startMenuReview' })) navigate('/gemhunter/menu')
            }}
          >
            เริ่มตรวจเมนู
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            className={cta}
            onClick={() => {
              if (run({ type: 'pause' })) toast.info('ไม่เป็นไร ร้านของคุณขายตามปกติ และไม่มีผลต่อสิทธิการขาย กลับมาเข้าร่วมเมื่อไรก็ได้')
            }}
          >
            ยังไม่เข้าร่วม
          </Button>
        </div>
      )
    }
    if (phase === 'paused') {
      return (
        <div className="flex flex-wrap gap-3">
          <Button className={`${cta} flex-1 sm:flex-none`} onClick={() => run({ type: 'resume' }, 'กลับมาทำต่อแล้ว')}>
            กลับมาเข้าร่วมต่อ
          </Button>
          <Button variant="outline" className={cta} onClick={() => setConfirmCancel(true)}>
            ยกเลิกแคมเปญ
          </Button>
        </div>
      )
    }
    if (phase === 'cancelled') return null
    return (
      <div className="flex flex-wrap gap-3">
        <Button className={`${cta} flex-1 sm:flex-none`} onClick={() => navigate(continuePath(phase))}>
          {phase === 'completed' ? 'ดูผลลัพธ์' : 'ทำต่อ'}
          <ArrowRight data-icon="inline-end" />
        </Button>
        {!isTerminal(phase) && (
          <Button
            variant="outline"
            className={cta}
            onClick={() => {
              if (run({ type: 'pause' })) toast.info('พักแคมเปญไว้แล้ว ร้านของคุณขายตามปกติ')
            }}
          >
            พักแคมเปญไว้
          </Button>
        )}
      </div>
    )
  }

  const checkList = (
    <ul className="flex flex-col gap-2">
      {checks.map((c) => (
        <li key={c.id} className="flex items-start gap-3 text-[17px]">
          {c.passed ? <Check className="mt-1 size-5 shrink-0 text-link" strokeWidth={3} aria-hidden="true" /> : <CircleX className="mt-1 size-5 shrink-0 text-destructive" aria-hidden="true" />}
          <span>
            {c.label} <span className="text-muted-foreground">({c.passed ? 'ผ่าน' : 'ยังไม่ผ่าน'}) {c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <div className="gh-invite">
        <div data-area="head">
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight">{headline}</h1>
          <p className="mt-3 max-w-[44ch] text-[17px] leading-relaxed text-muted-foreground">{lead}</p>
          {!invited && (
            <p className="mt-3">
              <PhaseBadge phase={phase} />
            </p>
          )}
        </div>

        <div data-area="pic" className="grid grid-cols-2 content-start gap-3">
          <PhotoTile hue={47} label="จานอาหารถ่ายจากด้านบน" dish="หมูสะเต๊ะ 10 ไม้" className="col-span-2 rounded-2xl shadow-(--shadow-raise)" imageClassName="aspect-[16/9] md:aspect-[4/3]" />
          <PhotoTile hue={94} label="ภาพใกล้ของอาหาร" dish="ไก่ย่างสมุนไพร" className="rounded-2xl shadow-(--shadow-raise)" imageClassName="aspect-[4/3]" />
          <PhotoTile hue={141} label="อาหารพร้อมน้ำจิ้มและเครื่องเคียง" dish="ปีกไก่ทอดน้ำปลา" className="rounded-2xl shadow-(--shadow-raise)" imageClassName="aspect-[4/3]" />
        </div>

        <div data-area="cost" className="flex flex-col gap-3">
          <section aria-labelledby="cost-h" className="surface p-5 md:p-6">
            <h2 id="cost-h" className="flex flex-wrap items-baseline gap-x-3 leading-none">
              <span className="text-[17px] font-semibold">ร้านคุณจ่าย</span>
              <span className="figure text-[36px] leading-none">0 บาท</span>
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">ตามสมมติฐานของแคมเปญตัวอย่างนี้</p>

            <ul className="mt-4 flex flex-col gap-2 border-t pt-4 text-[17px] leading-snug font-medium">
              {['ไม่ต้องลดราคา', 'ไม่ต้องแจกอาหารฟรี', 'ไม่ต้องซื้อโฆษณา'].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-link" strokeWidth={3} aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2 border-t pt-4 text-[15px] leading-snug">
              <p>
                คูปองให้ลูกค้า {voucher.valueRangeBaht.min}–{voucher.valueRangeBaht.max} บาท <strong className="font-semibold">แพลตฟอร์มเป็นผู้ออกให้</strong>
              </p>
              <p className="text-muted-foreground">ค่าธรรมเนียมการขายตามปกติ ยังเป็นไปตามเงื่อนไขเดิม</p>
            </div>
          </section>

          {invited && (
            <p className="text-[15px] leading-snug text-muted-foreground">ยังไม่มีอะไรขึ้นหน้าร้านจนกว่าคุณอนุมัติ และไม่เข้าร่วมก็ขายตามปกติ</p>
          )}
        </div>

        <div data-area="cta" className="gh-cta flex flex-col gap-3">
          {!eligible && (
            <p className="flex items-start gap-2 font-medium" role="status">
              <CircleX className="mt-1 size-5 shrink-0" aria-hidden="true" />
              ร้านยังไม่ผ่านคุณสมบัติบางข้อ จึงเริ่มตรวจเมนูไม่ได้ในตอนนี้
            </p>
          )}
          {actions()}
        </div>

        {invited && (
          <section data-area="path" aria-labelledby="do-h" className="border-t pt-8">
            <H2 id="do-h" className="mb-5">
              สิ่งที่คุณทำ
            </H2>
            <ol className="grid gap-4 sm:grid-cols-3 sm:gap-8">
              {[`เลือกชื่อเมนู ${menuCount} รายการ`, 'ขายตามปกติ', 'เลือกรูปจากลูกค้า'].map((t, i) => (
                <li key={t} className="flex items-baseline gap-3 sm:flex-col sm:gap-1">
                  <span className="figure text-[30px] leading-none" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="text-[17px] leading-snug font-semibold">
                    <span className="sr-only">ขั้นที่ {i + 1}: </span>
                    {t}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div data-area="more" className="flex flex-col gap-2 border-t pt-3">
          {!eligible && (
            <section aria-label="คุณสมบัติร้านที่ยังไม่ผ่าน" className="mb-2">
              {checkList}
            </section>
          )}
          <Disclose
            label="สิทธิของร้านคุณ"
            meta={<span className="text-[15px] font-medium text-muted-foreground tabular-nums">{RIGHTS.length} ข้อ</span>}
          >
            <div className="flex flex-col gap-6 pt-2 pb-3 md:grid md:grid-cols-2 md:gap-12">
              <ul className="flex flex-col gap-3">
                {RIGHTS.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[17px] leading-snug">
                    <Check className="mt-0.5 size-5 shrink-0 text-link" strokeWidth={3} aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-5">
                <p className="text-[14px] leading-relaxed text-muted-foreground">{INCENTIVE_NOTE}</p>
                {eligible && (
                  <div>
                    <p className="mb-2 text-[17px] font-semibold">ร้านคุณผ่านคุณสมบัติร่วมแคมเปญครบ {checks.length} ข้อ</p>
                    {checkList}
                  </div>
                )}
              </div>
            </div>
          </Disclose>
        </div>
      </div>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยกเลิกแคมเปญ GemHunter</DialogTitle>
            <DialogDescription>
              แคมเปญนี้จะหยุดถาวรในต้นแบบนี้ ร้านของคุณยังขายตามปกติและสิทธิการขายไม่ลดลง เพราะการยกเลิกเกิดกับแคมเปญนี้เท่านั้น
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11 text-[15px]" onClick={() => setConfirmCancel(false)}>
              ยังไม่ยกเลิก
            </Button>
            <Button
              variant="destructive"
              className="h-11 text-[15px]"
              onClick={() => {
                if (run({ type: 'cancel' })) toast.info('ยกเลิกแคมเปญแล้ว ร้านของคุณขายตามปกติ')
                setConfirmCancel(false)
              }}
            >
              ยืนยันยกเลิกแคมเปญ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
