import { evidenceOf } from './graduation'
import { approvedPhotos as approvedPhotoList } from './submissions'
import { transition } from './lifecycle'
import { ok, reject } from './types'
import type { GemBondHandoff, GemHunterCampaign, Result } from './types'

/** Consumers (GemBond) reject any other version. */
export const HANDOFF_SCHEMA_VERSION = 1 as const

/** Shown to the merchant so they can see what stays behind. */
export const HANDOFF_EXCLUDED = [
  'ชื่อและรายละเอียดของนักล่า',
  'ข้อความรีวิวทั้งหมด',
  'ประวัติคำสั่งซื้อ',
  'ต้นทุนและกำไรของร้าน',
  'รูปหรือรีวิวที่ยังไม่ได้รับอนุมัติ',
]

/** Exactly what the merchant agrees to share, one entry per payload group. `shareConsent.scope` stores the ids. */
export const HANDOFF_SCOPE = [
  { id: 'review_summary', label: 'จำนวนรีวิวที่ผ่านการตรวจสอบและคะแนนเฉลี่ย' },
  { id: 'approved_photos', label: 'รูปที่ผ่านการตรวจสอบและร้านอนุมัติแล้ว' },
  { id: 'cover_photo', label: 'รูปปกที่ร้านเลือก' },
  { id: 'approved_menu_titles', label: 'ชื่อเมนูที่ร้านอนุมัติแล้ว' },
  { id: 'badge', label: 'ป้ายผู้ผ่านแคมเปญ GemHunter' },
] as const

export const HANDOFF_BADGE_MEANING =
  'ป้ายนี้หมายถึงร้านผ่านเกณฑ์ของแคมเปญ GemHunter ตัวอย่าง ไม่ใช่การรับรองความปลอดภัยทางอาหาร สุขอนามัย หรือฮาลาล และไม่ใช่การรับประกันยอดขายหรืออันดับ'

export const handoffIdFor = (campaignId: string) => `handoff-${campaignId}-v${HANDOFF_SCHEMA_VERSION}`

type BuildCode = 'not_eligible' | 'consent_required'

/**
 * Builds the summary GemBond may receive. Refused unless the graduation rule passes AND the merchant explicitly agreed to share.
 * Consent never waives the rule. Payload is a whitelist, never a copy of campaign data. The id is derived from the campaign id only.
 */
export function buildHandoff(c: GemHunterCampaign, merchantName: string, createdAt: string, consent: boolean | undefined): Result<GemBondHandoff, BuildCode> {
  const ev = evidenceOf(c)
  if (!ev.eligible || ev.averageRating === null) return reject('not_eligible', `ยังไม่ครบเกณฑ์: ${ev.unmet.join(' / ')}`)
  if (consent !== true) return reject('consent_required', 'กรุณายืนยันว่าร้านอนุญาตให้ส่งข้อมูลสรุปนี้ก่อน')
  const photoIds = approvedPhotoList(c).map((p) => p.id)
  return ok({
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    handoffId: handoffIdFor(c.id),
    merchantId: c.merchantId,
    merchantName,
    sourceCampaignId: c.id,
    createdAt,
    status: 'ready',
    shareConsent: { granted: true, at: createdAt, scope: HANDOFF_SCOPE.map((s) => s.id) },
    readiness: 'graduated',
    payload: {
      validReviewCount: ev.validReviews,
      averageRating: ev.averageRating,
      approvedPhotoIds: photoIds,
      approvedMenuTitles: c.menuAudit.items
        .filter((i) => i.decision !== 'pending')
        .map((i) => ({ menuItemName: i.menuItemName, title: i.publishedTitle })),
      coverPhotoId: c.coverPhotoId !== null && photoIds.includes(c.coverPhotoId) ? c.coverPhotoId : null,
      badge: 'gemhunter_graduate',
      badgeMeaning: HANDOFF_BADGE_MEANING,
    },
    excluded: HANDOFF_EXCLUDED,
  })
}

/**
 * Marks the handoff opened and the campaign completed. This only records that the merchant opened GemBond:
 * it never creates, consents to or activates a GemBond plan or campaign.
 */
export function openHandoff(c: GemHunterCampaign): Result<GemHunterCampaign, 'no_handoff' | 'already_opened' | 'illegal_transition' | 'handoff_not_opened'> {
  if (c.handoff?.status === 'opened') return reject('already_opened', 'เปิด GemBond จากข้อมูลชุดนี้ไปแล้ว')
  if (!c.handoff || c.phase !== 'gembond_handoff') return reject('no_handoff', 'ยังไม่มีข้อมูลที่พร้อมส่งต่อให้ GemBond')
  const t = transition({ ...c, handoff: { ...c.handoff, status: 'opened' } }, 'completed')
  return t.ok ? t : reject(t.code === 'illegal_transition' ? 'illegal_transition' : 'handoff_not_opened', t.reason)
}
