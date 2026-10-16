import { afterEach, describe, expect, it, vi } from 'vitest'
import { sharePairingLink } from '../share'

const input = { title: 'คู่เมนูที่คุณเลือก - GemBond', text: 'a x b', url: 'http://x/pair/c?step=4&dishA=a&dishB=b' }
const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })
}

describe('sharePairingLink', () => {
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'navigator', original)
  })

  it('uses native share when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    setNavigator({ share, clipboard: { writeText } })
    expect(await sharePairingLink(input)).toBe('shared')
    expect(share).toHaveBeenCalledWith(input)
    expect(writeText).not.toHaveBeenCalled()
  })

  it('treats AbortError as a cancel: no clipboard write, no error', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const writeText = vi.fn()
    setNavigator({ share: vi.fn().mockRejectedValue(abort), clipboard: { writeText } })
    expect(await sharePairingLink(input)).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard when share fails for another reason', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator({ share: vi.fn().mockRejectedValue(new Error('boom')), clipboard: { writeText } })
    expect(await sharePairingLink(input)).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(input.url)
  })

  it('copies when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator({ clipboard: { writeText } })
    expect(await sharePairingLink(input)).toBe('copied')
  })

  it('reports failure when the clipboard write is denied', async () => {
    setNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    expect(await sharePairingLink(input)).toBe('failed')
  })

  it('reports failure (never silence) when there is no Clipboard API', async () => {
    setNavigator({})
    expect(await sharePairingLink(input)).toBe('failed')
  })
})
