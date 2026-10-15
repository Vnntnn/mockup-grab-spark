import { useId, useRef, useState } from 'react'
import { Camera, Check, Clock, FlaskConical, Hand, Info, Lock, Send, ShieldCheck, Store, Ticket } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { todayISO } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { evidenceOf, MIN_REVIEW_LENGTH, pendingSubmissions, storefrontPhotos } from '../domain'
import { merchantOf } from '../data/seed'
import { useGemHunter } from '../store'
import { Disclose, EmptyNote, SimTag, VoucherTerms } from '../components/ghui'
import { ModerationBadge } from '../components/hunter/ModerationBadge'
import { PhotoTile } from '../components/hunter/PhotoTile'
import { StarRatingInput } from '../components/hunter/StarRating'
import { SubmissionCard } from '../components/hunter/SubmissionCard'
import { acceptsSubmissions, bankGroup, closedReason } from '../components/hunter/phase'
import { useRun } from '../components/hunter/useRun'

type View = 'hunter' | 'merchant'

const HUNTERS = ['นักล่าสาธิต', 'นักล่าสาธิต 2']
/** Simulated photo choices: no file is uploaded, the label says what the placeholder image shows. */
const PHOTO_OPTIONS = [
  { label: 'จานอาหารถ่ายจากด้านบน', short: 'ด้านบน' },
  { label: 'ภาพใกล้ของอาหาร', short: 'ใกล้ ๆ' },
  { label: 'อาหารพร้อมน้ำจิ้มและเครื่องเคียง', short: 'พร้อมเครื่องเคียง' },
  { label: 'อาหารในกล่องที่ได้รับ', short: 'ในกล่อง' },
]

const controlCls =
  'h-12 w-full rounded-lg border border-input bg-background px-3 text-[17px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive'

/** Reducer rejection codes that belong to one field; anything else is shown above the submit button. */
const FIELD_OF: Record<string, 'rating' | 'review' | 'photo' | 'consent'> = {
  invalid_rating: 'rating',
  review_too_short: 'review',
  no_photo: 'photo',
  no_image_consent: 'consent',
}

function Tabs({ view, onChange, waiting }: { view: View; onChange: (v: View) => void; waiting: number }) {
  const refs = useRef<Record<View, HTMLButtonElement | null>>({ hunter: null, merchant: null })
  const order: View[] = ['merchant', 'hunter']
  const move = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % order.length : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i + order.length - 1) % order.length : null
    if (next === null) return
    e.preventDefault()
    onChange(order[next])
    refs.current[order[next]]?.focus()
  }
  const tabCls = (on: boolean) =>
    cn(
      'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[17px] leading-snug outline-none transition-[background-color,box-shadow,color] duration-(--dur-micro) ease-(--ease-out) focus-visible:ring-3 focus-visible:ring-ring',
      on ? 'bg-card font-bold text-foreground shadow-(--shadow-raise)' : 'font-medium text-muted-foreground hover:text-foreground',
    )
  return (
    <div role="tablist" aria-label="เลือกมุมมอง" className="mb-8 inline-flex gap-1 rounded-full bg-secondary p-1">
      <button
        ref={(el) => {
          refs.current.merchant = el
        }}
        role="tab"
        type="button"
        id="tab-merchant"
        aria-selected={view === 'merchant'}
        aria-controls="panel-merchant"
        tabIndex={view === 'merchant' ? 0 : -1}
        onClick={() => onChange('merchant')}
        onKeyDown={(e) => move(e, 0)}
        className={tabCls(view === 'merchant')}
      >
        รูปที่ลูกค้าส่งมา
        {waiting > 0 && (
          <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-[14px] leading-6 font-bold text-primary-foreground tabular-nums">
            <span className="sr-only">รอคุณเลือก </span>
            {waiting}
          </span>
        )}
      </button>
      <button
        ref={(el) => {
          refs.current.hunter = el
        }}
        role="tab"
        type="button"
        id="tab-hunter"
        aria-selected={view === 'hunter'}
        aria-controls="panel-hunter"
        tabIndex={view === 'hunter' ? 0 : -1}
        onClick={() => onChange('hunter')}
        onKeyDown={(e) => move(e, 1)}
        className={tabCls(view === 'hunter')}
      >
        <FlaskConical className="size-4" aria-hidden="true" />
        จำลองลูกค้าส่งรีวิว
      </button>
    </div>
  )
}

