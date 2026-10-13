import { Compass, ShieldCheck, Undo2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PartnerCard } from './PartnerCard'
import { useApp } from '@/app/store'
import { matching, partnerOf, selfOf } from '@/app/selectors'

export function Opportunities() {
  const { state, dispatch } = useApp()
  const me = selfOf(state)
  const { recommendations, rejected } = matching(state)
  const open = recommendations.filter((r) => state.plans[r.proposedPlanId]?.lifecycleStatus !== 'declined')
  const declined = recommendations.filter((r) => state.plans[r.proposedPlanId]?.lifecycleStatus === 'declined')
  const [primary, ...others] = open
  const fairnessRejected = rejected.filter((r) => r.stage === 'fairness')

  return (
    <>
      <PageHeader title="หาโอกาสเติบโต" lead="เราเลือกร้านที่น่าจะเข้ากับร้านคุณมาให้ ไม่ต้องค้นหาหรือตั้งค่าเอง" />

      {!primary ? (
        <Empty className="mb-6 rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass />
            </EmptyMedia>
            <EmptyTitle className="text-[20px]">ตอนนี้ยังไม่มีร้านที่เหมาะจะแนะนำ</EmptyTitle>
            <EmptyDescription className="text-[16px]">
              {me.participationPreference === 'not_now'
                ? 'คุณเลือกพักการรับคำแนะนำไว้ เปลี่ยนได้ที่หน้า "ร้านของฉัน"'
                : 'ไม่ใช่ความผิดของร้านคุณ อาจเป็นเพราะเวลาเปิดขายหรือย่านยังไม่ตรงกับร้านอื่น ลองดูที่หน้า "ร้านของฉัน" ว่าข้อมูลถูกต้องหรือไม่'}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline" className="h-11 text-[15px]">
            <Link to="/store">ไปที่ร้านของฉัน</Link>
          </Button>
        </Empty>
      ) : (
        <div className="mb-8 flex flex-col gap-5">
          <PartnerCard rec={primary} plan={state.plans[primary.proposedPlanId]} partner={partnerOf(state, state.plans[primary.proposedPlanId])} primary />
          {others.length > 0 && (
            <>
              <h2 className="mt-2 text-[20px] font-semibold text-forest">ตัวเลือกอื่นที่ก็น่าสนใจ</h2>
              {others.map((r) => (
                <PartnerCard key={r.id} rec={r} plan={state.plans[r.proposedPlanId]} partner={partnerOf(state, state.plans[r.proposedPlanId])} />
              ))}
            </>
          )}
        </div>
      )}

      {declined.length > 0 && (
        <Panel title="ที่ยังไม่เข้าร่วม" icon={<Undo2 />} className="mb-6">
          <ul className="flex flex-col gap-3">
            {declined.map((r) => {
              const plan = state.plans[r.proposedPlanId]
              const p = partnerOf(state, plan)
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3">
                  <span>{p.name}</span>
                  <Button
                    variant="outline"
                    className="h-11 text-[15px]"
                    onClick={() => {
                      dispatch({ type: 'reopen', planId: plan.id })
                      toast(`นำ${p.name}กลับมาในรายการแล้ว`)
                    }}
                  >
                    เปลี่ยนใจ ดูแผนอีกครั้ง
                  </Button>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[15px] text-muted-foreground">การไม่เข้าร่วมไม่กระทบสิทธิการขายตามปกติของร้านคุณ</p>
        </Panel>
      )}

      <Panel title="เราดูแลความเป็นธรรมให้อย่างไร" icon={<ShieldCheck />}>
        <p className="mb-2">ก่อนแผนไหนมาถึงคุณ ระบบตรวจก่อนว่าแผนไม่บังคับลดราคา ไม่บังคับแบ่งยอดขาย และไม่มีค่าใช้จ่ายที่ไม่บอก ถ้าไม่ผ่านจะไม่ถูกส่งมาให้คุณเลย</p>
        <p className="text-muted-foreground">
          ครั้งนี้ระบบคัดแผนที่ไม่ผ่านออก {fairnessRejected.length} แผน {rejected.length - fairnessRejected.length > 0 && `และไม่แนะนำร้านที่ย่าน เวลา หรือประเภทอาหารไม่เหมาะอีก ${rejected.length - fairnessRejected.length} ร้าน`}
        </p>
      </Panel>
    </>
  )
}
