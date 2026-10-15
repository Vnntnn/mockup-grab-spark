import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, FlaskConical, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INCENTIVE_NOTE } from './copy'

/** Page title: one h1, at most one short sentence under it. */
export function PageHead({ title, lead, className, children }: { title: string; lead?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <header className={cn('mb-6 max-w-[62ch] md:mb-8', className)}>
      <h1 className="text-[30px] leading-tight font-bold md:text-[36px]">{title}</h1>
      {lead && <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground">{lead}</p>}
      {children}
    </header>
  )
}

/** Section heading, no icon tile. */
export function H2({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2 id={id} className={cn('text-[22px] leading-snug font-bold', className)}>
      {children}
    </h2>
  )
}

/**
 * The one empty state of GemHunter: a small line icon, one sentence, at most one action.
 * Quiet on purpose (no box, no fake cards): an empty list is a normal beginning, not a failure of the shop.
 */
export function EmptyNote({ Icon, children, action, className }: { Icon: LucideIcon; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex max-w-[34rem] flex-col items-start gap-3 py-2', className)}>
      <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
      <p className="text-[17px] leading-relaxed">{children}</p>
      {action}
    </div>
  )
}

/**
 * Detail on demand. The trigger is a real button (aria-expanded, 44px+), the height eases open, and while closed the content
 * is not focusable or readable by assistive tech. Anything the merchant must see before deciding does NOT belong in here.
 */
export function Disclose({
  label,
  icon,
  meta,
  defaultOpen = false,
  children,
  className,
  triggerClassName,
}: {
  label: ReactNode
  icon?: ReactNode
  meta?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  triggerClassName?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn('flex min-h-11 w-full items-center gap-3 rounded-lg text-left text-[15px] font-semibold outline-offset-4', triggerClassName)}
      >
        {icon}
        <span className="min-w-0 flex-1">{label}</span>
        {meta}
        <ChevronDown className="gh-chevron size-5 shrink-0" aria-hidden="true" />
      </button>
      <div id={id} className="gh-disclose-body" data-open={open}>
        <div>{children}</div>
      </div>
    </div>
  )
}

/**
 * "n of total" as filled segments. The number is always printed next to it, so the bar never carries the meaning alone.
 * Segments are filled straight from `value` (visible without any animation); a changed value eases through the CSS transition.
 */
export function SegMeter({ value, total, className }: { value: number; total: number; className?: string }) {
  return (
    <div className={cn('gh-seg', className)} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} data-on={i < value} />
      ))}
    </div>
  )
}

/** The voucher conditions, one tap away wherever the voucher appears. */
export function VoucherTerms({ className }: { className?: string }) {
  return (
    <Disclose className={className} label="เงื่อนไขคูปอง" icon={<Info className="size-4 shrink-0" aria-hidden="true" />} triggerClassName="text-[15px] font-medium text-muted-foreground">
      <p className="pb-2 text-[14px] leading-relaxed text-muted-foreground">{INCENTIVE_NOTE}</p>
    </Disclose>
  )
}

/** Marks something that only exists in the demo (not part of what a merchant or customer would really use). */
export function SimTag({ children = 'เฉพาะสาธิต', className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[14px] leading-6 font-medium text-muted-foreground', className)}>
      <FlaskConical className="size-4" aria-hidden="true" />
      {children}
    </span>
  )
}
