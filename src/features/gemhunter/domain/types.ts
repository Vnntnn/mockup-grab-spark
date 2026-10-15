import type { MerchantId } from '@/domain/types'

/** All GemHunter data is synthetic. Nothing here is a real order, review, photo, voucher or purchase check. */

export type GemHunterPhase =
  | 'eligibility_check'
  | 'menu_review'
  | 'active_campaign'
  | 'submission_review'
  | 'graduation_check'
  | 'gembond_handoff'
  | 'completed'
  | 'paused'
  | 'cancelled'

/** Demo assumption, configurable. The rating rule is strictly greater than, so exactly 4.2 does not pass. */
export interface GraduationConfig {
  minValidReviews: number
  minAverageRatingExclusive: number
}

export interface Voucher {
  id: string
  label: string
  /** Illustrative range, never a promised amount. */
  valueRangeBaht: { min: number; max: number }
  fundedBy: 'platform'
  merchantCostBaht: 0
  illustrative: true
  /** The UI draws a clearly labelled, non-scannable placeholder. There is no QR payload and nothing to redeem. */
  qrPlaceholder: true
}

export interface HunterMission {
  id: string
  title: string
  description: string
  voucher: Voucher
  orderChannel: 'existing_store_channel'
}

// ---------- menu audit ----------
export type MenuDecision = 'pending' | 'accepted' | 'edited' | 'kept'
/** Where a verified attribute came from. Nothing is verified without a source. */
export type AttributeSource = 'shop_profile' | 'merchant_confirmed'

/** One merchant decision. `from` and `to` are the storefront titles before and after it. Deterministic: no clock. */
export interface MenuHistoryEntry {
  action: 'accepted' | 'edited' | 'kept'
  from: string
  to: string
}

export interface MenuAuditItem {
  id: string
  /** key into the merchant's sampleMenu */
  menuItemName: string
  currentTitle: string
  suggestedTitle: string
  suggestionAttributes: string[]
  /** verified by the system or confirmed by the merchant */
  verifiedAttributes: string[]
  /** provenance of every verified attribute */
  attributeSource: Record<string, AttributeSource>
  decision: MenuDecision
  editedTitle?: string
  /** what customers see. Equals currentTitle until the merchant approves something else. */
  publishedTitle: string
  /** every decision in order. `currentTitle` is never overwritten, so the original is always recoverable. */
  history: MenuHistoryEntry[]
}

export interface MenuAudit {
  items: MenuAuditItem[]
}

// ---------- submissions ----------
export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type Rating = 1 | 2 | 3 | 4 | 5

export interface PhotoAsset {
  id: string
  submissionId: string
  /** what the synthetic image shows (placeholder art only, no real images) */
  label: string
  hue: number
  imageUseConsent: boolean
  moderation: ModerationStatus
  merchantDecision: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  onStorefront: boolean
}

export interface HunterSubmission {
  id: string
  /** synthetic alias, never a real person */
  hunterId: string
  menuItemName: string
  rating: Rating
  reviewText: string
  photo: PhotoAsset
  /** the prototype only simulates a qualifying purchase; it is never 'verified' */
  purchaseCheck: 'simulated'
  /** the reviewer was shown that an illustrative campaign voucher exists. Shown as a disclosure on the review. */
  incentiveDisclosed: true
  moderation: ModerationStatus
  moderationNote?: string
  submittedAt: string
}

// ---------- graduation and handoff ----------
export interface GraduationCheck {
  id: 'reviews' | 'rating' | 'menu'
  label: string
  passed: boolean
  detail: string
}

export interface GraduationImprovement {
  /** Always false: missing a check today is not a permanent ineligibility. */
  permanent: false
  text: string
  /** one next step per unmet check */
  nextSteps: { checkId: GraduationCheck['id']; text: string }[]
}

export interface GraduationEvidence {
  validReviews: number
  /** null when there are no approved reviews, never NaN */
  averageRating: number | null
  approvedPhotos: number
  menuAuditComplete: boolean
  checks: GraduationCheck[]
  eligible: boolean
  /** plain Thai reasons, with exact numbers */
  unmet: string[]
  improvement: GraduationImprovement
}

/**
 * Handoff Data Contract v1 (GemHunter -> GemBond). GemBond reads this through `readHandoff` / `useGemHunterHandoff` only.
 * Consumers must reject any other `schemaVersion`.
 */
export interface GemBondHandoff {
  schemaVersion: 1
  /** deterministic: `handoff-${campaignId}-v1`, never time or random */
  handoffId: string
  /** must equal the GemBond merchant id */
  merchantId: MerchantId
  merchantName: string
  sourceCampaignId: string
  createdAt: string
  status: 'ready' | 'opened'
  /** the merchant's explicit acknowledgement. A handoff cannot exist without it. */
  shareConsent: { granted: true; at: string; scope: string[] }
  /** only set when the graduation evidence is eligible */
  readiness: 'graduated'
  /** whitelist only: counts, average, approved ids and titles */
  payload: {
    validReviewCount: number
    averageRating: number
    /** moderation approved + merchant approved + image-use consent */
    approvedPhotoIds: string[]
    approvedMenuTitles: { menuItemName: string; title: string }[]
    /** one of the approved storefront photos, or null */
    coverPhotoId: string | null
    badge: 'gemhunter_graduate'
    /** a campaign badge, not a food-safety, hygiene or halal certification and not a guarantee */
    badgeMeaning: string
  }
  /** what is deliberately not shared, shown to the merchant */
  excluded: string[]
}

export interface GemHunterCampaign {
  id: string
  merchantId: MerchantId
  phase: GemHunterPhase
  menuAudit: MenuAudit
  mission: HunterMission
  submissions: HunterSubmission[]
  /** single cover photo (a photo id). Invariant: cover is on the storefront, storefront photos are fully approved. */
  coverPhotoId: string | null
  handoff: GemBondHandoff | null
  config: GraduationConfig
  pausedFrom?: GemHunterPhase
}

export interface GemHunterState {
  version: number
  campaign: GemHunterCampaign
}

// ---------- results ----------
/** A rejected operation. `reason` is plain Thai for the merchant; `code` is for tests and branching. */
export interface Rejection<C extends string = string> {
  ok: false
  code: C
  reason: string
}

export type Result<T, C extends string = string> = { ok: true; value: T } | Rejection<C>
export type Validation<C extends string = string> = { ok: true } | Rejection<C>

export const reject = <C extends string>(code: C, reason: string): Rejection<C> => ({ ok: false, code, reason })
export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value })
