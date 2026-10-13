import { AlertTriangle, ArrowRight, BarChart3, Info, Lightbulb, Receipt, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { DailyBars } from '@/components/charts/DailyBars'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useApp } from '@/app/store'
import { partnerOf, resultsFor, seedFor } from '@/app/selectors'
import { campaignSeries, INSUFFICIENT_TEXT, recommendNextAction } from '@/domain/calculations'
import { MERCHANT_BASELINE } from '@/data/results'
import type { Campaign, CampaignResults } from '@/domain/types'
import { baht, num, signedBaht, signedPct } from '@/lib/format'
import { fmtRange } from '@/lib/dates'

function Compare({ label, before, after, pct, fmt, comparable }: { label: string; before: number; after: number; pct: number; fmt: (n: number) => string; comparable: boolean }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[15px]">ก่อนแคมเปญ <span className="font-semibold">{fmt(before)}</span></p>
      <p className="text-[28px] leading-tight font-semibold text-forest">{fmt(after)}</p>
      <p className="text-[15px]">ช่วงแคมเปญ · {comparable ? `เปลี่ยนไป ${signedPct(pct)}` : 'เทียบเป็นเปอร์เซ็นต์ไม่ได้'}</p>
    </div>
  )
}

function Line({ label, value, strong, hint }: { label: string; value: string; strong?: boolean; hint?: string }) {
  return (
    <li className={`flex items-start justify-between gap-4 py-2.5 ${strong ? 'font-semibold' : ''}`}>
      <span>{label}{hint && <span className="block text-[14px] font-normal text-muted-foreground">{hint}</span>}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </li>
  )
}

