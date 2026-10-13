import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Ban, Check, CircleDollarSign, Eye, EyeOff, Handshake, LifeBuoy, LineChart, ListChecks, Scale, ShieldCheck, Timer, Users } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BondPair } from '@/components/BondPair'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { ConsentDialog } from './ConsentDialog'
import { useApp } from '@/app/store'
import { matching, partnerOf, selfOf } from '@/app/selectors'
import { consentOf, hasValidConsent, totalCommitmentBaht } from '@/domain/plans'
import { canPartnerAccess, validateGrowthPlan } from '@/domain/fairness'
import { baht } from '@/lib/format'
import { fmtFull } from '@/lib/dates'
import { cn } from '@/lib/utils'

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
    <ul className="flex flex-col gap-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3">
          <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function PlanDetail() {
  const { planId } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [consentOpen, setConsentOpen] = useState(false)
  const plan = planId ? state.plans[planId] : undefined

  if (!plan) {
    return (
      <>
        <PageHeader title="ไม่พบแผนนี้" />
        <Empty className="rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyDescription className="text-[16px]">ลิงก์อาจไม่ถูกต้อง หรือข้อมูลตัวอย่างถูกรีเซ็ตแล้ว</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="h-11 text-[15px]"><Link to="/plans">กลับไปแผนของฉัน</Link></Button>
        </Empty>
      </>
    )
  }

  const me = selfOf(state)
  const partner = partnerOf(state, plan)
  const rec = matching(state).recommendations.find((r) => r.proposedPlanId === plan.id)
  const myCost = plan.costTermsByMerchant[me.id]
  const total = totalCommitmentBaht(plan, me.id)
  const fairness = validateGrowthPlan(plan)
  const st = plan.lifecycleStatus
  const myConsent = consentOf(plan, me.id)
  const stale = myConsent?.consentStatus === 'invalidated'
  const lastChange = plan.changeLog[plan.changeLog.length - 1]
  const partnerPerms = plan.dataPermissions

  const decline = () => {
    if (!dispatch({ type: 'decline', planId: plan.id })) return toast.error('ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน')
    toast('รับทราบ ไม่เป็นไรเลย ร้านคุณยังขายตามปกติทุกอย่าง')
    navigate('/opportunities')
  }

  return (
    <>
      <Link to="/plans" className="mb-3 inline-flex min-h-11 items-center gap-2 text-[16px] text-emerald-700 hover:underline">
        <ArrowLeft className="size-5" aria-hidden="true" />
        แผนของฉัน
      </Link>
      <PageHeader title={plan.title} action={<StatusBadge status={st} />} />

      {stale && (
        <Alert className="mb-6 border-saffron/50 bg-saffron-soft text-saffron-ink">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle className="text-[16px]">เงื่อนไขเปลี่ยนเป็นฉบับที่ {plan.planVersion}</AlertTitle>
          <AlertDescription className="text-[15px] text-saffron-ink/90">
            {lastChange.summary} การยืนยันฉบับเดิมถูกล้างแล้ว โปรดอ่านและยืนยันใหม่ ถ้ายังไม่พร้อมก็ไม่เป็นไร
          </AlertDescription>
        </Alert>
      )}

      {/* 1. what is being recommended */}
      <Panel className="mb-5">
        <div className="flex flex-col gap-5">
          <p className="max-w-[62ch] text-[18px]">{plan.summary}</p>
          <BondPair plan={plan} self={me} partner={partner} />
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ['ค่าใช้จ่ายเพิ่ม', total === null ? 'ยังไม่ทราบ' : baht(total)],
              ['ส่วนลดบังคับ', plan.discountTerms.requiredFromSmallMerchant ? 'มี' : 'ไม่มี'],
              ['แบ่งยอดขาย', plan.revenueSharingTerms.mandatory ? 'ต้องแบ่ง' : 'ไม่ต้อง'],
              ['ระยะเวลา', `${plan.durationDays} วัน`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-sage p-3">
                <dt className="text-[14px] text-muted-foreground">{k}</dt>
                <dd className="text-[20px] font-semibold text-forest">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[14px] text-muted-foreground">ตัวเลขข้างบนเป็นข้อสมมุติของแผนตัวอย่างเพื่อสาธิต ไม่ใช่การรับประกันว่าแคมเปญจริงทุกแบบจะเป็นอย่างนี้</p>
        </div>
      </Panel>

      {/* 2. why relevant */}
      <Panel title="ทำไมแผนนี้อาจเหมาะกับร้านคุณ" icon={<Users />} className="mb-5">
        {rec ? (
          <>
            <ul className="mb-3 flex flex-col gap-2.5">
              {rec.matchReasons.filter((r) => r.score > 0.5).map((r) => (
                <li key={r.factor} className="flex items-start gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" />
                  <span>{r.detail}</span>
                </li>
              ))}
            </ul>
            <p className="text-[15px] text-muted-foreground">{rec.benefitForYou}</p>
          </>
        ) : (
          <p>แผนนี้ถูกเตรียมไว้ก่อนหน้า ตอนนี้ข้อมูลร้านเปลี่ยนไปแล้ว แต่เงื่อนไขของแผนยังเหมือนเดิม</p>
        )}
        <p className="mt-3 rounded-xl bg-sage p-3 text-[15px]">เป็นเพียงโอกาสที่อาจเกิดขึ้น ไม่มีการรับประกันลูกค้า ยอดขาย กำไร หรืออันดับ</p>
      </Panel>

      {/* 3 + 4. responsibilities */}
      <Panel title="คุณต้องทำอะไรบ้าง" icon={<ListChecks />} className="mb-5">
        <Bullets items={plan.responsibilitiesByMerchant[me.id]} />
      </Panel>
      <Panel title={`${partner.name}และ GemBond ทำอะไรบ้าง`} icon={<Handshake />} className="mb-5">
        <p className="mb-2 font-semibold">{partner.name}</p>
        <Bullets items={plan.responsibilitiesByMerchant[partner.id]} />
        <p className="mt-5 mb-2 font-semibold">GemBond</p>
        <Bullets items={plan.gembondResponsibilities} />
      </Panel>

      {/* 5. costs */}
      <Panel title="ค่าใช้จ่ายของคุณ" icon={<CircleDollarSign />} className="mb-5 ring-2 ring-saffron/40">
        <ul className="flex flex-col divide-y rounded-xl border">
          {myCost.lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-4 p-3.5">
              <div>
                <p className="font-medium">{l.label}</p>
                <p className="text-[15px] text-muted-foreground">{l.trigger}</p>
                {l.amountBaht !== null && l.amountBaht > 0 && l.cap && <p className="text-[15px] text-muted-foreground">เพดาน: {l.cap}</p>}
              </div>
              <p className={cn('shrink-0 text-[22px] font-semibold', l.amountBaht === null ? 'text-saffron-ink' : 'text-forest')}>
                {l.amountBaht === null ? 'ยังไม่ทราบ' : baht(l.amountBaht)}
              </p>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 bg-sage p-3.5">
            <p className="font-semibold">รวมที่คุณต้องจ่ายเพิ่มสำหรับแผนนี้</p>
            <p className="text-[26px] font-semibold text-forest">{total === null ? 'ยังไม่ทราบ' : baht(total)}</p>
          </li>
        </ul>
        <p className="mt-3 text-[15px]">เป็นข้อสมมุติของแคมเปญตัวอย่างนี้เท่านั้น ไม่ใช่การรับประกันสำหรับแคมเปญจริงทุกแบบ ถ้าแคมเปญจริงมีค่าใช้จ่าย เราจะบอกจำนวนหรือวิธีคำนวณ ใครจ่าย เพดาน และจ่ายเมื่อไร ก่อนขอให้คุณยืนยัน</p>
        <p className="mt-2 text-[15px] text-muted-foreground">{myCost.outsideScopeNote}</p>
      </Panel>

      {/* 6. data */}
      <Panel title="ข้อมูลที่ร้านคู่ค้าเห็น" icon={<Eye />} className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold"><Eye className="size-5" aria-hidden="true" />เห็นได้</p>
            <ul className="flex flex-col gap-2 text-[15px]">{partnerPerms.filter((d) => canPartnerAccess(plan, d.id)).map((d) => <li key={d.id}>{d.label}</li>)}</ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold"><EyeOff className="size-5" aria-hidden="true" />ไม่เห็น</p>
            <ul className="flex flex-col gap-2 text-[15px]">{partnerPerms.filter((d) => !canPartnerAccess(plan, d.id)).map((d) => <li key={d.id}>{d.label}</li>)}</ul>
          </div>
        </div>
      </Panel>

      {/* 7. rights */}
      <Panel title="สิทธิของร้านคุณ" icon={<ShieldCheck />} className="mb-5">
        <Bullets items={RIGHTS} />
      </Panel>

      {/* 8. duration + cancellation */}
      <Panel title="ระยะเวลาและการยกเลิก" icon={<Timer />} className="mb-5">
        <p className="mb-3">แคมเปญนี้ยาว {plan.durationDays} วัน นับจากวันที่ร้านทั้งสองยืนยันและคุณกดเริ่ม</p>
        <Bullets items={plan.cancellationTerms} />
      </Panel>

      {/* 9. measurement */}
      <Panel title="เราวัดผลอย่างไร" icon={<LineChart />} className="mb-5">
        <p className="mb-2">เมื่อแคมเปญจบ เราจะเทียบออเดอร์ช่วงแคมเปญกับช่วงก่อนหน้า และเทียบกับร้านลักษณะใกล้เคียงที่ไม่ได้ร่วมแคมเปญ</p>
        <p className="mb-2">นับออเดอร์ที่มาจากลิงก์แคมเปญแยกไว้ และแสดงค่าใช้จ่ายด้วย เพราะยอดขายที่เพิ่มไม่ได้แปลว่ากำไรเพิ่มเสมอ</p>
        <p className="text-muted-foreground">ผลที่เห็นอาจไม่ได้เกิดจากแคมเปญทั้งหมด เราจะบอกข้อจำกัดนี้ทุกครั้ง</p>
      </Panel>

      <Accordion type="single" collapsible className="mb-6 rounded-2xl border bg-card px-5">
        <AccordionItem value="more" className="border-0">
          <AccordionTrigger className="min-h-12 text-[17px] font-medium hover:no-underline">ดูรายละเอียดเพิ่มเติม</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-6 text-[16px]">
            <div>
              <p className="mb-2 flex items-center gap-2 font-semibold"><Scale className="size-5" aria-hidden="true" />ระบบตรวจความเป็นธรรมให้แล้ว</p>
              <ul className="flex flex-col gap-2">
                {fairness.checks.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    {c.status === 'pass' ? <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" /> : <Ban className="mt-1 size-5 shrink-0 text-destructive" aria-hidden="true" />}
                    <span>{c.label} <span className="text-muted-foreground">— {c.status === 'pass' ? 'ผ่าน' : c.status === 'fail' ? 'ไม่ผ่าน' : 'ยังตรวจไม่ได้'}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">การยืนยันของแต่ละร้าน (แยกกัน)</p>
              <ul className="flex flex-col gap-2 text-[15px]">
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
              <p className="mb-2 font-semibold">ประวัติเงื่อนไข</p>
              <ul className="flex flex-col gap-1.5 text-[15px]">{plan.changeLog.map((c) => <li key={c.version}>ฉบับที่ {c.version} · {fmtFull(c.at)} · {c.summary}</li>)}</ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 10. decision */}
      <Panel title="ตัดสินใจ" className="mb-4 ring-2 ring-emerald-700/25" id="decision">
        {st === 'awaiting' && (
          <div className="flex flex-col gap-4">
            <p>อ่านครบแล้วเลือกได้เลย ไม่มีเวลานับถอยหลัง ปิดหน้านี้แล้วกลับมาทีหลังก็ได้</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="h-14 text-[17px]" onClick={() => setConsentOpen(true)}>สนใจและยืนยันเงื่อนไข</Button>
              <Button variant="outline" className="h-14 text-[17px]" onClick={decline}>ยังไม่เข้าร่วม</Button>
            </div>
            <p className="text-[15px] text-muted-foreground">การเลือก "ยังไม่เข้าร่วม" ไม่กระทบสิทธิการขายตามปกติของร้านคุณ</p>
          </div>
        )}
        {st === 'interested' && (
          <div className="flex flex-col gap-4">
            <p>คุณยืนยันเงื่อนไขฉบับที่ {myConsent?.termsVersion} แล้ว แคมเปญ<strong>ยังไม่เริ่ม</strong> เพราะ{partner.name}ต้องยืนยันเงื่อนไขฉบับเดียวกันด้วย</p>
            <Button variant="outline" className="h-12 self-start text-[16px]" onClick={() => { if (dispatch({ type: 'decline', planId: plan.id })) toast('ถอนความสนใจแล้ว ไม่มีผลต่อการขายของคุณ') }}>ถอนความสนใจ (ยังไม่เข้าร่วม)</Button>
          </div>
        )}
        {st === 'ready' && (
          <div className="flex flex-col gap-4">
            <p>ร้านทั้งสองยืนยันเงื่อนไขฉบับเดียวกันแล้ว กดเริ่มแคมเปญได้ที่หน้าแคมเปญเมื่อคุณพร้อม</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-12 text-[16px]"><Link to="/campaigns">ไปที่หน้าแคมเปญ</Link></Button>
              <Button variant="outline" className="h-12 text-[16px]" onClick={decline}>ยังไม่เข้าร่วม</Button>
            </div>
          </div>
        )}
        {st === 'active' && (
          <div className="flex flex-col gap-3"><p>แคมเปญกำลังดำเนินการ ดูรายละเอียดหรือขอยกเลิกได้ที่หน้าแคมเปญ</p><Button asChild className="h-12 self-start text-[16px]"><Link to="/campaigns">ดูแคมเปญ</Link></Button></div>
        )}
        {st === 'completed' && (
          <div className="flex flex-col gap-3"><p>แคมเปญนี้เสร็จสิ้นแล้ว</p><Button asChild className="h-12 self-start text-[16px]"><Link to="/results">ดูผลลัพธ์</Link></Button></div>
        )}
        {st === 'cancelled' && <p>แผนนี้ถูกยกเลิก ไม่มีค่าปรับ และไม่มีผลต่อสิทธิการขายตามปกติของร้านคุณ</p>}
        {st === 'declined' && (
          <div className="flex flex-col gap-3">
            <p>คุณเลือกยังไม่เข้าร่วมแผนนี้ ไม่เป็นไร ร้านคุณยังขายตามปกติทุกอย่าง ถ้าเปลี่ยนใจกลับมาดูได้เสมอ</p>
            <Button variant="outline" className="h-12 self-start text-[16px]" onClick={() => dispatch({ type: 'reopen', planId: plan.id })}>เปลี่ยนใจ ดูแผนอีกครั้ง</Button>
          </div>
        )}
      </Panel>

      <p className="mb-8 text-[16px]">
        <Link to={`/support?plan=${plan.id}`} className="inline-flex min-h-11 items-center gap-2 text-emerald-700 underline-offset-4 hover:underline">
          <LifeBuoy className="size-5" aria-hidden="true" />
          ยังไม่เข้าใจข้อไหน หรืออยากแจ้งปัญหา? ขอความช่วยเหลือ
        </Link>
      </p>

      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        plan={plan}
        partnerName={partner.name}
        onConfirm={(acks) => {
          setConsentOpen(false)
          if (dispatch({ type: 'accept', planId: plan.id, acks })) toast.success('บันทึกความสนใจของร้านคุณแล้ว รอร้านคู่ค้ายืนยัน')
          else toast.error('ยืนยันไม่ได้ในสถานะปัจจุบัน')
        }}
      />
    </>
  )
}
