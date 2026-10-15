import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** One line of a ledger: what it is on the left, the amount on the right, an optional plain-language reason underneath. */
export function LedgerRow({ label, hint, value, strong, total, tone }: { label: ReactNode; hint?: ReactNode; value: ReactNode; strong?: boolean; total?: boolean; tone?: 'warn' }) {
  return (
    <li className={cn('flex items-baseline justify-between gap-5 py-3', total ? 'mt-1 border-t-2 border-ink pt-4' : 'border-t border-border first:border-t-0')}>
      <span className={cn('min-w-0', (strong || total) && 'font-semibold')}>
        {label}
        {hint && <span className="mt-0.5 block text-[15px] font-normal text-muted-foreground">{hint}</span>}
      </span>
      <span className={cn('figure shrink-0 self-start text-right', total ? 'text-[30px] leading-none' : 'text-[22px]', tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</span>
    </li>
  )
}

export function Ledger({ children, label, className }: { children: ReactNode; label?: string; className?: string }) {
  return (
    <ul className={className} aria-label={label}>
      {children}
    </ul>
  )
}
