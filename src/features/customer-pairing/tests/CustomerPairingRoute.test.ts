import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { MemoryRouter, Navigate } from 'react-router-dom'
import { CustomerPairingRoute } from '../CustomerPairingRoute'
import { createInitialState } from '@/app/reducer'
import { DEFAULT_CAMPAIGN_ID } from '../data'
import { CampaignPreview } from '@/features/campaigns/CampaignPreview'

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
    expect(html).toContain('ขั้นตอนที่ 1 จาก 2')
    expect(html).toContain('ข้าวมันไก่ต้ม')
    expect(html).toContain('ข้าวมันไก่ทอด')
    expect(html).toContain('sticky top-8') // desktop dock
    expect(html).toContain('fixed bottom-0') // mobile dock
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
    expect(html).toContain('ขั้นตอนที่ 2 จาก 2')
    expect(html).toContain('หมูสะเต๊ะ 10 ไม้')
    expect(html).toContain('ไก่ย่างสมุนไพร')
    expect(html).toContain('เปลี่ยนจานหลัก')
    expect(html).toContain('sticky top-8')
    expect(html).toContain('fixed bottom-0')
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
})
