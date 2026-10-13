import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useApp } from '@/app/store'
import { partnerOf, visiblePlans } from '@/app/selectors'
import type { GrowthPlan } from '@/domain/types'

export function PlansList() {
  const { state } = useApp()
  const plans = visiblePlans(state)
  const groups: { title: string; items: GrowthPlan[] }[] = [
    { title: 'รอคุณพิจารณา', items: plans.filter((p) => ['awaiting', 'interested', 'ready'].includes(p.lifecycleStatus)) },
    { title: 'กำลังดำเนินการและเสร็จสิ้น', items: plans.filter((p) => ['active', 'completed'].includes(p.lifecycleStatus)) },
    { title: 'ยังไม่เข้าร่วมหรือถูกยกเลิก', items: plans.filter((p) => ['declined', 'cancelled'].includes(p.lifecycleStatus)) },
  ]
  return (
    <>
      <PageHeader title="แผนของฉัน" lead="แผนทั้งหมดที่ GemBond เตรียมไว้ให้ร้านคุณ พร้อมสถานะล่าสุด" />
      {plans.length === 0 ? (
        <Empty className="rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyTitle className="text-[20px]">ยังไม่มีแผน</EmptyTitle>
            <EmptyDescription className="text-[16px]">เมื่อมีร้านที่เหมาะ เราจะเตรียมแผนให้ที่นี่ ไม่ต้องรีบ</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.filter((g) => g.items.length).map((g) => (
            <Panel key={g.title} title={g.title}>
              <ul className="flex flex-col divide-y">
                {g.items.map((p) => (
                  <li key={p.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2">
                      <p className="text-[18px] font-semibold">{p.title}</p>
                      <p className="text-muted-foreground">ร่วมกับ{partnerOf(state, p).name} · {p.durationDays} วัน · เงื่อนไขฉบับที่ {p.planVersion}</p>
                      <StatusBadge status={p.lifecycleStatus} className="self-start" />
                    </div>
                    <Button asChild variant="outline" className="h-11 shrink-0 text-[15px]">
                      <Link to={`/plans/${p.id}`}>
                        เปิดดูแผน
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
