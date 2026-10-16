import { Check } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { evidenceOf, type GemHunterCampaign } from '../domain'
import { CAMPAIGN_STEP_OF_PHASE } from './hunter/phase'
import { STEPS } from './phase'

export type StepState = 'done' | 'now' | 'upcoming'

const STATE_TEXT: Record<StepState, string> = { done: 'เสร็จแล้ว', now: 'ขั้นที่ทำอยู่', upcoming: 'ยังไม่ถึง' }

/**
 * Which of the five steps are really done. Derived only from the campaign phase (same order as CAMPAIGN_STEP_OF_PHASE),
 * so a step is never marked done for something the campaign has not reached. Cancelled campaigns collect no further steps.
 */
export function stepStates(c: GemHunterCampaign): StepState[] {
  const at = c.phase === 'paused' ? (c.pausedFrom ?? 'eligibility_check') : c.phase
  const step = at === 'cancelled' || at === 'paused' ? 0 : CAMPAIGN_STEP_OF_PHASE[at]
  const graduated = at === 'gembond_handoff' || at === 'completed' || (at === 'graduation_check' && evidenceOf(c).eligible)
  return STEPS.map((_, i) => {
    const n = i + 1
    if (n < step || (n === 5 && graduated)) return 'done'
    return n === step ? 'now' : 'upcoming'
  })
}

/** The five steps as real navigation: number or tick, label, and a bar under the page you are on. */
export function Stepper({ campaign }: { campaign: GemHunterCampaign }) {
  const states = stepStates(campaign)
  const done = states.filter((s) => s === 'done').length
  return (
    <div className="relative">
      <ol className="grid grid-cols-5">
        {STEPS.map(({ to, end, label, full }, i) => {
          const state = states[i]
          return (
            <li key={to} className="min-w-0">
              <NavLink
                to={to}
                end={end}
                aria-label={`ขั้นที่ ${i + 1}: ${full}`}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-[76px] flex-col items-center justify-center gap-1.5 px-1 pt-2.5 pb-3.5 outline-offset-[-3px] transition-colors md:min-h-16 md:flex-row md:gap-2.5 md:px-3 md:py-3.5',
                    isActive && 'after:absolute after:inset-x-2 after:bottom-0 after:z-10 after:h-[3px] after:rounded-full after:bg-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      key={state}
                      aria-hidden="true"
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full border-2 text-[13px] leading-none font-bold tabular-nums transition-colors duration-(--dur-micro) ease-(--ease-out)',
                        state === 'done' && 'pop',
                        state === 'done' && 'border-foreground bg-primary text-primary-foreground',
                        state === 'now' && 'border-foreground bg-card text-foreground',
                        state === 'upcoming' && 'border-input bg-card text-muted-foreground',
                        isActive && 'ring-2 ring-foreground/20 ring-offset-1',
                      )}
                    >
                      {state === 'done' ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-center text-[13px] leading-tight transition-colors md:text-[15px] md:leading-normal md:whitespace-nowrap',
                        isActive ? 'font-bold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {label}
                    </span>
                    <span className="sr-only">
                      {STATE_TEXT[state]}
                      {isActive && ' (หน้าที่เปิดอยู่)'}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ol>
      {/* how far through the five steps: fills as steps finish, the printed state above is what assistive tech reads */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-border">
        <div className="ease-fill h-full bg-primary shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--primary-foreground)_55%,transparent)]" style={{ width: `${(done / states.length) * 100}%` }} />
      </div>
    </div>
  )
}
