import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { PageHeader } from '@/components/PageHeader'
import { EmptyArt } from '@/components/visual'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { AlternativeMatch, PrimaryMatch } from './PartnerCard'
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
      <PageHeader title="หาโอกาสเติบโต" lead="ร้านที่น่าจะเข้ากับร้านคุณ เราเลือกมาให้แล้ว" />

      {!primary ? (
        <Empty className="surface mb-6">
          <EmptyHeader>
            <EmptyArt className="mx-auto" />
            <EmptyTitle className="text-[22px]">ตอนนี้ยังไม่มีร้านที่เหมาะจะแนะนำ</EmptyTitle>
            <EmptyDescription className="text-[17px]">
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
        <>
          <PrimaryMatch rec={primary} plan={state.plans[primary.proposedPlanId]} partner={partnerOf(state, state.plans[primary.proposedPlanId])} />
          {others.length > 0 && (
            <section aria-labelledby="others-h" className="mt-12">
              <h2 id="others-h" className="text-[22px] font-bold text-ink">ตัวเลือกอื่น</h2>
              <ul className="divide-y divide-border">
                {others.map((r) => (
                  <AlternativeMatch key={r.id} rec={r} plan={state.plans[r.proposedPlanId]} partner={partnerOf(state, state.plans[r.proposedPlanId])} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {declined.length > 0 && (
        <section aria-labelledby="declined-h" className="mt-12">
          <h2 id="declined-h" className="text-[22px] font-bold text-ink">ที่ยังไม่เข้าร่วม</h2>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {declined.map((r) => {
              const plan = state.plans[r.proposedPlanId]
              const p = partnerOf(state, plan)
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="font-medium">{p.name}</span>
                  <Button
                    variant="outline"
                    className="h-11 text-[15px]"
                    onClick={() => {
                      if (dispatch({ type: 'reopen', planId: plan.id })) toast(`นำ${p.name}กลับมาในรายการแล้ว`)
                      else toast.error('ทำรายการนี้ไม่ได้ในสถานะปัจจุบัน')
                    }}
                  >
                    เปลี่ยนใจ ดูแผนอีกครั้ง
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="mt-12 flex max-w-[64ch] items-start gap-2.5 text-[15px] text-muted-foreground">
        <ShieldCheck className="mt-1 size-5 shrink-0 text-link" aria-hidden="true" />
        <span>
          ระบบตรวจก่อนส่งแผนมาให้คุณ: ไม่บังคับลดราคา ไม่บังคับแบ่งยอดขาย ไม่มีค่าใช้จ่ายแอบแฝง แผนที่ไม่ผ่านจะไม่ถูกแสดง คัดออกแล้ว {fairnessRejected.length} แผน
          {rejected.length - fairnessRejected.length > 0 && ` และไม่แนะนำอีก ${rejected.length - fairnessRejected.length} ร้านที่เวลาหรืออาหารไม่สอดคล้องกัน`}
        </span>
      </p>
    </>
  )
}
