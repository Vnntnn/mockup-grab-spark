import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { jsx } from './jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { extractAll } from '../../scripts/i18n-extract.mjs'
import { pickText } from '@/features/customer-pairing/network'
import { EN } from './en'
import { getLang, setLang } from './lang'
import { LangToggle } from './LangToggle'
import { clearTranslationCache, t, translate } from './translate'

// Thai letters, vowels, tone marks and digits (not the baht sign U+0E3F)
const THAI = /[\u0E01-\u0E3A\u0E40-\u0E5B]/

// the suite runs in node: a minimal window/document is enough for the language state
const store = new Map<string, string>()
const root = { lang: '', classList: { add: () => {}, remove: () => {} } }

beforeEach(() => {
  store.clear()
  vi.stubGlobal('window', {
    localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
    setTimeout: () => 0,
  })
  vi.stubGlobal('document', { documentElement: root })
  setLang('en')
})
afterEach(() => {
  setLang('th')
  clearTranslationCache()
  vi.unstubAllGlobals()
})

describe('translate', () => {
  it('leaves Thai untouched in Thai mode', () => {
    setLang('th')
    expect(translate('ภาพรวม')).toBe('ภาพรวม')
  })

  it('translates exact entries and patterns, including the translated captures', () => {
    expect(translate('ภาพรวม')).toBe('Overview')
    expect(translate('คู่ร้าน ข้าวหอม และ ชาไทยป้าอร')).toBe("Pairing: Khao Hom and Pa Orn's Thai Tea")
  })

  it('translates the parts of "a · b" lists when the whole is unknown', () => {
    expect(translate('ภาพรวม · ผลลัพธ์')).toBe('Overview · Results')
  })

  it.each([
    '— ผ่าน',
    'ร้านคุณ: ยังไม่ยืนยัน',
    'เสร็จแล้ว (หน้าที่เปิดอยู่)',
    '“หมูสะเต๊ะ 10 ไม้”',
    'ใช้ชื่อที่แนะนำ:',
    'รูปที่ลูกค้าส่งมา',
    'ยังไม่ผ่าน · ยังรอ: ข้าวหอม',
    'ยังเริ่มไม่ได้ ข้อที่ยังไม่ผ่าน: ร้านทั้งสองฝ่ายยืนยันแล้ว / ทั้งสองร้านยืนยันเงื่อนไขฉบับเดียวกัน (ฉบับที่ 1)',
    'ในระบบจริง ทีมงานจะติดต่อกลับ ระหว่างนี้ คุณยังเลือกไม่เข้าร่วมแผนได้ทุกเมื่อ',
  ])('has no Thai left after translating a composed string: %s', (s) => {
    expect(translate(s)).not.toMatch(THAI)
  })

  it('returns unknown composed text as it is, without looping', () => {
    expect(translate('(ข้อความที่ไม่มีคำแปล)')).toBe('(ข้อความที่ไม่มีคำแปล)')
    expect(translate('ฎ (ฎฎ) ฎฎฎ')).toBe('ฎ (ฎฎ) ฎฎฎ')
  })

  it('uses singular nouns after a count of 1', () => {
    expect(translate('1 คู่ร้าน')).toBe('1 pairing')
    expect(translate('2 คู่ร้าน')).toBe('2 pairings')
    expect(translate('11 คู่ร้าน')).toBe('11 pairings')
  })

  it('reads naturally where the English first read as literal Thai (QA regressions)', () => {
    expect(translate('฿ 500 บาท')).toBe('฿500')
    expect(translate('เปิดร้าน')).toBe('Opens')
    expect(translate('ปิดร้าน')).toBe('Closes')
    expect(translate('ปิด')).toBe('Close')
    expect(translate('ร้านคุณจ่ายเพิ่ม')).toBe('Extra you pay')
    expect(translate('ขอยกเลิกแคมเปญ')).toBe('Cancel this campaign')
    expect(translate('แคมเปญยังไม่เริ่ม จึงยังไม่เปิดรับรีวิว ดูรายการได้ แต่ยังเลือกรูปไม่ได้ ')).toMatch(/open yet\. You can look/)
    expect(translate('อาหารจานหลัก ย่านออฟฟิศกลางกรุง ช่วยแนะนำร้านคุณให้ลูกค้ากลุ่มใหม่ ไม่รับประกันยอดขาย')).toMatch(/^A restaurant serving main dishes in the/i)
  })

  it('names what is picked from a restaurant as a lower-case singular in English, in Thai as it is', () => {
    expect(['จานหลัก', 'ของว่าง', 'เครื่องดื่ม', 'ของหวาน'].map(pickText)).toEqual(['main dish', 'snack', 'drink', 'dessert'])
    setLang('th')
    expect(pickText('เครื่องดื่ม')).toBe('เครื่องดื่ม')
  })

  it('keeps the mandatory notices in English', () => {
    expect(translate('ราคาแสดงแยกตามร้าน และสั่งซื้อกับแต่ละร้านแยกกัน')).toBe('Prices are shown per restaurant, and you order from each restaurant separately')
    expect(translate('ข้อมูลเมนูและราคาเป็นข้อมูลจำลองเพื่อการสาธิตต้นแบบ (Prototype) ไม่ใช่ราคาขายจริงของร้านค้า')).not.toMatch(THAI)
  })

  it('t() fills placeholders in both languages', () => {
    expect(t('เลือก{0}จาก{1}', 'จานหลัก', 'ข้าวหอม')).toBe('Choose main dish from Khao Hom')
    setLang('th')
    expect(t('เลือก{0}จาก{1}', 'จานหลัก', 'ข้าวหอม')).toBe('เลือกจานหลักจากข้าวหอม')
  })
})

describe('language state', () => {
  it('persists the choice and sets <html lang>', () => {
    expect(getLang()).toBe('en')
    expect(root.lang).toBe('en')
    expect(store.get('gembond.lang')).toBe('en')
    setLang('th')
    expect(root.lang).toBe('th')
    expect(store.get('gembond.lang')).toBe('th')
  })
})

describe('jsx runtime', () => {
  it('shows JSX text and accessible names in English', () => {
    const html = renderToStaticMarkup(jsx('button', { 'aria-label': 'ย้อนกลับ', children: 'ภาพรวม' }))
    expect(html).toContain('>Overview<')
    expect(html).not.toMatch(THAI)
  })

  it('toggle renders both options with aria-pressed', () => {
    const html = renderToStaticMarkup(createElement(LangToggle))
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('>EN<')
  })
})

describe('dictionary coverage', () => {
  it('has an English entry for every Thai string in the app source', () => {
    const missing = [...new Set(extractAll('src').map((f) => f.key))].filter((k) => EN[k] === undefined)
    expect(missing).toEqual([])
  })

  it('has no Thai left in any translation', () => {
    const allowed = new Set(['ไทย', 'ภาษาไทย', 'ภาษา / Language'])
    const left = Object.entries(EN).filter(([k, v]) => THAI.test(v) && !allowed.has(k)).map(([k]) => k)
    expect(left).toEqual([])
  })
})
