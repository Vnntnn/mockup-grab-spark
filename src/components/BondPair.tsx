import { CheckCircle2, Clock } from 'lucide-react'
import { Gem } from './GemMark'
import { cn } from '@/lib/utils'
import { initial } from '@/lib/format'
import { hasValidConsent } from '@/domain/plans'
import type { GrowthPlan, Merchant } from '@/domain/types'

/**
 * Signature element: two gems and the bond between them.
 * Each half of the bond lights up only when that merchant has consented to the CURRENT terms version.
 */
export function BondPair({ plan, self, partner, compact = false }: { plan: GrowthPlan; self: Merchant; partner: Merchant; compact?: boolean }) {
  const selfOk = hasValidConsent(plan, self.id)
  const partnerOk = hasValidConsent(plan, partner.id)
  const both = selfOk && partnerOk
  const half = (on: boolean) => cn('h-1.5 flex-1', on ? 'bg-saffron' : 'border-t-2 border-dashed border-sage-strong')
  const side = (m: Merchant, tone: 'self' | 'partner', ok: boolean, label: string) => (
    <div className={cn('flex min-w-0 flex-col items-center gap-1 text-center', compact ? 'w-24' : 'w-32 sm:w-40')}>
      <Gem glyph={initial(m.name)} tone={tone} className={compact ? 'size-12' : 'size-16 sm:size-[72px]'} />
      <p className={cn('font-semibold leading-snug text-forest', compact ? 'text-sm' : 'text-[15px]')}>{label}</p>
      <p className={cn('flex items-center gap-1 leading-snug', compact ? 'text-[13px]' : 'text-sm', ok ? 'font-medium text-success' : 'text-muted-foreground')}>
        {ok ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : <Clock className="size-4 shrink-0" aria-hidden="true" />}
        {ok ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
      </p>
    </div>
  )
  return (
    <div
      className="flex items-start justify-center gap-2"
      role="group"
      aria-label={`สถานะการยืนยัน: ${self.name} ${selfOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}, ${partner.name} ${partnerOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}`}
    >
      {side(self, 'self', selfOk, 'ร้านคุณ')}
      <div className={cn('flex flex-1 items-center', compact ? 'mt-5 max-w-24' : 'mt-7 max-w-40 sm:mt-8')} aria-hidden="true">
        <span className={cn(half(selfOk), 'rounded-l-full')} />
        <span className={cn('size-3.5 shrink-0 rotate-45', both ? 'bg-saffron' : 'border-2 border-sage-strong bg-card')} />
        <span className={cn(half(partnerOk), 'rounded-r-full')} />
      </div>
      {side(partner, 'partner', partnerOk, partner.name)}
    </div>
  )
}
