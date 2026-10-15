import { CheckCircle2, Clock, Handshake } from 'lucide-react'
import { Gem } from './GemMark'
import { cn } from '@/lib/utils'
import { initial } from '@/lib/format'
import { hasValidConsent } from '@/domain/plans'
import type { GrowthPlan, Merchant } from '@/domain/types'

/**
 * The two shops and the bond between them. Each half of the line turns green only when that shop
 * has agreed to the CURRENT terms version, so the line is complete only when both have.
 */
export function BondPair({ plan, self, partner, className }: { plan: GrowthPlan; self: Merchant; partner: Merchant; className?: string }) {
  const selfOk = hasValidConsent(plan, self.id)
  const partnerOk = hasValidConsent(plan, partner.id)
  const side = (m: Merchant, tone: 'self' | 'partner', ok: boolean, name: string) => (
    <div className="flex w-28 min-w-0 flex-col items-center gap-1 text-center sm:w-36">
      <Gem glyph={initial(m.name)} tone={tone} className="size-14 sm:size-16" />
      <p className="w-full truncate text-[15px] leading-tight font-semibold">{name}</p>
      <p className={cn('flex items-center gap-1 text-[14px] leading-tight', ok ? 'font-semibold text-link' : 'text-muted-foreground')}>
        {ok ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : <Clock className="size-4 shrink-0" aria-hidden="true" />}
        {ok ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
      </p>
    </div>
  )
  return (
    <div
      className={cn('flex items-start justify-center gap-1', className)}
      role="group"
      aria-label={`สถานะการยืนยัน: ${self.name} ${selfOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}, ${partner.name} ${partnerOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}`}
    >
      {side(self, 'self', selfOk, 'ร้านคุณ')}
      <div className="mt-6 flex w-20 items-center sm:mt-7 sm:w-28" aria-hidden="true">
        <span className={cn('ease-fill h-1 flex-1 rounded-l-full', selfOk ? 'bg-brand' : 'bg-border')} />
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300', selfOk && partnerOk ? 'bg-brand text-ink' : 'border-2 border-border bg-card text-muted-foreground')}>
          <Handshake className="size-4" />
        </span>
        <span className={cn('ease-fill h-1 flex-1 rounded-r-full', partnerOk ? 'bg-brand' : 'bg-border')} />
      </div>
      {side(partner, 'partner', partnerOk, partner.name)}
    </div>
  )
}
