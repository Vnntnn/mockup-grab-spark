import { useRef } from 'react'
import { Check } from 'lucide-react'
import { baht } from '@/lib/format'
import { cn } from '@/lib/utils'
import { flyPlate } from '../motion'
import { DishSvgArt } from './DishSvgArt'
import type { PairingDish } from '../types'

export interface DishMenuProps {
  label: string
  options: PairingDish[]
  selectedSlug: string | null
  onSelect: (dish: PairingDish) => void
  /** Which slot of the pinned pair bar this menu fills; the plate of a newly chosen dish travels there. */
  slot?: 'A' | 'B'
}

/**
 * A menu list: plate, dish name, price under it, radio. Hairlines separate rows, no cards. The chosen row takes the
 * green wash, a 2px ink outline and a filled check, so selection never relies on colour alone (aria-checked says it too).
 * ARIA radiogroup; arrow keys move focus and selection (roving tabindex).
 */
export function DishMenu({ label, options, selectedSlug, onSelect, slot }: DishMenuProps) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const choose = (dish: PairingDish, index: number) => {
    if (slot && dish.slug !== selectedSlug && typeof document !== 'undefined') flyPlate(rowRefs.current[index]?.querySelector('svg'), document.querySelector(`[data-pair-slot="${slot}"]`))
    onSelect(dish)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number, dish: PairingDish) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      choose(dish, index)
      return
    }
    let nextIndex: number | null = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextIndex = (index + 1) % options.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') nextIndex = (index - 1 + options.length) % options.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = options.length - 1
    if (nextIndex !== null) {
      e.preventDefault()
      choose(options[nextIndex], nextIndex)
      rowRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className="border-t border-border pb-36 md:pb-40 lg:pb-8">
      {options.map((dish, index) => {
        const isSelected = selectedSlug === dish.slug
        const isFocusable = isSelected || (!selectedSlug && index === 0)
        return (
          <div
            key={dish.slug}
            ref={(el) => {
              rowRefs.current[index] = el
            }}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isFocusable ? 0 : -1}
            onClick={() => choose(dish, index)}
            onKeyDown={(e) => handleKeyDown(e, index, dish)}
            className={cn(
              'pr-row pr-press flex min-h-[72px] cursor-pointer select-none items-center gap-4 border-b border-border px-4 py-3 focus-visible:outline-[3px] focus-visible:-outline-offset-[3px] focus-visible:outline-ink',
              isSelected ? 'bg-accent shadow-[inset_0_0_0_2px_#161616]' : 'bg-card hover:bg-secondary',
            )}
          >
            <DishSvgArt slug={dish.slug} className="w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="pr-name">{dish.name}</p>
              <p className="pr-body pr-price">{baht(dish.priceBaht)}</p>
            </div>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                isSelected ? 'pop border-ink bg-ink' : 'border-muted-foreground',
              )}
            >
              {isSelected && <Check className="size-3.5 stroke-[3] text-white" />}
            </span>
          </div>
        )
      })}
    </div>
  )
}
