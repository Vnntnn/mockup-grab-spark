import { cn } from '@/lib/utils'
import { DishPlate } from './DishSvgArt'

export interface PlateSlotText {
  /** Short name of the restaurant this slot belongs to. */
  restaurant: string
  /** The chosen dish, or what is still to choose ("Choose a snack"). */
  label: string
  chosen: boolean
}

export interface PlatePairProps {
  slugA: string | null
  slugB: string | null
  /** Names under each plate so the two dishes are never separated from their restaurant. */
  textA?: PlateSlotText
  textB?: PlateSlotText
  className?: string
}

/**
 * The pair preview in the desktop summary: the two chosen plates side by side, never overlapping, each with its restaurant
 * and dish named underneath. One figure, one simulation caption. An empty slot is a dashed ring with the prompt for it, so
 * the same component shows a pairing being assembled. It never shows a price or a total.
 */
export function PlatePair({ slugA, slugB, textA, textB, className }: PlatePairProps) {
  const slot = (slug: string | null, text: PlateSlotText | undefined, side: 'a' | 'b') => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {slug ? (
        <DishPlate key={slug} slug={slug} className={cn('w-full max-w-[9rem]', side === 'a' ? 'pr-join-a' : 'pr-join-b')} />
      ) : (
        <span aria-hidden="true" className="aspect-square w-full max-w-[9rem] rounded-full border-2 border-dashed border-border" />
      )}
      {text && (
        <p className="min-w-0">
          <span className="pr-caption block text-muted-foreground">{text.restaurant}</span>
          <span className={cn('pr-body block', text.chosen ? 'font-bold' : 'text-muted-foreground')}>{text.label}</span>
        </p>
      )}
    </div>
  )
  return (
    <figure className={cn('m-0 flex flex-col items-center gap-2', className)}>
      <div className="flex w-full items-start justify-center gap-4">
        {slot(slugA, textA, 'a')}
        {slot(slugB, textB, 'b')}
      </div>
      {(slugA || slugB) && <figcaption className="pr-caption text-muted-foreground">ภาพจำลอง</figcaption>}
    </figure>
  )
}
