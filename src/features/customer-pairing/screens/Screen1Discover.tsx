import { Gem } from '@/components/GemMark'
import { initial, baht } from '@/lib/format'
import { DishSvgArt } from '../components/DishSvgArt'
import { APPROVED_SAMPLE_PAIR } from '../data'
import type { PairingCampaignData } from '../types'

export interface Screen1DiscoverProps {
  data: PairingCampaignData
  onStart: () => void
  onLoadSample: () => void
}

export function Screen1Discover({
  data,
  onStart,
  onLoadSample,
}: Screen1DiscoverProps) {
  const sampleDishA =
    data.menuA.find((d) => d.slug === APPROVED_SAMPLE_PAIR.dishASlug) ??
    data.menuA[0]
  const sampleDishB =
    data.menuB.find((d) => d.slug === APPROVED_SAMPLE_PAIR.dishBSlug) ??
    data.menuB[0]

  return (
    <div className="flex flex-col gap-6 py-4 max-w-lg mx-auto">
      {/* Restaurant Chips Header */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Gem
              glyph={data.restaurantA.id === 'm-khaohom' ? 'ข' : initial(data.restaurantA.name).charAt(0)}
              tone="self"
              className="size-7 shrink-0"
            />
            <div className="text-left leading-tight">
              <span className="block font-bold text-[14px] text-ink">
                {data.restaurantA.name}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {data.restaurantA.category}
              </span>
            </div>
          </div>

          <div
            className="flex items-center text-muted-foreground/40 px-0.5"
            aria-hidden="true"
          >
            <div className="h-px w-3 bg-border" />
            <svg
              className="size-2 text-muted-foreground/60 mx-1"
              viewBox="0 0 8 8"
              fill="currentColor"
            >
              <polygon points="4,0 8,4 4,8 0,4" />
            </svg>
            <div className="h-px w-3 bg-border" />
          </div>

          <div className="flex items-center gap-2">
            <Gem
              glyph={data.restaurantB.id === 'm-satay' ? 'ส' : initial(data.restaurantB.name).charAt(0)}
              tone="partner"
              className="size-7 shrink-0"
            />
            <div className="text-left leading-tight">
              <span className="block font-bold text-[14px] text-ink">
                {data.restaurantB.name}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {data.restaurantB.category.includes('ทานเล่น')
                  ? 'ของว่างทานเล่น'
                  : data.restaurantB.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Headline */}
      <div className="text-center px-2">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          จับคู่เมนูจาก 2 ร้านในย่านคุณ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          เลือก 1 เมนูจานหลัก และ 1 ของว่างจาก 2 ร้านพันธมิตร เพื่อสร้างชุดเมนูคู่สำหรับมื้อพิเศษ
        </p>
      </div>

      {/* Hero Visual Composition: Interlocking Dual Dish Showcase */}
      <div className="my-2 flex items-center justify-center">
        <div className="relative flex items-center justify-center -space-x-6 sm:-space-x-8">
          <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            <DishSvgArt
              slug="khao-man-gai-tom"
              size="md"
              standaloneLabel="ข้าวมันไก่ต้ม"
            />
          </div>
          <div className="relative z-20 -mt-6 sm:-mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <DishSvgArt
              slug="moo-satay-10"
              size="md"
              standaloneLabel="หมูสะเต๊ะ 10 ไม้"
            />
          </div>
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStart}
          className="h-[52px] min-h-[48px] w-full rounded-xl bg-[#00B14F] text-[#0A0A0A] font-heading font-bold text-[17px] shadow-sm hover:bg-[#009E46] transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-ring"
        >
          เริ่มจับคู่เมนู
        </button>
      </div>

      {/* Secondary Sample Pairing Shelf */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-center mt-2">
        <h2 className="font-heading font-semibold text-xs tracking-wide text-muted-foreground uppercase">
          คู่เมนูตัวอย่างสำหรับการสาธิต
        </h2>
        <div className="mt-2 text-sm text-ink font-medium">
          <span>{sampleDishA ? `${sampleDishA.name} (${baht(sampleDishA.priceBaht)})` : 'ข้าวมันไก่ต้ม (฿65)'}</span>
          <span className="mx-2 text-muted-foreground">+</span>
          <span>{sampleDishB ? `${sampleDishB.name} (${baht(sampleDishB.priceBaht)})` : 'หมูสะเต๊ะ 10 ไม้ (฿120)'}</span>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={onLoadSample}
            className="min-h-[48px] px-4 inline-flex items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            ดูคู่นี้
          </button>
        </div>
      </div>
    </div>
  )
}
