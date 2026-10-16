import { ChosenStatus } from '../components/ChosenStatus'
import { DishMenu } from '../components/DishMenu'
import { RoleIcon } from '../components/RoleIcon'
import type { PairingCampaignData, PairingDish } from '../types'

export interface Screen2SelectMainProps {
  data: PairingCampaignData
  selectedSlug: string | null
  onSelect: (dish: PairingDish) => void
}

export function Screen2SelectMain({ data, selectedSlug, onSelect }: Screen2SelectMainProps) {
  const name = data.restaurantA.name
  return (
    <div>
      <h1 className="pr-title flex items-start gap-3 px-4 pb-3 pt-4">
        <RoleIcon restaurantId={data.restaurantA.id} className="mt-0.5 size-7 text-link" />
        <span>
        เลือก{data.roleA.pick}จาก <span className="inline-block max-w-full">{name}</span>
        </span>
      </h1>
      <ChosenStatus owner={name} dish={data.menuA.find((d) => d.slug === selectedSlug)} />
      <DishMenu slot="A" label={`เลือก${data.roleA.pick}จาก${name}`} options={data.menuA} selectedSlug={selectedSlug} onSelect={onSelect} />
    </div>
  )
}
