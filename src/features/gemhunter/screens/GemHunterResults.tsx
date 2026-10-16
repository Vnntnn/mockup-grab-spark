import { useEffect, useRef, type ReactNode } from 'react'
import { useKept } from '@/i18n/keep'
import { ArrowRight, BadgeCheck, Check, CircleDashed, ExternalLink, FlaskConical, Lock, PackageCheck, ShieldCheck, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { campaignMetrics, evidenceOf, fmtRating, HANDOFF_BADGE_MEANING, HANDOFF_EXCLUDED, HANDOFF_SCOPE, METRICS_NOTE, type GemBondHandoff, type GraduationCheck } from '../domain'
import { useGemHunter } from '../store'
import { H2, SegMeter } from '../components/ghui'
import { useRun } from '../components/hunter/useRun'

const BADGE_TEXT = 'ผ่านแคมเปญ GemHunter'

/** Pass or not yet, as an icon and words. The verdict always comes from the domain check, never recomputed here. */
function Verdict({ passed }: { passed: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[15px] font-semibold', passed ? 'text-link' : 'text-muted-foreground')}>
      {passed ? <Check key="y" className="pop size-5" strokeWidth={3} aria-hidden="true" /> : <CircleDashed className="size-5" aria-hidden="true" />}
      {passed ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'}
    </span>
  )
}

/** One graduation measure: a name, one big number, one meter, the rule in words. */
function Gauge({ title, passed, figure, unit, meter, rule, extra }: { title: string; passed: boolean; figure: string; unit?: string; meter: ReactNode; rule: string; extra?: ReactNode }) {
  return (
    <li className="flex flex-col gap-4 p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[17px] font-bold">{title}</h3>
        <Verdict passed={passed} />
      </div>
      <p className="figure text-[36px] leading-none">
        {figure}
        {unit && <span className="ml-1 text-[22px] font-semibold text-muted-foreground">{unit}</span>}
      </p>
      {meter}
      <p className="text-[15px] leading-snug text-muted-foreground">{rule}</p>
      {extra}
    </li>
  )
}

/** Average rating on a 0-5 track with the pass line drawn on it. The words and the verdict carry the result; the picture only shows where it sits. */
function RatingScale({ average, passLine, passed }: { average: number | null; passLine: number; passed: boolean }) {
  // width comes straight from the value, so it is right without any animation; a changed value eases through the CSS transition
  const shown = average === null ? 0 : (average / 5) * 100
  const line = (passLine / 5) * 100
  return (
    <div aria-hidden="true" className="pb-5">
      <div className="gh-scale">
        <div className="gh-scale-fill" data-met={passed} style={{ width: `${shown}%` }} />
        <i className="gh-scale-line" style={{ left: `${line}%` }} />
      </div>
      <div className="relative mt-1.5 h-5 text-[14px] leading-5 text-muted-foreground tabular-nums">
        <span className="absolute left-0">0</span>
        <span className="absolute font-semibold text-foreground" style={{ left: `${line}%`, transform: 'translateX(-50%)' }}>
          {passLine}
        </span>
        <span className="absolute right-0">5</span>
      </div>
    </div>
  )
}

function Lists({ inTitle, inItems, outTitle, outItems }: { inTitle: string; inItems: ReactNode[]; outTitle: string; outItems: ReactNode[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-12">
      <section aria-label={inTitle}>
        <h3 className="flex items-center gap-2 text-[17px] font-bold">
          <Check className="size-5 text-link" strokeWidth={3} aria-hidden="true" />
          {inTitle}
        </h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-6 text-[17px]">
          {inItems.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>
      <section aria-label={outTitle}>
        <h3 className="flex items-center gap-2 text-[17px] font-bold">
          <X className="size-5" strokeWidth={3} aria-hidden="true" />
          {outTitle}
        </h3>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-6 text-[17px]">
          {outItems.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** Built only from the handoff record and HANDOFF_EXCLUDED, so the screen can never list something different from what is actually shared. */
function HandoffSummary({ h }: { h: GemBondHandoff }) {
  const p = h.payload
  return (
    <Lists
      inTitle="สิ่งที่ส่งต่อ"
      inItems={[
        <>ข้อมูลร้านเดิม: {h.merchantName}</>,
        <>
          รีวิวที่ผ่านการตรวจสอบ {p.validReviewCount} รีวิว คะแนนเฉลี่ย {fmtRating(p.averageRating)} จาก 5
        </>,
        <>รูปที่อนุมัติแล้ว {p.approvedPhotoIds.length} รูป</>,
        <>ชื่อเมนูที่ร้านเลือกแล้ว: {p.approvedMenuTitles.map((m) => m.title).join(' / ')}</>,
        <>ตรา “{BADGE_TEXT}”</>,
      ]}
      outTitle="สิ่งที่ไม่ส่งต่อ"
      outItems={h.excluded}
    />
  )
}

type NodeState = 'done' | 'now' | 'upcoming'

/** Allow, prepare, open: the line fills as each is done. */
function HandoffPath({ states }: { states: [NodeState, NodeState, NodeState] }) {
  const nodes = [
    { Icon: ShieldCheck, label: 'อนุญาต' },
    { Icon: PackageCheck, label: 'เตรียมข้อมูล' },
    { Icon: ExternalLink, label: 'เปิด GemBond' },
  ]
  const reached = states.filter((s) => s === 'done').length
  const fill = states[2] === 'done' ? 1 : Math.min(1, reached / 2)
  return (
    <ol className="gh-nodes max-w-sm" style={{ ['--fill' as string]: fill }} aria-label="ขั้นตอนส่งต่อไป GemBond">
      {nodes.map(({ Icon, label }, i) => (
        <li key={label} className="relative z-10 flex flex-col items-center gap-1 text-center">
          <span
            key={states[i]}
            className={cn(
              'relative z-10 grid size-9 place-items-center rounded-full border-2 transition-colors duration-(--dur-micro) ease-(--ease-out)',
              states[i] === 'done' && 'pop border-foreground bg-primary text-primary-foreground',
              states[i] === 'now' && 'border-foreground bg-card text-foreground',
              states[i] === 'upcoming' && 'border-input bg-card text-muted-foreground',
            )}
          >
            {states[i] === 'done' ? <Check className="size-5" strokeWidth={3} aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
          </span>
          <span className={cn('text-[14px] leading-tight', states[i] === 'upcoming' ? 'text-muted-foreground' : 'font-semibold')}>
            {label}
            <span className="sr-only">: {states[i] === 'done' ? 'เสร็จแล้ว' : states[i] === 'now' ? 'ขั้นที่ทำอยู่' : 'ยังไม่ถึง'}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export function GemHunterResults() {
  const { state } = useGemHunter()
  const run = useRun()
  const navigate = useNavigate()
  const [consent, setConsent] = useKept('results:consent', false)
  const c = state.campaign
  const ev = evidenceOf(c)
  const m = campaignMetrics(c)
  const { minValidReviews, minAverageRatingExclusive } = c.config

  const handoffNote = useRef<HTMLParagraphElement>(null)
  const focusHandoff = useRef(false)
  // creating the handoff replaces the form with the handoff summary: move focus to it instead of dropping it on <body>
  useEffect(() => {
    if (c.phase === 'gembond_handoff' && focusHandoff.current) {
      focusHandoff.current = false
      handoffNote.current?.focus()
    }
  }, [c.phase])

  const openGemBond = (e: React.MouseEvent) => {
    // Opening GemBond must be a deliberate click. The second click of a double-click on the button that just created the
    // handoff lands on this one (it appears where the other was), so only a single click or the keyboard may open it.
    if (e.detail > 1) return
    const r = run({ type: 'openHandoff' }, 'เปิด GemBond แล้ว (ยังไม่มีแคมเปญ GemBond เริ่มโดยอัตโนมัติ)')
    // already opened is not a failure: the merchant just wants to get to GemBond
    if (r.ok || r.code === 'already_opened') navigate('/dashboard')
  }

  // the check is always offered: failing it only shows what is still missing, it never blocks or penalises the shop
  const canCheck = c.phase === 'active_campaign' || c.phase === 'submission_review'
  const formOpen = c.phase === 'graduation_check' && ev.eligible

  const byId = (id: GraduationCheck['id']) => ev.checks.find((x) => x.id === id)
  const reviewsCheck = byId('reviews')
  const ratingCheck = byId('rating')
  const menuCheck = byId('menu')
  const { decided, total } = m.menuAuditCompletion
  const stepOf = (id: GraduationCheck['id']) => ev.improvement.nextSteps.find((s) => s.checkId === id)?.text

  const headline = c.phase === 'completed' ? 'แคมเปญเสร็จสิ้นแล้ว' : ev.eligible ? 'ร้านผ่านเกณฑ์แคมเปญแล้ว' : 'ยังไม่ครบเกณฑ์ผ่านแคมเปญ'
  const lead = ev.eligible ? 'คุณเลือกเปิด GemBond ต่อเมื่อพร้อม ไม่บังคับ' : 'ไม่ใช่การตัดสิทธิ์ถาวรและไม่ใช่ความผิดของร้าน การขายตามปกติไม่ได้รับผลกระทบ'

  const pathStates = (): [NodeState, NodeState, NodeState] | null => {
    if (c.phase === 'completed') return ['done', 'done', 'done']
    if (c.phase === 'gembond_handoff') return ['done', 'done', 'now']
    if (formOpen) return consent ? ['done', 'now', 'upcoming'] : ['now', 'upcoming', 'upcoming']
    return null
  }
  const nodes = pathStates()

  const handoffBody = () => {
    switch (c.phase) {
      case 'cancelled':
        return (
          <p className="text-[17px]">
            แคมเปญนี้ถูกยกเลิกแล้ว ไม่มีข้อมูลถูกส่งต่อ และการขายตามปกติของร้านไม่ได้รับผลกระทบ คุณยังเปิด GemBond ได้เองเมื่อพร้อม{' '}
            <Link to="/dashboard" className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
              ไปที่ GemBond
            </Link>
          </p>
        )
      case 'paused':
        return (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[17px]">แคมเปญพักอยู่ ไปขั้นต่อไปไม่ได้จนกว่าจะกลับมาทำต่อ</p>
            <Button className="h-12 px-6 text-[17px]" onClick={() => run({ type: 'resume' }, 'กลับมาทำแคมเปญต่อแล้ว')}>
              กลับมาทำต่อ
            </Button>
          </div>
        )
      case 'completed':
        return (
          <div className="flex flex-col gap-6">
            <p className="text-[17px] font-semibold">แคมเปญเสร็จสิ้น และคุณเปิด GemBond แล้ว</p>
            {c.handoff && <HandoffSummary h={c.handoff} />}
            <Button asChild className="h-12 self-start px-6 text-[17px]">
              <Link to="/dashboard">
                ไปที่ GemBond
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        )
      case 'gembond_handoff':
        return (
          <div className="flex flex-col gap-6">
            <p ref={handoffNote} tabIndex={-1} className="text-[17px] font-semibold outline-none">
              เตรียมข้อมูลเรียบร้อยแล้ว ตรวจดูก่อนเปิด GemBond
            </p>
            {c.handoff && <HandoffSummary h={c.handoff} />}
            <div className="flex flex-col items-start gap-2 border-t pt-5">
              <Button className="h-14 px-8 text-[17px]" onClick={openGemBond}>
                เปิด GemBond
                <ArrowRight data-icon="inline-end" />
              </Button>
              <p className="text-[15px] text-muted-foreground">การเปิด GemBond ไม่ได้เริ่มแคมเปญ GemBond ให้อัตโนมัติ คุณยังต้องดูแผนและยืนยันเองทุกครั้ง และใช้โปรไฟล์ร้านเดิมของคุณ</p>
            </div>
          </div>
        )
      default:
        if (formOpen) {
          return (
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault()
                if (consent !== true) return
                if (run({ type: 'createHandoff', at: todayISO(), consent }, 'เตรียมข้อมูลส่งต่อแล้ว').ok) focusHandoff.current = true
              }}
            >
              <p className="text-[17px] text-muted-foreground">ตอนนี้ยังไม่มีอะไรถูกส่งและยังไม่เปิด GemBond</p>
              <Lists inTitle="ข้อมูลที่จะส่งต่อ" inItems={HANDOFF_SCOPE.map((s) => s.label)} outTitle="ข้อมูลที่ไม่ส่งต่อ" outItems={HANDOFF_EXCLUDED} />
              <p className="max-w-[75ch] text-[15px] text-muted-foreground">{HANDOFF_BADGE_MEANING}</p>
              <div className="flex items-start gap-3 rounded-xl border-2 border-foreground bg-accent p-4">
                <Checkbox id="handoff-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-2.5 size-6" aria-describedby="handoff-consent-hint" />
                <Label htmlFor="handoff-consent" className="min-h-11 flex-1 cursor-pointer py-2 text-[17px] leading-relaxed font-medium">
                  ร้านอนุญาตให้ส่งต่อข้อมูลตามรายการ “ข้อมูลที่จะส่งต่อ” ไป GemBond เท่านั้น
                </Label>
              </div>
              <div className="flex flex-col items-start gap-2">
                <Button type="submit" className="h-14 px-8 text-[17px]" disabled={!consent}>
                  เตรียมข้อมูลส่งต่อไป GemBond
                </Button>
                <p id="handoff-consent-hint" className="text-[15px] text-muted-foreground">
                  {consent ? 'ยกเลิกการติ๊กได้ตลอดก่อนกดปุ่ม' : 'ติ๊กช่องยืนยันก่อน จึงจะกดปุ่มได้'}
                </p>
              </div>
            </form>
          )
        }
        return (
          <p className="flex items-start gap-2.5 text-[17px] leading-snug text-muted-foreground" role="status">
            <Lock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {c.phase === 'graduation_check'
              ? 'ยังไม่ครบเกณฑ์ ปุ่มเตรียมข้อมูลจะขึ้นที่นี่เมื่อครบ'
              : `${c.phase === 'eligibility_check' || c.phase === 'menu_review' ? 'แคมเปญยังไม่เริ่ม ' : ''}ปุ่มส่งต่อข้อมูลไป GemBond จะเปิดเมื่อครบเกณฑ์ ยังไม่ครบก็ไม่มีบทลงโทษ และร้านขายตามปกติได้เหมือนเดิม`}
          </p>
        )
    }
  }

  const locked = !formOpen && c.phase !== 'gembond_handoff' && c.phase !== 'completed' && c.phase !== 'cancelled' && c.phase !== 'paused'

  return (
    <>
      <header className="mb-8 max-w-[44rem]">
        {ev.eligible && (
          <p className="mb-3">
            <span className="stamp">
              <BadgeCheck className="size-5" aria-hidden="true" />
              {BADGE_TEXT}
            </span>
          </p>
        )}
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">{headline}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground">{lead}</p>
      </header>

      <section aria-labelledby="criteria-h">
        <h2 id="criteria-h" className="sr-only">
          เกณฑ์ผ่านแคมเปญ (เกณฑ์ตัวอย่างสำหรับสาธิต ปรับได้)
        </h2>
        <ul className="surface grid divide-y overflow-hidden md:grid-cols-3 md:divide-x md:divide-y-0" aria-label="รายการเกณฑ์">
          {reviewsCheck && (
            <Gauge
              title="รีวิวที่ผ่านตรวจ"
              passed={reviewsCheck.passed}
              figure={`${ev.validReviews}`}
              unit={`/ ${minValidReviews}`}
              meter={<SegMeter value={Math.min(ev.validReviews, minValidReviews)} total={minValidReviews} />}
              rule={reviewsCheck.label}
            />
          )}
          {ratingCheck && (
            <Gauge
              title="คะแนนเฉลี่ย"
              passed={ratingCheck.passed}
              figure={ev.averageRating === null ? 'ยังไม่มี' : fmtRating(ev.averageRating)}
              unit={ev.averageRating === null ? undefined : 'จาก 5'}
              meter={<RatingScale average={ev.averageRating} passLine={minAverageRatingExclusive} passed={ratingCheck.passed} />}
              rule={ratingCheck.label}
              extra={!ratingCheck.passed && ev.averageRating !== null ? <p className="text-[14px] leading-snug text-muted-foreground">{stepOf('rating')}</p> : undefined}
            />
          )}
          {menuCheck && (
            <Gauge
              title="ชื่อเมนู"
              passed={menuCheck.passed}
              figure={`${decided}`}
              unit={`/ ${total}`}
              meter={<SegMeter value={decided} total={Math.max(total, 1)} />}
              rule={menuCheck.label}
              extra={
                !menuCheck.passed ? (
                  <Link to="/gemhunter/menu" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-link underline underline-offset-4">
                    {stepOf('menu') ?? 'ไปเลือกชื่อเมนู'}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : undefined
              }
            />
          )}
        </ul>

        <div className="mt-5 flex flex-col gap-3">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]" aria-label="รีวิวตัวอย่างที่ส่งเข้ามา">
            <li className="font-semibold">
              ส่งเข้ามา <span className="figure">{m.missionCompletions}</span>
            </li>
            <li>ผ่าน {m.moderation.approved}</li>
            <li>ไม่ผ่าน {m.moderation.rejected}</li>
            <li>รอตรวจ {m.moderation.pending}</li>
            <li>รูปที่อนุมัติแล้ว {ev.approvedPhotos}</li>
          </ul>
          <p className="max-w-[75ch] text-[14px] leading-relaxed text-muted-foreground">{METRICS_NOTE}</p>

          {(canCheck || (!ev.eligible && ev.validReviews === 0)) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {canCheck && (
                <Button variant={ev.eligible ? 'default' : 'outline'} className="h-14 px-7 text-[17px]" onClick={() => run({ type: 'checkGraduation' }, 'ตรวจเกณฑ์จบแคมเปญแล้ว')}>
                  ตรวจเกณฑ์จบแคมเปญ
                </Button>
              )}
              {!ev.eligible && ev.validReviews === 0 && (
                <Link to="/gemhunter/photos?view=hunter" className="inline-flex min-h-11 items-center gap-2 text-[17px] font-medium text-link underline underline-offset-4">
                  <FlaskConical className="size-4" aria-hidden="true" />
                  เฉพาะสาธิต: จำลองลูกค้าส่งรีวิว
                </Link>
              )}
              {canCheck && <p className="text-[14px] text-muted-foreground">ตรวจได้ทุกเมื่อ ไม่ส่งข้อมูลไปที่ไหน ไม่มีบทลงโทษ</p>}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="handoff-h" className={cn('mt-12 rounded-3xl p-6 md:p-9', locked ? 'border border-dashed border-input bg-card' : 'surface border-2 border-foreground')}>
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <H2 id="handoff-h">เปิด GemBond ต่อ</H2>
          <span className="text-[15px] font-medium text-muted-foreground">ไม่บังคับ</span>
        </div>
        {nodes && (
          <div className="mb-7">
            <HandoffPath states={nodes} />
          </div>
        )}
        {handoffBody()}
      </section>
    </>
  )
}
