import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { Screen1Discover } from '../screens/Screen1Discover'
import { Screen2SelectMain } from '../screens/Screen2SelectMain'
import { Screen3SelectComplement } from '../screens/Screen3SelectComplement'
import { createInitialState } from '@/app/reducer'
import { resolvePairingCampaign, DEFAULT_CAMPAIGN_ID } from '../data'

type RadioCardElement = React.ReactElement<{
  onKeyDown: (e: { key: string; preventDefault: () => void }) => void
  ref?: (el: HTMLElement | null) => void
}> & {
  ref?: (el: HTMLElement | null) => void
}

interface RenderedScreen2Tree {
  props: {
    children: [unknown, { props: { children: RadioCardElement[] } }]
  }
}

interface RenderedScreen3Tree {
  props: {
    children: [unknown, unknown, { props: { children: RadioCardElement[] } }]
  }
}

describe('Screens 1, 2, 3', () => {
  const state = createInitialState('2026-10-16')
  const campData = resolvePairingCampaign(DEFAULT_CAMPAIGN_ID, state.merchants, state.plans, state.campaigns)!

  describe('Screen1Discover', () => {
    it('renders neutral headline and sample shelf on Screen 1', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).toContain('จับคู่เมนูจาก 2 ร้านในย่านคุณ')
      expect(html).toContain('เริ่มจับคู่เมนู')
      expect(html).toContain('คู่เมนูตัวอย่างสำหรับการสาธิต')
      expect(html).toContain('ดูคู่นี้')
      expect(html).toContain('min-h-[48px]')
    })

    it('renders restaurant chips with initial gems and categories', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).toContain('ร้านข้าวหอม')
      expect(html).toContain('อาหารจานหลัก')
      expect(html).toContain('ร้านหมูสะเต๊ะบ้านสวน')
      expect(html).toContain('ของว่างทานเล่น')
      // Gem glyphs: 'ข' and 'ส'
      expect(html).toContain('>ข<')
      expect(html).toContain('>ส<')
    })

    it('renders primary CTA button with Grab Green styling, 52px height, and bold 17px Sarabun', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).toContain('bg-[#00B14F]')
      expect(html).toContain('text-[#0A0A0A]')
      expect(html).toContain('h-[52px]')
      expect(html).toContain('text-[17px]')
      expect(html).toContain('font-bold')
    })

    it('renders secondary sample shelf with exact dish names and prices', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).toContain('ข้าวมันไก่ต้ม')
      expect(html).toContain('฿65')
      expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
      expect(html).toContain('฿120')
    })

    it('contains zero emojis on Screen 1', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })
  })

  describe('Screen2SelectMain', () => {
    it('renders accessible radio group and pb-36 padding on Screen 2', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect: () => {},
        })
      )
      expect(html).toContain('role="radiogroup"')
      expect(html).toContain('role="radio"')
      expect(html).toContain('pb-36')
      expect(html).toContain('ข้าวมันไก่ทอด')
      expect(html).toContain('฿70')
    })

    it('renders subheader indicating step 1 of 2 and Restaurant A name', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: null,
          onSelect: () => {},
        })
      )
      expect(html).toContain('ขั้นตอนที่ 1 จาก 2: เลือกจานหลักจาก ร้านข้าวหอม')
      expect(html).toContain('aria-label="เลือกจานหลักจากร้านข้าวหอม"')
    })

    it('renders all 3 dishes from menuA with min-h-[56px] touch targets', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: null,
          onSelect: () => {},
        })
      )
      expect(html).toContain('ข้าวมันไก่ต้ม')
      expect(html).toContain('฿65')
      expect(html).toContain('ข้าวมันไก่ทอด')
      expect(html).toContain('฿70')
      expect(html).toContain('ข้าวหน้าไก่เทอริยากิ')
      expect(html).toContain('฿85')
      expect(html).toContain('min-h-[56px]')
    })

    it('applies selected styling with 2px ink border and light green background to selected card', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect: () => {},
        })
      )
      expect(html).toContain('border-[#161616]')
      expect(html).toContain('bg-[#E3F6EA]')
      expect(html).toContain('aria-checked="true"')
    })

    it('ensures index 0 receives tabIndex="0" and index 1..2 receive tabIndex="-1" when no dish is selected', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: null,
          onSelect: () => {},
        })
      )
      const radioTags = [...html.matchAll(/<div[^>]*role="radio"[^>]*>/g)].map((m) => m[0])
      expect(radioTags).toHaveLength(3)
      expect(radioTags[0]).toContain('tabindex="0"')
      expect(radioTags[1]).toContain('tabindex="-1"')
      expect(radioTags[2]).toContain('tabindex="-1"')
    })

    it('ensures selected dish receives tabIndex="0" and other dishes receive tabIndex="-1"', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect: () => {},
        })
      )
      const radioTags = [...html.matchAll(/<div[^>]*role="radio"[^>]*>/g)].map((m) => m[0])
      expect(radioTags).toHaveLength(3)
      expect(radioTags[0]).toContain('tabindex="-1"')
      expect(radioTags[1]).toContain('tabindex="0"')
      expect(radioTags[2]).toContain('tabindex="-1"')
    })

    it('advances selection and focuses next card on ArrowDown and ArrowRight, with wrapping', () => {
      const onSelect = vi.fn()
      const capture = { current: null as RenderedScreen2Tree | null }
      function Wrapper() {
        const el = Screen2SelectMain({
          data: campData,
          selectedSlug: null,
          onSelect,
        })
        capture.current = el as unknown as RenderedScreen2Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[1]
      const cards = radioGroup.props.children
      const mockDoms = cards.map(() => ({ focus: vi.fn() }))
      cards.forEach((card, i) => {
        const refFn = card.props.ref ?? card.ref
        if (typeof refFn === 'function') refFn(mockDoms[i] as unknown as HTMLElement)
      })

      // ArrowDown from index 0 -> advances to index 1
      const preventDefault1 = vi.fn()
      cards[0].props.onKeyDown({ key: 'ArrowDown', preventDefault: preventDefault1 })
      expect(preventDefault1).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[1])
      expect(mockDoms[1].focus).toHaveBeenCalled()

      // ArrowRight from index 1 -> advances to index 2
      const preventDefault2 = vi.fn()
      cards[1].props.onKeyDown({ key: 'ArrowRight', preventDefault: preventDefault2 })
      expect(preventDefault2).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()

      // ArrowDown from index 2 (last) -> wraps to index 0 (first)
      const preventDefault3 = vi.fn()
      cards[2].props.onKeyDown({ key: 'ArrowDown', preventDefault: preventDefault3 })
      expect(preventDefault3).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()
    })

    it('reverses selection and focuses previous card on ArrowUp and ArrowLeft, with wrapping', () => {
      const onSelect = vi.fn()
      const capture = { current: null as RenderedScreen2Tree | null }
      function Wrapper() {
        const el = Screen2SelectMain({
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect,
        })
        capture.current = el as unknown as RenderedScreen2Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[1]
      const cards = radioGroup.props.children
      const mockDoms = cards.map(() => ({ focus: vi.fn() }))
      cards.forEach((card, i) => {
        const refFn = card.props.ref ?? card.ref
        if (typeof refFn === 'function') refFn(mockDoms[i] as unknown as HTMLElement)
      })

      // ArrowUp from index 1 -> moves to index 0
      const preventDefault1 = vi.fn()
      cards[1].props.onKeyDown({ key: 'ArrowUp', preventDefault: preventDefault1 })
      expect(preventDefault1).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()

      // ArrowLeft from index 0 (first) -> wraps to index 2 (last)
      const preventDefault2 = vi.fn()
      cards[0].props.onKeyDown({ key: 'ArrowLeft', preventDefault: preventDefault2 })
      expect(preventDefault2).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()
    })

    it('selects first and last options on Home and End keys', () => {
      const onSelect = vi.fn()
      const capture = { current: null as RenderedScreen2Tree | null }
      function Wrapper() {
        const el = Screen2SelectMain({
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect,
        })
        capture.current = el as unknown as RenderedScreen2Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[1]
      const cards = radioGroup.props.children
      const mockDoms = cards.map(() => ({ focus: vi.fn() }))
      cards.forEach((card, i) => {
        const refFn = card.props.ref ?? card.ref
        if (typeof refFn === 'function') refFn(mockDoms[i] as unknown as HTMLElement)
      })

      // Home from index 1 -> jumps to index 0
      const preventDefaultHome = vi.fn()
      cards[1].props.onKeyDown({ key: 'Home', preventDefault: preventDefaultHome })
      expect(preventDefaultHome).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()

      // End from index 0 -> jumps to index 2
      const preventDefaultEnd = vi.fn()
      cards[0].props.onKeyDown({ key: 'End', preventDefault: preventDefaultEnd })
      expect(preventDefaultEnd).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()
    })

    it('selects current option on Space and Enter keys without moving index', () => {
      const onSelect = vi.fn()
      const capture = { current: null as RenderedScreen2Tree | null }
      function Wrapper() {
        const el = Screen2SelectMain({
          data: campData,
          selectedSlug: null,
          onSelect,
        })
        capture.current = el as unknown as RenderedScreen2Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[1]
      const cards = radioGroup.props.children

      const preventDefaultSpace = vi.fn()
      cards[1].props.onKeyDown({ key: ' ', preventDefault: preventDefaultSpace })
      expect(preventDefaultSpace).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[1])

      const preventDefaultEnter = vi.fn()
      cards[2].props.onKeyDown({ key: 'Enter', preventDefault: preventDefaultEnter })
      expect(preventDefaultEnter).toHaveBeenCalled()
      expect(onSelect).toHaveBeenLastCalledWith(campData.menuA[2])
    })

    it('contains zero emojis on Screen 2', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect: () => {},
        })
      )
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })
  })

  describe('Screen3SelectComplement', () => {
    it('renders preserved Dish A chip with [เปลี่ยน] on Screen 3', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[1],
          selectedSlugB: null,
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).toContain('ข้าวมันไก่ทอด')
      expect(html).toContain('เปลี่ยน')
      expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
      expect(html).toContain('฿120')
      expect(html).toContain('min-h-[48px]')
      expect(html).toContain('aria-label="เปลี่ยนจานหลัก"')
    })

    it('renders subheader indicating step 2 of 2 and Restaurant B name', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: null,
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).toContain('ขั้นตอนที่ 2 จาก 2: เลือกของว่างจาก ร้านหมูสะเต๊ะบ้านสวน')
      expect(html).toContain('aria-label="เลือกของว่างจากร้านหมูสะเต๊ะบ้านสวน"')
    })

    it('renders all 3 dishes from menuB with pb-36 padding and min-h-[56px] cards', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: null,
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).toContain('pb-36')
      expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
      expect(html).toContain('฿120')
      expect(html).toContain('ไก่ย่างสมุนไพร')
      expect(html).toContain('฿95')
      expect(html).toContain('ปีกไก่ทอดน้ำปลา')
      expect(html).toContain('฿85')
      expect(html).toContain('min-h-[56px]')
    })

    it('applies selected styling with 2px ink border and light green background to selected complement dish', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).toContain('border-[#161616]')
      expect(html).toContain('bg-[#E3F6EA]')
      expect(html).toContain('aria-checked="true"')
    })

    it('contains zero emojis on Screen 3', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })

    it('does not render Dish A anchor chip if selectedDishA is null', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: null,
          selectedSlugB: null,
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).not.toContain('aria-label="เปลี่ยนจานหลัก"')
      expect(html).not.toContain('เปลี่ยน')
    })

    it('marks unselected cards with aria-checked="false" and tabIndex="-1"', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      expect(html).toContain('aria-checked="false"')
      expect(html).toContain('tabindex="-1"')
    })

    it('ensures index 0 receives tabIndex="0" and index 1..2 receive tabIndex="-1" when no dish is selected', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: null,
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      const radioTags = [...html.matchAll(/<div[^>]*role="radio"[^>]*>/g)].map((m) => m[0])
      expect(radioTags).toHaveLength(3)
      expect(radioTags[0]).toContain('tabindex="0"')
      expect(radioTags[1]).toContain('tabindex="-1"')
      expect(radioTags[2]).toContain('tabindex="-1"')
    })

    it('ensures selected dish receives tabIndex="0" and other dishes receive tabIndex="-1"', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: 'gai-yang',
          onSelectB: () => {},
          onEditA: () => {},
        })
      )
      const radioTags = [...html.matchAll(/<div[^>]*role="radio"[^>]*>/g)].map((m) => m[0])
      expect(radioTags).toHaveLength(3)
      expect(radioTags[0]).toContain('tabindex="-1"')
      expect(radioTags[1]).toContain('tabindex="0"')
      expect(radioTags[2]).toContain('tabindex="-1"')
    })

    it('advances selection and focuses next complement card on ArrowDown / ArrowRight, with wrapping', () => {
      const onSelectB = vi.fn()
      const capture = { current: null as RenderedScreen3Tree | null }
      function Wrapper() {
        const el = Screen3SelectComplement({
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: null,
          onSelectB,
          onEditA: () => {},
        })
        capture.current = el as unknown as RenderedScreen3Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[2]
      const cards = radioGroup.props.children
      const mockDoms = cards.map(() => ({ focus: vi.fn() }))
      cards.forEach((card, i) => {
        const refFn = card.props.ref ?? card.ref
        if (typeof refFn === 'function') refFn(mockDoms[i] as unknown as HTMLElement)
      })

      // ArrowDown from index 0 -> index 1
      const preventDefault1 = vi.fn()
      cards[0].props.onKeyDown({ key: 'ArrowDown', preventDefault: preventDefault1 })
      expect(preventDefault1).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[1])
      expect(mockDoms[1].focus).toHaveBeenCalled()

      // ArrowRight from index 1 -> index 2
      const preventDefault2 = vi.fn()
      cards[1].props.onKeyDown({ key: 'ArrowRight', preventDefault: preventDefault2 })
      expect(preventDefault2).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()

      // ArrowDown from index 2 -> wraps to index 0
      const preventDefault3 = vi.fn()
      cards[2].props.onKeyDown({ key: 'ArrowDown', preventDefault: preventDefault3 })
      expect(preventDefault3).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()
    })

    it('reverses selection and jumps with Home/End on Screen 3', () => {
      const onSelectB = vi.fn()
      const capture = { current: null as RenderedScreen3Tree | null }
      function Wrapper() {
        const el = Screen3SelectComplement({
          data: campData,
          selectedDishA: campData.menuA[0],
          selectedSlugB: 'gai-yang',
          onSelectB,
          onEditA: () => {},
        })
        capture.current = el as unknown as RenderedScreen3Tree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!.props.children[2]
      const cards = radioGroup.props.children
      const mockDoms = cards.map(() => ({ focus: vi.fn() }))
      cards.forEach((card, i) => {
        const refFn = card.props.ref ?? card.ref
        if (typeof refFn === 'function') refFn(mockDoms[i] as unknown as HTMLElement)
      })

      // ArrowUp from index 1 -> index 0
      const preventDefault1 = vi.fn()
      cards[1].props.onKeyDown({ key: 'ArrowUp', preventDefault: preventDefault1 })
      expect(preventDefault1).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()

      // ArrowLeft from index 0 -> wraps to index 2
      const preventDefault2 = vi.fn()
      cards[0].props.onKeyDown({ key: 'ArrowLeft', preventDefault: preventDefault2 })
      expect(preventDefault2).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()

      // Home from index 2 -> index 0
      const preventDefaultHome = vi.fn()
      cards[2].props.onKeyDown({ key: 'Home', preventDefault: preventDefaultHome })
      expect(preventDefaultHome).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[0])
      expect(mockDoms[0].focus).toHaveBeenCalled()

      // End from index 0 -> index 2
      const preventDefaultEnd = vi.fn()
      cards[0].props.onKeyDown({ key: 'End', preventDefault: preventDefaultEnd })
      expect(preventDefaultEnd).toHaveBeenCalled()
      expect(onSelectB).toHaveBeenLastCalledWith(campData.menuB[2])
      expect(mockDoms[2].focus).toHaveBeenCalled()
    })
  })
})
