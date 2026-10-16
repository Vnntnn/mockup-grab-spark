import { useState } from 'react'
import { CheckCircle2, Clock, Handshake } from 'lucide-react'
import { Gem } from './GemMark'
import { cn } from '@/lib/utils'
import { initial } from '@/lib/format'
import { hasValidConsent } from '@/domain/plans'
import type { GrowthPlan, Merchant } from '@/domain/types'

/**
 * The two shops and the bond between them. Each half of the line turns green only when that shop
 * has agreed to the CURRENT terms version, so the line is complete only when both have.
 *
 * Motion: when a shop's consent turns valid WHILE this is on screen, that half of the line fills toward the middle and the
 * shop's gem pops once; when both are valid the handshake joint pops with one ring. Arriving on a page where the bond is
 * already complete (or switching language, which remounts) plays nothing. Losing a consent plays nothing either.
 */
export function BondPair({ plan, self, partner, className }: { plan: GrowthPlan; self: Merchant; partner: Merchant; className?: string }) {
  const selfOk = hasValidConsent(plan, self.id)
  const partnerOk = hasValidConsent(plan, partner.id)
  const bothOk = selfOk && partnerOk

  // "adjust state while rendering": compare with the previous render's values, so only a real false -> true change animates
  const [prev, setPrev] = useState({ selfOk, partnerOk, bothOk })
  const [fresh, setFresh] = useState({ self: false, partner: false, both: false })
  if (prev.selfOk !== selfOk || prev.partnerOk !== partnerOk) {
    setPrev({ selfOk, partnerOk, bothOk })
    setFresh({
      self: selfOk && (fresh.self || !prev.selfOk),
      partner: partnerOk && (fresh.partner || !prev.partnerOk),
      both: bothOk && (fresh.both || !prev.bothOk),
    })
  }

  const side = (m: Merchant, tone: 'self' | 'partner', ok: boolean, justNow: boolean, name: string) => (
    <div className="flex w-28 min-w-0 flex-col items-center gap-1 text-center sm:w-36">
      <span className={cn('block', justNow && 'bond-gem-pop')}>
        <Gem glyph={initial(m.name)} tone={tone} className="size-14 sm:size-16" />
      </span>
      <p className="w-full truncate text-[15px] leading-tight font-semibold">{name}</p>
      <p key={justNow ? 'now' : 'rest'} className={cn('flex items-center gap-1 text-[14px] leading-tight', ok ? 'font-semibold text-link' : 'text-muted-foreground', justNow && 'pr-swap')}>
        {ok ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : <Clock className="size-4 shrink-0" aria-hidden="true" />}
        {ok ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
      </p>
    </div>
  )
  // the grey half is always there; the green overlay fills it
  const half = (ok: boolean, justNow: boolean, from: 'left' | 'right') => (
    <span className={cn('relative h-1 flex-1 overflow-hidden', from === 'left' ? 'rounded-l-full' : 'rounded-r-full', 'bg-border')}>
      {ok && <span className={cn('absolute inset-0 bg-brand', justNow && (from === 'left' ? 'bond-fill-left' : 'bond-fill-right'))} />}
    </span>
  )
  return (
    <div
      className={cn('flex items-start justify-center gap-1', className)}
      role="group"
      aria-label={`สถานะการยืนยัน: ${self.name} ${selfOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}, ${partner.name} ${partnerOk ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}`}
    >
      {side(self, 'self', selfOk, fresh.self, 'ร้านคุณ')}
      <div className="mt-6 flex w-20 items-center sm:mt-7 sm:w-28" aria-hidden="true">
        {half(selfOk, fresh.self, 'left')}
        <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300', bothOk ? 'bg-brand text-ink' : 'border-2 border-border bg-card text-muted-foreground', fresh.both && 'bond-joint')}>
          {fresh.both && <span className="bond-ring pointer-events-none absolute inset-0 rounded-full border-2 border-brand" />}
          <Handshake className="size-4" />
        </span>
        {half(partnerOk, fresh.partner, 'right')}
      </div>
      {side(partner, 'partner', partnerOk, fresh.partner, partner.name)}
    </div>
  )
}
