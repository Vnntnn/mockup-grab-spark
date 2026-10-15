import { merchants, SELF_ID } from '@/data/merchants'
import type { Merchant } from '@/domain/types'
import type { GemHunterCampaign, GraduationConfig, HunterMission, MenuAuditItem } from '../domain/types'
import type { SubmissionInput } from '../domain/submissions'

/** Merchant identity comes from the GemBond data. GemHunter keeps only the id. */
export const GEMHUNTER_MERCHANT_ID = SELF_ID

export const merchantOf = (id: string): Merchant | undefined => merchants.find((m) => m.id === id)

/** Illustrative demo rule, not a real program requirement. */
export const GRADUATION_CONFIG: GraduationConfig = { minValidReviews: 10, minAverageRatingExclusive: 4.2 }

export const MISSION: HunterMission = {
  id: 'mission-neighborhood-taste',
  title: 'ตามหาร้านเด็ดในย่านใกล้คุณ',
  description: 'ลองสั่งจากร้านใหม่ในย่าน แล้วแชร์รูปอาหารจริงพร้อมรีวิวตามที่รู้สึก',
  voucher: {
    id: 'voucher-illustrative-30',
    label: 'ส่วนลดจากแพลตฟอร์ม 30–50 บาท (ตัวอย่าง)',
    valueRangeBaht: { min: 30, max: 50 },
    fundedBy: 'platform',
    merchantCostBaht: 0,
    illustrative: true,
    qrPlaceholder: true,
  },
  orderChannel: 'existing_store_channel',
}

/**
 * Suggested titles keyed by sampleMenu name. Every phrase used in a title is an attribute that is both in verifiedAttributes
 * and tagged in attributeSource, and the title contains it word for word, so the seed has no invalid suggestion and no unsupported claim.
 * `shop_profile`: stated in the synthetic shop profile or menu. `merchant_confirmed`: the merchant confirmed it when joining (synthetic).
 */
type Suggestion = Pick<MenuAuditItem, 'suggestedTitle' | 'suggestionAttributes' | 'verifiedAttributes' | 'attributeSource'>
const SUGGESTIONS: Record<string, Suggestion> = {
  'หมูสะเต๊ะ 10 ไม้': {
    suggestedTitle: 'หมูสะเต๊ะ 10 ไม้ ย่างหอมควันถ่าน ทำสดทุกเช้า น้ำจิ้มทำเอง',
    suggestionAttributes: ['ย่างหอมควันถ่าน', 'ทำสดทุกเช้า', 'น้ำจิ้มทำเอง'],
    verifiedAttributes: ['ย่างหอมควันถ่าน', 'ทำสดทุกเช้า', 'น้ำจิ้มทำเอง', '10 ไม้'],
    attributeSource: { ย่างหอมควันถ่าน: 'merchant_confirmed', ทำสดทุกเช้า: 'shop_profile', น้ำจิ้มทำเอง: 'shop_profile', '10 ไม้': 'shop_profile' },
  },
  'ไก่ย่างสมุนไพร': {
    suggestedTitle: 'ไก่ย่างสมุนไพร สูตรหมักเอง ย่างหอมควันถ่าน',
    suggestionAttributes: ['สูตรหมักเอง', 'ย่างหอมควันถ่าน'],
    verifiedAttributes: ['สูตรหมักเอง', 'ย่างหอมควันถ่าน', 'สมุนไพร'],
    attributeSource: { สูตรหมักเอง: 'merchant_confirmed', ย่างหอมควันถ่าน: 'merchant_confirmed', สมุนไพร: 'shop_profile' },
  },
  'ปีกไก่ทอดน้ำปลา': {
    suggestedTitle: 'ปีกไก่ทอดน้ำปลา ทอดสดใหม่ กรอบนอก',
    suggestionAttributes: ['ทอดสดใหม่', 'กรอบนอก'],
    verifiedAttributes: ['ทอดสดใหม่', 'กรอบนอก', 'น้ำปลา'],
    attributeSource: { ทอดสดใหม่: 'merchant_confirmed', กรอบนอก: 'merchant_confirmed', น้ำปลา: 'shop_profile' },
  },
}

export function createSeedCampaign(): GemHunterCampaign {
  const merchant = merchantOf(GEMHUNTER_MERCHANT_ID)
  const menuAudit = {
    items: (merchant?.sampleMenu ?? [])
      .filter((m) => SUGGESTIONS[m.name])
      .map<MenuAuditItem>((m, i) => ({
        id: `menu-${i + 1}`,
        menuItemName: m.name,
        currentTitle: m.name,
        ...SUGGESTIONS[m.name],
        decision: 'pending',
        publishedTitle: m.name,
        history: [],
      })),
  }
  return {
    id: `gh-campaign-${GEMHUNTER_MERCHANT_ID}`,
    merchantId: GEMHUNTER_MERCHANT_ID,
    phase: 'eligibility_check',
    menuAudit,
    mission: MISSION,
    submissions: [],
    coverPhotoId: null,
    handoff: null,
    config: { ...GRADUATION_CONFIG },
  }
}

// ---------- demo hunter submissions ----------
export const DEMO_SUBMITTED_AT = '2026-10-14'
export const DEMO_ID_PREFIX = 'demo-sub-'

const ALIASES = ['นักล่ามะลิ', 'นักล่าตะวัน', 'นักล่าใบเตย', 'นักล่าฟ้าใส', 'นักล่าข้าวปุ้น', 'นักล่าลมเย็น', 'นักล่าเมฆขาว', 'นักล่าพริกไทย', 'นักล่ากะทิ', 'นักล่าเสียงฝน']
const RATINGS = [5, 5, 4, 5, 4, 5, 4, 5, 3, 5] as const
// index i is posted under menu item i % 3 (satay, grilled chicken, wings), so each text is placed where it fits
const TEXTS = [
  'หมูนุ่ม น้ำจิ้มหอมถั่ว กินเพลินมาก',
  'ไก่ย่างหอมสมุนไพร ไม่เค็มเกินไป',
  'ปีกไก่กรอบดี แต่อยากได้น้ำจิ้มเพิ่มอีกนิด',
  'รสชาติดี หมูหอม แต่ไม้ค่อนข้างเล็ก',
  'ไก่หมักเข้าเนื้อดี อยากให้ย่างเกรียมกว่านี้หน่อย',
  'ปีกไก่ทอดหอมน้ำปลา ทานเพลินจนหมดกล่อง',
  'ชอบน้ำจิ้ม ทานคู่กับแตงกวาอร่อยมาก',
  'ได้ของครบ ร้อนกำลังดี ส่งเร็วกว่าที่คิด',
  'รสชาติโอเค แต่มาถึงเย็นไปนิดหนึ่ง',
  'ของสด หอมควันย่าง จะกลับมาสั่งอีก',
]

/** Ten synthetic hunters, one review each, spread over the menu. Ids and timestamps are fixed so the demo is repeatable. */
export function demoSubmissionInputs(menuItemNames: string[]): SubmissionInput[] {
  return ALIASES.map((hunterId, i) => ({
    hunterId,
    menuItemName: menuItemNames[i % menuItemNames.length],
    rating: RATINGS[i],
    reviewText: TEXTS[i],
    imageUseConsent: true,
    photoLabel: `ภาพอาหารตัวอย่างจากนักล่า ${i + 1}`,
  }))
}
