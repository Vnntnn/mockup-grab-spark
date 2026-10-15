import { describe, expect, it } from 'vitest'
import { isDecisionRoute } from './nav-utils'

describe('isDecisionRoute helper', () => {
  it('identifies plan decision routes that require contextual full-screen mode', () => {
    expect(isDecisionRoute('/plans/plan-m-khaohom')).toBe(true)
    expect(isDecisionRoute('/plans/plan-m-jumbo')).toBe(true)
  })

  it('keeps standard mobile bottom navigation on catalog and dashboard pages', () => {
    expect(isDecisionRoute('/dashboard')).toBe(false)
    expect(isDecisionRoute('/plans')).toBe(false)
    expect(isDecisionRoute('/opportunities')).toBe(false)
    expect(isDecisionRoute('/campaigns')).toBe(false)
    expect(isDecisionRoute('/results')).toBe(false)
  })
})
