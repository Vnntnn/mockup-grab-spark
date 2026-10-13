import type { ReactNode } from 'react'

export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[60ch]">
        <h1 className="text-[26px] font-semibold text-forest md:text-[32px]">{title}</h1>
        {lead && <p className="mt-1 text-[17px] text-muted-foreground">{lead}</p>}
      </div>
      {action}
    </header>
  )
}
