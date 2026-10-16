import { cn } from '@/lib/utils'
import { GemMark } from '@/components/GemMark'
import { RoleIcon } from './RoleIcon'
import { shortName } from '../network'
import type { PairingCampaignData, PairingDish } from '../types'

export interface PairProgressProps {
  data: PairingCampaignData
  dishA: PairingDish | null
  dishB: PairingDish | null
  /** Which restaurant is being chosen from right now. */
  active: 'A' | 'B'
  /** Shown on step 3 so the first choice can be changed without leaving the pair. */
  onEditA?: () => void
}

function Slot({
  slot,
  restaurantId,
  restaurantName,
  dish,
  isActive,
  side,
  onEdit,
  editLabel,
}: {
  slot: 'A' | 'B'
  restaurantId: string
  restaurantName: string
  dish: PairingDish | null
  isActive: boolean
  side: 'left' | 'right'
  onEdit?: () => void
  editLabel?: string
}) {
  return (
    <div data-pair-slot={slot} className={cn('min-w-0 py-2', side === 'right' ? 'pl-6 pr-4' : 'pl-4 pr-6')}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('pr-caption flex min-w-0 items-center gap-1.5', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          <RoleIcon restaurantId={restaurantId} className="size-4 text-link" />
          <span className="truncate">{shortName(restaurantName)}</span>
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={editLabel}
            className="pr-caption -my-3 flex min-h-[48px] shrink-0 cursor-pointer items-center px-2 font-semibold text-link underline decoration-1 underline-offset-[0.4em]"
          >
            เปลี่ยน
          </button>
        )}
      </div>
      {/* keyed by dish so a new choice replaces the old name with a short settle */}
      <p key={dish?.slug ?? 'none'} className={cn('pr-body pr-swap truncate', dish ? 'font-bold' : 'text-muted-foreground')}>
        {dish ? dish.name : 'ยังไม่ได้เลือก'}
      </p>
    </div>
  )
}

/**
 * The pair being built, always in view while choosing: which restaurant comes first and second, what is already chosen,
 * which one is being chosen now (the underline slides from one to the other). Replaces the step counter, the
 * restaurant sub-heading and the summary strip.
 */
export function PairProgress({ data, dishA, dishB, active, onEditA }: PairProgressProps) {
  return (
    <div role="group" aria-label="คู่ที่กำลังเลือก" className="relative grid grid-cols-2 border-b border-border bg-background">
      <Slot
        slot="A"
        restaurantId={data.restaurantA.id}
        restaurantName={data.restaurantA.name}
        dish={dishA}
        isActive={active === 'A'}
        side="left"
        onEdit={active === 'B' ? onEditA : undefined}
        editLabel={`เปลี่ยน${data.roleA.pick}`}
      />
      <Slot slot="B" restaurantId={data.restaurantB.id} restaurantName={data.restaurantB.name} dish={dishB} isActive={active === 'B'} side="right" />
      <GemMark className="pointer-events-none absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 bg-background" />
      <span
        aria-hidden="true"
        className={cn('pr-slide absolute bottom-[-1px] left-0 h-0.5 w-1/2 bg-ink', active === 'B' && 'translate-x-full')}
      />
    </div>
  )
}
