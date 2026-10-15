import { useCallback } from 'react'
import { ArrowRight, Link2 } from 'lucide-react'
import { baht } from '@/lib/format'
import { SimulatedBadge } from '@/components/SimulatedBadge'
import { DishSvgArt } from '../components/DishSvgArt'
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
  onShare?: () => void
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
}: Screen4ResultProps) {
  const handleShare = useCallback(async () => {
    if (onShare) {
      onShare()
      return
    }
    if (typeof window !== 'undefined') {
      const canonicalParams = new URLSearchParams()
      canonicalParams.set('step', '4')
      canonicalParams.set('dishA', dishA.slug)
      canonicalParams.set('dishB', dishB.slug)
      if (isSample) {
        canonicalParams.set('sample', 'true')
      }
      const shareUrl = `${window.location.origin}/pair/${data.campaignId}?${canonicalParams.toString()}`
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'คู่เมนูจาก Grab GemBond',
            text: `${dishA.name} x ${dishB.name}`,
            url: shareUrl,
          })
          return
        } catch {
          // Fallback to clipboard
        }
      }
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareUrl)
        } catch {
          // Fallback
        }
      }
    }
  }, [onShare, dishA.slug, dishA.name, dishB.slug, dishB.name, isSample, data.campaignId])

  const storeALabel = data.restaurantA.name.startsWith('ร้าน')
    ? `ไปยังหน้า${data.restaurantA.name}`
    : `ไปยังหน้าร้าน${data.restaurantA.name}`

  const storeBLabel = data.restaurantB.name.startsWith('ร้าน')
    ? `ไปยังหน้า${data.restaurantB.name}`
    : `ไปยังหน้าร้าน${data.restaurantB.name}`

  return (
    <div className="max-w-lg mx-auto py-4 flex flex-col gap-6 pb-20">
      {/* Origin Attribution & Heading */}
      <div className="text-center px-2">
        {isSample && (
          <div className="flex justify-center mb-2.5">
            <SimulatedBadge text="คู่เมนูตัวอย่างสำหรับการสาธิต" variant="pill" />
          </div>
        )}
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          {isSample ? 'คู่เมนูตัวอย่างสำหรับการสาธิต' : 'คู่เมนูที่คุณเลือก'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSample
            ? `ตัวอย่างการจับคู่เมนูจาก${data.restaurantA.name}และ${data.restaurantB.name}`
            : `คู่เมนูจาก${data.restaurantA.name}และ${data.restaurantB.name}`}
        </p>
      </div>

      {/* Editorial Shared Dining Stage */}
      <div className="rounded-3xl border border-[#DDE2DD] bg-[#F8FAF8] p-5 sm:p-6 shadow-xs flex flex-col gap-6">
        {/* Section A: Main Dish */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {`อาหารจานหลัก · ${data.restaurantA.name}`}
          </div>
          <DishSvgArt slug={dishA.slug} size="lg" className="w-full shadow-xs" />
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-lg sm:text-xl text-ink truncate">
                {dishA.name}
              </h3>
              <p className="figure font-semibold text-base sm:text-lg text-foreground mt-0.5">
                {baht(dishA.priceBaht)}
              </p>
            </div>
            <button
              type="button"
              onClick={onEditA}
              aria-label="เปลี่ยนจานหลัก"
              className="min-h-[48px] px-4 shrink-0 inline-flex items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              เปลี่ยนจานหลัก
            </button>
          </div>
        </div>

        {/* Connecting Symbol */}
        <div className="flex items-center justify-center -my-2" aria-hidden="true">
          <div className="h-px flex-1 bg-[#DDE2DD]" />
          <div className="mx-3 flex size-10 items-center justify-center rounded-full border border-[#DDE2DD] bg-white text-muted-foreground shadow-xs">
            <Link2 className="size-5 text-[#00B14F] rotate-45" />
          </div>
          <div className="h-px flex-1 bg-[#DDE2DD]" />
        </div>

        {/* Section B: Complement Dish */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {`ของว่างทานเล่น · ${data.restaurantB.name}`}
          </div>
          <DishSvgArt slug={dishB.slug} size="lg" className="w-full shadow-xs" />
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-lg sm:text-xl text-ink truncate">
                {dishB.name}
              </h3>
              <p className="figure font-semibold text-base sm:text-lg text-foreground mt-0.5">
                {baht(dishB.priceBaht)}
              </p>
            </div>
            <button
              type="button"
              onClick={onEditB}
              aria-label="เปลี่ยนของว่าง"
              className="min-h-[48px] px-4 shrink-0 inline-flex items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              เปลี่ยนของว่าง
            </button>
          </div>
        </div>
      </div>

      {/* Disclosures & Notices */}
      <div className="rounded-2xl border border-border/80 bg-secondary/50 p-4 text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          ราคาแสดงแยกตามร้าน และสั่งซื้อกับแต่ละร้านแยกกัน
        </p>
        <p className="text-xs text-muted-foreground">
          ข้อมูลเมนูและราคาเป็นข้อมูลจำลองเพื่อการสาธิตต้นแบบ (Prototype) ไม่ใช่ราคาขายจริงของร้านค้า
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-2">
        {/* Primary Share */}
        <button
          type="button"
          onClick={handleShare}
          className="h-[52px] min-h-[48px] w-full rounded-xl bg-[#00B14F] text-[#0A0A0A] font-heading font-bold text-[17px] shadow-sm hover:bg-[#009E46] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ring"
        >
          แชร์คู่เมนูนี้
        </button>

        {/* Store Ordering Channels */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onOpenStore(data.restaurantA.name)}
            className="w-full min-h-[48px] px-4 flex items-center justify-between rounded-xl border border-border bg-card text-foreground font-semibold text-[15px] hover:bg-secondary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span>{storeALabel}</span>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onOpenStore(data.restaurantB.name)}
            className="w-full min-h-[48px] px-4 flex items-center justify-between rounded-xl border border-border bg-card text-foreground font-semibold text-[15px] hover:bg-secondary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span>{storeBLabel}</span>
            <ArrowRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </button>
        </div>

        {/* Secondary Reset */}
        <button
          type="button"
          onClick={onReset}
          className="w-full min-h-[48px] px-4 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          จับคู่เมนูคู่อื่นใหม่
        </button>
      </div>
    </div>
  )
}