function CampaignResultsView({ campaign, r }: { campaign: Campaign; r: CampaignResults }) {
  const { state } = useApp()
  const plan = state.plans[campaign.planId]
  const partner = partnerOf(state, plan)
  const seed = seedFor(state, plan.id)
  const d = r.derived
  const next = recommendNextAction(r)
  const canEstimate = d.estimatedIncrementalOrders !== null
  const up = d.ordersChangePct > 0
  const comparable = d.insufficientReason === null
  const perDay = d.baselineDays !== d.campaignDays // unequal periods: show daily averages, never raw totals
  const unit = (n: number, days: number) => (perDay ? n / Math.max(days, 1) : n)
  const dec = (n: number) => n.toFixed(1)

  return (
    <div className="mb-10 flex flex-col gap-5">
      <h2 className="text-[22px] font-semibold text-forest">{plan.title} · ร่วมกับ{partner.name}</h2>
      <p className="text-[15px] text-muted-foreground">
        ช่วงแคมเปญ {fmtRange(r.reportingPeriod)} เทียบกับช่วงก่อนหน้า {fmtRange(r.baselinePeriod)} · ข้อมูลตัวอย่างสำหรับสาธิตระบบ
      </p>

      <Panel title="สิ่งที่เห็นได้ตรง ๆ" icon={<BarChart3 />}>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Compare label={perDay ? 'ออเดอร์เฉลี่ยต่อวัน' : 'ออเดอร์'} before={unit(r.orders.baseline, d.baselineDays)} after={unit(r.orders.campaign, d.campaignDays)} pct={d.ordersChangePct} fmt={perDay ? dec : num} comparable={comparable} />
          <Compare label={perDay ? 'ยอดขายเฉลี่ยต่อวัน (ยังไม่ใช่กำไร)' : 'ยอดขาย (ยังไม่ใช่กำไร)'} before={unit(r.revenue.baseline, d.baselineDays)} after={unit(r.revenue.campaign, d.campaignDays)} pct={d.revenueChangePct} fmt={baht} comparable={comparable} />
        </div>
        {perDay && <p className="mb-3 text-[15px] text-muted-foreground">ข้อมูลก่อนแคมเปญ {d.baselineDays} วัน และช่วงแคมเปญที่มีข้อมูล {d.campaignDays} จาก {d.periodDays} วัน จึงเทียบเป็นค่าเฉลี่ยต่อวัน</p>}
        <DailyBars before={MERCHANT_BASELINE.orders} during={campaignSeries(seed, d.campaignDays).orders} />
        <p className="mt-4 rounded-xl bg-sage p-3.5">
          {!comparable
            ? 'ข้อมูลยังไม่เพียงพอที่จะเทียบอย่างยุติธรรม จึงยังสรุปไม่ได้ว่าแคมเปญช่วยหรือไม่'
            : up
              ? 'ยอดสั่งซื้อเพิ่มขึ้นเมื่อเทียบกับช่วงก่อนหน้า แต่ยังสรุปไม่ได้ว่าการเพิ่มขึ้นทั้งหมดเกิดจากแคมเปญ'
              : 'ยอดสั่งซื้อไม่ได้เพิ่มขึ้นเมื่อเทียบกับช่วงก่อนหน้า ซึ่งอาจมีเหตุอื่นร่วมด้วย จึงยังสรุปเรื่องแคมเปญไม่ได้'}
        </p>
      </Panel>

      <Panel title="ส่วนที่น่าจะมาจากแคมเปญ" icon={<TrendingUp />}>
        {canEstimate ? (
          <>
            <ul className="divide-y">
              <Line label="ออเดอร์ที่เพิ่มขึ้นจริง" value={`${r.orders.campaign >= d.baselineOrdersScaled ? '+' : '−'}${num(Math.abs(r.orders.campaign - d.baselineOrdersScaled))}`} hint={perDay ? `ช่วงแคมเปญลบช่วงก่อนหน้า (ปรับให้เป็น ${d.campaignDays} วันเท่ากัน)` : 'ช่วงแคมเปญลบช่วงก่อนหน้า'} />
              <Line label="ที่คาดว่าจะเพิ่มอยู่แล้วแม้ไม่มีแคมเปญ" value={`${d.expectedOrders! - d.baselineOrdersScaled >= 0 ? '+' : ''}${num(d.expectedOrders! - d.baselineOrdersScaled)}`} hint={`${d.comparisonLabel} เปลี่ยนไปในช่วงเดียวกัน`} />
              <Line strong label="ส่วนที่น่าจะมาจากแคมเปญ (ค่าประมาณ)" value={`ประมาณ ${num(d.estimatedIncrementalOrders!)} ออเดอร์`} />
            </ul>
            <p className="mt-3 text-[15px] text-muted-foreground">เป็นค่าประมาณ ไม่ใช่ค่าที่ยืนยันได้ ร้านที่นำมาเทียบอาจไม่เหมือนร้านคุณทุกอย่าง</p>
          </>
        ) : (
          <Alert className="border-saffron/50 bg-saffron-soft text-saffron-ink">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle className="text-[16px]">ข้อมูลยังไม่เพียงพอ</AlertTitle>
            <AlertDescription className="text-[15px] text-saffron-ink/90">
              {d.insufficientReason ? INSUFFICIENT_TEXT[d.insufficientReason] : 'ยังไม่มีกลุ่มร้านเปรียบเทียบ'} เราจึงไม่ประมาณส่วนที่มาจากแคมเปญ ดูได้แค่ตัวเลขที่เห็นจริงด้านบน
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-5 rounded-xl border p-4">
          <p className="mb-1 font-semibold">คนที่กดลิงก์แคมเปญ</p>
          <p>กดลิงก์ {num(r.attributableClicks)} ครั้ง · สั่งซื้อผ่านลิงก์ {num(r.attributedOrders)} ออเดอร์ ({d.clickToOrderPct.toFixed(1)}% ของคนที่กด)</p>
          <p className="mt-1 text-[15px] text-muted-foreground">การกดลิงก์ไม่ใช่การซื้อ และบางคนที่สั่งผ่านลิงก์อาจสั่งอยู่แล้วแม้ไม่มีแคมเปญ</p>
        </div>
      </Panel>

      <Panel title="กำไร ไม่ใช่แค่ยอดขาย" icon={<Receipt />}>
        {d.contribution !== null && d.incrementalContribution !== null ? (
          <>
            <ul className="divide-y">
              <Line label="ยอดขายช่วงแคมเปญ" value={baht(r.revenue.campaign)} />
              <Line label="หัก ต้นทุนวัตถุดิบและบรรจุภัณฑ์โดยประมาณ" value={`− ${baht(r.relevantVariableCosts ?? 0)}`} hint={`ตามที่คุณระบุไว้ ${state.variableCostPct}% ของยอดขาย`} />
              <Line label="หัก ค่าใช้จ่ายของแคมเปญ" value={`− ${baht(r.promotionalCosts)}`} />
              <Line strong label="ส่วนที่เหลือช่วงแคมเปญ" value={baht(d.contribution)} />
              <Line label="หัก ส่วนที่เหลือที่คาดว่าจะได้อยู่แล้วถ้าไม่มีแคมเปญ" value={`− ${baht(d.expectedBaselineContribution ?? 0)}`} />
              <Line strong label="ผลต่างที่น่าจะมาจากแคมเปญ (ค่าประมาณ)" value={signedBaht(d.incrementalContribution)} />
            </ul>
            <p className="mt-3 text-[15px] text-muted-foreground">รวม: ต้นทุนวัตถุดิบ/บรรจุภัณฑ์ตามที่ร้านประมาณ และค่าใช้จ่ายแคมเปญ ไม่รวม: ค่าแรง ค่าเช่า ค่าธรรมเนียมแพลตฟอร์มปกติ และภาษี</p>
          </>
        ) : (
          <Alert className="border-saffron/50 bg-saffron-soft text-saffron-ink">
            <Info aria-hidden="true" />
            <AlertTitle className="text-[16px]">ข้อมูลยังไม่เพียงพอสำหรับการประเมินกำไร</AlertTitle>
            <AlertDescription className="text-[15px] text-saffron-ink/90">
              {d.insufficientReason
                ? `${INSUFFICIENT_TEXT[d.insufficientReason]} `
                : d.contribution === null
                  ? 'คุณยังไม่ได้ใส่ต้นทุนโดยประมาณ (ไม่บังคับ) '
                  : 'ยังไม่มีกลุ่มร้านเปรียบเทียบที่จะประมาณส่วนต่าง '}
              {!d.insufficientReason && d.contribution === null && <Link to="/store" className="underline">ใส่ได้ที่หน้า "ร้านของฉัน"</Link>}
            </AlertDescription>
          </Alert>
        )}
      </Panel>

      <Panel title="ถ้าจะทำอะไรต่อ" icon={<Lightbulb />} className="ring-2 ring-emerald-700/25">
        <p className="text-[18px] font-semibold text-forest">{next.title}</p>
        <p className="mt-1">{next.body}</p>
        <p className="mt-3 text-[15px] text-muted-foreground">นี่เป็นคำแนะนำตามเงื่อนไขของตัวเลขเท่านั้น ไม่รับประกันผล คุณเป็นผู้ตัดสินใจเสมอ</p>
        <Button asChild variant={next.kind === 'add_costs' ? 'default' : 'outline'} className="mt-4 h-12 text-[16px]">
          <Link to={next.kind === 'add_costs' ? '/store' : '/opportunities'}>
            {next.kind === 'add_costs' ? 'ไปใส่ต้นทุนโดยประมาณ' : 'ดูแผนที่แนะนำ'}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </Panel>
    </div>
  )
}

export function Results() {
  const { state } = useApp()
  const camps = Object.values(state.campaigns)
  const done = camps.filter((c) => c.status === 'completed')
  const active = camps.find((c) => c.status === 'active')
  return (
    <>
      <PageHeader title="ผลลัพธ์" lead="ดูว่าแคมเปญช่วยร้านคุณได้แค่ไหน แยกให้ชัดระหว่างสิ่งที่เห็น กับสิ่งที่น่าจะมาจากแคมเปญ" />
      <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-saffron-soft px-3 py-1.5 text-[14px] font-medium text-saffron-ink">
        <Info className="size-4" aria-hidden="true" />
        ข้อมูลตัวอย่างสำหรับสาธิตระบบ
      </p>
      {done.length > 0 ? (
        done.map((c) => <CampaignResultsView key={c.id} campaign={c} r={resultsFor(state, c)!} />)
      ) : (
        <Empty className="rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BarChart3 /></EmptyMedia>
            <EmptyTitle className="text-[20px]">{active ? 'แคมเปญยังไม่จบ' : 'ยังไม่มีผลลัพธ์ให้ดู'}</EmptyTitle>
            <EmptyDescription className="text-[16px]">
              {active
                ? 'เมื่อแคมเปญจบ เราจะสรุปให้ที่นี่ โดยไม่ตีความผลก่อนเวลา เพราะข้อมูลระหว่างทางยังไม่พอจะบอกว่าคุ้มหรือไม่'
                : 'ยังไม่มีแคมเปญที่จบ ซึ่งเป็นเรื่องปกติ เมื่อคุณเข้าร่วมและแคมเปญจบ ผลจะมาแสดงที่นี่'}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="h-11 text-[15px]"><Link to={active ? '/campaigns' : '/opportunities'}>{active ? 'ดูแคมเปญ' : 'ดูแผนที่แนะนำ'}</Link></Button>
        </Empty>
      )}
    </>
  )
}
