import { Ban, CircleCheck, CircleDashed, CircleDot, Hourglass, Pause, Radio, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GemHunterPhase } from '../domain/types'
import { PHASE_LABEL_SHORT } from './phase'

/** Status as an icon plus words: the icon shape differs by state, so colour is never the only cue. */
const ICON: Record<GemHunterPhase, LucideIcon> = {
  eligibility_check: CircleDashed,
  menu_review: CircleDot,
  active_campaign: Radio,
  submission_review: Hourglass,
  graduation_check: Hourglass,
  gembond_handoff: CircleCheck,
  completed: CircleCheck,
  paused: Pause,
  cancelled: Ban,
}

export function PhaseBadge({ phase, className }: { phase: GemHunterPhase; className?: string }) {
  const Icon = ICON[phase]
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[15px] leading-snug font-medium', className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {PHASE_LABEL_SHORT[phase]}
    </span>
  )
}
