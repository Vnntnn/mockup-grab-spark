import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Gem } from '@/components/GemMark'
import { PageHeader } from '@/components/PageHeader'
import { EmptyArt } from '@/components/visual'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useApp } from '@/app/store'
import { headlinePlan, partnerOf, visiblePlans } from '@/app/selectors'
import { initial } from '@/lib/format'
import type { GrowthPlan } from '@/domain/types'

export function PlansList() {
  const { state } = useApp()
  // other recommendations live on "หาโอกาสเติบโต"; here: the plan in front of the owner, and anything they opened, joined or set aside
  const head = headlinePlan(state)
  const plans = visiblePlans(state).filter((p) => p.lifecycleStatus !== 'awaiting' || p.id === head?.id)
  const groups: { title: string; items: GrowthPlan[] }[] = [
    { title: 'รอคุณพิจารณา', items: plans.filter((p) => ['awaiting', 'interested', 'ready'].includes(p.lifecycleStatus)) },
    { title: 'กำลังดำเนินการและเสร็จสิ้น', items: plans.filter((p) => ['active', 'completed'].includes(p.lifecycleStatus)) },
    { title: 'ยังไม่เข้าร่วมหรือถูกยกเลิก', items: plans.filter((p) => ['declined', 'cancelled'].includes(p.lifecycleStatus)) },
  ]
  return (
    <>
      <PageHeader title="แผนของฉัน" />
      {plans.length === 0 ? (
        <Empty className="surface">
          <EmptyHeader>
            <EmptyArt className="mx-auto" />
            <EmptyTitle className="text-[22px]">ยังไม่มีแผน</EmptyTitle>
            <EmptyDescription className="text-[17px]">เมื่อมีร้านที่เหมาะ เราจะเตรียมแผนให้ที่นี่</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.filter((g) => g.items.length).map((g, gi) => (
            <section key={g.title} aria-labelledby={`g${gi}`}>
              <h2 id={`g${gi}`} className="mb-3 text-[17px] font-bold text-muted-foreground">{g.title}</h2>
              <ul className="flex flex-col gap-3">
                {g.items.map((p) => {
                  const partner = partnerOf(state, p)
                  return (
                    <li key={p.id}>
                      <Link to={`/plans/${p.id}`} className="surface pressable flex items-center gap-4 px-5 py-4" aria-label={`เปิดดูแผนกับ${partner.name}`}>
                        <Gem glyph={initial(partner.name)} tone="partner" className="size-12 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[22px] leading-snug font-bold text-ink">{partner.name}</span>
                          <span className="block text-[15px] text-muted-foreground">{p.durationDays} วัน · ฉบับที่ {p.planVersion}</span>
                          <StatusBadge status={p.lifecycleStatus} className="mt-2" />
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
