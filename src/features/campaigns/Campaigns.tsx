import { useState } from 'react'
import { Ban, CalendarDays, Check, CircleDollarSign, LifeBuoy, Lock, Megaphone, PlayCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BondPair } from '@/components/BondPair'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { CampaignPreview } from './CampaignPreview'
import { useApp } from '@/app/store'
import { campaignPlans, partnerOf, selfOf } from '@/app/selectors'
import { checkActivation } from '@/domain/campaign-lifecycle'
import { totalCommitmentBaht } from '@/domain/plans'
import { baht } from '@/lib/format'
import { fmtFull } from '@/lib/dates'
import type { GrowthPlan } from '@/domain/types'

const CAMPAIGN_LABEL = { awaiting_consent: 'รอการยืนยัน', ready: 'พร้อมเริ่ม', active: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก' } as const

function CampaignCard({ plan }: { plan: GrowthPlan }) {
  const { state, dispatch } = useApp()
  const [cancelOpen, setCancelOpen] = useState(false)
  const me = selfOf(state)
  const partner = partnerOf(state, plan)
  const camp = state.campaigns[plan.id]
  const checks = checkActivation(plan, Object.values(state.merchants))
  const blocked = checks.filter((c) => !c.passed)
  const canStart = plan.lifecycleStatus === 'ready' && blocked.length === 0
  const total = totalCommitmentBaht(plan, me.id)
  const showChecklist = plan.lifecycleStatus === 'interested' || plan.lifecycleStatus === 'ready' || plan.lifecycleStatus === 'awaiting'

  return (
    <Panel>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold text-forest">{plan.title}</h2>
            <p className="text-muted-foreground">ร่วมกับ{partner.name} · {CAMPAIGN_LABEL[camp.status]}</p>
          </div>
          <StatusBadge status={plan.lifecycleStatus} />
        </div>
        <BondPair plan={plan} self={me} partner={partner} />

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-sage p-3.5">
            <dt className="flex items-center gap-2 text-[14px] text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />ช่วงเวลา</dt>
            <dd className="font-semibold">{camp.startDate && camp.endDate ? `${fmtFull(camp.startDate)} – ${fmtFull(camp.endDate)}` : `${plan.durationDays} วัน (ยังไม่เริ่ม)`}</dd>
          </div>
          <div className="rounded-xl bg-sage p-3.5">
            <dt className="flex items-center gap-2 text-[14px] text-muted-foreground"><CircleDollarSign className="size-4" aria-hidden="true" />ค่าใช้จ่ายของคุณ</dt>
            <dd className="font-semibold">{total === null ? 'ยังไม่ทราบ' : `${baht(total)} (ข้อสมมุติสาธิต)`}</dd>
          </div>
          <div className="rounded-xl bg-sage p-3.5">
            <dt className="flex items-center gap-2 text-[14px] text-muted-foreground"><Megaphone className="size-4" aria-hidden="true" />กิจกรรม</dt>
            <dd className="font-semibold">หน้าแนะนำร้านร่วมกัน + ลิงก์/QR</dd>
          </div>
        </dl>

        {showChecklist && (
          <div className="rounded-xl border p-4">
            <p className="mb-3 font-semibold">ก่อนเริ่มแคมเปญ ต้องครบทุกข้อ</p>
            <ul className="flex flex-col gap-2.5">
              {checks.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  {c.passed ? <Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" /> : <X className="mt-1 size-5 shrink-0 text-destructive" aria-hidden="true" />}
                  <span>
                    {c.label}
                    <span className="block text-[15px] text-muted-foreground">{c.passed ? 'ผ่าน' : 'ยังไม่ผ่าน'} · {c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="h-12 self-start px-6 text-[16px]"
                disabled={!canStart}
                aria-describedby="start-hint"
                onClick={() => {
                  if (dispatch({ type: 'activate', planId: plan.id })) toast.success('เริ่มแคมเปญแล้ว (จำลอง ไม่ได้เผยแพร่จริง)')
                  else toast.error('ยังเริ่มแคมเปญไม่ได้ ดูข้อที่ยังไม่ผ่านด้านบน')
                }}
              >
                {canStart ? <PlayCircle data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
                เริ่มแคมเปญ
              </Button>
              <p id="start-hint" className="text-[15px] text-muted-foreground">
                {canStart ? 'ทุกข้อผ่านแล้ว กดเริ่มได้เมื่อคุณพร้อม' : `ยังเริ่มไม่ได้ ข้อที่ยังไม่ผ่าน: ${blocked.map((b) => b.label).join(' / ')}`}
              </p>
              {plan.lifecycleStatus !== 'ready' && <Link to={`/plans/${plan.id}`} className="inline-flex min-h-11 items-center text-[15px] text-emerald-700 underline-offset-4 hover:underline">ดูแผนและสถานะการยืนยัน</Link>}
            </div>
          </div>
        )}

        {plan.lifecycleStatus === 'active' && <CampaignPreview self={me} partner={partner} campaignId={camp.id} />}

        <Accordion type="single" collapsible>
          <AccordionItem value="resp" className="border-0">
            <AccordionTrigger className="min-h-11 text-[16px] font-medium hover:no-underline">สิ่งที่แต่ละร้านทำ (ตามเงื่อนไขฉบับที่ {camp.planVersion})</AccordionTrigger>
            <AccordionContent className="text-[16px]">
              {Object.entries(camp.agreedResponsibilities).map(([id, items]) => (
                <div key={id} className="mb-4">
                  <p className="mb-1 font-semibold">{id === me.id ? 'ร้านคุณ' : partner.name}</p>
                  <ul className="list-disc pl-5">{items.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-wrap gap-3">
          {plan.lifecycleStatus === 'completed' && <Button asChild className="h-12 text-[16px]"><Link to="/results">ดูผลลัพธ์</Link></Button>}
          {(plan.lifecycleStatus === 'active' || plan.lifecycleStatus === 'ready') && (
            <Button variant="outline" className="h-12 text-[16px]" onClick={() => setCancelOpen(true)}>
              <Ban data-icon="inline-start" />
              ขอยกเลิกแคมเปญ
            </Button>
          )}
          <Button asChild variant="ghost" className="h-12 text-[16px]">
            <Link to={`/support?plan=${plan.id}`}><LifeBuoy data-icon="inline-start" />ขอความช่วยเหลือ</Link>
          </Button>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[20px]">ยกเลิกแคมเปญนี้?</DialogTitle>
            <DialogDescription className="text-[16px]">ถ้ายกเลิก สิ่งที่จะเกิดขึ้นคือ</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 text-[16px]">
            {plan.cancellationTerms.map((t) => <li key={t} className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" />{t}</li>)}
            <li className="flex gap-3"><Check className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" />{partner.name}จะได้รับแจ้ง (จำลอง)</li>
          </ul>
          <DialogFooter>
            <Button variant="outline" className="h-12 text-[16px]" onClick={() => setCancelOpen(false)}>ไม่ยกเลิก</Button>
            <Button className="h-12 text-[16px]" onClick={() => { setCancelOpen(false); if (dispatch({ type: 'cancel', planId: plan.id })) toast('ยกเลิกแคมเปญแล้ว ไม่มีค่าปรับ'); else toast.error('ยกเลิกไม่ได้ในสถานะปัจจุบัน') }}>ยืนยันยกเลิกแคมเปญ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

export function Campaigns() {
  const { state } = useApp()
  const plans = campaignPlans(state)
  return (
    <>
      <PageHeader title="แคมเปญ" lead="สิ่งที่เกิดขึ้นหลังคุณสนใจแผน แคมเปญจะเริ่มได้เมื่อร้านทั้งสองยืนยันเงื่อนไขฉบับเดียวกันเท่านั้น" />
      {plans.length === 0 ? (
        <Empty className="rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Megaphone /></EmptyMedia>
            <EmptyTitle className="text-[20px]">ยังไม่มีแคมเปญ</EmptyTitle>
            <EmptyDescription className="text-[16px]">เมื่อคุณสนใจแผนใดแผนหนึ่ง แคมเปญจะมาแสดงที่นี่ ไม่ต้องรีบ ร้านคุณขายตามปกติได้ทุกอย่าง</EmptyDescription>
          </EmptyHeader>
          <Button asChild className="h-12 text-[16px]"><Link to="/opportunities">ดูแผนที่แนะนำ</Link></Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">{plans.map((p) => <CampaignCard key={p.id} plan={p} />)}</div>
      )}
    </>
  )
}
