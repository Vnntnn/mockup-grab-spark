import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function Panel({
  title,
  icon,
  children,
  className,
  id,
}: {
  title?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Card id={id} className={cn('gap-4 rounded-2xl text-[17px] [--card-spacing:--spacing(5)] md:[--card-spacing:--spacing(6)]', className)}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-[22px] leading-snug font-bold text-ink">
            {icon && <span className="text-link [&_svg]:size-6">{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