/** A picture you can pick: a native radio under the image, so the keyboard and screen readers behave as for any radio group. */
function ThumbRadio({ name, checked, onChange, label, ariaLabel, children }: { name: string; checked: boolean; onChange: () => void; label: string; ariaLabel?: string; children: React.ReactNode }) {
  return (
    <label className="gh-pick bg-card">
      <input type="radio" name={name} checked={checked} onChange={onChange} aria-label={ariaLabel} className="sr-only" />
      {children}
      <span className="gh-pick-mark" aria-hidden="true">
        <Check className="size-3.5" strokeWidth={3.5} />
      </span>
      <span className="block px-1.5 py-2 text-center text-[14px] leading-tight font-medium">{label}</span>
    </label>
  )
}

function HunterForm() {
  const { state } = useGemHunter()
  const run = useRun()
  const uid = useId()
  const c = state.campaign
  const merchant = merchantOf(c.merchantId)
  const menu = c.menuAudit.items.map((i) => ({ name: i.menuItemName, price: merchant?.sampleMenu.find((m) => m.name === i.menuItemName)?.priceBaht }))
  const closed = closedReason(c.phase)

  const [hunterId, setHunterId] = useState(HUNTERS[0])
  const [menuItem, setMenuItem] = useState(menu[0]?.name ?? '')
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [photoLabel, setPhotoLabel] = useState(PHOTO_OPTIONS[0].label)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<{ code: string; reason: string } | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const fieldError = (f: 'rating' | 'review' | 'photo' | 'consent') => (error && FIELD_OF[error.code] === f ? error.reason : null)
  const generalError = error && !FIELD_OF[error.code] ? error.reason : null
  const reviewLen = [...review.trim()].length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(null)
    // The reducer is the single source of truth for validation; its Thai reason becomes the inline message.
    const r = run(
      { type: 'submit', at: todayISO(), hunterId, menuItemName: menuItem, rating, reviewText: review, imageUseConsent: consent, photoLabel },
      'ส่งรีวิวและรูปแล้ว (จำลอง) สถานะ: รอตรวจสอบ',
    )
    if (!r.ok) return setError({ code: r.code, reason: r.reason })
    setError(null)
    setSent(`${hunterId} · ${menuItem}`)
    setRating(0)
    setReview('')
    setConsent(false)
  }

  return (
    <div role="tabpanel" id="panel-hunter" aria-labelledby="tab-hunter" className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <div className="lg:sticky lg:top-44 lg:self-start">
        <p className="mb-3 flex flex-wrap items-center gap-x-3 text-[14px] text-muted-foreground">
          <SimTag />
          ไม่อัปโหลดไฟล์ ไม่ตรวจการสั่งซื้อจริง
        </p>
        <PhotoTile hue={47} label={photoLabel} dish={menuItem} className="rounded-2xl shadow-(--shadow-lift)" imageClassName="aspect-[4/3]" />
        <p className="mt-2 text-[14px] text-muted-foreground">ภาพที่ระบบสร้างจากเมนูและมุมที่เลือก ไม่ใช่รูปถ่ายจริง</p>
      </div>

      <div>
        {closed && (
          <p className="mb-5 flex items-start gap-2 text-[17px]" role="status">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">ยังส่งรีวิวไม่ได้ในตอนนี้:</strong> {closed}{' '}
              <Link to="/gemhunter" className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
                ไปที่หน้าคำเชิญ
              </Link>
            </span>
          </p>
        )}
        <form onSubmit={submit} noValidate aria-label="ส่งรูปและรีวิวหลังสั่ง">
          <fieldset disabled={!acceptsSubmissions(c.phase)} className="min-w-0">
            <FieldGroup>
              <FieldSet>
                <FieldLegend variant="label">เมนูที่สั่ง</FieldLegend>
                <div role="radiogroup" aria-label="เมนูที่สั่ง" className="grid grid-cols-3 gap-2.5">
                  {menu.map((m) => (
                    <ThumbRadio
                      key={m.name}
                      name={`${uid}-menu`}
                      checked={menuItem === m.name}
                      onChange={() => {
                        setMenuItem(m.name)
                        setError(null)
                      }}
                      label={m.name}
                    >
                      <PhotoTile hue={47} label={photoLabel} dish={m.name} chip={false} imageClassName="aspect-square" />
                    </ThumbRadio>
                  ))}
                </div>
              </FieldSet>

              <FieldSet data-invalid={!!fieldError('photo')}>
                <FieldLegend variant="label">มุมภาพ (เลือกภาพจำลอง)</FieldLegend>
                <div role="radiogroup" aria-label="รูปอาหาร (เลือกภาพจำลอง)" className="grid grid-cols-4 gap-2">
                  {PHOTO_OPTIONS.map((p) => (
                    <ThumbRadio
                      key={p.label}
                      name={`${uid}-photo`}
                      checked={photoLabel === p.label}
                      onChange={() => {
                        setPhotoLabel(p.label)
                        setError(null)
                      }}
                      label={p.short}
                      ariaLabel={p.label}
                    >
                      <PhotoTile hue={47} label={p.label} dish={menuItem} chip={false} imageClassName="aspect-square" />
                    </ThumbRadio>
                  ))}
                </div>
                {fieldError('photo') && <FieldError>{fieldError('photo')}</FieldError>}
              </FieldSet>

              <FieldSet data-invalid={!!fieldError('rating')}>
                <FieldLegend variant="label">ให้คะแนนตามที่รู้สึกจริง</FieldLegend>
                <StarRatingInput
                  name={`${uid}-rating`}
                  value={rating}
                  onChange={(n) => {
                    setRating(n)
                    setError(null)
                  }}
                  describedBy={`${uid}-rating-note`}
                  invalid={!!fieldError('rating')}
                />
                <p id={`${uid}-rating-note`} className="flex items-center gap-2 text-[14px] text-muted-foreground">
                  <Ticket className="size-4 shrink-0" aria-hidden="true" />
                  ได้คูปองเท่ากันทุกดาว
                </p>
                {fieldError('rating') && <FieldError>{fieldError('rating')}</FieldError>}
              </FieldSet>

              <Field data-invalid={!!fieldError('review')}>
                <FieldLabel htmlFor={`${uid}-review`}>
                  รีวิวของคุณ <span className="font-normal text-muted-foreground">(อย่างน้อย {MIN_REVIEW_LENGTH} ตัวอักษร)</span>
                </FieldLabel>
                <Textarea
                  id={`${uid}-review`}
                  rows={3}
                  className="text-[17px]"
                  value={review}
                  aria-invalid={!!fieldError('review')}
                  onChange={(e) => {
                    setReview(e.target.value)
                    setError(null)
                  }}
                />
                <p className="text-right text-[14px] text-muted-foreground tabular-nums" aria-hidden="true">
                  {reviewLen}/{MIN_REVIEW_LENGTH}
                </p>
                {fieldError('review') && <FieldError>{fieldError('review')}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor={`${uid}-hunter`}>ชื่อนักล่า (ชื่อสมมติ)</FieldLabel>
                <select
                  id={`${uid}-hunter`}
                  className={cn(controlCls, 'sm:max-w-xs')}
                  value={hunterId}
                  onChange={(e) => {
                    setHunterId(e.target.value)
                    setError(null)
                  }}
                >
                  {HUNTERS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>

              <div className={cn('flex items-start gap-3 rounded-xl border-2 p-4', fieldError('consent') ? 'border-destructive' : 'border-border')} data-invalid={!!fieldError('consent')}>
                <Checkbox
                  id={`${uid}-consent`}
                  className="mt-3 size-5"
                  checked={consent}
                  aria-invalid={!!fieldError('consent')}
                  aria-describedby={`${uid}-consent-note`}
                  onCheckedChange={(v) => {
                    setConsent(v === true)
                    setError(null)
                  }}
                />
                <div>
                  <Label htmlFor={`${uid}-consent`} className="min-h-11 cursor-pointer text-[17px] font-medium">
                    ฉันยินยอมให้ร้านใช้รูปนี้ (จำเป็น)
                  </Label>
                  <p id={`${uid}-consent-note`} className="text-[14px] text-muted-foreground">
                    ร้านอาจใช้รูปที่ผ่านการตรวจสอบและร้านอนุมัติแล้วเป็นรูปหน้าร้าน ร้านไม่เห็นข้อมูลส่วนตัวของคุณนอกจากชื่อนักล่า
                  </p>
                  {fieldError('consent') && <p className="mt-1 text-[14px] font-medium text-destructive">{fieldError('consent')}</p>}
                </div>
              </div>

              <div aria-live="polite">
                {generalError && (
                  <p className="rounded-xl bg-danger-soft p-3 text-[15px] text-destructive" role="alert">
                    {generalError}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <Button
                  type="submit"
                  disabled={!acceptsSubmissions(c.phase)}
                  aria-describedby={closed ? `${uid}-closed` : undefined}
                  className="h-14 px-8 text-[17px] disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                >
                  <Send data-icon="inline-start" />
                  ส่งรูปและรีวิว (จำลอง)
                </Button>
                <VoucherTerms />
              </div>
              {closed && (
                <p id={`${uid}-closed`} className="text-[15px] text-muted-foreground">
                  ปุ่มนี้ใช้ไม่ได้ในตอนนี้ เพราะ{closed}
                </p>
              )}
            </FieldGroup>
          </fieldset>
        </form>

        <div aria-live="polite">
          {sent && (
            <div className="gh-ok mt-5 flex flex-col gap-2 rounded-xl border-2 border-foreground bg-accent p-4 text-[17px]">
              <p className="flex items-center gap-2 font-bold">
                <Check className="size-5 shrink-0" strokeWidth={3} aria-hidden="true" />
                ส่งแล้ว (จำลอง): {sent}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <ModerationBadge status="pending" />
                <span className="text-[15px] text-muted-foreground">ยังไม่ถูกนับจนกว่าแพลตฟอร์มจะตรวจสอบ</span>
              </p>
              <Button asChild variant="outline" className="h-11 self-start bg-card px-4 text-[17px]">
                <Link to="/gemhunter/photos?view=merchant">ดูรูปที่ลูกค้าส่งมา</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const GROUP_HEAD = {
  mine: { title: 'รอคุณเลือก', note: 'ผ่านการตรวจสอบแล้ว เลือกว่าจะใช้รูปไหนหน้าร้าน' },
  wait: { title: 'รอแพลตฟอร์มตรวจสอบ', note: '' },
  done: { title: 'จัดการแล้ว', note: '' },
} as const

function Stat({ Icon, n, label, big }: { Icon: typeof Clock; n: number; label: string; big?: boolean }) {
  return (
    <li className={cn('flex flex-col gap-1 px-4 py-4 md:px-6', big && 'bg-accent')}>
      <span className="flex items-center gap-2 text-[15px] leading-snug font-medium">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className={cn('figure leading-none', big ? 'text-[36px]' : 'text-[30px]')}>{n}</span>
    </li>
  )
}

function MerchantBank() {
  const { state } = useGemHunter()
  const c = state.campaign
  const ev = evidenceOf(c)
  const open = acceptsSubmissions(c.phase)
  const closed = closedReason(c.phase)
  // on a phone the first four show; the rest are one tap away (desktop always lists everything)
  const [showAll, setShowAll] = useState(false)

  const newest = [...c.submissions].reverse()
  const groups = (['mine', 'wait', 'done'] as const).map((g) => ({ g, items: newest.filter((s) => bankGroup(s) === g) })).filter((x) => x.items.length > 0)
  const total = c.submissions.length
  const mineCount = groups.find((x) => x.g === 'mine')?.items.length ?? 0
  let offset = 0

  return (
    <div role="tabpanel" id="panel-merchant" aria-labelledby="tab-merchant" className="flex flex-col gap-8">
      {total > 0 && (
        <div className="flex flex-col gap-2">
          <ul className="surface grid grid-cols-[1.2fr_1fr_1fr] divide-x overflow-hidden" aria-label="สรุปรูปที่ลูกค้าส่งมา">
            <Stat Icon={Hand} n={mineCount} label="รอคุณเลือก" big />
            <Stat Icon={Clock} n={pendingSubmissions(c).length} label="รอตรวจ" />
            <Stat Icon={Store} n={storefrontPhotos(c).length} label="ใช้หน้าร้าน" />
          </ul>
          <Disclose label="ใครตรวจ ใครเลือก" icon={<Info className="size-4 shrink-0" aria-hidden="true" />} triggerClassName="text-[15px] font-medium text-muted-foreground">
            <ul className="flex flex-col gap-2.5 pt-1 pb-3 text-[15px] leading-snug">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                แพลตฟอร์มเป็นผู้ตรวจรีวิว ร้านเลือกเฉพาะรูป รีวิวที่ผ่านนับทุกคะแนน ({ev.validReviews} รีวิวที่ผ่านแล้ว)
              </li>
              <li className="flex items-start gap-3">
                <Ticket className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                ผู้รีวิวได้คูปองเท่ากันทุกดาว แพลตฟอร์มเป็นผู้ออก ร้านไม่เสียค่าใช้จ่าย
              </li>
            </ul>
          </Disclose>
        </div>
      )}
      {closed && (
        <p className="flex items-start gap-2 text-[17px]">
          <Lock className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>
            {closed} ดูรายการได้ แต่ยังเลือกรูปไม่ได้{' '}
            <Link to="/gemhunter/results" className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
              ดูผลลัพธ์
            </Link>
          </span>
        </p>
      )}

      {total === 0 ? (
        <EmptyNote
          Icon={Camera}
          action={
            <Button asChild variant="ghost" className="-ml-3 h-11 gap-2 px-3 text-[15px] font-medium text-muted-foreground">
              <Link to="/gemhunter/photos?view=hunter">
                <FlaskConical data-icon="inline-start" />
                เฉพาะสาธิต: จำลองลูกค้าส่งรีวิว
              </Link>
            </Button>
          }
        >
          ยังไม่มีรูปและรีวิวเข้ามา เป็นเรื่องปกติของช่วงเริ่มต้น ไม่ได้เกิดจากร้านของคุณ
        </EmptyNote>
      ) : (
        <>
          {groups.map(({ g, items }) => {
            const start = offset
            offset += items.length
            const head = GROUP_HEAD[g]
            return (
              <section key={g} aria-labelledby={`grp-${g}`} className={start >= 4 && !showAll ? 'max-md:hidden' : undefined}>
                <h2 id={`grp-${g}`} className="flex items-baseline gap-2 text-[22px] leading-snug font-bold">
                  {head.title} <span className="text-[17px] font-semibold text-muted-foreground tabular-nums">{items.length}</span>
                </h2>
                {head.note && <p className="text-[15px] text-muted-foreground">{head.note}</p>}
                <ul className={cn('mt-4 grid items-start gap-4 md:gap-5', g === 'wait' ? 'lg:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
                  {items.map((s, i) => (
                    <SubmissionCard key={s.id} s={s} open={open} className={start + i >= 4 && !showAll ? 'max-md:hidden' : undefined} />
                  ))}
                </ul>
              </section>
            )
          })}
          {total > 4 && !showAll && (
            <Button variant="outline" className="h-12 px-6 text-[17px] md:hidden" onClick={() => setShowAll(true)}>
              ดูอีก {total - 4} รายการ
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export function PhotoBank() {
  const { state } = useGemHunter()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'hunter' ? 'hunter' : 'merchant'
  const setView = (v: View) => setParams({ view: v }, { replace: true })
  const waiting = state.campaign.submissions.filter((s) => bankGroup(s) === 'mine').length
  return (
    <>
      <h1 className="mb-5 text-[30px] leading-tight font-bold tracking-tight md:text-[34px]">{view === 'hunter' ? 'จำลองลูกค้าส่งรีวิว' : 'เลือกรูปจากลูกค้า'}</h1>
      <Tabs view={view} onChange={setView} waiting={waiting} />
      {view === 'hunter' ? <HunterForm /> : <MerchantBank />}
    </>
  )
}
