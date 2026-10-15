import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SelectionDockProps {
  step: 2 | 3
  isEditing?: boolean
  summaryText: string
  isEnabled: boolean
  onNext: () => void
  variant?: 'mobile-dock' | 'desktop-sidebar'
  className?: string
}

export function SelectionDock({
  step,
  isEditing = false,
  summaryText,
  isEnabled,
  onNext,
  variant = 'mobile-dock',
  className,
}: SelectionDockProps) {
  const getCtaLabel = (): string => {
    if (isEditing) {
      return 'ดูคู่เมนูของคุณ'
    }
    if (step === 2) {
      return 'เลือกเมนูร้านที่สอง'
    }
    return 'ดูคู่เมนูของคุณ'
  }

  const ctaLabel = getCtaLabel()

  if (variant === 'desktop-sidebar') {
    return (
      <aside
        aria-label="สรุปการเลือกเมนูและดำเนินการต่อ"
        className={cn(
          'hidden lg:block sticky top-8 bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-raise)]',
          className
        )}
      >
        <div className="mb-4">
          <h3 className="font-heading text-[18px] font-bold text-foreground">
            สรุปการเลือกเมนู
          </h3>
          <p className="mt-2 text-[15px] text-muted-foreground">{summaryText}</p>
        </div>
        <Button
          type="button"
          disabled={!isEnabled}
          onClick={onNext}
          className={cn(
            'min-h-[48px] w-full text-[17px] font-bold rounded-xl transition-colors',
            isEnabled
              ? 'bg-[#00B14F] text-[#0A0A0A] hover:bg-[#009E46]'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          {ctaLabel}
        </Button>
      </aside>
    )
  }

  return (
    <div
      role="region"
      aria-label="การเลือกเมนูและดำเนินการต่อ"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border p-4 pb-safe lg:hidden md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-3rem)] md:max-w-lg md:rounded-2xl md:border md:shadow-lg',
        className
      )}
    >
      {summaryText && (
        <div className="mb-2 text-[14px] text-muted-foreground font-medium truncate">
          {summaryText}
        </div>
      )}
      <Button
        type="button"
        disabled={!isEnabled}
        onClick={onNext}
        className={cn(
          'min-h-[48px] w-full text-[17px] font-bold rounded-xl transition-colors',
          isEnabled
            ? 'bg-[#00B14F] text-[#0A0A0A] hover:bg-[#009E46]'
            : 'opacity-50 cursor-not-allowed'
        )}
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
