import { afterEach, describe, expect, it, vi } from 'vitest'
import { flyPlate, withViewTransition } from '../motion'

afterEach(() => vi.unstubAllGlobals())

const rect = (w: number) => ({ left: 10, top: 10, width: w, height: w, right: 10 + w, bottom: 10 + w })

function fakeDom(reduced: boolean) {
  const appended: unknown[] = []
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduced }) })
  vi.stubGlobal('document', { body: { appendChild: (e: unknown) => appended.push(e) } })
  const clone = { setAttribute: vi.fn(), style: {}, remove: vi.fn(), animate: vi.fn(() => ({})) }
  const from = { getBoundingClientRect: () => rect(80), cloneNode: () => clone } as unknown as Element
  const to = { getBoundingClientRect: () => rect(40) } as unknown as Element
  return { appended, clone, from, to }
}

describe('flyPlate (the dish-choice confirmation)', () => {
  it('does nothing without a DOM or without both ends', () => {
    expect(() => flyPlate(null, null)).not.toThrow()
  })

  it('is skipped for reduced motion: no copy of the plate is created', () => {
    const { appended, clone, from, to } = fakeDom(true)
    flyPlate(from, to)
    expect(appended).toHaveLength(0)
    expect(clone.animate).not.toHaveBeenCalled()
  })

  it('otherwise adds one non-interactive, hidden copy and animates it for a third of a second', () => {
    const { appended, clone, from, to } = fakeDom(false)
    flyPlate(from, to)
    expect(appended).toHaveLength(1)
    expect(clone.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true')
    expect((clone.style as Record<string, string>).pointerEvents).toBe('none')
    expect(clone.animate).toHaveBeenCalledTimes(1)
    const options = (clone.animate.mock.calls[0] as unknown[])[1] as { duration: number }
    expect(options.duration).toBeLessThanOrEqual(400)
  })
})

describe('withViewTransition (selective page transition)', () => {
  it('runs callback via document.startViewTransition when supported and motion is allowed', () => {
    const startViewTransition = vi.fn((cb: () => void) => cb())
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) })
    vi.stubGlobal('document', { visibilityState: 'visible', startViewTransition })
    const run = vi.fn()
    withViewTransition(run)
    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('skips startViewTransition and runs callback immediately under prefers-reduced-motion', () => {
    const startViewTransition = vi.fn()
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) })
    vi.stubGlobal('document', { visibilityState: 'visible', startViewTransition })
    const run = vi.fn()
    withViewTransition(run)
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(run).toHaveBeenCalledTimes(1)
  })
})
