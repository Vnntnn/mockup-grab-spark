import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { Screen1Discover } from '../screens/Screen1Discover'
import { Screen2SelectMain } from '../screens/Screen2SelectMain'
import { Screen3SelectComplement } from '../screens/Screen3SelectComplement'
import { DishMenu } from '../components/DishMenu'
import { PairProgress } from '../components/PairProgress'
import { createInitialState } from '@/app/reducer'
import { resolvePairingCampaign, DEFAULT_CAMPAIGN_ID } from '../data'

type RadioCardElement = React.ReactElement<{
  onKeyDown: (e: { key: string; preventDefault: () => void }) => void
  ref?: (el: HTMLElement | null) => void
}> & {
  ref?: (el: HTMLElement | null) => void
}

interface RenderedGroupTree {
  props: { children: RadioCardElement[] }
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

    it('renders both restaurants as plain facts with their sections', () => {
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
      // each restaurant is plain facts: name, section, area and hours labelled as demo data
      expect(html).toContain('ย่านออฟฟิศกลางกรุง')
      expect(html).toMatch(/เปิด (<!-- -->)?11:00/)
      expect(html).toContain('ข้อมูลตัวอย่าง')
      expect(html).not.toContain('bg-stall-a')
    })

    it('renders primary CTA button with Grab Green styling, 52px height, and bold 17px Sarabun', () => {
      const html = renderToString(
        React.createElement(Screen1Discover, {
          data: campData,
          onStart: () => {},
          onLoadSample: () => {},
        })
      )
      expect(html).toContain('bg-brand')
      expect(html).toContain('text-primary-foreground')
      expect(html).toContain('min-h-[52px]')
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

    it('renders the heading with the role and Restaurant A name', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: null,
          onSelect: () => {},
        })
      )
      expect(html).toContain('เลือกจานหลักจาก')
      expect(html).not.toContain('ขั้นตอนที่') // the pair progress says where we are; no counter above the heading
      expect(html).toContain('aria-label="เลือกจานหลักจากร้านข้าวหอม"')
    })

    it('renders all 3 dishes from menuA with comfortable (72px) rows', () => {
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
      expect(html).toContain('min-h-[72px]')
    })

    it('marks the chosen dish with the green wash, an ink bar and aria-checked', () => {
      const html = renderToString(
        React.createElement(Screen2SelectMain, {
          data: campData,
          selectedSlug: 'khao-man-gai-tod',
          onSelect: () => {},
        })
      )
      expect(html).toContain('bg-accent')
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกจานหลัก',
          options: campData.menuA,
          selectedSlug: null,
          onSelect,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกจานหลัก',
          options: campData.menuA,
          selectedSlug: 'khao-man-gai-tod',
          onSelect,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกจานหลัก',
          options: campData.menuA,
          selectedSlug: 'khao-man-gai-tod',
          onSelect,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกจานหลัก',
          options: campData.menuA,
          selectedSlug: null,
          onSelect,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
    it('keeps the first choice and its change action in the pinned pair progress (not on this screen)', () => {
      const onEditA = vi.fn()
      const progress = renderToString(
        React.createElement(PairProgress, { data: campData, dishA: campData.menuA[1], dishB: null, active: 'B', onEditA }),
      )
      expect(progress).toContain('ข้าวมันไก่ทอด')
      expect(progress).toContain('ยังไม่ได้เลือก')
      expect(progress).toContain('aria-label="เปลี่ยนจานหลัก"')
      expect(progress).toContain('min-h-[48px]')
      // while choosing from the first restaurant there is nothing to change yet
      const first = renderToString(
        React.createElement(PairProgress, { data: campData, dishA: null, dishB: null, active: 'A', onEditA }),
      )
      expect(first).not.toContain('เปลี่ยน')
    })

    it('renders the heading with the role and Restaurant B name', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: null,
          onSelectB: () => {},
        })
      )
      expect(html).toContain('เลือกของว่างจาก')
      expect(html).not.toContain('ขั้นตอนที่')
      expect(html).toContain('aria-label="เลือกของว่างจากร้านหมูสะเต๊ะบ้านสวน"')
    })

    it('renders all 3 dishes from menuB with dock clearance and 72px rows', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: null,
          onSelectB: () => {},
        })
      )
      expect(html).toContain('pb-36')
      expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
      expect(html).toContain('฿120')
      expect(html).toContain('ไก่ย่างสมุนไพร')
      expect(html).toContain('฿95')
      expect(html).toContain('ปีกไก่ทอดน้ำปลา')
      expect(html).toContain('฿85')
      expect(html).toContain('min-h-[72px]')
    })

    it('marks the chosen complement dish with the green wash, an ink bar and aria-checked', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
        })
      )
      expect(html).toContain('bg-accent')
      expect(html).toContain('aria-checked="true"')
    })

    it('contains zero emojis on Screen 3', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
        })
      )
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })

    it('marks unselected cards with aria-checked="false" and tabIndex="-1"', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: 'moo-satay-10',
          onSelectB: () => {},
        })
      )
      expect(html).toContain('aria-checked="false"')
      expect(html).toContain('tabindex="-1"')
    })

    it('ensures index 0 receives tabIndex="0" and index 1..2 receive tabIndex="-1" when no dish is selected', () => {
      const html = renderToString(
        React.createElement(Screen3SelectComplement, {
          data: campData,
          selectedSlugB: null,
          onSelectB: () => {},
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
          selectedSlugB: 'gai-yang',
          onSelectB: () => {},
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกของว่าง',
          options: campData.menuB,
          selectedSlug: null,
          onSelect: onSelectB,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
      const capture = { current: null as RenderedGroupTree | null }
      function Wrapper() {
        const el = DishMenu({
          label: 'เลือกของว่าง',
          options: campData.menuB,
          selectedSlug: 'gai-yang',
          onSelect: onSelectB,
        })
        capture.current = el as unknown as RenderedGroupTree
        return el
      }
      renderToString(React.createElement(Wrapper))
      const radioGroup = capture.current!
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
