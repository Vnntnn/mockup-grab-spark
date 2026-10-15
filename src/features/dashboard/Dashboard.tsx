import { ArrowRight, Banknote, Image as ImageIcon, ShieldCheck, ShoppingBag, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BondPair } from '@/components/BondPair'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/status/StatusBadge'
import { JourneyTrack } from '@/components/visual'
import { Button } from '@/components/ui/button'
import { useApp } from '@/app/store'
import { useGemHunterHandoff } from '@/features/gemhunter/handoff-view'
import { deriveActivity, recentPeriod, selfOf } from '@/app/selectors'
import { getHeroPartnershipSummary } from './dashboard-helpers'
import { baht, num } from '@/lib/format'
import { fmtDay, fmtRange } from '@/lib/dates'

export function Dashboard() {
  const { state } = useApp()
  const me = selfOf(state)
  const handoff = useGemHunterHandoff(me.id)
  const period = recentPeriod(state)
  const activity = deriveActivity(state)
  const hero = getHeroPartnershipSummary(state)
  const plan = hero ? state.plans[hero.planId] : undefined
  const stopped = hero?.status === 'declined' || hero?.status === 'cancelled'
  const offer = hero?.status === 'awaiting' && !hero.renewal

  return (
    <>
      <PageHeader title={`สวัสดี ${me.name}`} lead="มาดูกันว่าร้านของคุณมีโอกาสเติบโตตรงไหนบ้าง" />

      {hero && plan ? (
        <section aria-labelledby="next-h" className="surface overflow-hidden">
          <div className="bg-accent px-6 py-5">
            <BondPair plan={plan} self={me} partner={hero.partner} />
          </div>
          <div className="px-6 pt-5 pb-6 md:px-8">
            <h2 id="next-h" className="text-[24px] leading-snug font-bold tracking-tight text-ink md:text-[28px]">
              {offer ? `ร่วมแนะนำร้านกับ${hero.partnerName}` : hero.title}
            </h2>
            {offer ? (
              <p className="mt-1.5 max-w-[48ch] text-muted-foreground">
                {hero.partner.category} {hero.partner.neighborhood} ช่วยแนะนำร้านคุณให้ลูกค้ากลุ่มใหม่ ไม่รับประกันยอดขาย
              </p>
            ) : (
              <p className="mt-1.5 text-muted-foreground">ร่วมกับ{hero.partnerName}</p>
            )}

            {hero.renewal && plan.changeLog.length > 0 && (
              <p className="mt-3 max-w-[52ch] rounded-lg bg-warn-soft px-4 py-3 text-warn-text">
                เงื่อนไขเปลี่ยนเป็นฉบับที่ {plan.planVersion} ({plan.changeLog[plan.changeLog.length - 1].summary}) การยืนยันเดิมถูกล้างแล้ว โปรดอ่านและยืนยันใหม่
              </p>
            )}

            <div className="mt-5">{stopped || offer || hero.renewal ? <StatusBadge status={hero.status} /> : <JourneyTrack status={hero.status} />}</div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild variant={stopped ? 'outline' : 'default'} className="px-6">
                <Link to={hero.ctaRoute}>
                  {hero.ctaLabel}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <p className="text-[15px] text-muted-foreground">
                ร้านคุณจ่ายเพิ่ม <strong className="figure text-[20px] text-ink">{hero.costBaht === null ? 'ยังไม่ทราบ' : baht(hero.costBaht)}</strong>
                <span className="block text-[14px]">ข้อสมมุติของแผนตัวอย่าง</span>
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="next-h" className="surface px-6 py-8 md:px-8">
          <h2 id="next-h" className="text-[24px] leading-snug font-bold tracking-tight text-ink">ตอนนี้ยังไม่มีแผนแนะนำ</h2>
          <p className="mt-2 max-w-[48ch] text-muted-foreground">
            {me.participationPreference === 'not_now' ? 'คุณเลือกพักการรับคำแนะนำไว้ เปลี่ยนได้ที่ "ร้านของฉัน"' : 'เมื่อมีร้านที่เหมาะ เราจะแสดงที่นี่ ร้านคุณขายตามปกติได้ทุกอย่าง'}
          </p>
          <Button asChild variant="outline" className="mt-5 px-6">
            <Link to="/opportunities">หาโอกาสเติบโต</Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="sum" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id="sum" className="text-[20px] font-bold text-ink">ร้านคุณตอนนี้</h2>
          <p className="text-[14px] text-muted-foreground">
            {period.label} · {fmtRange(period.range)}
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="surface flex items-center gap-3 px-4 py-4">
            <ShoppingBag className="size-6 shrink-0 text-link" aria-hidden="true" />
            <div>
              <dt className="text-[14px] leading-tight text-muted-foreground">ออเดอร์</dt>
              <dd className="figure text-[28px] leading-tight text-ink">{num(period.orders)}</dd>
            </div>
          </div>
          <div className="surface flex items-center gap-3 px-4 py-4">
            <Banknote className="size-6 shrink-0 text-link" aria-hidden="true" />
            <div>
              <dt className="text-[14px] leading-tight text-muted-foreground">ยอดขาย (ก่อนหักต้นทุน)</dt>
              <dd className="figure text-[28px] leading-tight text-ink">{baht(period.revenue)}</dd>
            </div>
          </div>
        </dl>
      </section>

      {handoff && (
        <section aria-labelledby="gh-readiness" className="mt-10">
          <h2 id="gh-readiness" className="flex items-center gap-2 text-[20px] font-bold text-ink">
            <ShieldCheck className="size-5 text-link" aria-hidden="true" />
            ผ่านแคมเปญ GemHunter แล้ว
          </h2>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[17px]">
            <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" /><dt className="sr-only">รีวิวที่ผ่านการตรวจสอบ</dt><dd><strong className="figure">{handoff.payload.validReviewCount}</strong> รีวิว</dd></div>
            <div className="flex items-center gap-2"><Star className="size-5 text-muted-foreground" aria-hidden="true" /><dt className="sr-only">คะแนนเฉลี่ย</dt><dd><strong className="figure">{Number(handoff.payload.averageRating.toFixed(2))}</strong> จาก 5</dd></div>
            <div className="flex items-center gap-2"><ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" /><dt className="sr-only">รูปที่อนุมัติแล้ว</dt><dd><strong className="figure">{handoff.payload.approvedPhotoIds.length}</strong> รูป</dd></div>
          </dl>
          <details className="mt-2 text-[15px] text-muted-foreground">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-ink">ตรานี้หมายถึงอะไร</summary>
            <p className="max-w-[56ch]">{handoff.payload.badgeMeaning} ไม่มีแผนหรือแคมเปญที่เริ่มให้อัตโนมัติ เริ่มได้เมื่อคุณเลือกเอง</p>
          </details>
          <Link to="/gemhunter/results" className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">ดูสรุปแคมเปญ GemHunter</Link>
        </section>
      )}

      <section aria-labelledby="act" className="mt-10">
        <h2 id="act" className="text-[20px] font-bold text-ink">ล่าสุด</h2>
        {activity.length ? (
          <ul className="mt-2 divide-y divide-border">
            {activity.slice(0, 3).map((a) => (
              <li key={a.id}>
                <Link to={a.href} className="flex min-h-11 items-baseline justify-between gap-4 py-3 transition-colors duration-[var(--dur-micro)] hover:text-link">
                  <span>{a.text}</span>
                  <span className="shrink-0 text-[14px] text-muted-foreground">{fmtDay(a.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">ยังไม่มีความเคลื่อนไหว</p>
        )}
      </section>
    </>
  )
}
