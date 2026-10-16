import { MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n/translate'
import { pickText } from '../network'
import { cn } from '@/lib/utils'
import { PlatePair } from './PlatePair'
import type { PairingDish } from '../types'

export interface SelectionDockProps {
  step: 2 | 3
  isEditing?: boolean
  /** Shown only while the action is unavailable, as the hint for what to do. */
  summaryText: string
  isEnabled: boolean
  onNext: () => void
  /** Short name of the restaurant chosen from next; step 2 names it on the button. */
  nextRestaurant?: string
  variant?: 'mobile-dock' | 'desktop-sidebar'
  /** Desktop sidebar only: the pairing as it is being assembled. */
  dishA?: PairingDish | null
  dishB?: PairingDish | null
  /** Desktop sidebar: who owns each slot and what is picked there, for the captions under the plates. */
  slotA?: { restaurant: string; pick: string }
  slotB?: { restaurant: string; pick: string }
  className?: string
}

function ctaLabelFor(step: 2 | 3, isEditing: boolean, nextRestaurant?: string): string {
  if (isEditing || step === 3) return 'ดูคู่เมนูของคุณ'
  return nextRestaurant ? `ถัดไป: เลือกจาก${nextRestaurant}` : 'เลือกเมนูร้านที่สอง'
}

const ctaClass =
  'h-auto min-h-[52px] w-full whitespace-normal rounded-[0.625rem] bg-brand py-2 text-[17px] font-bold text-primary-foreground hover:bg-[#009e46] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-100 disabled:bg-secondary disabled:text-muted-foreground'

export function SelectionDock({
  step,
  isEditing = false,
  summaryText,
  isEnabled,
  onNext,
  nextRestaurant,
  variant = 'mobile-dock',
  dishA,
  dishB,
  slotA,
  slotB,
  className,
}: SelectionDockProps) {
  const ctaLabel = ctaLabelFor(step, isEditing, nextRestaurant)

  if (variant === 'desktop-sidebar') {
    return (
      <aside
        aria-label="ดูคู่เมนูที่เลือกและดำเนินการต่อ"
        className={cn('sticky top-40 hidden border-t border-border pt-6 lg:block', className)}
      >
        <PlatePair
          slugA={dishA?.slug ?? null}
          slugB={dishB?.slug ?? null}
          textA={slotA && { restaurant: slotA.restaurant, label: dishA?.name ?? t('เลือก{0}จากร้านนี้', pickText(slotA.pick)), chosen: !!dishA }}
          textB={slotB && { restaurant: slotB.restaurant, label: dishB?.name ?? t('เลือก{0}จากร้านนี้', pickText(slotB.pick)), chosen: !!dishB }}
          className="mb-5"
        />
        {!isEnabled && (
          <p className="pr-body mb-3 flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="size-5 shrink-0 text-link" aria-hidden="true" />
            {summaryText}
          </p>
        )}
        <Button type="button" disabled={!isEnabled} onClick={onNext} className={ctaClass}>
          {ctaLabel}
        </Button>
      </aside>
    )
  }

  return (
    <div
      role="region"
      aria-label="การเลือกเมนูและดำเนินการต่อ"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-4 pb-safe pt-3 lg:hidden',
        'md:bottom-6 md:left-1/2 md:w-[calc(100%-3rem)] md:max-w-lg md:-translate-x-1/2 md:rounded-xl md:border md:pt-4 md:shadow-[var(--shadow-edge)]',
        className,
      )}
    >
      {!isEnabled && summaryText && (
        <p className="pr-body mb-2 flex items-center gap-2 text-muted-foreground">
          <MousePointerClick className="size-5 shrink-0 text-link" aria-hidden="true" />
          <span className="truncate">{summaryText}</span>
        </p>
      )}
      <Button type="button" disabled={!isEnabled} onClick={onNext} className={ctaClass}>
        {ctaLabel}
      </Button>
    </div>
  )
}
