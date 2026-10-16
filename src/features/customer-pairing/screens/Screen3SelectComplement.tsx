import { ChosenStatus } from '../components/ChosenStatus'
import { DishMenu } from '../components/DishMenu'
import { RoleIcon } from '../components/RoleIcon'
import type { PairingCampaignData, PairingDish } from '../types'

export interface Screen3SelectComplementProps {
  data: PairingCampaignData
  selectedSlugB: string | null
  onSelectB: (dish: PairingDish) => void
}

/** The first choice and the way to change it live in the pinned pair progress above, so this screen is only the menu. */
export function Screen3SelectComplement({ data, selectedSlugB, onSelectB }: Screen3SelectComplementProps) {
  const name = data.restaurantB.name
  return (
    <div>
      <h1 className="pr-title flex items-start gap-3 px-4 pb-3 pt-4">
        <RoleIcon restaurantId={data.restaurantB.id} className="mt-0.5 size-7 text-link" />
        <span>
        เลือก{data.roleB.pick}จาก <span className="inline-block max-w-full">{name}</span>
        </span>
      </h1>
      <ChosenStatus owner={name} dish={data.menuB.find((d) => d.slug === selectedSlugB)} />
      <DishMenu slot="B" label={`เลือก${data.roleB.pick}จาก${name}`} options={data.menuB} selectedSlug={selectedSlugB} onSelect={onSelectB} />
    </div>
  )
}
