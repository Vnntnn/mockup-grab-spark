import { Clock } from 'lucide-react'
import { baht } from '@/lib/format'
import { DishSvgArt } from './DishSvgArt'
import { RoleIcon } from './RoleIcon'
import { cn } from '@/lib/utils'
import type { NetRestaurant } from '../network'

function Dishes({ restaurant, compact }: { restaurant: NetRestaurant; compact?: boolean }) {
  return (
    <ul className="border-t border-border" aria-label={`เมนูตัวอย่างของ${restaurant.name}`}>
      {restaurant.menu.map((m) => (
        <li
          key={m.name}
          className={cn(
            'border-b border-border py-2',
            compact ? 'pr-body' : 'pr-body flex items-baseline justify-between gap-3',
          )}
        >
          <span className="font-medium">{m.name}</span>
          <span className={cn('pr-price', compact ? 'block text-muted-foreground' : 'shrink-0')}>{baht(m.priceBaht)}</span>
        </li>
      ))}
    </ul>
  )
}

/** One restaurant on its own: what it is, when it opens, what it says about itself, its demo dishes with prices. */
export function RestaurantFacts({
  restaurant,
  className,
  headingLevel: Heading = 'h2',
}: {
  restaurant: NetRestaurant
  className?: string
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <Heading className="pr-title">{restaurant.name}</Heading>
      <p className="pr-body mt-1 flex items-center gap-2 text-muted-foreground">
        <RoleIcon restaurantId={restaurant.id} className="text-link" />
        <span>
          {restaurant.role.section} · {restaurant.neighborhood}
        </span>
      </p>
      <p className="pr-caption mt-1 flex items-center gap-2 text-muted-foreground">
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        เปิด {restaurant.hours} น.
      </p>
      <p className="pr-body mt-3">{restaurant.blurb}</p>
      <div className="mt-3">
        <Dishes restaurant={restaurant} />
      </div>
    </div>
  )
}

/** One side of a pairing: name, what is picked here, the dishes. Sits in BondColumns next to its partner. */
export function RestaurantSide({
  restaurant,
  onOpen,
  detailed,
  plate,
}: {
  restaurant: NetRestaurant
  onOpen?: () => void
  /** Adds the neighbourhood and the restaurant's own one-line description (the pairing overview shows both). */
  detailed?: boolean
  /** One of this restaurant's own dishes, drawn large above its name, so the pairing reads as food first. */
  plate?: { slug: string; dishName: string; side: 'a' | 'b' }
}) {
  return (
    <div className="min-w-0">
      {plate && (
        <div className="pt-10">
          <DishSvgArt slug={plate.slug} className={cn('mx-auto max-w-[9.5rem]', plate.side === 'a' ? 'pr-join-a' : 'pr-join-b')} />
          <p className="pr-caption mt-1 text-center text-muted-foreground">
            ตัวอย่าง: <span className="font-semibold text-foreground">{plate.dishName}</span>
          </p>
        </div>
      )}
      <h3 className={cn('pr-name', plate ? 'mt-3' : 'pt-10')}>{restaurant.name}</h3>
      <p className="pr-caption mt-1 flex items-center gap-1.5 text-muted-foreground">
        <RoleIcon restaurantId={restaurant.id} className="size-4 text-link" />
        <span>
          {restaurant.role.section}
          {detailed ? ` · ${restaurant.neighborhood}` : ''}
        </span>
      </p>
      <p className="pr-caption mb-3 mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        เปิด {restaurant.hours} น.
      </p>
      {detailed && <p className="pr-body mb-3 hidden min-[380px]:block">{restaurant.blurb}</p>}
      <Dishes restaurant={restaurant} compact />
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="pr-body flex min-h-[48px] cursor-pointer items-center text-left font-semibold text-link decoration-1 underline underline-offset-[0.4em]"
        >
          ดูร้านนี้
        </button>
      )}
    </div>
  )
}
