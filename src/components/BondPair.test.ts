import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { createInitialState, reduce } from '@/app/reducer'
import { selfOf } from '@/app/selectors'
import { BondPair } from './BondPair'

const PLAN = 'plan-m-khaohom'
const html = (s: ReturnType<typeof createInitialState>) => {
  const plan = s.plans[PLAN]
  const partner = s.merchants[plan.participatingMerchantIds.find((id) => id !== s.selfId)!]
  return renderToString(React.createElement(BondPair, { plan, self: selfOf(s), partner }))
}

describe('BondPair motion', () => {
  const start = createInitialState('2026-10-16')
  const mine = reduce(start, { type: 'accept', planId: PLAN, acks: ['cost', 'data', 'rights'] })
  const both = reduce(mine, { type: 'demoPartnerConsent', planId: PLAN })

  it('plays nothing when it first appears, whatever the state: an already-complete bond is not "newly" complete', () => {
    for (const s of [start, mine, both]) expect(html(s)).not.toMatch(/bond-(fill|gem-pop|joint|ring)/)
  })

  it('shows the real consent state in text, not only in colour', () => {
    expect(html(start)).toContain('ยังไม่ยืนยัน')
    expect(html(both)).toContain('ยืนยันแล้ว')
    expect(html(both)).not.toContain('ยังไม่ยืนยัน')
  })
})
