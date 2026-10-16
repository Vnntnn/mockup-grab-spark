import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createInitialState } from '@/app/reducer'
import { CustomerDiscovery } from '../discovery/CustomerDiscovery'
import { DEMO_NETWORK_NOTE, MAP_LEGEND_NOTE, MAP_POSITION_NOTE } from '../network'

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null })) // sonner needs a DOM

const state = createInitialState('2026-10-16')
// server rendering inserts <!-- --> between adjacent text nodes; assertions are about the visible text
const render = (entry: string) =>
  renderToString(
    React.createElement(MemoryRouter, { initialEntries: [entry] }, React.createElement(CustomerDiscovery, { testState: state })),
  ).replace(/<!-- -->/g, '')

// the visible words in reading order (icons and markup removed)
const words = (html: string) => html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('CustomerDiscovery (/pair)', () => {
  it('opens on the schematic map as the main way to choose, with the suggested pairing and one primary action beside it', () => {
    const html = render('/pair')
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1)
    // the map: every restaurant and every pairing is a keyboard-reachable marker, with a legend and the demo notes
    for (const name of ['ร้านข้าวหอม', 'ร้านหมูสะเต๊ะบ้านสวน', 'ร้านชาไทยป้าอร', 'ร้านขนมหวานครัวคุณนิด']) {
      expect(html).toContain(`aria-label="${name} `)
    }
    expect(html.match(/aria-label="คู่ร้าน /g)?.length).toBe(4)
    expect(html).toContain(MAP_LEGEND_NOTE)
    expect(html).toContain(MAP_POSITION_NOTE)
    expect(html).toContain(DEMO_NETWORK_NOTE)
    // the suggested pairing is already in focus, so the way into the dishes is one tap away
    expect(html).toContain('คู่ร้านแนะนำ')
    expect(html.match(/เลือกเมนูจากคู่นี้/g)?.length).toBe(2) // one action: in the panel on desktop, in the bottom bar on phones
    expect(words(html)).toContain('เลือก 1 จานหลัก + 1 ของว่าง')
    expect(html).toContain('aria-label="ขั้นตอนการจับคู่เมนู"') // the three-step strip: pick a pair, one dish from each, order separately
    expect(html).not.toContain('เลือกจานหลักจาก')
  })

  it('puts the food first: each restaurant column opens with one of its own dishes drawn, named, labelled as a simulated image', () => {
    const html = render('/pair')
    expect(html.match(/<figcaption[^>]*>ภาพจำลอง<\/figcaption>/g)?.length).toBe(2)
    expect(words(html)).toContain('ตัวอย่าง: ข้าวมันไก่ต้ม') // the approved sample dishes for the campaign pairing
    expect(words(html)).toContain('ตัวอย่าง: หมูสะเต๊ะ 10 ไม้')
    // the plate sits above the owner's name, in the same column
    expect(html).toMatch(/ภาพจำลอง<\/figcaption><\/figure>.*?ข้าวมันไก่ต้ม.*?<h3[^>]*>ร้านข้าวหอม/)
  })

  it('says the lines on the map are pairings, not routes or distances', () => {
    expect(render('/pair')).toContain('ไม่ใช่เส้นทางหรือระยะทาง')
  })

  it('has a map/list switch; the list is the map-free path with every pairing and every restaurant', () => {
    const map = render('/pair')
    expect(map).toContain('aria-label="เลือกมุมมอง"')
    expect(map).not.toContain('id="pairing-list-heading"')
    const list = render('/pair?view=list')
    expect(list).toContain('คู่ร้านทั้งหมด')
    expect(list).toContain('ร้านทั้งหมด (4)')
    expect(list.match(/<li>/g)?.length).toBe(8) // 4 pairings + 4 restaurants
    expect(list).not.toContain(MAP_POSITION_NOTE) // no map in this view
    expect(list).toContain(DEMO_NETWORK_NOTE)
  })

  it('the suggested pairing shows both restaurants as separate entities, each with its own dishes and prices', () => {
    const html = render('/pair')
    expect(html.match(/<h3[^>]*>ร้าน/g)?.length).toBe(2)
    for (const dish of ['ข้าวมันไก่ต้ม', 'หมูสะเต๊ะ 10 ไม้']) expect(html).toContain(dish)
    expect(html).toContain('฿65')
    expect(html).toContain('฿120')
    expect(html).toContain('เวลาเปิดและเมนูเป็นข้อมูลตัวอย่าง')
  })

  it('a selected pairing takes the panel, is pressed on the map, and has a way back to the suggested one', () => {
    const html = render('/pair?pairing=pair-khaohom-tea')
    expect(html).toContain('กลับไปคู่ร้านแนะนำ')
    expect(html).toContain('เลือกเมนูจากคู่นี้')
    expect(html).toContain('ร้านข้าวหอม')
    expect(html).toContain('ร้านชาไทยป้าอร')
    expect(html).not.toContain('>คู่ร้านแนะนำ<')
    expect(html.match(/<h3[^>]*>ร้าน/g)?.length).toBe(2)
    expect(html).toMatch(/aria-pressed="true"/)
    expect(html).not.toMatch(/ส่วนลด|ประหยัด|ราคารวม|ตะกร้า/)
  })

  it('a selected restaurant shows its own details, dishes with prices and its pairings', () => {
    const html = render('/pair?restaurant=m-tea')
    expect(html).toContain('ชาไทยเย็น')
    expect(html).toContain('฿45')
    expect(html).toContain('คู่ร้านของร้านนี้')
    expect(words(html)).toContain('จานหลัก + เครื่องดื่ม') // its pairing, as restaurant + bond + restaurant
    expect(html).toContain('ดูคู่นี้')
    expect(html).toContain('คู่ร้านทั้งหมด') // the way back
    expect(html).not.toContain('เลือกเมนูจากคู่นี้') // choosing dishes starts from a pairing, not a restaurant
    expect(html).toMatch(/aria-pressed="true"/)
  })

  it('has no emoji', () => {
    expect(render('/pair?pairing=pair-khaohom-tea')).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
  })
})
