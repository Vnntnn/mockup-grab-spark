import { Link } from 'react-router-dom'
import { ArrowRight, Check, RotateCcw, ShieldCheck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status/StatusBadge'
import { formatGuaranteeBaht } from '@/components/primitives-data'
import { getDecisionDockState } from './dock-utils'
import type { GrowthPlan } from '@/domain/types'
import { cn } from '@/lib/utils'

export interface StickyDecisionDockProps {
  plan: GrowthPlan
  isSelfAccepted: boolean
  fairnessPassed: boolean
  totalBaht: number | null
  onOpenConsent: () => void
  onDecline: () => void
  onReopen: () => void
  className?: string
}

/**
 * The decision area: a rail beside the document on desktop, a fixed bar on phones.
 * "ยังไม่เข้าร่วม" sits next to the primary action at the same size, so declining is as easy as agreeing.
 */
export function StickyDecisionDock({ plan, isSelfAccepted, fairnessPassed, totalBaht, onOpenConsent, onDecline, onReopen, className }: StickyDecisionDockProps) {
  const st = plan.lifecycleStatus
  const dock = getDecisionDockState(st, isSelfAccepted)
  const waitingForPartner = st === 'interested' || (st === 'awaiting' && isSelfAccepted)
  const shown = waitingForPartner ? 'interested' : st
  const cost = totalBaht === null ? 'ยังไม่ทราบ' : formatGuaranteeBaht(totalBaht)

  const primary = (full: boolean) => {
    if (dock.requiresConsent)
      return (
        <Button type="button" onClick={onOpenConsent} className={cn(full && 'w-full', 'order-first min-[480px]:order-none')}>
          {dock.primaryActionLabel}
        </Button>
      )
    if (!dock.primaryActionLabel) return null
    const to = st === 'completed' ? '/results' : '/campaigns'
    return (
      <Button asChild className={cn(full && 'w-full', 'order-first min-[480px]:order-none')}>
        <Link to={to}>
          {dock.primaryActionLabel}
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    )
  }
  const decline = (full: boolean) =>
    dock.canDecline && (
      <Button type="button" variant="outline" onClick={onDecline} className={cn('border-2 border-ink', full && 'w-full')}>
        {dock.declineLabel}
      </Button>
    )
  const reopen = (full: boolean) =>
    st === 'declined' && (
      <Button type="button" variant="outline" onClick={onReopen} className={cn(full && 'w-full')}>
        <RotateCcw data-icon="inline-start" />
        เปลี่ยนใจ ดูแผนอีกครั้ง
      </Button>
    )

  return (
    <>
      {/* desktop rail */}
      <aside aria-label="สรุปและตัดสินใจ" className={cn('surface sticky top-24 hidden p-6 lg:block', className)}>
        <StatusBadge status={shown} />
        <div className="mt-5 flex items-start gap-3">
          <Wallet className="mt-1.5 size-5 shrink-0 text-link" aria-hidden="true" />
          <div>
            <p className="text-[14px] leading-tight text-muted-foreground">ร้านคุณจ่ายเพิ่ม</p>
            <p className="figure text-[32px] leading-tight text-ink">{cost}</p>
            <p className="text-[14px] text-muted-foreground">ข้อสมมุติของแผนตัวอย่าง</p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-[15px]">
          <ShieldCheck className={cn('size-5 shrink-0', fairnessPassed ? 'text-link' : 'text-warn')} aria-hidden="true" />
          {fairnessPassed ? 'ผ่านการตรวจความเป็นธรรมแล้ว' : 'ยังตรวจความเป็นธรรมไม่ครบ ดูรายละเอียดด้านล่าง'}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {waitingForPartner && (
            <p className="flex items-start gap-2 rounded-lg bg-accent px-4 py-3 text-[15px]">
              <Check className="mt-1 size-4 shrink-0 text-link" strokeWidth={3} aria-hidden="true" />
              <span>คุณยืนยันแล้ว รอร้านคู่ค้ายืนยันเงื่อนไขฉบับเดียวกัน</span>
            </p>
          )}
          {primary(true)}
          {decline(true)}
          {reopen(true)}
        </div>
      </aside>

      {/* phone bar */}
      <div
        role="region"
        aria-label="ตัดสินใจเรื่องแผนนี้"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_-14px_rgb(22_36_28/0.3)] lg:hidden"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <p className="flex items-center justify-between gap-3 text-[15px]">
            <span className="flex items-center gap-2"><Wallet className="size-5 text-link" aria-hidden="true" />ร้านคุณจ่ายเพิ่ม <strong className="figure text-[18px]">{cost}</strong></span>
            {waitingForPartner && <span className="flex items-center gap-1 font-semibold text-link"><Check className="size-4" strokeWidth={3} aria-hidden="true" />ยืนยันแล้ว</span>}
          </p>
          <div className={cn('grid gap-2 [&_[data-slot=button]]:h-auto [&_[data-slot=button]]:min-h-12 [&_[data-slot=button]]:px-3 [&_[data-slot=button]]:py-2 [&_[data-slot=button]]:text-center [&_[data-slot=button]]:leading-tight [&_[data-slot=button]]:whitespace-normal', dock.canDecline && dock.primaryActionLabel ? 'grid-cols-1 min-[480px]:grid-cols-2' : 'grid-cols-1')}>
            {decline(true)}
            {primary(true)}
            {reopen(true)}
          </div>
        </div>
      </div>
    </>
  )
}
