import { MISSION } from '../data/seed'
import { ok, reject } from './types'
import type { GemHunterCampaign, HunterSubmission, Rating, Result, Validation, Voucher } from './types'

export const MIN_REVIEW_LENGTH = 10

export interface SubmissionInput {
  hunterId: string
  menuItemName: string
  rating: number
  reviewText: string
  imageUseConsent: boolean
  photoLabel: string
}

export type SubmissionCode =
  | 'invalid_hunter'
  | 'unknown_menu_item'
  | 'invalid_rating'
  | 'review_too_short'
  | 'no_photo'
  | 'no_image_consent'
  | 'duplicate'

const isRating = (n: number): n is Rating => Number.isInteger(n) && n >= 1 && n <= 5

/** Pure check, nothing is stored. Any failure means the submission never enters state. */
export function validateSubmission(existing: HunterSubmission[], input: SubmissionInput, menuItemNames: string[]): Validation<SubmissionCode> {
  if (input.hunterId.trim().length === 0) return reject('invalid_hunter', 'ไม่พบชื่อนักล่า')
  if (!menuItemNames.includes(input.menuItemName)) return reject('unknown_menu_item', 'ไม่พบเมนูที่เลือก')
  if (!isRating(input.rating)) return reject('invalid_rating', 'กรุณาให้คะแนน 1 ถึง 5 ดาว')
  if (input.reviewText.trim().length < MIN_REVIEW_LENGTH) return reject('review_too_short', `รีวิวต้องมีอย่างน้อย ${MIN_REVIEW_LENGTH} ตัวอักษร`)
  if (input.photoLabel.trim().length === 0) return reject('no_photo', 'กรุณาแนบรูปอาหาร')
  if (!input.imageUseConsent) return reject('no_image_consent', 'ต้องยินยอมให้ร้านใช้รูปนี้ก่อนจึงจะส่งได้')
  if (existing.some((s) => s.hunterId === input.hunterId && s.menuItemName === input.menuItemName))
    return reject('duplicate', 'นักล่าคนนี้ส่งรีวิวเมนูนี้ไปแล้ว')
  return { ok: true }
}

/** New submissions always start pending. `id` is only overridden for deterministic demo data. */
export function addSubmission(
  existing: HunterSubmission[],
  input: SubmissionInput,
  menuItemNames: string[],
  submittedAt: string,
  id?: string,
): Result<HunterSubmission, SubmissionCode> {
  const v = validateSubmission(existing, input, menuItemNames)
  if (!v.ok) return v
  const n = existing.length + 1
  const subId = id ?? `sub-${n}`
  return ok({
    id: subId,
    hunterId: input.hunterId,
    menuItemName: input.menuItemName,
    rating: input.rating as Rating,
    reviewText: input.reviewText.trim(),
    photo: {
      id: subId.replace('sub', 'photo'),
      submissionId: subId,
      label: input.photoLabel.trim(),
      hue: (n * 47) % 360,
      imageUseConsent: input.imageUseConsent,
      moderation: 'pending',
      merchantDecision: 'pending',
      onStorefront: false,
    },
    purchaseCheck: 'simulated',
    incentiveDisclosed: true,
    moderation: 'pending',
    submittedAt,
  })
}

type EditCode = 'unknown_submission' | 'already_moderated' | 'photo_not_approved'

function updateSubmission(
  subs: HunterSubmission[],
  id: string,
  fn: (s: HunterSubmission) => Result<HunterSubmission, EditCode>,
): Result<HunterSubmission[], EditCode> {
  const s = subs.find((x) => x.id === id)
  if (!s) return reject('unknown_submission', 'ไม่พบรายการที่ส่งเข้ามา')
  const r = fn(s)
  if (!r.ok) return r
  return ok(subs.map((x) => (x.id === id ? r.value : x)))
}

/** Moderation decides the review and its photo together. A decision is final. */
export function moderateSubmission(subs: HunterSubmission[], id: string, result: 'approved' | 'rejected', note?: string) {
  return updateSubmission(subs, id, (s) => {
    if (s.moderation !== 'pending') return reject('already_moderated', 'รายการนี้ตรวจสอบแล้ว')
    return ok({
      ...s,
      moderation: result,
      moderationNote: note,
      photo: { ...s.photo, moderation: result, rejectionReason: result === 'rejected' ? note : undefined },
    })
  })
}

