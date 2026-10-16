import { ArrowRight, Clock, MapPin, Utensils } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { Gem } from '@/components/GemMark'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { WhyMatch } from './WhyMatch'
import { useApp } from '@/app/store'
import { selfOf } from '@/app/selectors'
import { initial } from '@/lib/format'
import type { GrowthPlan, Merchant, PartnerRecommendation } from '@/domain/types'

const hoursOf = (m: Merchant) => `${m.operatingHours.open}–${m.operatingHours.close} น.`

function useDecline(plan: GrowthPlan) {
  const { dispatch } = useApp()
  return () => {
    if (dispatch({ type: 'decline', planId: plan.id })) toast('เก็บไว้ใน "ที่ยังไม่เข้าร่วม" แล้ว เปลี่ยนใจได้ทุกเมื่อ ไม่มีผลต่อการขายของคุณ')
    else toast.error('ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน')
  }
}

/** The two choices, same size: look at the plan, or not now. The lead recommendation gets the green one. */
function Choices({ plan, className, lead = true }: { plan: GrowthPlan; className?: string; lead?: boolean }) {
  const decline = useDecline(plan)
  const inMotion = plan.lifecycleStatus !== 'awaiting'
  return (
    <div className={className}>
      <Button asChild variant={lead ? 'default' : 'outline'} className="h-auto min-h-12 max-w-full shrink py-2 whitespace-normal px-6 text-[17px] font-bold">
        <Link to={`/plans/${plan.id}`}>
          {inMotion ? 'ดูแผนนี้' : 'ดูแผนที่แนะนำ'}
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
      {!inMotion && (
        <Button variant={lead ? 'outline' : 'ghost'} className="h-auto min-h-12 max-w-full shrink py-2 whitespace-normal px-6 text-[17px]" onClick={decline}>
          ไม่สนใจร้านนี้
        </Button>
      )}
    </div>
  )
}

/** The recommended partner: who they are, how the two shops line up, what each gains, then the choice. */
export function PrimaryMatch({ rec, plan, partner }: { rec: PartnerRecommendation; plan: GrowthPlan; partner: Merchant }) {
  const { state } = useApp()
  const me = selfOf(state)
  const rows = [
    { icon: Utensils, k: 'ของที่ขาย', mine: me.menuCategories.join(' · '), theirs: partner.menuCategories.join(' · ') },
    { icon: MapPin, k: 'ย่าน', mine: me.neighborhood, theirs: partner.neighborhood },
    { icon: Clock, k: 'เวลาเปิด', mine: hoursOf(me), theirs: hoursOf(partner) },
  ]
  return (
    <section aria-labelledby="primary-h" className="surface overflow-hidden">
      <div className="flex items-center gap-4 bg-accent px-6 py-5 md:px-8">
        <Gem glyph={initial(partner.name)} tone="partner" className="size-14 shrink-0 md:size-16" />
        <div className="min-w-0 flex-1">
          <h2 id="primary-h" className="text-[30px] leading-snug font-bold tracking-tight text-ink">{partner.name}</h2>
          <p className="text-[17px]">{partner.category}</p>
        </div>
        {plan.lifecycleStatus !== 'awaiting' && <StatusBadge status={plan.lifecycleStatus} className="hidden sm:inline-flex" />}
      </div>

      <div className="px-6 py-6 md:px-8">
        {plan.lifecycleStatus !== 'awaiting' && <StatusBadge status={plan.lifecycleStatus} className="mb-4 sm:hidden" />}
        <div className="hidden grid-cols-[8rem_1fr_1fr] gap-x-6 pb-2 text-[15px] font-bold md:grid" aria-hidden="true">
          <span />
          <span className="flex items-center gap-2"><Gem glyph={initial(me.name)} tone="self" className="size-6 shrink-0" />ร้านคุณ</span>
          <span className="flex items-center gap-2"><Gem glyph={initial(partner.name)} tone="partner" className="size-6 shrink-0" />{partner.name}</span>
        </div>
        <ul aria-label={`เปรียบเทียบร้านคุณกับ${partner.name}`} className="divide-y divide-border border-y border-border">
          {rows.map(({ icon: Icon, k, mine, theirs }) => (
            <li key={k} className="grid gap-x-6 gap-y-0.5 py-3 md:grid-cols-[8rem_1fr_1fr]">
              <p className="flex items-center gap-2 text-[15px] text-muted-foreground"><Icon className="size-[18px]" aria-hidden="true" />{k}</p>
              <p><span className="font-semibold md:hidden">ร้านคุณ: </span>{mine}</p>
              <p><span className="font-semibold md:hidden">{partner.name}: </span>{theirs}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-5 flex flex-col gap-3">
          <li className="flex items-start gap-3"><Gem glyph={initial(me.name)} tone="self" className="mt-0.5 size-7 shrink-0" /><span><span className="sr-only">ประโยชน์ต่อร้านคุณ: </span>{rec.benefitForYou}</span></li>
          <li className="flex items-start gap-3"><Gem glyph={initial(partner.name)} tone="partner" className="mt-0.5 size-7 shrink-0" /><span><span className="sr-only">ประโยชน์ต่อ{partner.name}: </span>{rec.benefitForPartner}</span></li>
        </ul>

        <Choices plan={plan} className="mt-6 flex flex-wrap gap-3" />
        <WhyMatch rec={rec} />
      </div>
    </section>
  )
}

/** An alternative partner: one readable row, quieter buttons, the same reasons on request. */
export function AlternativeMatch({ rec, plan, partner }: { rec: PartnerRecommendation; plan: GrowthPlan; partner: Merchant }) {
  return (
    <li className="py-6">
      <div className="flex items-start gap-4">
        <Gem glyph={initial(partner.name)} tone="partner" className="size-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[22px] font-bold text-ink">{partner.name}</h3>
          <p className="text-[15px] text-muted-foreground">{partner.category} · {partner.neighborhood} · {hoursOf(partner)}</p>
          <p className="mt-2 max-w-[56ch]">{rec.benefitForYou}</p>
          {plan.lifecycleStatus !== 'awaiting' && <div className="mt-2"><StatusBadge status={plan.lifecycleStatus} /></div>}
          <Choices plan={plan} lead={false} className="mt-3 flex flex-wrap gap-3" />
          <WhyMatch rec={rec} />
        </div>
      </div>
    </li>
  )
}
