import { describe, it, expect } from 'vitest'
import {
  parsePairingUrl,
  computeNextStepTarget,
  computeEditEntryTarget,
  computeBackDecision,
} from '../navigation-helpers'

describe('navigation-helpers', () => {
  const slugsA = ['khao-man-gai-tom', 'khao-man-gai-tod', 'khao-na-gai']
  const slugsB = ['moo-satay-10', 'gai-yang', 'peek-gai-tod']
  const camp = 'camp-plan-m-khaohom'

  describe('URL parsing & canonicalization', () => {
    it('Edge Case C: strips sample=true when dishes do not match approved fixture', () => {
      const params = new URLSearchParams('step=4&dishA=khao-na-gai&dishB=gai-yang&sample=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.isSample).toBe(false)
      expect(parsed.needsCanonicalization).toBe(true)
      expect(parsed.canonicalUrl).not.toContain('sample=true')
    })

    it('Edge Case C: preserves sample=true when dishes match approved fixture', () => {
      const params = new URLSearchParams('step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10&sample=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.isSample).toBe(true)
      expect(parsed.needsCanonicalization).toBe(false)
    })

    it('Redirects to earliest incomplete step when deep link enters step 4 with missing dish', () => {
      const params = new URLSearchParams('step=4&dishA=khao-man-gai-tom') // missing dishB
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.step).toBe(3) // falls back to step 3
      expect(parsed.needsCanonicalization).toBe(true)
    })

    it('Redirects to step 2 when deep link enters step 4 or step 3 with missing dishA', () => {
      const p4 = parsePairingUrl(new URLSearchParams('step=4&dishB=moo-satay-10'), camp, slugsA, slugsB)
      expect(p4.step).toBe(2)
      expect(p4.needsCanonicalization).toBe(true)

      const p3 = parsePairingUrl(new URLSearchParams('step=3'), camp, slugsA, slugsB)
      expect(p3.step).toBe(2)
      expect(p3.needsCanonicalization).toBe(true)
    })

    it('parses edit=true into isEditing flag', () => {
      const params = new URLSearchParams('step=2&dishA=khao-man-gai-tom&dishB=moo-satay-10&edit=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.isEditing).toBe(true)
    })

    it('defaults to step 1 and flags canonicalization if step is missing or invalid', () => {
      const pNone = parsePairingUrl(new URLSearchParams(''), camp, slugsA, slugsB)
      expect(pNone.step).toBe(1)
      expect(pNone.needsCanonicalization).toBe(true)
      expect(pNone.canonicalUrl).toBe(`/pair/${camp}?step=1`)

      const pInvalid = parsePairingUrl(new URLSearchParams('step=99'), camp, slugsA, slugsB)
      expect(pInvalid.step).toBe(1)
      expect(pInvalid.needsCanonicalization).toBe(true)
      expect(pInvalid.canonicalUrl).toBe(`/pair/${camp}?step=1`)
    })

    it('ignores invalid dish slugs and marks needsCanonicalization', () => {
      const params = new URLSearchParams('step=2&dishA=unknown-dish')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.dishA).toBeNull()
      expect(parsed.needsCanonicalization).toBe(true)
      expect(parsed.canonicalUrl).toBe(`/pair/${camp}?step=2`)
    })

    it('strips edit=true on step 1 or step 4 during canonicalization', () => {
      const params = new URLSearchParams('step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10&edit=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.isEditing).toBe(false)
      expect(parsed.needsCanonicalization).toBe(true)
      expect(parsed.canonicalUrl).not.toContain('edit=true')
    })
  })

  describe('In-Place Replace & Single-Result Invariant Edit Mode', () => {
    it('generates replace decision for editing Dish A from Step 4, stripping sample and saving pre-edit state', () => {
      const decision = computeEditEntryTarget(2, 'khao-man-gai-tom', 'moo-satay-10', camp)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=2&dishA=khao-man-gai-tom&dishB=moo-satay-10&edit=true`)
      expect(decision.targetUrl).not.toContain('sample=true')
      expect(decision.state).toEqual({
        originalDishA: 'khao-man-gai-tom',
        originalDishB: 'moo-satay-10',
        inJourney: true,
        isEditing: true,
      })
    })

    it('generates replace decision for editing Dish B from Step 4', () => {
      const decision = computeEditEntryTarget(3, 'khao-man-gai-tom', 'moo-satay-10', camp)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10&edit=true`)
      expect(decision.state).toEqual({
        originalDishA: 'khao-man-gai-tom',
        originalDishB: 'moo-satay-10',
        inJourney: true,
        isEditing: true,
      })
    })

    it('Edit-mode CTA: advances to Step 4 via replace, clearing edit=true', () => {
      const params = new URLSearchParams('step=2&dishA=khao-man-gai-tod&dishB=moo-satay-10&edit=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      expect(parsed.isEditing).toBe(true)
      const decision = computeNextStepTarget(parsed, camp)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=4&dishA=khao-man-gai-tod&dishB=moo-satay-10`)
      expect(decision.targetUrl).not.toContain('edit=true')
      expect(decision.targetUrl).not.toContain('sample=true')
    })

    it('Header Back in edit mode cancels edit and restores pre-edit selections while retaining custom attribution (sample is not restored)', () => {
      const params = new URLSearchParams('step=2&dishA=khao-man-gai-tod&dishB=moo-satay-10&edit=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const historyState = {
        originalDishA: 'khao-man-gai-tom',
        originalDishB: 'moo-satay-10',
        inJourney: true,
        isEditing: true,
      }
      const decision = computeBackDecision(parsed, camp, historyState)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`)
      expect(decision.targetUrl).not.toContain('sample=true')
      expect(decision.targetUrl).not.toContain('edit=true')
    })

    it('Header Back in edit mode without history state safely navigates to Step 4 via replace', () => {
      const params = new URLSearchParams('step=2&dishA=khao-man-gai-tod&dishB=moo-satay-10&edit=true')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const decision = computeBackDecision(parsed, camp, null)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=4&dishA=khao-man-gai-tod&dishB=moo-satay-10`)
    })
  })

  describe('Normal forward progression & Header Back', () => {
    it('advances forward via push in normal progression', () => {
      const p1 = parsePairingUrl(new URLSearchParams('step=1'), camp, slugsA, slugsB)
      expect(computeNextStepTarget(p1, camp).type).toBe('push')
      expect(computeNextStepTarget(p1, camp).targetUrl).toBe(`/pair/${camp}?step=2`)

      const p2 = parsePairingUrl(new URLSearchParams('step=2&dishA=khao-man-gai-tom'), camp, slugsA, slugsB)
      expect(computeNextStepTarget(p2, camp).type).toBe('push')
      expect(computeNextStepTarget(p2, camp).targetUrl).toBe(`/pair/${camp}?step=3&dishA=khao-man-gai-tom`)

      const p3 = parsePairingUrl(new URLSearchParams('step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10'), camp, slugsA, slugsB)
      expect(computeNextStepTarget(p3, camp).type).toBe('push')
      expect(computeNextStepTarget(p3, camp).targetUrl).toBe(`/pair/${camp}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`)
    })

    it('Header Back in normal progression pops history (navigate(-1))', () => {
      const params = new URLSearchParams('step=3&dishA=khao-man-gai-tom')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const decision = computeBackDecision(parsed, camp, { inJourney: true, journeyDepth: 3 })
      expect(decision.type).toBe('pop')
      expect(decision.delta).toBe(-1)
    })

    it('Header Back on direct deep link (no history) falls back to canonical previous step via replace', () => {
      const params = new URLSearchParams('step=3&dishA=khao-man-gai-tom')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const decision = computeBackDecision(parsed, camp, null)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=2&dishA=khao-man-gai-tom`)
    })

    it('Header Back on direct deep link to step 2 falls back to step 1', () => {
      const params = new URLSearchParams('step=2&dishA=khao-man-gai-tom')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const decision = computeBackDecision(parsed, camp, null)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=1`)
    })

    it('Header Back on direct deep link to step 4 falls back to step 3', () => {
      const params = new URLSearchParams('step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10')
      const parsed = parsePairingUrl(params, camp, slugsA, slugsB)
      const decision = computeBackDecision(parsed, camp, null)
      expect(decision.type).toBe('replace')
      expect(decision.targetUrl).toBe(`/pair/${camp}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`)
    })
  })
})
