import { baht } from '@/lib/format'
import { PairingOverview } from '../components/PairingOverview'
import { APPROVED_SAMPLE_PAIR } from '../data'
import { pickText, toNetRestaurant } from '../network'
import type { PairingCampaignData } from '../types'

export interface Screen1DiscoverProps {
  data: PairingCampaignData
  onStart: () => void
  onLoadSample: () => void
  /** Back to the map and list of all pairings. */
  onDiscover?: () => void
}

const link = 'pr-body flex min-h-[48px] cursor-pointer items-center font-semibold text-link decoration-1 underline underline-offset-[0.4em]'

/** The overview of one pairing, in the same two-column grammar as everywhere else. Also where a shared campaign link lands. */
export function Screen1Discover({ data, onStart, onLoadSample, onDiscover }: Screen1DiscoverProps) {
  const sampleDishA = data.menuA.find((d) => d.slug === APPROVED_SAMPLE_PAIR.dishASlug) ?? data.menuA[0]
  const sampleDishB = data.menuB.find((d) => d.slug === APPROVED_SAMPLE_PAIR.dishBSlug) ?? data.menuB[0]

  return (
    <div className="px-4 pb-10 pt-2 lg:px-0">
      <h1 className="pr-display">จับคู่เมนูจาก 2 ร้านในย่านคุณ</h1>
      <p className="pr-body mt-2 text-muted-foreground">
        เลือก 1 {pickText(data.roleA.pick)} + 1 {pickText(data.roleB.pick)} แล้วดูคู่เมนูของคุณ
      </p>

      <div className="mt-4">
        <PairingOverview first={toNetRestaurant(data.restaurantA)} second={toNetRestaurant(data.restaurantB)} pairingId={data.campaignId} withPlates detailed />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-[0.625rem] bg-brand px-8 font-heading text-[17px] font-bold text-primary-foreground transition-colors hover:bg-[#009e46]"
      >
        เริ่มจับคู่เมนู
      </button>

      {data.hasSample && (
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3">
          <div className="min-w-0">
            <h2 className="pr-caption font-semibold text-muted-foreground">คู่เมนูตัวอย่างสำหรับการสาธิต</h2>
            <p className="pr-body font-medium">
              <span className="inline-block max-w-full">{`${sampleDishA.name} (${baht(sampleDishA.priceBaht)})`}</span>
              <span className="mx-1.5 text-muted-foreground">+</span>
              <span className="inline-block max-w-full">{`${sampleDishB.name} (${baht(sampleDishB.priceBaht)})`}</span>
            </p>
          </div>
          <button type="button" onClick={onLoadSample} className={`${link} shrink-0 px-2`}>
            ดูคู่นี้
          </button>
        </div>
      )}

      {onDiscover && (
        <button type="button" onClick={onDiscover} className={`${link} mt-1`}>
          ดูคู่ร้านอื่น
        </button>
      )}
    </div>
  )
}
