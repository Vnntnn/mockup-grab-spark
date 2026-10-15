import { APPROVED_SAMPLE_PAIR } from './data'

export interface PairingUrlState {
  step: 1 | 2 | 3 | 4
  dishA: string | null
  dishB: string | null
  isSample: boolean
  isEditing: boolean
  needsCanonicalization: boolean
  canonicalUrl: string
}

export interface HistoryPreEditState {
  originalDishA?: string | null
  originalDishB?: string | null
  inJourney?: boolean
  journeyDepth?: number
  isEditing?: boolean
}

export interface NavigationDecision {
  type: 'push' | 'replace' | 'pop'
  targetUrl?: string
  delta?: number
  state?: HistoryPreEditState
}

export function buildCanonicalQuery(
  step: 1 | 2 | 3 | 4,
  dishA: string | null,
  dishB: string | null,
  isSample: boolean,
  isEditing: boolean
): URLSearchParams {
  const query = new URLSearchParams()
  query.set('step', String(step))
  if (dishA) query.set('dishA', dishA)
  if (dishB) query.set('dishB', dishB)
  if (isSample) query.set('sample', 'true')
  if (isEditing) query.set('edit', 'true')
  return query
}

export function parsePairingUrl(
  searchParams: URLSearchParams,
  campaignId: string,
  validSlugsA: string[],
  validSlugsB: string[]
): PairingUrlState {
  const stepParam = searchParams.get('step')
  let rawStep: number | null = null
  if (stepParam === '1' || stepParam === '2' || stepParam === '3' || stepParam === '4') {
    rawStep = Number(stepParam)
  }

  const dishAParam = searchParams.get('dishA')
  const dishA = dishAParam && validSlugsA.includes(dishAParam) ? dishAParam : null

  const dishBParam = searchParams.get('dishB')
  const dishB = dishBParam && validSlugsB.includes(dishBParam) ? dishBParam : null

  const rawEdit = searchParams.get('edit') === 'true'
  const rawSample = searchParams.get('sample') === 'true'

  // Determine effective step according to deep link constraints
  let effectiveStep: 1 | 2 | 3 | 4
  if (rawStep === 4) {
    if (!dishA) {
      effectiveStep = 2
    } else if (!dishB) {
      effectiveStep = 3
    } else {
      effectiveStep = 4
    }
  } else if (rawStep === 3) {
    if (!dishA) {
      effectiveStep = 2
    } else {
      effectiveStep = 3
    }
  } else if (rawStep === 2) {
    effectiveStep = 2
  } else {
    effectiveStep = 1
  }

  // Edit mode is only valid on intermediate selection steps (Step 2 or 3)
  const isEditing = rawEdit && (effectiveStep === 2 || effectiveStep === 3)

  // Sample pairing is only valid when not editing and matching approved fixture
  const isSample =
    rawSample &&
    !isEditing &&
    dishA === APPROVED_SAMPLE_PAIR.dishASlug &&
    dishB === APPROVED_SAMPLE_PAIR.dishBSlug

  const canonicalParams = buildCanonicalQuery(
    effectiveStep,
    dishA,
    dishB,
    isSample,
    isEditing
  )

  const canonicalUrl = `/pair/${campaignId}?${canonicalParams.toString()}`

  // Check if searchParams needs canonicalization
  const needsCanonicalization = searchParams.toString() !== canonicalParams.toString()

  return {
    step: effectiveStep,
    dishA,
    dishB,
    isSample,
    isEditing,
    needsCanonicalization,
    canonicalUrl,
  }
}

export function computeNextStepTarget(
  current: PairingUrlState,
  campaignId: string
): NavigationDecision {
  if (current.isEditing) {
    const query = new URLSearchParams()
    query.set('step', '4')
    if (current.dishA) query.set('dishA', current.dishA)
    if (current.dishB) query.set('dishB', current.dishB)

    return {
      type: 'replace',
      targetUrl: `/pair/${campaignId}?${query.toString()}`,
      state: {
        inJourney: true,
      },
    }
  }

  const nextStep = Math.min(current.step + 1, 4) as 1 | 2 | 3 | 4
  const query = new URLSearchParams()
  query.set('step', String(nextStep))
  if (current.dishA) query.set('dishA', current.dishA)
  if (current.dishB) query.set('dishB', current.dishB)

  return {
    type: 'push',
    targetUrl: `/pair/${campaignId}?${query.toString()}`,
    state: {
      inJourney: true,
    },
  }
}

export function computeEditEntryTarget(
  targetStep: 2 | 3,
  currentDishA: string | null,
  currentDishB: string | null,
  campaignId: string
): NavigationDecision {
  const query = new URLSearchParams()
  query.set('step', String(targetStep))
  if (currentDishA) query.set('dishA', currentDishA)
  if (currentDishB) query.set('dishB', currentDishB)
  query.set('edit', 'true')

  return {
    type: 'replace',
    targetUrl: `/pair/${campaignId}?${query.toString()}`,
    state: {
      originalDishA: currentDishA,
      originalDishB: currentDishB,
      inJourney: true,
      isEditing: true,
    },
  }
}

export function computeBackDecision(
  current: PairingUrlState,
  campaignId: string,
  historyState: HistoryPreEditState | null
): NavigationDecision {
  if (current.isEditing) {
    const dishA = historyState?.originalDishA ?? current.dishA
    const dishB = historyState?.originalDishB ?? current.dishB
    const query = new URLSearchParams()
    query.set('step', '4')
    if (dishA) query.set('dishA', dishA)
    if (dishB) query.set('dishB', dishB)

    return {
      type: 'replace',
      targetUrl: `/pair/${campaignId}?${query.toString()}`,
      state: historyState?.inJourney
        ? {
            inJourney: true,
            journeyDepth: 4,
          }
        : undefined,
    }
  }

  if (historyState?.inJourney && (historyState.journeyDepth === undefined || historyState.journeyDepth > 1)) {
    return {
      type: 'pop',
      delta: -1,
    }
  }

  // Direct deep link fallback (no history): canonical previous step
  let prevStep: 1 | 2 | 3
  if (current.step === 4) {
    prevStep = 3
  } else if (current.step === 3) {
    prevStep = 2
  } else {
    prevStep = 1
  }

  const query = new URLSearchParams()
  query.set('step', String(prevStep))
  if (prevStep > 1) {
    if (current.dishA) query.set('dishA', current.dishA)
    if (current.dishB) query.set('dishB', current.dishB)
  }

  return {
    type: 'replace',
    targetUrl: `/pair/${campaignId}?${query.toString()}`,
  }
}

export type NavigateFunctionLike = {
  (to: string, options?: { replace?: boolean; state?: HistoryPreEditState | unknown }): void | Promise<unknown>
  (delta: number): void | Promise<unknown>
}

export function applyNavigationDecision(
  navigateFn: NavigateFunctionLike,
  decision: NavigationDecision
) {
  if (decision.type === 'pop') {
    return navigateFn(decision.delta ?? -1)
  }
  if (decision.targetUrl) {
    return navigateFn(decision.targetUrl, {
      replace: decision.type === 'replace',
      state: decision.state,
    })
  }
}

