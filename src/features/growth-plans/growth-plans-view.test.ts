import { describe, expect, it } from 'vitest'
import { getDecisionDockState } from './dock-utils'

describe('getDecisionDockState', () => {
  it('offers the exact spec labels for a plan awaiting the owner, with decline beside it', () => {
    const state = getDecisionDockState('awaiting', false)
    expect(state.primaryActionLabel).toBe('สนใจและยืนยันเงื่อนไข')
    expect(state.declineLabel).toBe('ยังไม่เข้าร่วม')
    expect(state.canDecline).toBe(true)
    expect(state.requiresConsent).toBe(true)
  })

  it('shares the status wording used on every other screen', () => {
    expect(getDecisionDockState('active', true).statusBadgeText).toBe('แคมเปญกำลังดำเนินการ')
    expect(getDecisionDockState('awaiting', true).statusBadgeText).toBe('คุณสนใจแล้ว — รอร้านคู่ค้ายืนยัน')
    expect(getDecisionDockState('declined', false).statusBadgeText).toBe('คุณเลือกยังไม่เข้าร่วม')
  })

  it('never asks for consent again once the owner has agreed, and cannot cancel a running campaign from here', () => {
    expect(getDecisionDockState('interested', true).requiresConsent).toBe(false)
    expect(getDecisionDockState('interested', true).primaryActionLabel).toBeNull()
    expect(getDecisionDockState('active', true).canDecline).toBe(false)
  })
})
