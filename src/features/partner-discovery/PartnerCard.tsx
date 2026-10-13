import { ArrowRight, Clock, MapPin, UtensilsCrossed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Gem } from '@/components/GemMark'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { WhyMatch } from './WhyMatch'
import { useApp } from '@/app/store'
import { initial } from '@/lib/format'
import type { GrowthPlan, Merchant, PartnerRecommendation } from '@/domain/types'
import { cn } from '@/lib/utils'

export function PartnerCard({ rec, plan, partner, primary }: { rec: PartnerRecommendation; plan: GrowthPlan; partner: Merchant; primary?: boolean }) {
  const { dispatch } = useApp()
  const inMotion = plan.lifecycleStatus !== 'awaiting'
  const hours = `${partner.operatingHours.open}–${partner.operatingHours.close} น.`
  return (
    <Panel className={cn(primary && 'ring-2 ring-emerald-700/25')}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Gem glyph={initial(partner.name)} tone={primary ? 'self' : 'partner'} className={primary ? 'size-16 shrink-0' : 'size-14 shrink-0'} />
          <div className="min-w-0 flex-1">
            {primary && <p className="mb-1 text-[15px] font-medium text-emerald-700">เหมาะกับร้านคุณที่สุดตอนนี้</p>}
            <h3 className={cn('font-semibold text-forest', primary ? 'text-[22px]' : 'text-[20px]')}>{partner.name}</h3>
            <p className="text-muted-foreground">{partner.category}</p>
            <p className="mt-1.5 inline-block rounded-full bg-secondary px-3 py-0.5 text-[15px] font-semibold text-forest" title="ความเหมาะสมรวม ไม่ใช่การรับประกันผล">
              เหมาะ {rec.matchScore}/100
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-1.5 text-[15px] text-muted-foreground">
          <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{partner.neighborhood}</li>
          <li className="flex items-center gap-2"><Clock className="size-4 shrink-0" aria-hidden="true" />เปิดขาย {hours}</li>
          <li className="flex items-start gap-2"><UtensilsCrossed className="mt-1 size-4 shrink-0" aria-hidden="true" />{partner.menuCategories.join(' · ')}</li>
        </ul>
        <p>{partner.blurb}. สินค้าของทั้งสองร้านอาจช่วยให้ลูกค้ามีตัวเลือกสำหรับมื้ออาหารที่หลากหลายขึ้น</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-sage p-3.5">
            <p className="mb-1 text-[15px] font-semibold text-forest">ร้านคุณอาจได้</p>
            <p className="text-[15px]">{rec.benefitForYou}</p>
          </div>
          <div className="rounded-xl bg-sage p-3.5">
            <p className="mb-1 text-[15px] font-semibold text-forest">{partner.name}อาจได้</p>
            <p className="text-[15px]">{rec.benefitForPartner}</p>
          </div>
        </div>
        <WhyMatch rec={rec} />
        {inMotion && <StatusBadge status={plan.lifecycleStatus} className="self-start" />}
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-12 px-5 text-[16px]">
            <Link to={`/plans/${plan.id}`}>
              {inMotion ? 'ดูแผนนี้' : 'ดูแผนที่แนะนำ'}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          {!inMotion && (
            <Button
              variant="outline"
              className="h-12 px-5 text-[16px]"
              onClick={() => {
                dispatch({ type: 'decline', planId: plan.id })
                toast('เก็บไว้ในรายการ "ที่ยังไม่เข้าร่วม" แล้ว เปลี่ยนใจได้ทุกเมื่อ ไม่มีผลต่อการขายของคุณ')
              }}
            >
              ไม่สนใจร้านนี้
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}
