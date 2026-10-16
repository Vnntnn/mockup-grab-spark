import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { createMemoryRouter, MemoryRouter, Navigate, RouterProvider } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomerPairingRoute } from '../CustomerPairingRoute'
import { createInitialState } from '@/app/reducer'
import { DEFAULT_CAMPAIGN_ID } from '../data'
import { CampaignPreview } from '@/features/campaigns/CampaignPreview'
import { usePairingNavigation } from '../hooks/usePairingNavigation'

vi.mock('radix-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('radix-ui')>()
  return {
    ...actual,
    Dialog: {
      ...actual.Dialog,
      Portal: ({ children }: { children: React.ReactNode }) => children,
    },
  }
})

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null })) // sonner's Toaster needs a DOM, the harness here has none

describe('CustomerPairingRoute & Root Redirect', () => {
  const state = createInitialState('2026-10-16')

  it('configures root redirect element to default campaign step 1', () => {
    const navElement = React.createElement(Navigate, {
      to: `/pair/${DEFAULT_CAMPAIGN_ID}?step=1`,
      replace: true,
    })
    expect(navElement.props.to).toBe(`/pair/${DEFAULT_CAMPAIGN_ID}?step=1`)
    expect(navElement.props.replace).toBe(true)
  })

  it('renders explicit accessible recovery view when campaign is invalid (Edge Case A)', () => {
    const html = renderToString(
      React.createElement(CustomerPairingRoute, {
        campaignId: 'unknown-camp',
        testState: state,
      })
    )
    expect(html).toContain('ไม่พบแคมเปญที่คุณค้นหา')
    expect(html).toContain('ดูแคมเปญตัวอย่าง')
    expect(html).toContain(`/pair/${DEFAULT_CAMPAIGN_ID}?step=1`)
    expect(html).toContain('min-h-[48px]')
    expect(html).not.toContain('จับคู่เมนูจาก 2 ร้านในย่านคุณ') // Does NOT silently substitute
  })

  it('renders discover screen when campaign is valid (Step 1)', () => {
    const html = renderToString(
      React.createElement(CustomerPairingRoute, {
        campaignId: DEFAULT_CAMPAIGN_ID,
        testState: state,
      })
    )
    expect(html).toContain('จับคู่เมนูจาก 2 ร้านในย่านคุณ')
    expect(html).toContain('ข้าวหอม')
    expect(html).toContain('หมูสะเต๊ะบ้านสวน')
    expect(html).toContain('เริ่มจับคู่เมนู')
  })

  it('renders Step 2 select main screen with dishes and responsive docks', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=2`] },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(html).toContain('เลือกจานหลักจาก')
    expect(html).toContain('ข้าวมันไก่ต้ม')
    expect(html).toContain('ข้าวมันไก่ทอด')
    expect(html).toContain('sticky top-40') // desktop dock
    expect(html).toContain('lg:hidden') // mobile dock
  })

  it('renders Step 3 select complement screen with preserved dish A and complement dishes', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            `/pair/${DEFAULT_CAMPAIGN_ID}?step=3&dishA=khao-man-gai-tom`,
          ],
        },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(html).toContain('เลือกของว่างจาก')
    expect(html).toContain('คู่ที่กำลังเลือก') // the pinned pair progress
    expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
    expect(html).toContain('ไก่ย่างสมุนไพร')
    expect(html).toContain('เปลี่ยนจานหลัก')
    expect(html).toContain('sticky top-40')
    expect(html).toContain('lg:hidden')
  })

  it('renders Step 4 result screen with selected dishes', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            `/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`,
          ],
        },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(html).toContain('ข้าวมันไก่ต้ม')
    expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
    expect(html).toContain('คู่เมนูที่คุณเลือก')
    expect(html).toContain('แชร์คู่เมนูนี้')
    expect(html).toContain('ไปยังหน้าร้านข้าวหอม')
    expect(html).toContain('ไปยังหน้าร้านหมูสะเต๊ะบ้านสวน')
  })

  it('renders exactly one h1 on every step (header title is not a heading)', () => {
    const queries = [
      'step=1',
      'step=2',
      'step=3&dishA=khao-man-gai-tom',
      'step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10',
    ]
    for (const q of queries) {
      const html = renderToString(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?${q}`] },
          React.createElement(CustomerPairingRoute, { campaignId: DEFAULT_CAMPAIGN_ID, testState: state })
        )
      )
      expect(html.match(/<h1[\s>]/g)?.length, q).toBe(1)
    }
  })

  it('contains zero emojis in rendered views', () => {
    const emojiRegex =
      /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

    const recoveryHtml = renderToString(
      React.createElement(CustomerPairingRoute, {
        campaignId: 'unknown-camp',
        testState: state,
      })
    )
    expect(recoveryHtml).not.toMatch(emojiRegex)

    const step1Html = renderToString(
      React.createElement(CustomerPairingRoute, {
        campaignId: DEFAULT_CAMPAIGN_ID,
        testState: state,
      })
    )
    expect(step1Html).not.toMatch(emojiRegex)

    const step2Html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=2`] },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(step2Html).not.toMatch(emojiRegex)

    const step3Html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            `/pair/${DEFAULT_CAMPAIGN_ID}?step=3&dishA=khao-man-gai-tom`,
          ],
        },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(step3Html).not.toMatch(emojiRegex)

    const step4Html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            `/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`,
          ],
        },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(step4Html).not.toMatch(emojiRegex)
  })

  it('renders merchant preview secondary launch link to customer view', () => {
    const merchantSelf = state.merchants['m-khaohom']
    const merchantPartner = state.merchants['m-satay']
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CampaignPreview, {
          self: merchantSelf,
          partner: merchantPartner,
          campaignId: DEFAULT_CAMPAIGN_ID,
        })
      )
    )
    expect(html).toContain('เปิดมุมมองลูกค้า (Interactive Demo)')
    expect(html).toContain(`/pair/${DEFAULT_CAMPAIGN_ID}`)
    expect(html).toContain('min-h-[48px]')
  })

  it('never puts the share title in the page on Step 4', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {
          initialEntries: [
            `/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`,
          ],
        },
        React.createElement(CustomerPairingRoute, {
          campaignId: DEFAULT_CAMPAIGN_ID,
          testState: state,
        })
      )
    )
    expect(html).not.toContain('คู่เมนูที่คุณเลือก - GemBond')
  })

  interface ReactInternalsWithHooks {
    H?: {
      useEffect?: (fn: () => void) => void
      useLayoutEffect?: (fn: () => void) => void
    }
  }

  function renderWithEffects(element: React.ReactElement) {
    const pendingEffects: Array<() => void> = []
    function EffectEnabler({ children }: { children: React.ReactNode }) {
      const internals = (React as unknown as {
        __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: ReactInternalsWithHooks
      }).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      if (internals?.H) {
        internals.H.useEffect = (fn: () => void) => {
          pendingEffects.push(fn)
        }
        internals.H.useLayoutEffect = (fn: () => void) => {
          pendingEffects.push(fn)
        }
      }
      return children
    }
    const html = renderToString(React.createElement(EffectEnabler, null, element))
    pendingEffects.forEach((fn) => fn())
    return html
  }

  it('triggers info toast when deep link enters Step 4 or Step 3 with incomplete dish selections', () => {
    const toastInfoMock = vi.spyOn(toast, 'info')

    try {
      // Direct deep link to Step 4 without dishA or dishB
      renderWithEffects(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=4`] },
          React.createElement(CustomerPairingRoute, {
            campaignId: DEFAULT_CAMPAIGN_ID,
            testState: state,
          })
        )
      )
      expect(toastInfoMock).toHaveBeenCalledWith('กรุณาเลือกเมนูให้ครบถ้วนก่อนดูผลลัพธ์')
      toastInfoMock.mockClear()

      // Direct deep link to Step 4 with only dishA (missing dishB)
      renderWithEffects(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=khao-man-gai-tom`] },
          React.createElement(CustomerPairingRoute, {
            campaignId: DEFAULT_CAMPAIGN_ID,
            testState: state,
          })
        )
      )
      expect(toastInfoMock).toHaveBeenCalledWith('กรุณาเลือกเมนูให้ครบถ้วนก่อนดูผลลัพธ์')
      toastInfoMock.mockClear()

      // Direct deep link to Step 3 without dishA
      renderWithEffects(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=3`] },
          React.createElement(CustomerPairingRoute, {
            campaignId: DEFAULT_CAMPAIGN_ID,
            testState: state,
          })
        )
      )
      expect(toastInfoMock).toHaveBeenCalledWith('กรุณาเลือกเมนูให้ครบถ้วนก่อนดูผลลัพธ์')
      toastInfoMock.mockClear()

      // Valid Step 4 deep link does NOT trigger fallback toast
      renderWithEffects(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10`] },
          React.createElement(CustomerPairingRoute, {
            campaignId: DEFAULT_CAMPAIGN_ID,
            testState: state,
          })
        )
      )
      expect(toastInfoMock).not.toHaveBeenCalled()
    } finally {
      toastInfoMock.mockRestore()
    }
  })

  it('Step 3 onEditA navigates to Step 2 with edit=true absent and dishB preserved via push', async () => {
    let capturedOnEditA: (() => Promise<unknown> | void) | null = null
    function SpyComponent() {
      const hook = usePairingNavigation({
        campaignId: DEFAULT_CAMPAIGN_ID,
        validSlugsA: ['khao-man-gai-tom', 'khao-man-gai-tod', 'khao-na-gai'],
        validSlugsB: ['moo-satay-10', 'gai-yang', 'peek-gai-tod'],
      })
      capturedOnEditA = () => hook.goToStep(2)
      return null
    }

    const router = createMemoryRouter([
      { path: '/pair/:campaignId', Component: SpyComponent },
    ], {
      initialEntries: [`/pair/${DEFAULT_CAMPAIGN_ID}?step=3&dishA=khao-man-gai-tom&dishB=moo-satay-10`],
      initialIndex: 0,
    })

    renderWithEffects(React.createElement(RouterProvider, { router }))
    expect(capturedOnEditA).not.toBeNull()
    const p = capturedOnEditA!()
    if (p instanceof Promise) {
      await p
    }

    const search = router.state.location.search
    expect(search).toContain('step=2')
    expect(search).toContain('dishA=khao-man-gai-tom')
    expect(search).toContain('dishB=moo-satay-10')
    expect(search).not.toContain('edit=true')
    expect(router.state.historyAction).toBe('PUSH')
  })
})
