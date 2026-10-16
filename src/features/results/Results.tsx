import { AlertTriangle, ArrowRight, Info, MousePointerClick, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DocSection } from '@/components/DocSection'
import { Ledger, LedgerRow } from '@/components/Ledger'
import { PageHeader } from '@/components/PageHeader'
import { DailyBars } from '@/components/charts/DailyBars'
import { WaterfallHeroBar } from '@/components/charts/WaterfallHeroBar'
import { canShowOrderSplit } from './waterfall-helpers'
import { EmptyArt } from '@/components/visual'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useApp } from '@/app/store'
import { partnerOf, resultsFor, seedFor } from '@/app/selectors'
import { campaignSeries, INSUFFICIENT_TEXT, orderImpactBreakdown, recommendNextAction } from '@/domain/calculations'
import { MERCHANT_BASELINE } from '@/data/results'
import type { Campaign, CampaignResults } from '@/domain/types'
import { baht, num, signedBaht, signedPct } from '@/lib/format'
import { fmtRange } from '@/lib/dates'
import { cn } from '@/lib/utils'

/** Whole orders with an explicit sign, so +38 / −5 / 0 read unambiguously. */
const signedOrders = (n: number) => (n > 0 ? `+${num(n)}` : n < 0 ? `−${num(Math.abs(n))}` : '0')

