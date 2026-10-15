import { ArrowLeft, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PairingHeaderProps {
  step: number
  onBack?: () => void
  onShare?: () => void
  shareTitle?: string
  className?: string
}

export function PairingHeader({
  step,
  onBack,
  onShare,
  shareTitle,
  className,
}: PairingHeaderProps) {
  const showBack = step >= 2
  const showShare = step === 4

  const getStepTitle = (): string => {
    switch (step) {
      case 1:
        return 'จับคู่เมนูข้ามร้าน'
      case 2:
        return 'เลือกร้านแรก'
      case 3:
        return 'เลือกร้านที่สอง'
      case 4:
        return shareTitle || 'คู่เมนูของคุณ'
      default:
        return 'จับคู่เมนูข้ามร้าน'
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-2 backdrop-blur-xs',
        className
      )}
    >
      <div className="flex items-center min-h-[48px] min-w-[48px]">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="ย้อนกลับ"
            className="min-h-[48px] min-w-[48px] p-2 flex items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <div className="min-h-[48px] min-w-[48px]" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 text-center px-2">
        <h1 className="font-heading text-[17px] font-bold text-ink truncate">
          {getStepTitle()}
        </h1>
      </div>

      <div className="flex items-center justify-end min-h-[48px] min-w-[48px]">
        {showShare ? (
          <button
            type="button"
            onClick={onShare}
            aria-label="แชร์คู่เมนูนี้"
            className="min-h-[48px] min-w-[48px] p-2 flex items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Share2 className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <div className="min-h-[48px] min-w-[48px]" aria-hidden="true" />
        )}
      </div>
    </header>
  )
}
