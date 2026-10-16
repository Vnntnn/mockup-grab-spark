import { forwardRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PairingOverview } from '../components/PairingOverview'
import { RoleIcon } from '../components/RoleIcon'
import { RestaurantFacts } from '../components/RestaurantFacts'
import { pickText, type DemoNetwork, type NetPairing, type NetRestaurant } from '../network'
import { PairingRowLabel } from './NetworkList'

export interface SpotlightProps {
  network: DemoNetwork
  /** The pairing in focus: the one the visitor picked, else the suggested one. Null while a restaurant is in focus. */
  pairing: NetPairing | null
  restaurant: NetRestaurant | null
  /** True while the suggested pairing is shown only because nothing was picked. */
  isSuggested: boolean
  onSelectRestaurant: (id: string) => void
  onSelectPairing: (id: string) => void
  onBack: () => void
  onStart: (pairingId: string) => void
}

/** What you pick from each restaurant, and the one button that starts the dish choice. */
export function PairingAction({ pairing, onStart }: { pairing: NetPairing; onStart: (pairingId: string) => void }) {
  return (
    <>
      <p className="pr-caption mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground [@media(max-height:760px)]:max-lg:hidden">
        <span>เลือก 1</span>
        <RoleIcon restaurantId={pairing.first.id} className="size-4 text-link" />
        <span>{pickText(pairing.first.role.pick)}</span>
        <span>+</span>
        <span>1</span>
        <RoleIcon restaurantId={pairing.second.id} className="size-4 text-link" />
        <span>{pickText(pairing.second.role.pick)}</span>
      </p>
      <Button
        type="button"
        onClick={() => onStart(pairing.id)}
        className="min-h-[52px] w-full rounded-[0.625rem] bg-brand text-[17px] font-bold text-primary-foreground hover:bg-[#009e46] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        เลือกเมนูจากคู่นี้
      </Button>
    </>
  )
}

/** Phone only: the same action pinned to the bottom edge, naming the pairing it acts on. */
export function StartBar({ pairing, onStart }: { pairing: NetPairing; onStart: (pairingId: string) => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 pb-safe pt-3 [@media(max-height:760px)]:pt-2 lg:hidden">
      <p className="pr-caption mb-2 truncate font-semibold [@media(max-height:760px)]:mb-1">
        {pairing.first.shortName} + {pairing.second.shortName}
      </p>
      <PairingAction pairing={pairing} onStart={onStart} />
    </div>
  )
}

const linkButton =
  'pr-body pr-press -ml-2 flex min-h-[48px] cursor-pointer items-center gap-2 px-2 font-semibold text-link decoration-1 underline underline-offset-[0.4em]'

/**
 * The one thing in focus on /pair: a pairing (the suggested one at first) with the single primary action, or a restaurant
 * with its pairings. Picking anything elsewhere on the page swaps this panel in place; there is no sheet to dismiss.
 */
export const Spotlight = forwardRef<HTMLHeadingElement, SpotlightProps>(function Spotlight(
  { network, pairing, restaurant, isSuggested, onSelectRestaurant, onSelectPairing, onBack, onStart },
  headingRef,
) {
  if (pairing) {
    return (
      <section aria-labelledby="spotlight-heading" className="pr-swap rounded-[0.625rem] border border-border bg-card p-4 lg:p-6" key={pairing.id}>
        {!isSuggested && (
          <button type="button" onClick={onBack} className={linkButton}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            กลับไปคู่ร้านแนะนำ
          </button>
        )}
        <h2 id="spotlight-heading" ref={headingRef} tabIndex={-1} className="pr-caption mb-3 font-semibold text-muted-foreground outline-none">
          {isSuggested ? 'คู่ร้านแนะนำ' : 'คู่ร้าน'}
        </h2>
        <PairingOverview first={pairing.first} second={pairing.second} pairingId={pairing.id} withPlates onOpenRestaurant={onSelectRestaurant} />
        {/* phones get the same action in a bar pinned to the bottom (StartBar), so it is never a scroll away */}
        <div className="mt-5 hidden border-t border-border bg-card pb-1 pt-4 lg:sticky lg:bottom-0 lg:block">
          <PairingAction pairing={pairing} onStart={onStart} />
        </div>
      </section>
    )
  }
  if (!restaurant) return null
  const mine = network.pairings.filter((p) => restaurant.pairingIds.includes(p.id))
  return (
    <section aria-labelledby="spotlight-heading" className="pr-swap rounded-[0.625rem] border border-border bg-card p-4 lg:p-6" key={restaurant.id}>
      <button type="button" onClick={onBack} className={linkButton}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        คู่ร้านทั้งหมด
      </button>
      <h2 id="spotlight-heading" ref={headingRef} tabIndex={-1} className="sr-only">
        {restaurant.name}
      </h2>
      <RestaurantFacts restaurant={restaurant} headingLevel="h3" />
      <h3 className="pr-name mt-6">คู่ร้านของร้านนี้</h3>
      <ul className="mt-2 border-t border-border">
        {mine.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelectPairing(p.id)}
              className={cn('pr-row flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-3 border-b border-border text-left')}
            >
              <PairingRowLabel p={p} />
              <span className="pr-caption shrink-0 font-semibold text-link">ดูคู่นี้</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pr-caption mt-4 text-muted-foreground">เวลาเปิดและเมนูเป็นข้อมูลตัวอย่าง</p>
    </section>
  )
})
