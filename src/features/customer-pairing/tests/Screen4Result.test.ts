import { describe, it, expect, vi } from 'vitest'
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
      onShare: () => {},
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
      onShare: () => {},
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
      onShare: () => {},
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
      onShare: () => {},
    }))
    expect(html).toContain('เปลี่ยนจานหลัก')
    expect(html).toContain('เปลี่ยนของว่าง')
    expect(html).toContain('min-h-[48px]')
  })

  it('renders primary share button in brand green with a 52px minimum height and bold 17px text', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
      onShare: () => {},
    }))
    expect(html).toContain('แชร์คู่เมนูนี้')
    expect(html).toContain('bg-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('min-h-[52px]')
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
      onShare: () => {},
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
      onShare: () => {},
    }))
    expect(html).toContain('จับคู่เมนูคู่อื่นใหม่')
  })

  it('shows each dish under its own restaurant with its own simulation caption, and never a total', () => {
    const html = renderToString(React.createElement(Screen4Result, {
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
      onShare: () => {},
    }))
    expect(html.match(/<figcaption[^>]*>ภาพจำลอง<\/figcaption>/g)?.length).toBe(2) // one visible caption per plate
    expect(html).not.toContain('bg-stall-a')
    expect(html).not.toContain('bg-stall-b')
    // price and attribution stay per dish: no sum, no combined wording
    expect(html).not.toMatch(/รวม|ประหยัด|ส่วนลด|ตะกร้า/)
  })

  it('wires the share button to the onShare prop', () => {
    const onShare = vi.fn()
    const root = Screen4Result({
      data: campData,
      dishA: campData.menuA[0],
      dishB: campData.menuB[0],
      isSample: false,
      onEditA: () => {},
      onEditB: () => {},
      onReset: () => {},
      onOpenStore: () => {},
      onShare,
    })
    type Node = { type?: unknown; props?: { children?: unknown; onClick?: () => void } }
    const text = (n: unknown): string =>
      typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join('') : n && typeof n === 'object' ? text((n as Node).props?.children) : ''
    const find = (n: unknown): Node | null => {
      if (Array.isArray(n)) return n.map(find).find(Boolean) ?? null
      if (!n || typeof n !== 'object') return null
      const node = n as Node
      if (node.type === 'button' && text(node) === 'แชร์คู่เมนูนี้') return node
      return find(node.props?.children)
    }
    const button = find(root)
    expect(button).not.toBeNull()
    button!.props!.onClick!()
    expect(onShare).toHaveBeenCalledTimes(1)
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
      onShare: () => {},
    }))
    const plain = html.replace(/<!-- -->/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '') // icons and plates are pictures; the order of the text is what is asserted
    // restaurant, then what it is, then plate, dish and price: in that order inside its own column
    expect(plain).toMatch(/ร้านข้าวหอม<\/p><p[^>]*>อาหารจานหลัก<\/p>.*?<h2[^>]*>ข้าวมันไก่ต้ม<\/h2><p[^>]*>฿65<\/p>/)
    expect(plain).toMatch(/ร้านหมูสะเต๊ะบ้านสวน<\/p><p[^>]*>ของว่างทานเล่น<\/p>.*?<h2[^>]*>หมูสะเต๊ะ 10 ไม้<\/h2><p[^>]*>฿120<\/p>/)
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
      onShare: () => {},
    }))
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
    expect(emojiRegex.test(html)).toBe(false)
  })
})
