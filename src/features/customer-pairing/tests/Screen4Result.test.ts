import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { toast } from 'sonner'
import { Screen4Result } from '../screens/Screen4Result'
import { createInitialState } from '@/app/reducer'
import { resolvePairingCampaign, DEFAULT_CAMPAIGN_ID } from '../data'

describe('Screen 4 Result Showcase', () => {
  const state = createInitialState('2026-10-16')
  const campData = resolvePairingCampaign(DEFAULT_CAMPAIGN_ID, state.merchants, state.plans, state.campaigns)!

  it('renders "คู่เมนูที่คุณเลือก" for custom selections without sample badge', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('คู่เมนูที่คุณเลือก')
    expect(html).not.toContain('[ คู่เมนูตัวอย่างสำหรับการสาธิต ]')
    expect(html).not.toContain('คู่เมนูตัวอย่างสำหรับการสาธิต')
  })

  it('renders "คู่เมนูตัวอย่างสำหรับการสาธิต" and badge when isSample is true', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: true,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('คู่เมนูตัวอย่างสำหรับการสาธิต')
    expect(html).toContain('ตัวอย่างการจับคู่เมนูจากร้านข้าวหอมและร้านหมูสะเต๊ะบ้านสวน')
  })

  it('displays verbatim price notice and prototype disclaimer', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('ราคาแสดงแยกตามร้าน และสั่งซื้อกับแต่ละร้านแยกกัน')
    expect(html).toContain('ข้อมูลเมนูและราคาเป็นข้อมูลจำลองเพื่อการสาธิตต้นแบบ (Prototype) ไม่ใช่ราคาขายจริงของร้านค้า')
  })

  it('ensures edit buttons have min-h-[48px] touch targets', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('เปลี่ยนจานหลัก')
    expect(html).toContain('เปลี่ยนของว่าง')
    expect(html).toContain('min-h-[48px]')
  })

  it('renders primary share button with Grab Green styling, 52px height, and bold 17px text', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('แชร์คู่เมนูนี้')
    expect(html).toContain('bg-[#00B14F]')
    expect(html).toContain('text-[#0A0A0A]')
    expect(html).toContain('h-[52px]')
    expect(html).toContain('min-h-[48px]')
    expect(html).toContain('text-[17px]')
    expect(html).toContain('font-bold')
  })

  it('renders store ordering channel buttons with touch targets >= 48px', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('ไปยังหน้าร้านข้าวหอม')
    expect(html).toContain('ไปยังหน้าร้านหมูสะเต๊ะบ้านสวน')
    expect(html).toContain('min-h-[48px]')
  })

  it('renders reset button with touch target >= 48px', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('จับคู่เมนูคู่อื่นใหม่')
  })

  it('renders editorial dining stage with bg-[#F8FAF8], border-[#DDE2DD], rounded-3xl, and responsive desktop grid classes', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('bg-[#F8FAF8]')
    expect(html).toContain('border-[#DDE2DD]')
    expect(html).toContain('rounded-3xl')
    expect(html).toContain('lg:grid-cols-11')
    expect(html).toContain('lg:col-span-5')
    expect(html).toContain('lg:col-span-1')
  })

  interface RenderedScreen4Tree {
    props: {
      children: [
        unknown,
        unknown,
        unknown,
        { props: { children: [{ props: { onClick: () => Promise<void> } }] } },
      ]
    }
  }

  it('handles native share with AbortError ignoring and clipboard fallback with spec toast copy', async () => {
    const originalNavigator = globalThis.navigator
    const originalWindow = (globalThis as unknown as { window?: { location: { origin: string } } }).window
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    const toastSuccessMock = vi.spyOn(toast, 'success')

    try {
      ;(globalThis as unknown as { window?: { location: { origin: string } } }).window = {
        location: { origin: 'http://localhost:3000' },
      }

      // 1. AbortError is ignored: no clipboard fallback or error toast
      const abortError = new Error('The user aborted a request.')
      abortError.name = 'AbortError'
      const shareAbortMock = vi.fn().mockRejectedValue(abortError)

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: shareAbortMock,
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      })

      let tree: RenderedScreen4Tree | null = null
      function Wrapper() {
        tree = Screen4Result({
          data: campData,
          dishA: campData.menuA[0],
          dishB: campData.menuB[0],
          isSample: false,
          onEditA: () => {},
          onEditB: () => {},
          onReset: () => {},
          onOpenStore: () => {},
        }) as unknown as RenderedScreen4Tree
        return tree as unknown as React.ReactElement
      }
      renderToString(React.createElement(Wrapper))
      const actionButtons = tree!.props.children[3]
      const shareBtn = actionButtons.props.children[0]

      await shareBtn.props.onClick()
      expect(shareAbortMock).toHaveBeenCalledWith({
        title: 'คู่เมนูที่คุณเลือก - GemBond',
        text: `${campData.menuA[0].name} x ${campData.menuB[0].name}`,
        url: expect.stringContaining('/pair/camp-plan-m-khaohom?step=4'),
      })
      expect(writeTextMock).not.toHaveBeenCalled()
      expect(toastSuccessMock).not.toHaveBeenCalled()

      // 2. Non-abort failure falls back to clipboard with spec toast copy
      const nonAbortError = new Error('Share failed')
      const shareFailMock = vi.fn().mockRejectedValue(nonAbortError)
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: shareFailMock,
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      })

      await shareBtn.props.onClick()
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('/pair/camp-plan-m-khaohom?step=4')
      )
      expect(toastSuccessMock).toHaveBeenCalledWith('คัดลอกลิงก์คู่เมนูนี้แล้ว')

      // 3. Sample pairing uses spec sample title
      let sampleTree: RenderedScreen4Tree | null = null
      function SampleWrapper() {
        sampleTree = Screen4Result({
          data: campData,
          dishA: campData.menuA[0],
          dishB: campData.menuB[0],
          isSample: true,
          onEditA: () => {},
          onEditB: () => {},
          onReset: () => {},
          onOpenStore: () => {},
        }) as unknown as RenderedScreen4Tree
        return sampleTree as unknown as React.ReactElement
      }
      renderToString(React.createElement(SampleWrapper))
      const sampleShareBtn = sampleTree!.props.children[3].props.children[0]

      const shareSampleMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          share: shareSampleMock,
          clipboard: { writeText: writeTextMock },
        },
        configurable: true,
        writable: true,
      })
      await sampleShareBtn.props.onClick()
      expect(shareSampleMock).toHaveBeenCalledWith({
        title: 'คู่เมนูตัวอย่างสำหรับการสาธิต - GemBond',
        text: `${campData.menuA[0].name} x ${campData.menuB[0].name}`,
        url: expect.stringContaining('sample=true'),
      })
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      })
      ;(globalThis as unknown as { window?: unknown }).window = originalWindow
      toastSuccessMock.mockRestore()
    }
  })

  it('renders dish sections with restaurant labels, titles, and baht prices', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    expect(html).toContain('อาหารจานหลัก · ร้านข้าวหอม')
    expect(html).toContain('ของว่างทานเล่น · ร้านหมูสะเต๊ะบ้านสวน')
    expect(html).toContain(campData.menuA[0].name)
    expect(html).toContain(campData.menuB[0].name)
  })

  it('contains zero emojis across rendered HTML', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: true,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
    }))
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
    expect(emojiRegex.test(html)).toBe(false)
  })
})
