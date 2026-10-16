import { useState } from 'react'
import { Ban, CalendarDays, Check, LifeBuoy, Lock, Megaphone, PlayCircle, Wallet, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { BondPair } from '@/components/BondPair'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/status/StatusBadge'
import { EmptyArt, JourneyTrack, Meter } from '@/components/visual'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { CampaignPreview } from './CampaignPreview'
import { useApp } from '@/app/store'
import { campaignPlans, partnerOf, selfOf } from '@/app/selectors'
import { checkActivation } from '@/domain/campaign-lifecycle'
import { totalCommitmentBaht } from '@/domain/plans'
import { baht } from '@/lib/format'
import { fmtFull } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { GrowthPlan } from '@/domain/types'

function CampaignCard({ plan }: { plan: GrowthPlan }) {
  const { state, dispatch } = useApp()
  const [cancelOpen, setCancelOpen] = useState(false)
  const me = selfOf(state)
  const partner = partnerOf(state, plan)
  const camp = state.campaigns[plan.id]
  const checks = checkActivation(plan, Object.values(state.merchants), Object.values(state.campaigns))
  const blocked = checks.filter((c) => !c.passed)
  const canStart = plan.lifecycleStatus === 'ready' && blocked.length === 0
  const total = totalCommitmentBaht(plan, me.id)
  const showChecklist = plan.lifecycleStatus === 'interested' || plan.lifecycleStatus === 'ready' || plan.lifecycleStatus === 'awaiting'

  const startBtn = (
    <Button
      className="h-12 px-6 text-[17px] font-bold"
      disabled={!canStart}
      aria-describedby={canStart ? undefined : `start-hint-${plan.id}`}
      onClick={() => {
        if (dispatch({ type: 'activate', planId: plan.id })) toast.success('เริ่มแคมเปญแล้ว (จำลอง ไม่ได้เผยแพร่จริง)')
        else toast.error('ยังเริ่มแคมเปญไม่ได้ ดูข้อที่ยังไม่ผ่านด้านล่าง')
      }}
    >
      {canStart ? <PlayCircle data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
      เริ่มแคมเปญ
    </Button>
  )
  const startHint = canStart ? null : (
    <p id={`start-hint-${plan.id}`} className="text-[15px] text-muted-foreground">
      ยังเริ่มไม่ได้ ข้อที่ยังไม่ผ่าน: {blocked.map((b) => b.label).join(' / ')}
    </p>
  )
  const isReady = plan.lifecycleStatus === 'ready'

  const nextNote: Record<GrowthPlan['lifecycleStatus'], string> = {
    awaiting: '',
    interested: 'ไม่มีอะไรที่คุณต้องทำตอนนี้',
    ready: canStart ? '' : 'ยังมีข้อที่ต้องผ่านก่อนเริ่ม ดูด้านล่าง',
    active: 'ไม่มีอะไรที่คุณต้องทำ',
    completed: '',
    cancelled: 'ไม่มีค่าปรับ',
    declined: 'ร้านคุณขายตามปกติทุกอย่าง',
  }

  return (
    <section aria-labelledby={`c-${plan.id}`}>
      <h2 id={`c-${plan.id}`} className="text-[30px] leading-snug font-bold tracking-tight text-ink">{plan.title}</h2>
      <div className="surface mt-4 overflow-hidden">
        <div className="bg-accent px-6 py-5"><BondPair plan={plan} self={me} partner={partner} /></div>
        <div className="px-6 py-5">
          {plan.lifecycleStatus === 'declined' || plan.lifecycleStatus === 'cancelled' || plan.lifecycleStatus === 'awaiting' ? <StatusBadge status={plan.lifecycleStatus} /> : <JourneyTrack status={plan.lifecycleStatus} />}
          {nextNote[plan.lifecycleStatus] && <p className="mt-4 max-w-[52ch] text-[17px]">{nextNote[plan.lifecycleStatus]}</p>}
          {isReady && (
            <div className="mt-4 flex flex-col items-start gap-2">
              {startBtn}
              {startHint}
            </div>
          )}
        </div>
      </div>

      <dl className="mt-6 divide-y divide-border">
        <div className="flex items-center gap-3 py-3">
          <CalendarDays className="size-5 shrink-0 text-link" aria-hidden="true" />
          <dt className="text-muted-foreground">ช่วงเวลา</dt>
          <dd className="ml-auto text-right font-semibold">{camp.startDate && camp.endDate ? `${fmtFull(camp.startDate)} – ${fmtFull(camp.endDate)}` : `${plan.durationDays} วัน (ยังไม่เริ่ม)`}</dd>
        </div>
        <div className="flex items-center gap-3 py-3">
          <Wallet className="size-5 shrink-0 text-link" aria-hidden="true" />
          <dt className="text-muted-foreground">ค่าใช้จ่ายของคุณ</dt>
          <dd className="ml-auto text-right font-semibold tabular-nums">{total === null ? 'ยังไม่ทราบ' : `${baht(total)} (ข้อสมมุติสาธิต)`}</dd>
        </div>
        <div className="flex items-center gap-3 py-3">
          <Megaphone className="size-5 shrink-0 text-link" aria-hidden="true" />
          <dt className="text-muted-foreground">กิจกรรม</dt>
          <dd className="ml-auto text-right font-semibold">หน้าแนะนำร้านร่วมกัน + ลิงก์/QR</dd>
        </div>
      </dl>

      {/* shown while consent is still missing, and also when everything is agreed but a condition (e.g. a shop not ready) still blocks the start */}
      {showChecklist && (!isReady || !canStart) && (
        <div className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[22px] font-bold text-ink">ความพร้อมก่อนเริ่ม</h3>
            <p className={cn('text-[15px] font-semibold tabular-nums', canStart ? 'text-link' : 'text-ink')}>ผ่าน {checks.length - blocked.length}/{checks.length}</p>
          </div>
          <Meter value={(checks.length - blocked.length) / checks.length} label={`ผ่าน ${checks.length - blocked.length} จาก ${checks.length} ข้อ`} className="mt-2" />
          <ul className="mt-3 flex flex-col divide-y divide-border border-y border-border">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                {c.passed ? (
                  <Check className="mt-1.5 size-4 shrink-0 text-link" aria-hidden="true" />
                ) : (
                  <X className="mt-1.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.label}</p>
                  <p className="text-[15px] text-muted-foreground">{c.passed ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'} · {c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          {!isReady && (
            <div className="mt-5 flex flex-col items-start gap-2">
              {startBtn}
              {startHint}
              <Link to={`/plans/${plan.id}`} className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
                ดูแผนและสถานะการยืนยัน
              </Link>
            </div>
          )}
        </div>
      )}

      {plan.lifecycleStatus === 'active' && <div className="mt-10"><CampaignPreview self={me} partner={partner} campaignId={camp.id} /></div>}

      <Accordion type="single" collapsible className="mt-10 border-y border-border">
        <AccordionItem value="resp" className="border-0">
          <AccordionTrigger className="min-h-12 text-[15px] font-semibold hover:no-underline">สิ่งที่แต่ละร้านทำ (ตามเงื่อนไขฉบับที่ {camp.planVersion})</AccordionTrigger>
          <AccordionContent className="text-[15px]">
            {Object.entries(camp.agreedResponsibilities).map(([id, items]) => (
              <div key={id} className="mb-4">
                <p className="mb-1 font-bold">{id === me.id ? 'ร้านคุณ' : partner.name}</p>
                <ul className="list-disc pl-5">{items.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6 flex flex-wrap gap-3">
        {plan.lifecycleStatus === 'completed' && <Button asChild className="h-12 text-[17px] font-bold"><Link to="/results">ดูผลลัพธ์</Link></Button>}
        {(plan.lifecycleStatus === 'active' || plan.lifecycleStatus === 'ready') && (
          <Button variant="outline" className="h-12 text-[17px]" onClick={() => setCancelOpen(true)}>
            <Ban data-icon="inline-start" />
            ขอยกเลิกแคมเปญ
          </Button>
        )}
        <Button asChild variant="ghost" className="h-12 text-[17px]">
          <Link to={`/support?plan=${plan.id}`}><LifeBuoy data-icon="inline-start" />ขอความช่วยเหลือ</Link>
        </Button>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[22px]">ยกเลิกแคมเปญนี้?</DialogTitle>
            <DialogDescription className="text-[15px]">ถ้ายกเลิก สิ่งที่จะเกิดขึ้นคือ</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 text-[15px]">
            {plan.cancellationTerms.map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-link" aria-hidden="true" />{t}</li>)}
            <li className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-link" aria-hidden="true" />{partner.name}จะได้รับแจ้ง (จำลอง)</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" className="h-12 text-[17px]" onClick={() => setCancelOpen(false)}>ไม่ยกเลิก</Button>
            <Button variant="destructive" className="h-12 text-[17px]" onClick={() => { setCancelOpen(false); if (dispatch({ type: 'cancel', planId: plan.id })) toast('ยกเลิกแคมเปญแล้ว ไม่มีค่าปรับ'); else toast.error('ยกเลิกไม่ได้ในสถานะปัจจุบัน') }}>ยืนยันยกเลิกแคมเปญ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function Campaigns() {
  const { state } = useApp()
  const plans = campaignPlans(state)
  return (
    <>
      <PageHeader title="แคมเปญ" lead="เริ่มได้เมื่อร้านทั้งสองยืนยันเงื่อนไขฉบับเดียวกัน" />
      {plans.length === 0 ? (
        <Empty className="surface">
          <EmptyHeader>
            <EmptyArt kind="campaigns" className="mx-auto" />
            <EmptyTitle className="text-[22px]">ยังไม่มีแคมเปญ</EmptyTitle>
            <EmptyDescription className="text-[17px]">เมื่อคุณสนใจแผนใดแผนหนึ่ง แคมเปญจะมาแสดงที่นี่</EmptyDescription>
          </EmptyHeader>
          <Button asChild className="h-12 text-[17px] font-bold"><Link to="/opportunities">ดูแผนที่แนะนำ</Link></Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-16">{plans.map((p) => <CampaignCard key={p.id} plan={p} />)}</div>
      )}
    </>
  )
}