/** Counts as an approved photo only when moderation passed, the merchant approved it and the hunter consented. */
export const isApprovedPhoto = (s: HunterSubmission) =>
  s.photo.moderation === 'approved' && s.photo.merchantDecision === 'approved' && s.photo.imageUseConsent

export function decidePhoto(subs: HunterSubmission[], id: string, decision: 'approved' | 'rejected', reason?: string) {
  return updateSubmission(subs, id, (s) => {
    if (s.photo.moderation !== 'approved' || !s.photo.imageUseConsent)
      return reject('photo_not_approved', 'รูปนี้ยังไม่ผ่านการตรวจสอบ จึงยังเลือกไม่ได้')
    return ok({
      ...s,
      photo: {
        ...s.photo,
        merchantDecision: decision,
        rejectionReason: decision === 'rejected' ? reason : undefined,
        onStorefront: decision === 'approved' ? s.photo.onStorefront : false,
      },
    })
  })
}

export function setStorefront(subs: HunterSubmission[], id: string, on: boolean) {
  return updateSubmission(subs, id, (s) => {
    if (!isApprovedPhoto(s)) return reject('photo_not_approved', 'ต้องอนุมัติรูปก่อนจึงจะแสดงหน้าร้านได้')
    return ok({ ...s, photo: { ...s.photo, onStorefront: on } })
  })
}

type CoverCode = 'unknown_submission' | 'not_on_storefront'

/**
 * Sets (or with `on: false` clears) the single cover photo. Only a photo that is on the storefront can be the cover.
 * Turning off a photo that is not the current cover leaves the real cover alone.
 */
export function setCover(c: Pick<GemHunterCampaign, 'submissions' | 'coverPhotoId'>, submissionId: string, on: boolean): Result<string | null, CoverCode> {
  const s = c.submissions.find((x) => x.id === submissionId)
  if (!s) return reject('unknown_submission', 'ไม่พบรายการที่ส่งเข้ามา')
  if (!on) return ok(c.coverPhotoId === s.photo.id ? null : c.coverPhotoId)
  if (!isApprovedPhoto(s) || !s.photo.onStorefront) return reject('not_on_storefront', 'ต้องแสดงรูปนี้หน้าร้านก่อนจึงจะตั้งเป็นรูปปกได้')
  return ok(s.photo.id)
}

/**
 * Keeps cover ⊆ storefront ⊆ approved after any photo change: a cover that is no longer a storefront photo is dropped.
 * Rejecting a photo or taking it off the storefront therefore clears the cover in the same step.
 */
export function withValidCover<C extends Pick<GemHunterCampaign, 'submissions' | 'coverPhotoId'>>(c: C): C {
  if (c.coverPhotoId === null) return c
  const stillValid = storefrontPhotos(c).some((p) => p.id === c.coverPhotoId)
  return stillValid ? c : { ...c, coverPhotoId: null }
}

// ---------- reward ----------
export interface Reward {
  eligible: boolean
  valueRangeBaht: { min: number; max: number }
  fundedBy: 'platform'
  merchantCostBaht: 0
  illustrative: true
}

/**
 * The illustrative platform voucher for one submission. Rating is deliberately never read: a 1 star and a 5 star review earn the same.
 * Only a moderation rejection (content problem, such as a photo that is not the dish) withholds it. The merchant pays nothing either way.
 */
export function rewardFor(s: HunterSubmission, voucher: Pick<Voucher, 'valueRangeBaht'> = MISSION.voucher): Reward {
  return {
    eligible: s.moderation !== 'rejected',
    valueRangeBaht: { ...voucher.valueRangeBaht },
    fundedBy: 'platform',
    merchantCostBaht: 0,
    illustrative: true,
  }
}

// ---------- selectors ----------
export const approvedSubmissions = (subs: HunterSubmission[]) => subs.filter((s) => s.moderation === 'approved')
export const approvedPhotos = (c: Pick<GemHunterCampaign, 'submissions'>) => c.submissions.filter(isApprovedPhoto).map((s) => s.photo)
export const storefrontPhotos = (c: Pick<GemHunterCampaign, 'submissions'>) => approvedPhotos(c).filter((p) => p.onStorefront)
export const pendingSubmissions = (c: Pick<GemHunterCampaign, 'submissions'>) => c.submissions.filter((s) => s.moderation === 'pending')
