import { Check, ChevronRight, Compass, Info, Pencil, Receipt, RotateCcw, Share2, Store } from 'lucide-react'
import { baht } from '@/lib/format'
import { BondColumns } from '../components/BondColumns'
import { DishSvgArt } from '../components/DishSvgArt'
import { RoleIcon } from '../components/RoleIcon'
import type { PairingCampaignData, PairingDish } from '../types'

export interface Screen4ResultProps {
  data: PairingCampaignData
  dishA: PairingDish
  dishB: PairingDish
  isSample: boolean
  onEditA: () => void
  onEditB: () => void
  onReset: () => void
  onOpenStore: (merchantName: string) => void
  onShare: () => void
  /** True for a moment after the link was copied: the share button says so itself. */
  copied?: boolean
  /** Back to the map and list of all pairings. */
  onDiscover?: () => void
}

const textAction = 'pr-body pr-press flex min-h-[48px] cursor-pointer items-center font-semibold text-link decoration-1 underline underline-offset-[0.4em]'

/**
 * One dish, directly under its own restaurant: restaurant, plate, dish, price, change. Two of these sit in BondColumns,
 * so which dish belongs to which restaurant never depends on reading across the page. Prices are never summed.
 */
function Side({
  index,
  restaurantId,
  section,
  restaurantName,
  dish,
  editLabel,
  onEdit,
}: {
  index: number
  restaurantId: string
  section: string
  restaurantName: string
  dish: PairingDish
  editLabel: string
  onEdit: () => void
}) {
  return (
    <div className="min-w-0">
      <p className="pr-body pt-1 font-bold">{restaurantName}</p>
      <p className="pr-caption flex items-center gap-1.5 text-muted-foreground">
        <RoleIcon restaurantId={restaurantId} className="size-4 text-link" />
        {section}
      </p>
      <div className="pr-pop my-3" style={{ ['--i' as string]: index }}>
        <DishSvgArt slug={dish.slug} />
      </div>
      <h2 key={dish.slug} className="pr-name pr-swap">
        {dish.name}
      </h2>
      <p className="pr-body pr-price">{baht(dish.priceBaht)}</p>
      <button type="button" onClick={onEdit} aria-label={editLabel} className={`${textAction} -ml-1 gap-1.5 px-1`}>
        <Pencil className="size-4 shrink-0" aria-hidden="true" />
        {editLabel}
      </button>
    </div>
  )
}

function StoreRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pr-body pr-press flex min-h-[52px] w-full cursor-pointer items-center justify-between border-b border-border bg-card px-4 text-left font-semibold transition-colors hover:bg-secondary"
    >
      <span className="flex items-center gap-3">
        <Store className="size-5 shrink-0 text-link" aria-hidden="true" />
        {label}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

export function Screen4Result({
  data,
  dishA,
  dishB,
  isSample,
  onEditA,
  onEditB,
  onReset,
  onOpenStore,
  onShare,
  copied,
  onDiscover,
}: Screen4ResultProps) {
  const storeLabel = (name: string) => (name.startsWith('ร้าน') ? `ไปยังหน้า${name}` : `ไปยังหน้าร้าน${name}`)

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="px-4 pb-1 pt-3 lg:pt-6">
        {isSample && (
          <p className="pr-caption mb-2 inline-block rounded-sm border border-link px-2 font-semibold text-link">
            คู่เมนูตัวอย่างสำหรับการสาธิต
          </p>
        )}
        <h1 className="pr-display">{isSample ? 'คู่เมนูตัวอย่างสำหรับการสาธิต' : 'คู่เมนูที่คุณเลือก'}</h1>
        <p className="pr-body mt-2 text-muted-foreground">
          {isSample
            ? `ตัวอย่างการจับคู่เมนูจาก${data.restaurantA.name}และ${data.restaurantB.name}`
            : `คู่เมนูจาก${data.restaurantA.name}และ${data.restaurantB.name}`}
        </p>
      </div>

      <BondColumns
        className="mt-6 px-4"
        left={
          <Side index={0} restaurantId={data.restaurantA.id} section={data.roleA.section} restaurantName={data.restaurantA.name} dish={dishA} editLabel={`เปลี่ยน${data.roleA.pick}`} onEdit={onEditA} />
        }
        right={
          <Side index={1} restaurantId={data.restaurantB.id} section={data.roleB.section} restaurantName={data.restaurantB.name} dish={dishB} editLabel={`เปลี่ยน${data.roleB.pick}`} onEdit={onEditB} />
        }
      />

      <div className="mt-6 px-4 pb-12">
        <p className="pr-body flex items-start gap-3 font-semibold">
          <Receipt className="mt-0.5 size-6 shrink-0 text-link" aria-hidden="true" />
          <span>ราคาแสดงแยกตามร้าน และสั่งซื้อกับแต่ละร้านแยกกัน</span>
        </p>
        <p className="pr-caption mt-2 flex items-start gap-3 text-muted-foreground">
          <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>ข้อมูลเมนูและราคาเป็นข้อมูลจำลองเพื่อการสาธิตต้นแบบ (Prototype) ไม่ใช่ราคาขายจริงของร้านค้า</span>
        </p>

        <button
          type="button"
          onClick={onShare}
          className="mt-5 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] bg-brand font-heading text-[17px] font-bold text-primary-foreground transition-colors hover:bg-[#009e46]"
        >
          {copied ? (
            <>
              <Check key="done" className="pop size-5 stroke-[3]" aria-hidden="true" />
              <span key="done-text" className="pr-swap">คัดลอกลิงก์แล้ว</span>
            </>
          ) : (
            <>
              <Share2 className="size-5" aria-hidden="true" />
              แชร์คู่เมนูนี้
            </>
          )}
        </button>

        <div className="mt-5 border-t border-border">
          <StoreRow label={storeLabel(data.restaurantA.name)} onClick={() => onOpenStore(data.restaurantA.name)} />
          <StoreRow label={storeLabel(data.restaurantB.name)} onClick={() => onOpenStore(data.restaurantB.name)} />
        </div>

        <div className="mt-2 flex flex-col">
          <button type="button" onClick={onReset} className={`${textAction} gap-2`}>
            <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
            จับคู่เมนูคู่อื่นใหม่
          </button>
          {onDiscover && (
            <button type="button" onClick={onDiscover} className={`${textAction} gap-2`}>
              <Compass className="size-4 shrink-0" aria-hidden="true" />
              ดูคู่ร้านอื่น
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
