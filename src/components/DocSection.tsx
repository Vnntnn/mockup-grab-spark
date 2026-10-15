import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A section of a document: a heading under a hairline, body in open space. No box. */
export function DocSection({ title, id, aside, children, className }: { title: ReactNode; id?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  const hid = id ? `${id}-h` : undefined
  return (
    <section id={id} aria-labelledby={hid} className={cn('mt-12 border-t border-border pt-8', className)}>
      <h2 id={hid} className="text-[22px] leading-snug font-bold text-ink">{title}</h2>
      {aside && <p className="mt-1 text-[15px] text-muted-foreground">{aside}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
