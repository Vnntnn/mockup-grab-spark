import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { ModerationStatus } from '../../domain'
import { cn } from '@/lib/utils'

const LOOK: Record<ModerationStatus, { label: string; Icon: typeof Clock; cls: string }> = {
  pending: { label: 'รอตรวจสอบ', Icon: Clock, cls: 'bg-secondary text-foreground' },
  approved: { label: 'ผ่านการตรวจสอบ', Icon: CheckCircle2, cls: 'bg-success-soft text-success' },
  rejected: { label: 'ไม่ผ่านการตรวจสอบ', Icon: XCircle, cls: 'bg-danger-soft text-destructive' },
}

/** Status is always icon + text, never colour alone. */
export function ModerationBadge({ status, className }: { status: ModerationStatus; className?: string }) {
  const { label, Icon, cls } = LOOK[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[15px] font-medium', cls, className)}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}
