import type { ReactNode } from 'react'
import { BarChart3, Check, ClipboardCheck, Handshake, Megaphone, type LucideIcon } from 'lucide-react'
import { STATUS } from '@/lib/copy'
import { cn } from '@/lib/utils'
import type { PlanLifecycle } from '@/domain/types'

/**
 * A plan's route as four stops. The line fills as the plan moves; the caption under it is the plan's exact status wording.
 * Plans that stopped (declined, cancelled) have no route to show.
 */
const STOPS: { label: string; icon: LucideIcon }[] = [
  { label: 'ตัดสินใจ', icon: ClipboardCheck },
  { label: 'ยืนยันครบ', icon: Handshake },
  { label: 'แคมเปญ', icon: Megaphone },
  { label: 'ผลลัพธ์', icon: BarChart3 },
]

/** Index of the stop the plan is at; STOPS.length once everything is done; null when the plan stopped. */
export function stopOf(status: PlanLifecycle): number | null {
  switch (status) {
    case 'awaiting':
      return 0
    case 'interested':
      return 1
    case 'ready':
    case 'active':
      return 2
    case 'completed':
      return STOPS.length
    default:
      return null
  }
}

export function JourneyTrack({ status, className }: { status: PlanLifecycle; className?: string }) {
  const at = stopOf(status)
  if (at === null) return null
  const fill = Math.min(at, STOPS.length - 1) / (STOPS.length - 1)
  return (
    <div className={cn('w-full', className)}>
      <ol className="relative grid grid-cols-4" aria-label="ขั้นตอนของแผน">
        {/* the rail and its fill run between the first and last stop centres */}
        <span className="absolute top-5 right-[12.5%] left-[12.5%] h-1 rounded-full bg-border" aria-hidden="true" />
        <span className="ease-fill absolute top-5 left-[12.5%] h-1 origin-left rounded-full bg-brand" style={{ width: `${fill * 75}%` }} aria-hidden="true" />
        {STOPS.map(({ label, icon: Icon }, i) => {
          const done = i < at
          const current = i === at
          return (
            <li key={label} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={current ? 'step' : undefined}>
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border-2 transition-colors duration-300',
                  done ? 'border-brand bg-brand text-ink' : current ? 'border-ink bg-card text-ink shadow-[var(--shadow-raise)]' : 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="pop size-5" strokeWidth={3} aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
              </span>
              <span className={cn('text-[14px] leading-tight', current ? 'font-bold text-ink' : done ? 'font-medium text-ink' : 'text-muted-foreground')}>
                {label}
                <span className="sr-only">{done ? ' (เสร็จแล้ว)' : current ? ' (ขั้นตอนนี้)' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-[15px] font-semibold text-ink">{STATUS[status].label}</p>
    </div>
  )
}

/** A short run of icon-led facts: what it is on the left of the colon never needs a sentence. */
export function Fact({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: ReactNode; tone?: 'warn' }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={cn('mt-1 size-5 shrink-0', tone === 'warn' ? 'text-warn' : 'text-link')} aria-hidden="true" />
      <div>
        <dt className="text-[14px] leading-tight text-muted-foreground">{label}</dt>
        <dd className={cn('figure text-[22px] leading-tight', tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</dd>
      </div>
    </div>
  )
}

/** A value on a track from 0 to 1 that eases to its place. `mark` is an optional requirement tick. */
export function Meter({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="ease-fill h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Custom gem and plate illustrations for empty states where a screen has nothing to show yet. */
export function EmptyArt({
  className,
  kind = 'bond',
}: {
  className?: string
  kind?: 'bond' | 'plans' | 'campaigns' | 'results'
}) {
  if (kind === 'results')
    return (
      <svg viewBox="0 0 120 56" className={cn('h-14 w-[7.5rem]', className)} fill="none" aria-hidden="true" focusable="false">
        <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
        {/* three empty bars: what the results will fill, nothing invented */}
        <rect x="64" y="30" width="10" height="16" rx="2" stroke="#c9d0c9" strokeWidth="2.5" strokeDasharray="3 4" />
        <rect x="82" y="20" width="10" height="26" rx="2" stroke="#c9d0c9" strokeWidth="2.5" strokeDasharray="3 4" />
        <rect x="100" y="10" width="10" height="36" rx="2" stroke="#00b14f" strokeWidth="2.5" strokeDasharray="3 4" />
        <path d="M60 50h54" stroke="#161616" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  if (kind === 'plans')
    return (
      <svg viewBox="0 0 120 56" className={cn('h-14 w-[7.5rem]', className)} fill="none" aria-hidden="true" focusable="false">
        {/* merchant gem linked to a shared plan sheet & plate */}
        <polygon points="22,10 36,18 36,34 22,42 8,34 8,18" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M40 26h20" stroke="#c9d0c9" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 5" />
        <rect x="64" y="6" width="46" height="44" rx="5" stroke="#161616" strokeWidth="2.5" />
        <circle cx="79" cy="24" r="8" stroke="#00b14f" strokeWidth="2.2" />
        <circle cx="95" cy="24" r="8" stroke="#c9d0c9" strokeWidth="2.2" strokeDasharray="2 3" />
        <path d="M72 40h30" stroke="#161616" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  if (kind === 'campaigns')
    return (
      <svg viewBox="0 0 120 56" className={cn('h-14 w-[7.5rem]', className)} fill="none" aria-hidden="true" focusable="false">
        {/* two paired plates with the GemBond gem mark between them */}
        <circle cx="30" cy="28" r="19" stroke="#161616" strokeWidth="2.5" />
        <circle cx="30" cy="28" r="12" stroke="#c9d0c9" strokeWidth="2" strokeDasharray="2 4" />
        <circle cx="90" cy="28" r="19" stroke="#00b14f" strokeWidth="2.5" />
        <circle cx="90" cy="28" r="12" stroke="#c9d0c9" strokeWidth="2" strokeDasharray="2 4" />
        <polygon points="60,16 70,22 70,34 60,40 50,34 50,22" fill="#ffffff" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="60" cy="28" r="3" fill="#00b14f" />
      </svg>
    )
  return (
    <svg viewBox="0 0 120 56" className={cn('h-14 w-[7.5rem]', className)} fill="none" aria-hidden="true" focusable="false">
      <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" stroke="#161616" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="96,14 112,23 112,41 96,50 80,41 80,23" stroke="#00b14f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 28h32" stroke="#c9d0c9" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 6" />
    </svg>
  )
}
