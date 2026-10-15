import { Check } from 'lucide-react'
import { baht } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DishSvgArt } from '../components/DishSvgArt'
import type { PairingCampaignData, PairingDish } from '../types'

export interface Screen2SelectMainProps {
  data: PairingCampaignData
  selectedSlug: string | null
  onSelect: (dish: PairingDish) => void
}

export function Screen2SelectMain({
  data,
  selectedSlug,
  onSelect,
}: Screen2SelectMainProps) {
  return (
    <div className="max-w-lg mx-auto py-2">
      {/* Subheader */}
      <div className="mb-4 text-[15px] font-semibold text-muted-foreground">
        {`ขั้นตอนที่ 1 จาก 2: เลือกจานหลักจาก ${data.restaurantA.name}`}
      </div>

      {/* Accessible Radio Group */}
      <div
        role="radiogroup"
        aria-label={`เลือกจานหลักจาก${data.restaurantA.name}`}
        className="flex flex-col gap-3 pb-36"
      >
        {data.menuA.map((dish) => {
          const isSelected = selectedSlug === dish.slug
          return (
            <div
              key={dish.slug}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(dish)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  onSelect(dish)
                }
              }}
              className={cn(
                'group flex min-h-[56px] items-center justify-between gap-4 rounded-2xl p-3 sm:p-4 cursor-pointer transition-all select-none focus-visible:outline-2 focus-visible:outline-ring',
                isSelected
                  ? 'border-2 border-[#161616] bg-[#E3F6EA] shadow-xs'
                  : 'border border-border bg-card hover:border-foreground/30 hover:bg-secondary/40'
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-background flex items-center justify-center">
                  <DishSvgArt slug={dish.slug} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-[16px] sm:text-[17px] text-ink truncate">
                    {dish.name}
                  </h3>
                  <p className="figure font-semibold text-[15px] sm:text-[16px] text-foreground mt-0.5">
                    {baht(dish.priceBaht)}
                  </p>
                </div>
              </div>

              <div
                className="shrink-0 flex items-center pr-1"
                aria-hidden="true"
              >
                {isSelected ? (
                  <div className="size-6 rounded-full bg-[#161616] text-white flex items-center justify-center shadow-xs">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-6 rounded-full border-2 border-muted-foreground/40 group-hover:border-muted-foreground" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
