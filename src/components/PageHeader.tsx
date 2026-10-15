import type { ReactNode } from 'react'

export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-[30px] leading-tight tracking-tight text-ink md:text-[34px]">{title}</h1>
        {action}
      </div>
      {lead && <p className="mt-2 max-w-[52ch] text-[17px] text-muted-foreground">{lead}</p>}
    </header>
  )
}
