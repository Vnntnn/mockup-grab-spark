import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
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

  it('renders editorial dining stage with bg-[#F8FAF8], border-[#DDE2DD], and rounded-3xl', () => {
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
