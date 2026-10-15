import { useMemo } from 'react'
import { HANDOFF_SCHEMA_VERSION } from './domain/handoff'
import type { GemBondHandoff, GemHunterState } from './domain/types'
import { useGemHunter } from './store'

/**
 * The only door from GemHunter into GemBond. Returns the handoff contract and nothing else:
 * null when there is no handoff, it belongs to another merchant, it has an unknown schemaVersion, or the merchant's share consent is missing.
 * Fields are copied one by one, so anything extra stored on the record never crosses this boundary.
 */
export function readHandoff(state: GemHunterState, merchantId: string): GemBondHandoff | null {
  const h = state.campaign.handoff
  if (!h || h.schemaVersion !== HANDOFF_SCHEMA_VERSION) return null
  if (h.merchantId !== merchantId) return null
  if (h.readiness !== 'graduated' || h.shareConsent?.granted !== true) return null
  const p = h.payload
  return {
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    handoffId: h.handoffId,
    merchantId: h.merchantId,
    merchantName: h.merchantName,
    sourceCampaignId: h.sourceCampaignId,
    createdAt: h.createdAt,
    status: h.status,
    shareConsent: { granted: true, at: h.shareConsent.at, scope: [...h.shareConsent.scope] },
    readiness: 'graduated',
    payload: {
      validReviewCount: p.validReviewCount,
      averageRating: p.averageRating,
      approvedPhotoIds: [...p.approvedPhotoIds],
      approvedMenuTitles: p.approvedMenuTitles.map((t) => ({ menuItemName: t.menuItemName, title: t.title })),
      coverPhotoId: p.coverPhotoId,
      badge: p.badge,
      badgeMeaning: p.badgeMeaning,
    },
    excluded: [...h.excluded],
  }
}

/** For GemBond screens. Use this instead of `useGemHunter()` so GemBond never sees the rest of the GemHunter state. */
export function useGemHunterHandoff(merchantId: string): GemBondHandoff | null {
  const { state } = useGemHunter()
  return useMemo(() => readHandoff(state, merchantId), [state, merchantId])
}
