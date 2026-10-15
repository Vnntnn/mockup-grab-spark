import type { ReactNode } from 'react'
import { Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PhoneMockupFrameProps {
  children: ReactNode
  title?: string
  className?: string
}

/**
 * Frames the customer's view of the shop. One label says what it is (an illustration of a generic ordering app, not a real one);
 * the content inside carries its own "ภาพจำลอง" marks.
 */
export function PhoneMockupFrame({ children, title = 'มุมมองลูกค้าในแอปสั่งอาหาร (สมมติ)', className }: PhoneMockupFrameProps) {
  return (
    <div className={cn('w-full', className)}>
      <p className="mb-3 flex items-center gap-2 text-[15px] font-medium text-muted-foreground">
        <Smartphone className="size-4 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
