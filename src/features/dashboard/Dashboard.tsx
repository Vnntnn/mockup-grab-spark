import { ArrowRight, ClipboardCheck, Compass, History, ListChecks, Receipt, ShoppingBag, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BondPair } from '@/components/BondPair'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useApp } from '@/app/store'
import { campaignPlans, deriveActivity, headlinePlan, matching, partnerOf, recentPeriod, selfOf } from '@/app/selectors'
import { baht, num } from '@/lib/format'
import { fmtDay, fmtRange } from '@/lib/dates'
import type { GrowthPlan, PlanLifecycle } from '@/domain/types'
import { cn } from '@/lib/utils'

const RENEW_TODO = 'อ่านเงื่อนไขใหม่ แล้วยืนยันอีกครั้ง'
const TODO: Record<PlanLifecycle, { text: string; to: (p: GrowthPlan) => string }> = {
  awaiting: { text: 'อ่านแผนที่แนะนำ แล้วตัดสินใจ', to: (p) => `/plans/${p.id}` },
  interested: { text: 'ไม่มีอะไรต้องทำ รอร้านคู่ค้ายืนยัน', to: (p) => `/plans/${p.id}` },
  ready: { text: 'กดเริ่มแคมเปญเมื่อคุณพร้อม', to: () => '/campaigns' },
  active: { text: 'ไม่มีอะไรต้องทำ แคมเปญกำลังเดินอยู่', to: () => '/campaigns' },
  completed: { text: 'ดูผลลัพธ์ของแคมเปญ', to: () => '/results' },
  cancelled: { text: 'ไม่มีอะไรต้องทำ', to: (p) => `/plans/${p.id}` },
  declined: { text: 'ไม่มีอะไรต้องทำ', to: (p) => `/plans/${p.id}` },
}

const CTA: Partial<Record<PlanLifecycle, { label: string; to: (p: GrowthPlan) => string }>> = {
  interested: { label: 'ดูสถานะแผน', to: (p) => `/plans/${p.id}` },
  ready: { label: 'ไปเริ่มแคมเปญ', to: () => '/campaigns' },
  active: { label: 'ดูแคมเปญ', to: () => '/campaigns' },
  completed: { label: 'ดูผลลัพธ์', to: () => '/results' },
}

