import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { APPROVED_SAMPLE_PAIR } from '../data'
import {
  computeBackDecision,
  computeEditEntryTarget,
  computeNextStepTarget,
  parsePairingUrl,
  type HistoryPreEditState,
  type PairingUrlState,
} from '../navigation-helpers'

export interface UsePairingNavigationOptions {
  campaignId: string
  validSlugsA: string[]
  validSlugsB: string[]
}

export interface UsePairingNavigationReturn {
  urlState: PairingUrlState
  historyState: HistoryPreEditState | null
  goToNextStep: () => void
  goBack: () => void
  startEditing: (targetStep: 2 | 3) => void
  selectDish: (role: 'A' | 'B', slug: string) => void
  goToSample: () => void
  startOver: () => void
}

export function usePairingNavigation({
  campaignId,
  validSlugsA,
  validSlugsB,
}: UsePairingNavigationOptions): UsePairingNavigationReturn {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const urlState = useMemo(
    () => parsePairingUrl(searchParams, campaignId, validSlugsA, validSlugsB),
    [searchParams, campaignId, validSlugsA, validSlugsB]
  )

  const historyState = (location.state as HistoryPreEditState | null) ?? null

  // Canonicalize URL if needed (e.g. invalid step, invalid slug, tampered sample flag)
  useEffect(() => {
    if (urlState.needsCanonicalization) {
      navigate(urlState.canonicalUrl, { replace: true, state: historyState })
    }
  }, [urlState.needsCanonicalization, urlState.canonicalUrl, navigate, historyState])

  const goToNextStep = useCallback(() => {
    const decision = computeNextStepTarget(urlState, campaignId)
    if (decision.type === 'push' && decision.targetUrl) {
      navigate(decision.targetUrl, {
        state: { inJourney: true, journeyDepth: (historyState?.journeyDepth ?? 1) + 1 },
      })
    } else if (decision.type === 'replace' && decision.targetUrl) {
      navigate(decision.targetUrl, {
        replace: true,
        state: decision.state ?? { inJourney: true },
      })
    }
  }, [urlState, campaignId, historyState, navigate])

  const goBack = useCallback(() => {
    const decision = computeBackDecision(urlState, campaignId, historyState)
    if (decision.type === 'pop') {
      navigate(decision.delta ?? -1)
    } else if (decision.type === 'replace' && decision.targetUrl) {
      navigate(decision.targetUrl, {
        replace: true,
        state: decision.state ?? null,
      })
    }
  }, [urlState, campaignId, historyState, navigate])

  const startEditing = useCallback(
    (targetStep: 2 | 3) => {
      const decision = computeEditEntryTarget(
        targetStep,
        urlState.dishA,
        urlState.dishB,
        campaignId
      )
      if (decision.targetUrl) {
        navigate(decision.targetUrl, {
          replace: true,
          state: decision.state,
        })
      }
    },
    [urlState.dishA, urlState.dishB, campaignId, navigate]
  )

  const selectDish = useCallback(
    (role: 'A' | 'B', slug: string) => {
      const nextA = role === 'A' ? slug : urlState.dishA
      const nextB = role === 'B' ? slug : urlState.dishB
      const query = new URLSearchParams()
      query.set('step', String(urlState.step))
      if (nextA) query.set('dishA', nextA)
      if (nextB) query.set('dishB', nextB)
      if (urlState.isEditing) query.set('edit', 'true')
      navigate(`/pair/${campaignId}?${query.toString()}`, {
        replace: true,
        state: historyState,
      })
    },
    [urlState.step, urlState.dishA, urlState.dishB, urlState.isEditing, campaignId, historyState, navigate]
  )

  const goToSample = useCallback(() => {
    navigate(
      `/pair/${campaignId}?step=4&dishA=${APPROVED_SAMPLE_PAIR.dishASlug}&dishB=${APPROVED_SAMPLE_PAIR.dishBSlug}&sample=true`,
      { state: { inJourney: true, journeyDepth: 2 } }
    )
  }, [campaignId, navigate])

  const startOver = useCallback(() => {
    navigate(`/pair/${campaignId}?step=1`, {
      state: { inJourney: true, journeyDepth: 1 },
    })
  }, [campaignId, navigate])

  return {
    urlState,
    historyState,
    goToNextStep,
    goBack,
    startEditing,
    selectDish,
    goToSample,
    startOver,
  }
}
