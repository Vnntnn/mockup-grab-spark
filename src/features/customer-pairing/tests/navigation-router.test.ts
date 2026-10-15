import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import {
  applyNavigationDecision,
  parsePairingUrl,
  computeNextStepTarget,
  computeEditEntryTarget,
  computeBackDecision,
  type NavigationDecision,
} from '../navigation-helpers'
import {
  usePairingNavigation,
  type UsePairingNavigationReturn,
} from '../hooks/usePairingNavigation'

describe('navigation-router integration: history stack & 6 scenarios', () => {
  const slugsA = ['khao-man-gai-tom', 'khao-man-gai-tod', 'khao-na-gai']
  const slugsB = ['moo-satay-10', 'gai-yang', 'peek-gai-tod']
  const camp = 'camp-plan-m-khaohom'

  // Helper to execute a NavigationDecision on a memory router using applyNavigationDecision
  async function applyDecision(
    router: ReturnType<typeof createMemoryRouter>,
    decision: NavigationDecision
  ) {
    await applyNavigationDecision(router.navigate, decision)
  }

  function getUrlState(router: ReturnType<typeof createMemoryRouter>) {
    const searchParams = new URLSearchParams(router.state.location.search)
    return parsePairingUrl(searchParams, camp, slugsA, slugsB)
  }

  it('Scenario a: Normal forward progression (1 -> 2 -> 3 -> 4) pushes history entries', async () => {
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })

    expect(getUrlState(router).step).toBe(1)

    // Step 1 -> Step 2
    const d1 = computeNextStepTarget(getUrlState(router), camp)
    expect(d1.type).toBe('push')
    await applyDecision(router, d1)
    expect(getUrlState(router).step).toBe(2)

    // Intra-step selection of Dish A (replace in-place)
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, {
      replace: true,
      state: { inJourney: true, journeyDepth: 2 },
    })
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tom')

    // Step 2 -> Step 3
    const d2 = computeNextStepTarget(getUrlState(router), camp)
    expect(d2.type).toBe('push')
    await applyDecision(router, d2)
    expect(getUrlState(router).step).toBe(3)
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tom')

    // Intra-step selection of Dish B (replace in-place)
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, {
      replace: true,
      state: { inJourney: true, journeyDepth: 3 },
    })
    expect(getUrlState(router).dishB).toBe('moo-satay-10')

    // Step 3 -> Step 4
    const d3 = computeNextStepTarget(getUrlState(router), camp)
    expect(d3.type).toBe('push')
    await applyDecision(router, d3)
    expect(getUrlState(router).step).toBe(4)
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tom')
    expect(getUrlState(router).dishB).toBe('moo-satay-10')

    // Verify history backward traversal via Header Back in normal progression
    const backFrom4 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom4.type).toBe('pop')
    await applyDecision(router, backFrom4)
    expect(getUrlState(router).step).toBe(3)

    const backFrom3 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom3.type).toBe('pop')
    await applyDecision(router, backFrom3)
    expect(getUrlState(router).step).toBe(2)

    const backFrom2 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom2.type).toBe('pop')
    await applyDecision(router, backFrom2)
    expect(getUrlState(router).step).toBe(1)
  })

  it('Scenario b: Edit Dish A & Confirm enforces Single-Result Invariant and pops to Step 3 on browser back', async () => {
    // Setup history: [1, 2, 3, 4]
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })

    expect(getUrlState(router).step).toBe(4)

    // Tap [เปลี่ยนจานหลัก] from Step 4
    const editEntry = computeEditEntryTarget(2, 'khao-man-gai-tom', 'moo-satay-10', camp)
    expect(editEntry.type).toBe('replace')
    await applyDecision(router, editEntry)

    const editState = getUrlState(router)
    expect(editState.step).toBe(2)
    expect(editState.isEditing).toBe(true)
    expect(router.state.location.state).toEqual({
      originalDishA: 'khao-man-gai-tom',
      originalDishB: 'moo-satay-10',
      inJourney: true,
      isEditing: true,
    })

    // Intra-step dish selection: change to khao-na-gai
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-na-gai&dishB=moo-satay-10&edit=true`, {
      replace: true,
      state: router.state.location.state,
    })
    expect(getUrlState(router).dishA).toBe('khao-na-gai')

    // Confirm edit via CTA: computeNextStepTarget replaces back to Step 4
    const confirmDecision = computeNextStepTarget(getUrlState(router), camp)
    expect(confirmDecision.type).toBe('replace')
    expect(confirmDecision.targetUrl).not.toContain('edit=true')
    await applyDecision(router, confirmDecision)

    expect(getUrlState(router).step).toBe(4)
    expect(getUrlState(router).dishA).toBe('khao-na-gai')
    expect(getUrlState(router).dishB).toBe('moo-satay-10')

    // Single-Result Invariant: Native browser back pops to Step 3!
    await router.navigate(-1)
    expect(getUrlState(router).step).toBe(3)
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tom') // Step 3 retains original pre-edit history entry
  })

  it('Scenario c: Edit Dish B & Confirm enforces Single-Result Invariant', async () => {
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })

    // Edit Dish B from Step 4
    const editEntry = computeEditEntryTarget(3, 'khao-man-gai-tom', 'moo-satay-10', camp)
    expect(editEntry.type).toBe('replace')
    await applyDecision(router, editEntry)
    expect(getUrlState(router).step).toBe(3)
    expect(getUrlState(router).isEditing).toBe(true)

    // Intra-step selection of new Dish B: gai-yang
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=gai-yang&edit=true`, {
      replace: true,
      state: router.state.location.state,
    })

    // Confirm edit
    const confirmDecision = computeNextStepTarget(getUrlState(router), camp)
    expect(confirmDecision.type).toBe('replace')
    await applyDecision(router, confirmDecision)

    expect(getUrlState(router).step).toBe(4)
    expect(getUrlState(router).dishB).toBe('gai-yang')

    // Browser back pops to Step 3
    await router.navigate(-1)
    expect(getUrlState(router).step).toBe(3)
  })

  it('Scenario d: Edit Dish A & Header Back cancel restores original selections with custom attribution (sample not restored)', async () => {
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })
    // Started as sample pairing on Step 4
    await router.navigate(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10&sample=true`, {
      state: { inJourney: true },
    })
    expect(getUrlState(router).isSample).toBe(true)

    // Tap [เปลี่ยนจานหลัก]: sample=true is stripped immediately
    const editEntry = computeEditEntryTarget(2, 'khao-man-gai-tom', 'moo-satay-10', camp)
    await applyDecision(router, editEntry)
    expect(getUrlState(router).isEditing).toBe(true)
    expect(getUrlState(router).isSample).toBe(false)

    // Intra-step selection: user selects khao-na-gai
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-na-gai&dishB=moo-satay-10&edit=true`, {
      replace: true,
      state: router.state.location.state,
    })
    expect(getUrlState(router).dishA).toBe('khao-na-gai')

    // User taps Header Back (cancels edit session)
    const cancelDecision = computeBackDecision(
      getUrlState(router),
      camp,
      router.state.location.state
    )
    expect(cancelDecision.type).toBe('replace')
    expect(cancelDecision.targetUrl).toContain('dishA=khao-man-gai-tom') // restored
    expect(cancelDecision.targetUrl).toContain('dishB=moo-satay-10')
    expect(cancelDecision.targetUrl).not.toContain('sample=true') // sample is NOT restored
    expect(cancelDecision.targetUrl).not.toContain('edit=true')

    await applyDecision(router, cancelDecision)
    expect(getUrlState(router).step).toBe(4)
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tom')
    expect(getUrlState(router).dishB).toBe('moo-satay-10')
    expect(getUrlState(router).isSample).toBe(false) // custom attribution retained
  })

  it('Scenario e: Native browser back in edit mode pops history to Step 3', async () => {
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })

    // Enter edit mode for Dish A
    const editEntry = computeEditEntryTarget(2, 'khao-man-gai-tom', 'moo-satay-10', camp)
    await applyDecision(router, editEntry)
    expect(getUrlState(router).step).toBe(2)
    expect(getUrlState(router).isEditing).toBe(true)

    // User presses native browser back: pops history to Step 3
    await router.navigate(-1)
    expect(getUrlState(router).step).toBe(3)
  })

  it('Scenario f: Native browser back from Step 4 post-edit confirmation pops history to Step 3', async () => {
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=1`],
      initialIndex: 0,
    })
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })
    await router.navigate(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`, { state: { inJourney: true } })

    // Edit Dish A and confirm
    const editEntry = computeEditEntryTarget(2, 'khao-man-gai-tom', 'moo-satay-10', camp)
    await applyDecision(router, editEntry)
    await router.navigate(`/pair/${camp}?step=2&dishA=khao-man-gai-tod&dishB=moo-satay-10&edit=true`, {
      replace: true,
      state: router.state.location.state,
    })
    const confirm = computeNextStepTarget(getUrlState(router), camp)
    await applyDecision(router, confirm)

    expect(getUrlState(router).step).toBe(4)
    expect(getUrlState(router).dishA).toBe('khao-man-gai-tod')

    // Native browser back from post-edit Step 4 pops history to Step 3
    await router.navigate(-1)
    expect(getUrlState(router).step).toBe(3)
  })

  it('cascades Header Back smoothly on deep-linked Step 4 across 4 -> 3 -> 2 -> 1 without prematurely popping', async () => {
    // Fresh single-entry browser tab deep-linking directly to Step 4
    const router = createMemoryRouter([{ path: '/pair/:campaignId', element: null }], {
      initialEntries: [`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`],
      initialIndex: 0,
    })

    expect(getUrlState(router).step).toBe(4)
    expect(router.state.location.state).toBeNull()

    // Header Back on Step 4 (deep link fallback)
    const backFrom4 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom4.type).toBe('replace')
    expect(backFrom4.state).toBeUndefined()
    await applyDecision(router, backFrom4)
    expect(getUrlState(router).step).toBe(3)

    // Header Back on Step 3 must continue fallback replace cascade, NOT pop history
    const backFrom3 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom3.type).toBe('replace')
    expect(backFrom3.state).toBeUndefined()
    await applyDecision(router, backFrom3)
    expect(getUrlState(router).step).toBe(2)

    // Header Back on Step 2 must continue fallback replace cascade to Step 1
    const backFrom2 = computeBackDecision(getUrlState(router), camp, router.state.location.state)
    expect(backFrom2.type).toBe('replace')
    expect(backFrom2.state).toBeUndefined()
    await applyDecision(router, backFrom2)
    expect(getUrlState(router).step).toBe(1)
  })

  describe('usePairingNavigation hook integration', () => {
    it('initializes and computes urlState from router query parameters', () => {
      let hookOutput: UsePairingNavigationReturn | null = null
      function TestComponent() {
        hookOutput = usePairingNavigation({
          campaignId: camp,
          validSlugsA: slugsA,
          validSlugsB: slugsB,
        })
        return null
      }

      const router = createMemoryRouter([
        { path: '/pair/:campaignId', Component: TestComponent },
      ], {
        initialEntries: [`/pair/${camp}?step=2&dishA=khao-man-gai-tom`],
        initialIndex: 0,
      })

      // In react-router 7 with createMemoryRouter, Component mounts via RouterProvider
      renderToString(React.createElement(RouterProvider, { router }))

      expect(hookOutput).not.toBeNull()
      if (!hookOutput) throw new Error('hookOutput is null')

      const nav = hookOutput as UsePairingNavigationReturn
      expect(nav.urlState.step).toBe(2)
      expect(nav.urlState.dishA).toBe('khao-man-gai-tom')
      expect(typeof nav.goToNextStep).toBe('function')
      expect(typeof nav.goToStep).toBe('function')
      expect(typeof nav.goBack).toBe('function')
      expect(typeof nav.startEditing).toBe('function')
      expect(typeof nav.selectDish).toBe('function')
      expect(typeof nav.goToSample).toBe('function')
      expect(typeof nav.startOver).toBe('function')
    })
  })
})

