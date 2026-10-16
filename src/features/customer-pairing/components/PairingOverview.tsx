import { BondColumns } from './BondColumns'
import { APPROVED_SAMPLE_PAIR, DEFAULT_CAMPAIGN_ID, dishNameToSlug } from '../data'
import { RestaurantSide } from './RestaurantFacts'
import type { NetRestaurant } from '../network'

/** The dish drawn for a restaurant: the approved sample pair's dishes for the campaign pairing, else the first dish on its menu. */
function exampleDish(r: NetRestaurant, pairingId: string | undefined) {
  const wanted: string[] = pairingId === DEFAULT_CAMPAIGN_ID ? [APPROVED_SAMPLE_PAIR.dishASlug, APPROVED_SAMPLE_PAIR.dishBSlug] : []
  const item = r.menu.find((m) => wanted.includes(dishNameToSlug(m.name))) ?? r.menu[0]
  const slug = item ? dishNameToSlug(item.name) : ''
  return item && slug ? { slug, dishName: item.name } : undefined
}

/**
 * A pairing as two restaurants side by side: name, what you pick there, its sample dishes with prices. Each dish sits under
 * the name of the restaurant it belongs to, so ownership is never left to proximity. Shared by the discovery spotlight and
 * the wizard's first screen.
 */
export function PairingOverview({
  first,
  second,
  detailed,
  onOpenRestaurant,
  pairingId,
  withPlates,
}: {
  first: NetRestaurant
  second: NetRestaurant
  detailed?: boolean
  onOpenRestaurant?: (id: string) => void
  pairingId?: string
  /** Draw one of each restaurant's own dishes above its name. */
  withPlates?: boolean
}) {
  const plateA = withPlates ? exampleDish(first, pairingId) : undefined
  const plateB = withPlates ? exampleDish(second, pairingId) : undefined
  return (
    <>
      <BondColumns
        tight
        left={<RestaurantSide restaurant={first} detailed={detailed} plate={plateA && { ...plateA, side: 'a' }} onOpen={onOpenRestaurant && (() => onOpenRestaurant(first.id))} />}
        right={<RestaurantSide restaurant={second} detailed={detailed} plate={plateB && { ...plateB, side: 'b' }} onOpen={onOpenRestaurant && (() => onOpenRestaurant(second.id))} />}
      />
      <p className="pr-caption mt-3 text-muted-foreground">เวลาเปิดและเมนูเป็นข้อมูลตัวอย่าง</p>
    </>
  )
}