export function Dashboard() {
  const { state } = useApp()
  const me = selfOf(state)
  const head = headlinePlan(state)
  const partner = head ? partnerOf(state, head) : null
  const rec = head ? matching(state).recommendations.find((r) => r.proposedPlanId === head.id) : undefined
  const period = recentPeriod(state)
  const activity = deriveActivity(state)
  const started = Object.values(state.campaigns).some((c) => ['active', 'completed'].includes(c.status))
  const cta = head ? CTA[head.lifecycleStatus] : undefined
  // a plan the merchant already agreed to, sent back for renewed consent by a terms change
  const renewal = !!head && head.lifecycleStatus === 'awaiting' && head.consentRecords.some((r) => r.merchantId === me.id && r.consentStatus === 'invalidated')
  const engaged = !!head && campaignPlans(state).some((p) => p.id === head.id)

  return (
    <>
      <PageHeader title={`สวัสดี ${me.name}`} lead="มาดูกันว่าร้านของคุณมีโอกาสเติบโตตรงไหนบ้าง" />

      {head && partner ? (
        <Panel className="mb-6 ring-2 ring-emerald-700/20">
          {head.lifecycleStatus === 'awaiting' && !renewal ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="flex items-center gap-2 text-[15px] font-medium text-emerald-700">
                  <Sparkles className="size-5" aria-hidden="true" />
                  โอกาสสำหรับร้านคุณ
                </p>
                <h2 className="mt-1 text-[22px] font-semibold text-forest md:text-[24px]">มีโอกาสให้ลูกค้ากลุ่มใหม่รู้จักร้านของคุณ</h2>
                <p className="mt-2 max-w-[60ch]">
                  {partner.name} ({partner.category}) ในย่านใกล้กัน อาจช่วยแนะนำร้านของคุณให้ลูกค้าที่กำลังมองหาเมนูเสริมได้ โดยลูกค้าสั่งจากแต่ละร้านผ่านช่องทางปกติของร้านนั้น
                </p>
              </div>
              <BondPair plan={head} self={me} partner={partner} />
              {rec && (
                <ul className="flex flex-wrap gap-2" aria-label="เหตุผลที่แนะนำ">
                  {rec.matchReasons.slice(0, 3).map((r) => (
                    <li key={r.factor} className="rounded-full bg-secondary px-3 py-1.5 text-[15px] text-secondary-foreground">
                      {r.detail}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[15px] text-muted-foreground">นี่เป็นเพียงโอกาส ไม่มีการรับประกันยอดขายหรือผลลัพธ์ และคุณไม่ต้องจ่ายหรือลดราคาเพิ่มในแผนตัวอย่างนี้</p>
              <div>
                <Button asChild className="h-12 px-6 text-[17px]">
                  <Link to={`/plans/${head.id}`}>
                    ดูแผนที่แนะนำ
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold text-forest">{head.title}</h2>
                <StatusBadge status={head.lifecycleStatus} />
              </div>
              <BondPair plan={head} self={me} partner={partner} />
              {renewal && (
                <>
                  <p className="rounded-xl bg-saffron-soft p-3.5 text-saffron-ink">
                    เงื่อนไขเปลี่ยนเป็นฉบับที่ {head.planVersion} ({head.changeLog[head.changeLog.length - 1].summary}) การยืนยันเดิมถูกล้างแล้ว โปรดอ่านและยืนยันใหม่ ถ้ายังไม่พร้อมก็ไม่เป็นไร
                  </p>
                  <div>
                    <Button asChild className="h-12 px-6 text-[17px]">
                      <Link to={`/plans/${head.id}`}>
                        ดูเงื่อนไขใหม่
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
              {cta && (
                <div>
                  <Button asChild className="h-12 px-6 text-[17px]">
                    <Link to={cta.to(head)}>
                      {cta.label}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </Panel>
      ) : (
        <Empty className="mb-6 rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass />
            </EmptyMedia>
            <EmptyTitle className="text-[20px]">ตอนนี้ยังไม่มีแผนแนะนำ</EmptyTitle>
            <EmptyDescription className="text-[16px]">
              {me.participationPreference === 'not_now'
                ? 'คุณเลือกพักการรับคำแนะนำไว้ เปลี่ยนได้ที่หน้า "ร้านของฉัน" เมื่อพร้อม'
                : 'ไม่ต้องรีบ เมื่อมีร้านที่เหมาะกับร้านคุณ เราจะแสดงที่นี่ ร้านคุณยังขายตามปกติได้ทุกอย่าง'}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="h-11 text-[15px]">
            <Link to="/opportunities">ไปที่หน้าหาโอกาสเติบโต</Link>
          </Button>
        </Empty>
      )}

      <section aria-labelledby="sum" className="mb-6">
        <h2 id="sum" className="mb-3 text-[20px] font-semibold text-forest">
          ร้านคุณตอนนี้
        </h2>
        <p className="mb-3 text-[15px] text-muted-foreground">
          {period.label} · {fmtRange(period.range)} · ข้อมูลตัวอย่างเพื่อสาธิต
        </p>
        <dl className="grid grid-cols-2 gap-3">
          <Tile icon={<ShoppingBag />} label="ออเดอร์" value={num(period.orders)} unit="ออเดอร์" />
          <Tile icon={<Receipt />} label="ยอดขาย" value={baht(period.revenue)} unit="ยังไม่หักต้นทุน" />
          <div className="col-span-2 flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:col-span-1">
            <dt className="flex items-center gap-2 text-[15px] text-muted-foreground">
              <ClipboardCheck className="size-5" aria-hidden="true" />
              สถานะแคมเปญ
            </dt>
            <dd>{head && engaged ? <StatusBadge status={head.lifecycleStatus} className="text-[14px]" /> : <span className="text-[17px] font-medium">ยังไม่มีแคมเปญ</span>}</dd>
          </div>
          <div className="col-span-2 flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:col-span-1">
            <dt className="flex items-center gap-2 text-[15px] text-muted-foreground">
              <ListChecks className="size-5" aria-hidden="true" />
              สิ่งที่ต้องทำ
            </dt>
            <dd className="text-[17px] font-medium">
              {head ? (
                <Link to={TODO[head.lifecycleStatus].to(head)} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                  {renewal ? RENEW_TODO : TODO[head.lifecycleStatus].text}
                </Link>
              ) : (
                'ไม่มีอะไรต้องทำ'
              )}
            </dd>
          </div>
        </dl>
      </section>

      <Panel title="ความเคลื่อนไหวล่าสุด" icon={<History />} className="mb-6">
        {activity.length ? (
          <ul className="flex flex-col divide-y">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link to={a.href} className="flex items-start gap-3 py-3 hover:bg-secondary/50">
                  <span
                    className={cn('mt-2 size-2.5 shrink-0 rounded-full', a.tone === 'good' && 'bg-success', a.tone === 'wait' && 'bg-saffron', a.tone === 'info' && 'bg-forest', a.tone === 'quiet' && 'bg-muted-foreground')}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    <span className="block text-[16px]">{a.text}</span>
                    <span className="text-[14px] text-muted-foreground">{fmtDay(a.at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">ยังไม่มีความเคลื่อนไหว เมื่อมีแผนใหม่หรือมีการเปลี่ยนแปลง จะแสดงที่นี่</p>
        )}
      </Panel>

      {!started && (
        <Panel title="GemBond ช่วยคุณอย่างไร">
          <ol className="flex flex-col gap-3">
            {['เราเตรียมแผนให้ พร้อมบอกค่าใช้จ่ายและสิทธิของคุณ', 'คุณอ่านและตัดสินใจเอง จะเข้าร่วมหรือไม่ก็ได้', 'ร้านทั้งสองยืนยันแยกกัน แล้วแคมเปญจึงเริ่ม', 'จบแล้วดูผลลัพธ์ พร้อมคำแนะนำว่าควรทำอะไรต่อ'].map((t, i) => (
              <li key={t} className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[15px] font-semibold text-forest">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  )
}

function Tile({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
      <dt className="flex items-center gap-2 text-[15px] text-muted-foreground [&_svg]:size-5">
        {icon}
        {label}
      </dt>
      <dd className="text-[28px] leading-tight font-semibold text-forest">{value}</dd>
      <dd className="text-[14px] text-muted-foreground">{unit}</dd>
    </div>
  )
}
