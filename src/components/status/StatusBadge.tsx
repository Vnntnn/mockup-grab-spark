import { cn } from '@/lib/utils'
import { STATUS } from '@/lib/copy'
import type { PlanLifecycle } from '@/domain/types'

const TONE = {
  neutral: 'bg-secondary text-secondary-foreground border-sage-strong',
  wait: 'bg-saffron-soft text-saffron-ink border-saffron/50',
  good: 'bg-success-soft text-success border-success/30',
  quiet: 'bg-muted text-muted-foreground border-border',
} as const

/** Status is always icon + words, never colour alone. */
export function StatusBadge({ status, className }: { status: PlanLifecycle; className?: string }) {
  const s = STATUS[status]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[15px] font-medium leading-snug', TONE[s.tone], className)}>
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {s.label}
    </span>
  )
}
