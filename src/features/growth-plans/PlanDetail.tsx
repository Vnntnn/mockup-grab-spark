import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Ban, CalendarDays, Check, Eye, EyeOff, Split, Tag, Wallet } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BondPair } from '@/components/BondPair'
import { DocSection } from '@/components/DocSection'
import { Gem, GemMark } from '@/components/GemMark'
import { Ledger, LedgerRow } from '@/components/Ledger'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Fact, JourneyTrack } from '@/components/visual'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { StickyDecisionDock } from './StickyDecisionDock'
import { ConsentDialog } from './ConsentDialog'
import { useApp } from '@/app/store'
import { partnerOf, selfOf } from '@/app/selectors'
import { consentOf, hasValidConsent, totalCommitmentBaht } from '@/domain/plans'
import { canPartnerAccess, validateGrowthPlan } from '@/domain/fairness'
import { baht, initial } from '@/lib/format'
import { fmtFull } from '@/lib/dates'

/** The six rights every plan states before the owner is asked anything. */
const RIGHTS = [
  'คุณเป็นผู้กำหนดราคาและเมนูของตัวเอง',
  'คุณไม่จำเป็นต้องแบ่งยอดขายให้ร้านคู่ค้า',
  'คุณสามารถปฏิเสธแผนนี้ได้',
  'การปฏิเสธจะไม่ลดสิทธิการขายตามปกติของคุณ',
  'หากมีการเปลี่ยนเงื่อนไขสำคัญ ระบบจะขอความยินยอมใหม่',
  'ร้านคู่ค้าไม่สามารถเห็นข้อมูลส่วนตัวทางธุรกิจที่ไม่เกี่ยวข้อง',
]

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export function PlanDetail() {
  const { planId } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [consentOpen, setConsentOpen] = useState(false)
  // the terms version on screen when the dialog opened; consent is refused if the terms changed before confirming
  const [reviewedVersion, setReviewedVersion] = useState<number | null>(null)
  const plan = planId ? state.plans[planId] : undefined

  if (!plan) {
    return (
      <>
        <PageHeader title="ไม่พบแผนนี้" />
        <Empty className="surface">
          <EmptyHeader>
            <EmptyDescription className="text-[17px]">ลิงก์อาจไม่ถูกต้อง หรือข้อมูลตัวอย่างถูกรีเซ็ตแล้ว</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link to="/plans">กลับไปแผนของฉัน</Link>
          </Button>
        </Empty>
      </>
    )
  }

  const me = selfOf(state)
  const partner = partnerOf(state, plan)
  const myCost = plan.costTermsByMerchant[me.id]
  const total = totalCommitmentBaht(plan, me.id)
  const fairness = validateGrowthPlan(plan)
  const st = plan.lifecycleStatus
  const myConsent = consentOf(plan, me.id)
  const isSelfAccepted = myConsent?.consentStatus === 'accepted'
  const stale = myConsent?.consentStatus === 'invalidated'
  const lastChange = plan.changeLog[plan.changeLog.length - 1]
  const partnerPerms = plan.dataPermissions
  const totalText = total === null ? 'ยังไม่ทราบ' : baht(total)
  const waitingForPartner = st === 'interested' || (st === 'awaiting' && isSelfAccepted)
  // the cost lines fold away only when nothing is at stake: every line exactly zero, none unknown, no discount, no revenue share
  const nothingAtStake = total === 0 && myCost.lines.every((l) => l.amountBaht === 0) && !plan.discountTerms.requiredFromSmallMerchant && !plan.revenueSharingTerms.mandatory

  const decline = () => {
    if (!dispatch({ type: 'decline', planId: plan.id })) return toast.error('ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน')
    toast('รับทราบ ไม่เป็นไรเลย ร้านคุณยังขายตามปกติทุกอย่าง')
    navigate('/opportunities')
  }
  const openConsent = () => {
    setReviewedVersion(plan.planVersion)
    setConsentOpen(true)
  }

  const ledger = (
    <Ledger label="รายการค่าใช้จ่ายของร้านคุณ">
      {myCost.lines.map((l) => (
        <LedgerRow
          key={l.id}
          label={l.label}
          hint={
            <>
              {l.trigger}
              {l.amountBaht !== null && l.amountBaht > 0 && l.cap && <span className="block">เพดาน: {l.cap}</span>}
            </>
          }
          value={l.amountBaht === null ? 'ยังไม่ทราบ' : baht(l.amountBaht)}
          tone={l.amountBaht === null ? 'warn' : undefined}
        />
      ))}
      <LedgerRow total label="รวมที่คุณต้องจ่ายเพิ่ม" value={totalText} tone={total === null ? 'warn' : undefined} />
    </Ledger>
  )

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Link to="/plans" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-link hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          แผนของฉัน
        </Link>
        <span className="text-[14px] text-muted-foreground">เงื่อนไขฉบับที่ {plan.planVersion}</span>
      </div>

      <PageHeader title={plan.title} lead={`ร่วมกับ${partner.name}`} />

      <section aria-label="สถานะของแผน" className="surface overflow-hidden">
        <div className="bg-accent px-6 py-5">
          <BondPair plan={plan} self={me} partner={partner} />
        </div>
        <div className="px-6 py-5">
          {st === 'declined' || st === 'cancelled' ? <StatusBadge status={st} /> : <JourneyTrack status={waitingForPartner ? 'interested' : st} />}
          {waitingForPartner && <p className="mt-3 text-[15px] text-muted-foreground">คุณยืนยันเงื่อนไขฉบับที่ {myConsent?.termsVersion} แล้ว แคมเปญยังไม่เริ่ม เพราะ{partner.name}ต้องยืนยันฉบับเดียวกันด้วย</p>}
          {st === 'cancelled' && <p className="mt-3 text-[15px] text-muted-foreground">ไม่มีค่าปรับ และไม่มีผลต่อสิทธิการขายตามปกติของร้านคุณ</p>}
          {st === 'declined' && <p className="mt-3 text-[15px] text-muted-foreground">ร้านคุณยังขายตามปกติทุกอย่าง เปลี่ยนใจกลับมาดูได้เสมอ</p>}
        </div>
      </section>

      {stale && (
        <div role="alert" className="mt-4 flex gap-3 rounded-xl bg-warn-soft p-4 text-ink">
          <AlertTriangle className="mt-1 size-5 shrink-0 text-warn" aria-hidden="true" />
          <div>
            <p className="font-bold">เงื่อนไขเปลี่ยนเป็นฉบับที่ {plan.planVersion}</p>
            <p className="text-[15px]">{lastChange.summary} การยืนยันฉบับเดิมถูกล้างแล้ว โปรดอ่านและยืนยันใหม่ ถ้ายังไม่พร้อมก็ไม่เป็นไร</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <p className="max-w-[60ch] text-[18px]">{plan.summary}</p>

          <DocSection id="cost" title="ค่าใช้จ่ายของร้านคุณ" className="mt-8 border-0 pt-0">
            <div className="surface px-5 py-5 md:px-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                <Fact icon={Wallet} label="จ่ายเพิ่ม" value={totalText} tone={total === null || total > 0 ? 'warn' : undefined} />
                <Fact icon={Tag} label="ส่วนลดที่ต้องให้" value={plan.discountTerms.requiredFromSmallMerchant ? 'มี' : 'ไม่มี'} tone={plan.discountTerms.requiredFromSmallMerchant ? 'warn' : undefined} />
                <Fact icon={Split} label="แบ่งยอดขาย" value={plan.revenueSharingTerms.mandatory ? 'ต้องแบ่ง' : 'ไม่ต้อง'} tone={plan.revenueSharingTerms.mandatory ? 'warn' : undefined} />
                <Fact icon={CalendarDays} label="ระยะเวลา" value={`${plan.durationDays} วัน`} />
              </dl>
              {nothingAtStake ? (
                <details className="mt-4 border-t border-border pt-1">
                  <summary className="flex min-h-11 cursor-pointer items-center font-medium text-link">ดูรายการค่าใช้จ่ายทั้งหมด ({myCost.lines.length} รายการ)</summary>
                  <div className="pb-1">{ledger}</div>
                </details>
              ) : (
                <div className="mt-4 border-t border-border pt-3">{ledger}</div>
              )}
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-muted-foreground">
              เป็นข้อสมมุติของแผนตัวอย่างเพื่อสาธิต ไม่ใช่การรับประกันสำหรับแคมเปญจริง หากแคมเปญจริงมีค่าใช้จ่าย จะระบุจำนวน วิธีคำนวณ เพดาน และเวลาที่จ่ายก่อนขอยืนยันเสมอ {myCost.outsideScopeNote}
            </p>
          </DocSection>

          <DocSection id="rights" title="สิทธิของร้านคุณ">
            <ul className="flex flex-col gap-2">
              {RIGHTS.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1.5 size-4 shrink-0 text-link" strokeWidth={3} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </DocSection>

          <DocSection id="roles" title="ใครทำอะไรบ้าง">
            <div className="flex flex-col gap-6">
              {[
                { key: 'me', mark: <Gem glyph={initial(me.name)} tone="self" className="size-6 shrink-0" />, name: 'ร้านคุณ', items: plan.responsibilitiesByMerchant[me.id] },
                { key: 'partner', mark: <Gem glyph={initial(partner.name)} tone="partner" className="size-6 shrink-0" />, name: partner.name, items: plan.responsibilitiesByMerchant[partner.id] },
                { key: 'gb', mark: <GemMark className="size-6 shrink-0" />, name: 'GemBond', items: plan.gembondResponsibilities },
              ].map((r) => (
                <div key={r.key}>
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-ink">{r.mark}{r.name}</h3>
                  <Bullets items={r.items} />
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="data" title={`ข้อมูลที่${partner.name}เห็น`}>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-ink"><Eye className="size-5 text-link" aria-hidden="true" />เห็นได้เฉพาะ</h3>
                <Bullets items={partnerPerms.filter((d) => canPartnerAccess(plan, d.id)).map((d) => d.label)} />
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold text-ink"><EyeOff className="size-5 text-muted-foreground" aria-hidden="true" />ไม่สามารถเห็น</h3>
                <Bullets items={partnerPerms.filter((d) => !canPartnerAccess(plan, d.id)).map((d) => d.label)} />
              </div>
            </div>
          </DocSection>

          <DocSection id="term" title="ระยะเวลาและการยกเลิก">
            <p className="mb-3">{plan.durationDays} วัน นับจากวันที่ทั้งสองร้านยืนยันและคุณกดเริ่มแคมเปญ</p>
            <Bullets items={plan.cancellationTerms} />
          </DocSection>

          <Accordion type="single" collapsible className="mt-12 border-y border-border">
            <AccordionItem value="more" className="border-0">
              <AccordionTrigger className="min-h-12 text-[16px] font-semibold hover:no-underline">วิธีวัดผล ผลตรวจความเป็นธรรม และประวัติเงื่อนไข</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-6 text-[16px]">
                <div>
                  <p className="mb-2 font-bold text-ink">วัดผลเมื่อจบแคมเปญ</p>
                  <p className="max-w-[64ch]">
                    เทียบยอดสั่งซื้อช่วงแคมเปญกับช่วงก่อนหน้า และกับร้านใกล้เคียงที่ไม่ได้ร่วมแคมเปญ นับออเดอร์ที่มาจากลิงก์แนะนำแยกไว้ แสดงค่าใช้จ่ายควบคู่
                    เพราะยอดขายที่เพิ่มไม่ได้แปลว่ากำไรเพิ่มเสมอ ผลที่เห็นอาจไม่ได้เกิดจากแคมเปญทั้งหมด เราจะบอกข้อจำกัดทุกครั้ง
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-bold text-ink">ระบบตรวจความเป็นธรรมให้แล้ว</p>
                  <ul className="flex flex-col gap-2">
                    {fairness.checks.map((c) => (
                      <li key={c.id} className="flex items-start gap-3">
                        {c.status === 'pass' ? <Check className="mt-1.5 size-4 shrink-0 text-link" strokeWidth={3} aria-hidden="true" /> : <Ban className="mt-1.5 size-4 shrink-0 text-destructive" aria-hidden="true" />}
                        <span>{c.label} <span className="text-muted-foreground">— {c.status === 'pass' ? 'ผ่าน' : c.status === 'fail' ? 'ไม่ผ่าน' : 'ยังตรวจไม่ได้'}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-bold text-ink">การยืนยันของแต่ละร้าน (แยกอิสระ)</p>
                  <ul className="flex flex-col gap-1.5">
                    {plan.consentRecords.map((r) => {
                      const name = r.merchantId === me.id ? 'ร้านคุณ' : partner.name
                      const label = { pending: 'ยังไม่ยืนยัน', accepted: 'ยืนยันแล้ว', declined: 'เลือกยังไม่เข้าร่วม', invalidated: 'ถูกล้างเพราะเงื่อนไขเปลี่ยน' }[r.consentStatus]
                      return (
                        <li key={r.merchantId}>
                          {name}: {label}
                          {r.consentStatus === 'accepted' && ` (ฉบับที่ ${r.termsVersion}${r.timestamp ? ` · ${fmtFull(r.timestamp)}` : ''})`}
                          {r.merchantId !== me.id && r.consentStatus === 'accepted' && hasValidConsent(plan, r.merchantId) && ' · ข้อมูลจากการจำลอง'}
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-bold text-ink">ประวัติเงื่อนไข</p>
                  <ul className="flex flex-col gap-1.5 text-muted-foreground">{plan.changeLog.map((c) => <li key={c.version}>ฉบับที่ {c.version} · {fmtFull(c.at)} · {c.summary}</li>)}</ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {/* room so the fixed phone bar never covers the last lines */}
          <div className="h-36 lg:hidden" aria-hidden="true" />
        </div>

        <StickyDecisionDock
          plan={plan}
          isSelfAccepted={isSelfAccepted}
          fairnessPassed={fairness.status === 'passed'}
          totalBaht={total}
          onOpenConsent={openConsent}
          onDecline={decline}
          onReopen={() => {
            if (dispatch({ type: 'reopen', planId: plan.id })) toast('นำแผนกลับมาแล้ว ดูและตัดสินใจได้เมื่อพร้อม')
          }}
        />
      </div>

      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        plan={plan}
        partnerName={partner.name}
        onConfirm={(acks) => {
          setConsentOpen(false)
          const version = reviewedVersion ?? plan.planVersion
          if (dispatch({ type: 'accept', planId: plan.id, acks, reviewedVersion: version })) toast.success('บันทึกความสนใจของร้านคุณแล้ว รอร้านคู่ค้ายืนยัน')
          else if (version !== plan.planVersion) toast.error('เงื่อนไขเปลี่ยนไปแล้ว กรุณาอ่านฉบับล่าสุดก่อนยืนยัน')
          else toast.error('ยืนยันไม่ได้ในสถานะปัจจุบัน')
        }}
      />
    </>
  )
}
