import { ArrowLeft, Share2 } from 'lucide-react'
import { LangToggle } from '@/i18n/LangToggle'
import { cn } from '@/lib/utils'
import { CustomerDemoTools } from './CustomerDemoTools'

export interface PairingHeaderProps {
  step: number
  onBack?: () => void
  onShare?: () => void
  shareTitle?: string
  className?: string
}

const iconButton =
  'flex min-h-[48px] min-w-[48px] cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary'

/** Flat bar on the page ground: back, a quiet title, share on the result. Not a heading; each screen owns its h1. */
export function PairingHeader({ step, onBack, onShare, shareTitle, className }: PairingHeaderProps) {
  // the page's own heading and the pair progress say where we are, so the bar only carries the brand on the overview
  const title = step === 1 ? 'GemBond' : (shareTitle ?? '')

  return (
    <header className={cn('bg-background', className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-1 lg:px-5">
      <div className="min-h-[48px] min-w-[48px]">
        {(step >= 1 && onBack) && (
          <button type="button" onClick={onBack} aria-label="ย้อนกลับ" className={iconButton}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="pr-body truncate px-2 font-semibold">{title}</p>
      <div className="flex min-h-[48px] min-w-[48px] items-center gap-1">
        <LangToggle />
        <CustomerDemoTools />
        {step === 4 && onShare && (
          <button type="button" onClick={onShare} aria-label="แชร์คู่เมนูนี้" className={iconButton}>
            <Share2 className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      </div>
    </header>
  )
}
