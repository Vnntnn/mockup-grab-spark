import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SimulatedBadgeProps {
  text?: string
  variant?: 'pill' | 'banner'
  className?: string
}

export function SimulatedBadge({
  text = 'ภาพจำลอง',
  variant = 'pill',
  className,
}: SimulatedBadgeProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/70 px-3 py-1.5 text-[14px] font-medium text-muted-foreground',
          className,
        )}
      >
        <Eye className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span>{text || 'ภาพจำลองเพื่อการสาธิตการจัดหน้าร้าน (ไม่ใช่ภาพถ่ายจริงจากลูกค้า)'}</span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[14px] font-medium tracking-tight text-muted-foreground select-none',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />
      {text}
    </span>
  )
}