/** Before and during as two bars on one scale, with the change beside them. The bars are the comparison; the numbers are printed on them. */
function CompareRow({ label, before, during, beforeText, duringText, change, up }: { label: string; before: number; during: number; beforeText: string; duringText: string; change: string; up?: boolean }) {
  const max = Math.max(before, during, 1)
  const bar = (v: number, text: string, name: string, tone: string) => (
    <div className="flex items-center gap-3">
      <span className="w-[5.5rem] shrink-0 text-[14px] text-muted-foreground">{name}</span>
      <div className="h-7 flex-1">
        <div className={cn('ease-fill flex h-full min-w-fit items-center rounded-md px-2.5 text-[15px] font-semibold tabular-nums', tone)} style={{ width: `${Math.max((v / max) * 100, 12)}%` }}>
          {text}
        </div>
      </div>
    </div>
  )
  return (
    <li className="py-4">
      <p className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-bold">{label}</span>
        <span className={cn('figure text-[22px]', up ? 'text-link' : 'text-ink')}>{change}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {bar(before, beforeText, 'ก่อนแคมเปญ', 'bg-border text-ink')}
        {bar(during, duringText, 'ช่วงแคมเปญ', 'bg-brand text-ink')}
      </div>
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
  const impact = orderImpactBreakdown(r)
  const canEstimate = impact !== null
  const up = d.ordersChangePct > 0
  const comparable = d.insufficientReason === null
  const perDay = d.baselineDays !== d.campaignDays // unequal periods: show daily averages, never raw totals
  const unit = (n: number, days: number) => (perDay ? n / Math.max(days, 1) : n)
  const dec = (n: number) => (Number.isInteger(n) ? num(n) : n.toFixed(1))
  const stackable = canShowOrderSplit(impact)

  // The answer, in words, built only from the computed figures. Estimates are named as estimates; nothing here is a guarantee.
  const headline = !comparable
    ? 'ข้อมูลยังไม่เพียงพอที่จะเทียบอย่างยุติธรรม จึงยังสรุปไม่ได้ว่าแคมเปญช่วยหรือไม่'
    : canEstimate
      ? `ออเดอร์เปลี่ยนไป ${signedPct(d.ordersChangePct)} ส่วนที่น่าจะมาจากแคมเปญประมาณ ${signedOrders(impact.fromCampaign)} ออเดอร์`
      : `ออเดอร์เปลี่ยนไป ${signedPct(d.ordersChangePct)} แต่ยังไม่มีร้านเปรียบเทียบพอจะบอกว่าส่วนไหนมาจากแคมเปญ`

  const ledgerOrders = canEstimate && (
    <Ledger label="ออเดอร์ที่เปลี่ยนไปและส่วนที่น่าจะมาจากแคมเปญ">
      <LedgerRow label="ออเดอร์ทั้งหมดที่เปลี่ยนไป" value={signedOrders(impact.observed)} hint={`นับออเดอร์ทุกช่องทางของร้าน ไม่ใช่เฉพาะที่สั่งผ่านลิงก์แคมเปญ${perDay ? ` (ปรับให้เป็น ${d.campaignDays} วันเท่ากัน)` : ''}`} />
      <LedgerRow label="ส่วนที่คาดว่าจะเปลี่ยนอยู่แล้วแม้ไม่มีแคมเปญ" value={signedOrders(impact.expectedAnyway)} hint={`${d.comparisonLabel} เปลี่ยนไปในช่วงเดียวกัน`} />
      <LedgerRow total label="ส่วนที่น่าจะมาจากแคมเปญ (ค่าประมาณ)" value={`ประมาณ ${signedOrders(impact.fromCampaign)}`} />
    </Ledger>
  )

  return (
    <div className="mb-16">
      <header>
        <h2 className="text-[17px] font-semibold text-muted-foreground">{plan.title} · ร่วมกับ{partner.name}</h2>
        <p className="text-[14px] text-muted-foreground">
          {fmtRange(r.reportingPeriod)} เทียบ {fmtRange(r.baselinePeriod)} · ข้อมูลตัวอย่างสำหรับสาธิตระบบ
        </p>
        {d.baselineBeforeEarlierCampaign && (
          <p className="mt-1 max-w-[60ch] text-[14px] text-muted-foreground">
            ช่วงที่เทียบคือก่อนแคมเปญแรกของร้านคุณ เพราะวันก่อนเริ่มแคมเปญนี้มีแคมเปญอื่นปนอยู่ จึงเทียบได้ไม่แม่นเท่าแคมเปญแรก
          </p>
        )}
        <p className="mt-4 max-w-[34ch] text-balance text-[30px] leading-snug font-bold tracking-tight text-ink md:text-[34px]">{headline}</p>
      </header>

      {stackable && (
        <div className="mt-6">
          <WaterfallHeroBar baselineOrders={r.orders.campaign - impact.observed} expectedAnywayOrders={impact.expectedAnyway} estimatedFromCampaignOrders={impact.fromCampaign} />
        </div>
      )}

      <DocSection id="observed" title="สิ่งที่วัดได้จริง" className="border-0 pt-0">
        <div className="surface px-5 py-2 md:px-6">
          <ul className="divide-y divide-border">
            <CompareRow
              label={perDay ? 'ออเดอร์เฉลี่ยต่อวัน' : 'ออเดอร์รวม'}
              before={unit(r.orders.baseline, d.baselineDays)}
              during={unit(r.orders.campaign, d.campaignDays)}
              beforeText={dec(unit(r.orders.baseline, d.baselineDays))}
              duringText={dec(unit(r.orders.campaign, d.campaignDays))}
              change={comparable ? signedPct(d.ordersChangePct) : 'เทียบไม่ได้'}
              up={comparable && up}
            />
            <CompareRow
              label={perDay ? 'ยอดขายเฉลี่ยต่อวัน (ก่อนหักต้นทุน)' : 'ยอดขายรวม (ก่อนหักต้นทุน)'}
              before={unit(r.revenue.baseline, d.baselineDays)}
              during={unit(r.revenue.campaign, d.campaignDays)}
              beforeText={baht(unit(r.revenue.baseline, d.baselineDays))}
              duringText={baht(unit(r.revenue.campaign, d.campaignDays))}
              change={comparable ? signedPct(d.revenueChangePct) : 'เทียบไม่ได้'}
              up={comparable && d.revenueChangePct > 0}
            />
            <li className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4">
              <span className="flex items-center gap-2"><MousePointerClick className="size-5 text-muted-foreground" aria-hidden="true" />กดลิงก์ <strong className="figure">{num(r.attributableClicks)}</strong> ครั้ง</span>
              <span className="flex items-center gap-2"><ShoppingBag className="size-5 text-muted-foreground" aria-hidden="true" />สั่งผ่านลิงก์ <strong className="figure">{num(r.attributedOrders)}</strong> ออเดอร์ ({d.clickToOrderPct.toFixed(1)}% ของการกด)</span>
            </li>
          </ul>
        </div>

        {perDay && (
          <p className="mt-3 text-[14px] text-muted-foreground">
            ก่อนแคมเปญ {d.baselineDays} วัน ช่วงแคมเปญมีข้อมูล {d.campaignDays} จาก {d.periodDays} วัน จึงเทียบเป็นค่าเฉลี่ยต่อวัน
          </p>
        )}

        <details className="mt-4 border-t border-border pt-1">
          <summary className="flex min-h-11 cursor-pointer items-center text-[15px] font-semibold text-link hover:underline">
            ดูกราฟยอดสั่งซื้อรายวัน
          </summary>
          <div className="pt-4">
            <DailyBars before={MERCHANT_BASELINE.orders} during={campaignSeries(seed, d.campaignDays).orders} />
          </div>
        </details>

        {comparable && (
          <p className="mt-5 max-w-[60ch] font-semibold text-ink">
            {up
              ? 'ยอดสั่งซื้อเพิ่มขึ้นเมื่อเทียบกับช่วงก่อนหน้า แต่ยังสรุปไม่ได้ว่าการเพิ่มขึ้นทั้งหมดเกิดจากแคมเปญ'
              : 'ยอดสั่งซื้อไม่ได้เพิ่มขึ้นเมื่อเทียบกับช่วงก่อนหน้า ซึ่งอาจมีเหตุอื่นร่วมด้วย จึงยังสรุปเรื่องแคมเปญไม่ได้'}
          </p>
        )}
        <p className="mt-1 text-[14px] text-muted-foreground">การกดลิงก์ไม่ใช่การซื้อ และบางคนที่สั่งผ่านลิงก์อาจสั่งอยู่แล้วแม้ไม่มีแคมเปญ</p>
      </DocSection>

      <DocSection id="incremental" title="ส่วนที่น่าจะมาจากแคมเปญ (ค่าประมาณ)">
        {canEstimate ? (
          <>
            <details className="mt-1" open={!stackable}>
              <summary className="flex min-h-11 cursor-pointer items-center text-[15px] font-medium text-link">ดูวิธีคำนวณ</summary>
              {ledgerOrders}
            </details>
            <p className="mt-2 text-[14px] text-muted-foreground">เป็นค่าประมาณ ไม่ใช่ค่าที่ยืนยันได้ ร้านที่นำมาเทียบอาจไม่เหมือนร้านคุณทุกอย่าง</p>
          </>
        ) : (
          <div className="flex gap-3 rounded-xl bg-warn-soft p-4">
            <AlertTriangle className="mt-1 size-5 shrink-0 text-warn" aria-hidden="true" />
            <div>
              <p className="font-bold">ข้อมูลยังไม่เพียงพอ</p>
              <p>{d.insufficientReason ? INSUFFICIENT_TEXT[d.insufficientReason] : 'ยังไม่มีกลุ่มร้านเปรียบเทียบ'} เราจึงไม่ประมาณส่วนที่มาจากแคมเปญ ดูได้แค่ตัวเลขที่เห็นจริงด้านบน</p>
            </div>
          </div>
        )}
      </DocSection>

      <DocSection id="profit" title="การประเมินกำไรสุทธิ">
        {d.contribution !== null && d.incrementalContribution !== null ? (
          <>
            <div className="surface px-5 py-3 md:px-6">
              <Ledger label="จากยอดขายถึงผลต่างที่น่าจะมาจากแคมเปญ">
                <LedgerRow label="ยอดขายช่วงแคมเปญ" value={baht(r.revenue.campaign)} />
                <LedgerRow label="หัก ต้นทุนวัตถุดิบและบรรจุภัณฑ์โดยประมาณ" value={`− ${baht(r.relevantVariableCosts ?? 0)}`} hint={`ตามที่คุณระบุไว้ ${state.variableCostPct}% ของยอดขาย`} />
                <LedgerRow label="หัก ค่าใช้จ่ายของแคมเปญ" value={`− ${baht(r.promotionalCosts)}`} />
                <LedgerRow strong label="ส่วนที่เหลือช่วงแคมเปญ" value={baht(d.contribution)} />
                <LedgerRow label="หัก ส่วนที่คาดว่าจะได้อยู่แล้วถ้าไม่มีแคมเปญ" value={`− ${baht(d.expectedBaselineContribution ?? 0)}`} />
                <LedgerRow total label="ผลต่างที่น่าจะมาจากแคมเปญ (ค่าประมาณ)" value={signedBaht(d.incrementalContribution)} />
              </Ledger>
            </div>
            <p className="mt-3 max-w-[64ch] text-[14px] text-muted-foreground">รวม: ต้นทุนวัตถุดิบ/บรรจุภัณฑ์ตามที่ร้านประมาณ และค่าใช้จ่ายแคมเปญ ไม่รวม: ค่าแรง ค่าเช่า ค่าธรรมเนียมแพลตฟอร์มปกติ และภาษี</p>
          </>
        ) : (
          <div className="flex gap-3 rounded-xl bg-warn-soft p-4">
            <Info className="mt-1 size-5 shrink-0 text-warn" aria-hidden="true" />
            <div>
              <p className="font-bold">ข้อมูลยังไม่เพียงพอสำหรับการประเมินกำไร</p>
              <p>
                {d.insufficientReason
                  ? `${INSUFFICIENT_TEXT[d.insufficientReason]} `
                  : d.contribution === null
                    ? 'คุณยังไม่ได้ใส่ต้นทุนโดยประมาณ (ไม่บังคับ) '
                    : 'ยังไม่มีกลุ่มร้านเปรียบเทียบที่จะประมาณส่วนต่าง '}
                {!d.insufficientReason && d.contribution === null && <Link to="/store" className="underline">ใส่ได้ที่หน้า "ร้านของฉัน"</Link>}
              </p>
            </div>
          </div>
        )}
      </DocSection>

      <DocSection id="strategy" title="ก้าวถัดไป">
        <p className="text-[22px] leading-snug font-bold text-ink">{next.title}</p>
        <p className="mt-2 max-w-[56ch] text-[17px]">{next.body}</p>
        <p className="mt-2 text-[14px] text-muted-foreground">คำแนะนำตามตัวเลขเท่านั้น ไม่รับประกันผล คุณเป็นผู้ตัดสินใจเสมอ</p>
        <Button asChild variant={next.kind === 'add_costs' ? 'default' : 'outline'} className="mt-4 h-auto min-h-12 max-w-full shrink py-2 whitespace-normal text-[17px] font-bold">
          <Link to={next.kind === 'add_costs' ? '/store' : '/opportunities'}>
            {next.kind === 'add_costs' ? 'ใส่ต้นทุนโดยประมาณ' : 'ดูร้านที่น่าสนใจอื่น ๆ'}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </DocSection>

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
      <PageHeader title="ผลลัพธ์" lead="แยกสิ่งที่เห็น ออกจากสิ่งที่น่าจะมาจากแคมเปญ" />
      {done.length > 0 ? (
        done.map((c) => <CampaignResultsView key={c.id} campaign={c} r={resultsFor(state, c)!} />)
      ) : (
        <Empty className="surface">
          <EmptyHeader>
            <EmptyArt kind="results" className="mx-auto" />
            <EmptyTitle className="text-[22px]">{active ? 'แคมเปญยังไม่จบ' : 'ยังไม่มีผลลัพธ์'}</EmptyTitle>
            <EmptyDescription className="text-[17px]">
              {active ? 'เมื่อแคมเปญจบ เราจะสรุปให้ที่นี่ ข้อมูลระหว่างทางยังไม่พอจะบอกว่าคุ้มหรือไม่' : 'เมื่อมีแคมเปญที่จบ ผลจะมาแสดงที่นี่ ซึ่งเป็นเรื่องปกติ'}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="h-11 text-[15px]"><Link to={active ? '/campaigns' : '/opportunities'}>{active ? 'ดูแคมเปญ' : 'ดูแผนที่แนะนำ'}</Link></Button>
        </Empty>
      )}
    </>
  )
}
