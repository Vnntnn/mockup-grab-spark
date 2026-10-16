import { Drumstick, CupSoda, IceCreamBowl, Utensils, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * What a restaurant contributes to a pairing, as a picture: main dish, snack, drink, dessert. The same glyph is used on the
 * map marker, in lists, on the dish steps and on the result, so it can be learned once. Always paired with the word
 * (the icon alone never carries the meaning), hence aria-hidden.
 */
export function RoleIcon({ restaurantId, className, ...rest }: { restaurantId: string } & LucideProps) {
  const props: LucideProps = { className: cn('size-5 shrink-0', className), 'aria-hidden': true, focusable: false, ...rest }
  switch (restaurantId) {
    case 'm-satay':
      return <Drumstick {...props} />
    case 'm-tea':
      return <CupSoda {...props} />
    case 'm-dessert':
      return <IceCreamBowl {...props} />
    default:
      return <Utensils {...props} />
  }
}
