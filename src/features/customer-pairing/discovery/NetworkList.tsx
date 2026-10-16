import { ChevronRight } from 'lucide-react'
import { GemMark } from '@/components/GemMark'
import { RoleIcon } from '../components/RoleIcon'
import { cn } from '@/lib/utils'
import { pickText, type DemoNetwork, type NetPairing } from '../network'

const row =
  'pr-row pr-press flex w-full min-h-[64px] cursor-pointer items-center justify-between gap-3 border-b border-border px-1 py-3 text-left hover:bg-secondary'

/** A pairing as one line: restaurant, the bond, restaurant. The second line says what is picked from each. */
export function PairingRowLabel({ p }: { p: NetPairing }) {
  return (
    <span className="min-w-0">
      <span className="pr-body flex flex-wrap items-center gap-x-2 font-bold">
        <span>{p.first.shortName}</span>
        <GemMark className="size-6 shrink-0" />
        <span>{p.second.shortName}</span>
      </span>
      <span className="pr-caption mt-0.5 flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
        <RoleIcon restaurantId={p.first.id} className="size-4 text-link" />
        <span>{pickText(p.first.role.pick)}</span>
        <span aria-hidden="true">+</span>
        <RoleIcon restaurantId={p.second.id} className="size-4 text-link" />
        <span>{pickText(p.second.role.pick)}</span>
      </span>
    </span>
  )
}

/** Pairings other than the one in focus. Choosing one swaps it into the spotlight. */
export function PairingList({
  pairings,
  onSelectPairing,
  heading,
  selectedId,
}: {
  pairings: NetPairing[]
  onSelectPairing: (id: string) => void
  heading: string
  selectedId?: string
}) {
  if (pairings.length === 0) return null
  return (
    <section aria-labelledby="pairing-list-heading">
      <h2 id="pairing-list-heading" className="pr-name pb-2">
        {heading}
      </h2>
      <ul className="border-t border-border">
        {pairings.map((p) => (
          <li key={p.id}>
            <button type="button" aria-pressed={selectedId === p.id} onClick={() => onSelectPairing(p.id)} className={cn(row, selectedId === p.id && 'bg-accent')}>
              <PairingRowLabel p={p} />
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The directory: every restaurant on one quiet line, with how many pairings it is in. */
export function RestaurantList({
  network,
  restaurantId,
  onSelectRestaurant,
}: {
  network: DemoNetwork
  restaurantId: string | null
  onSelectRestaurant: (id: string) => void
}) {
  return (
    <ul className="border-t border-border">
      {network.restaurants.map((r) => (
        <li key={r.id}>
          <button type="button" aria-pressed={restaurantId === r.id} onClick={() => onSelectRestaurant(r.id)} className={cn(row, restaurantId === r.id && 'bg-accent')}>
            <span className="min-w-0">
              <span className="pr-body block font-bold">{r.name}</span>
              <span className="pr-caption flex items-center gap-1.5 text-muted-foreground">
                <RoleIcon restaurantId={r.id} className="size-4 text-link" />
                {r.role.section}
              </span>
            </span>
            <span className="pr-caption shrink-0 text-muted-foreground">{r.pairingIds.length} คู่ร้าน</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
