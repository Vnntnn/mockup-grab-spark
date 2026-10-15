import { cn } from '@/lib/utils'
import { STATUS } from '@/lib/copy'
import type { PlanLifecycle } from '@/domain/types'

const TONE = {
  neutral: 'bg-secondary text-ink',
  wait: 'bg-card text-ink ring-1 ring-inset ring-border',
  good: 'bg-accent text-ink',
  quiet: 'bg-secondary text-muted-foreground',
} as const

/** Status reads in a glance: an icon, the wording, a tinted pill. Never colour alone. */
export function StatusBadge({ status, className }: { status: PlanLifecycle; className?: string }) {
  const s = STATUS[status]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-3 text-[15px] leading-snug font-semibold', TONE[s.tone], className)}>
      <Icon className={cn('size-[18px] shrink-0', s.tone === 'good' && 'text-link')} aria-hidden="true" />
      {s.label}
    </span>
  )
}
