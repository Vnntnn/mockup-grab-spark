import { computeWaterfallSegments } from '@/features/results/waterfall-helpers'
import { cn } from '@/lib/utils'

export interface WaterfallHeroBarProps {
  /** Orders in the comparison period before the campaign. */
  baselineOrders: number
  /** Increase the comparison shops saw over the same stretch: what would likely have happened anyway. */
  expectedAnywayOrders: number
  /** What is left after that: an estimate of what the campaign added, not a proven effect. */
  estimatedFromCampaignOrders: number
  className?: string
}

/**
 * The campaign period's orders, split by where they probably came from.
 * The three parts add up to the campaign-period total; the last part is an estimate and is labelled as one.
 */
export function WaterfallHeroBar({ baselineOrders, expectedAnywayOrders, estimatedFromCampaignOrders, className }: WaterfallHeroBarProps) {
  const seg = computeWaterfallSegments({ baseline: baselineOrders, marketTrend: expectedAnywayOrders, gemBondUplift: estimatedFromCampaignOrders })
  const parts = [
    { key: 'base', pct: seg.baselinePercent, n: baselineOrders, short: 'ปกติ', long: 'ออเดอร์ปกติก่อนแคมเปญ', fill: 'bg-border text-ink' },
    { key: 'anyway', pct: seg.marketPercent, n: expectedAnywayOrders, short: 'น่าจะเพิ่มอยู่แล้ว', long: 'ที่ร้านใกล้เคียงก็เพิ่มในช่วงเดียวกัน', fill: 'bg-accent text-ink' },
    { key: 'camp', pct: seg.boostPercent, n: estimatedFromCampaignOrders, short: 'น่าจะมาจากแคมเปญ', long: 'ส่วนที่เหลือ เป็นค่าประมาณ ไม่ใช่ค่าที่ยืนยันได้', fill: 'bg-brand text-ink' },
  ]
  return (
    <section aria-labelledby="split-h" className={cn('surface p-5 md:p-6', className)}>
      <h3 id="split-h" className="text-[17px] font-bold text-ink">ออเดอร์ช่วงแคมเปญมาจากไหน (ค่าประมาณ)</h3>
      <div
        role="img"
        aria-label={`ออเดอร์ปกติ ${baselineOrders} ที่น่าจะเพิ่มอยู่แล้ว ${expectedAnywayOrders} ที่น่าจะมาจากแคมเปญ ${estimatedFromCampaignOrders} ออเดอร์`}
        className="mt-4 flex h-11 w-full gap-1 overflow-hidden rounded-lg bg-secondary p-1"
      >
        {parts.map((p) => (
          <div key={p.key} style={{ width: `${p.pct}%` }} className={cn('ease-fill flex min-w-0 items-center justify-center overflow-hidden rounded-md px-1 text-[14px] font-bold tabular-nums', p.fill)}>
            {p.pct >= 9 && <span className="truncate">{p.n}</span>}
          </div>
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.key} className="flex items-start gap-2 text-[14px] leading-snug">
            <span className={cn('mt-1 size-3 shrink-0 rounded-sm ring-1 ring-ink/15', p.fill.split(' ')[0])} aria-hidden="true" />
            <span>
              <strong className="block text-ink">{p.short} <span className="figure">{p.n}</span></strong>
              <span className="text-muted-foreground">{p.long}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
