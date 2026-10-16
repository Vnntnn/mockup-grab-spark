import type { ReactNode } from 'react'
import { GemMark } from '@/components/GemMark'
import { cn } from '@/lib/utils'

/**
 * One grammar for "two restaurants that belong together": two equal columns, a hairline between them, and the
 * GemBond mark (two overlapping gems) sitting on that line at the height of the two names. Used by the pairing
 * detail, the pairing overview and the result, so a pairing always looks the same.
 */
export function BondColumns({
  left,
  right,
  className,
  tight,
}: {
  left: ReactNode
  right: ReactNode
  className?: string
  /** Narrow gutter for columns that start below the mark (restaurant sides); the result keeps the wide one so the mark clears the names. */
  tight?: boolean
}) {
  return (
    <div className={cn('relative grid grid-cols-2', tight ? 'gap-x-6' : 'gap-x-11', className)}>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 top-10 w-px -translate-x-1/2 bg-border" />
      <span className="pr-pop pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" style={{ ['--i' as string]: 2 }}>
        <GemMark className="size-9" snap />
      </span>
    </div>
  )
}
