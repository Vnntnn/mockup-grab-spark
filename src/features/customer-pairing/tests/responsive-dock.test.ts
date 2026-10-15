import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'

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

import { SelectionDock } from '../components/SelectionDock'
import { PairingHeader } from '../components/PairingHeader'
import { StoreModal } from '../components/StoreModal'

describe('Responsive Dock & Header', () => {
  describe('SelectionDock', () => {
    it('renders mobile fixed bar (< 768px), tablet floating pill (768-1023px), and desktop hidden (>= 1024px)', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว: ข้าวมันไก่ทอด · ฿70',
        isEnabled: true,
        onNext: () => {},
      }))
      // Mobile fixed class
      expect(html).toContain('fixed bottom-0')
      expect(html).toContain('inset-x-0')
      expect(html).toContain('z-40')
      expect(html).toContain('bg-card')
      expect(html).toContain('border-t')
      expect(html).toContain('border-border')
      expect(html).toContain('pb-safe')
      // Tablet floating class
      expect(html).toContain('md:bottom-6')
      expect(html).toContain('md:left-1/2')
      expect(html).toContain('md:-translate-x-1/2')
      expect(html).toContain('md:w-[calc(100%-3rem)]')
      expect(html).toContain('md:max-w-lg')
      expect(html).toContain('md:rounded-2xl')
      expect(html).toContain('md:border')
      expect(html).toContain('md:shadow-lg')
      // Desktop hidden class for bottom dock
      expect(html).toContain('lg:hidden')
    })

    it('renders desktop embedded sidebar dock (>= 1024px)', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว: ข้าวมันไก่ทอด · ฿70',
        isEnabled: true,
        onNext: () => {},
        variant: 'desktop-sidebar',
      }))
      expect(html).toContain('sticky top-8')
      expect(html).toContain('hidden lg:block')
      expect(html).toContain('bg-card')
      expect(html).toContain('border')
      expect(html).toContain('border-border')
      expect(html).toContain('rounded-2xl')
      expect(html).toContain('p-6')
    })

    it('enforces min-h-[48px] touch targets on buttons', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).toContain('min-h-[48px]')
    })

    it('shows "เลือกเมนูร้านที่สอง" on Step 2 in normal progression', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).toContain('เลือกเมนูร้านที่สอง')
    })

    it('shows "ดูคู่เมนูของคุณ" when in edit mode on Step 2', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: true,
        summaryText: 'เลือกแล้ว',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).toContain('ดูคู่เมนูของคุณ')
    })

    it('shows "ดูคู่เมนูของคุณ" on Step 3', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 3,
        isEditing: false,
        summaryText: 'เลือกแล้ว',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).toContain('ดูคู่เมนูของคุณ')
    })

    it('uses Grab Green when enabled and supports disabled state', () => {
      const enabledHtml = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(enabledHtml).toContain('bg-[#00B14F]')
      expect(enabledHtml).toContain('text-[#0A0A0A]')
      expect(enabledHtml).toContain('hover:bg-[#009E46]')

      const disabledHtml = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'ยังไม่ได้เลือก',
        isEnabled: false,
        onNext: () => {},
      }))
      expect(disabledHtml).toContain('disabled')
    })

    it('displays summaryText in the dock', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว: ข้าวมันไก่ทอด · ฿70',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).toContain('เลือกแล้ว: ข้าวมันไก่ทอด · ฿70')
    })

    it('contains zero emojis in SelectionDock', () => {
      const html = renderToString(React.createElement(SelectionDock, {
        step: 2,
        isEditing: false,
        summaryText: 'เลือกแล้ว: ข้าวมันไก่ทอด · ฿70',
        isEnabled: true,
        onNext: () => {},
      }))
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })
  })

  describe('PairingHeader', () => {
    it('does NOT render back button on Step 1', () => {
      const html = renderToString(React.createElement(PairingHeader, {
        step: 1,
        onBack: () => {},
      }))
      expect(html).not.toContain('aria-label="ย้อนกลับ"')
      expect(html).not.toContain('aria-label="แชร์คู่เมนูนี้"')
    })

    it('renders back button with min 48px touch target on Step 2 and 3', () => {
      const step2Html = renderToString(React.createElement(PairingHeader, {
        step: 2,
        onBack: () => {},
      }))
      expect(step2Html).toContain('aria-label="ย้อนกลับ"')
      expect(step2Html).toContain('min-h-[48px]')
      expect(step2Html).toContain('min-w-[48px]')
      expect(step2Html).not.toContain('aria-label="แชร์คู่เมนูนี้"')

      const step3Html = renderToString(React.createElement(PairingHeader, {
        step: 3,
        onBack: () => {},
      }))
      expect(step3Html).toContain('aria-label="ย้อนกลับ"')
      expect(step3Html).toContain('min-h-[48px]')
      expect(step3Html).toContain('min-w-[48px]')
      expect(step3Html).not.toContain('aria-label="แชร์คู่เมนูนี้"')
    })

    it('renders back button and share action button with min 48px touch targets on Step 4', () => {
      const html = renderToString(React.createElement(PairingHeader, {
        step: 4,
        onBack: () => {},
        onShare: () => {},
        shareTitle: 'แชร์คู่เมนู',
      }))
      expect(html).toContain('aria-label="ย้อนกลับ"')
      expect(html).toContain('aria-label="แชร์คู่เมนูนี้"')
      expect(html).toContain('min-h-[48px]')
      expect(html).toContain('min-w-[48px]')
    })

    it('contains zero emojis in PairingHeader', () => {
      const html = renderToString(React.createElement(PairingHeader, {
        step: 4,
        onBack: () => {},
        onShare: () => {},
      }))
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })
  })

  describe('StoreModal', () => {
    it('does not render content when closed', () => {
      const html = renderToString(React.createElement(StoreModal, {
        isOpen: false,
        onClose: () => {},
        merchantName: 'ร้านข้าวหอม',
      }))
      expect(html).not.toContain('ร้านข้าวหอม')
      expect(html).not.toContain('ต้นแบบจำลอง')
    })

    it('renders merchant name, prototype notice, and 48px close button when open without duplicate store prefix', () => {
      const html1 = renderToString(React.createElement(StoreModal, {
        isOpen: true,
        onClose: () => {},
        merchantName: 'ร้านข้าวหอม',
      }))
      expect(html1).toContain('ร้านข้าวหอม')
      expect(html1).not.toContain('ร้าน ร้าน')
      expect(html1).toContain('ต้นแบบจำลอง')
      expect(html1).toContain('min-h-[48px]')
      expect(html1).toContain('px-6')

      const html2 = renderToString(React.createElement(StoreModal, {
        isOpen: true,
        onClose: () => {},
        merchantName: 'หมูสะเต๊ะบ้านสวน',
      }))
      expect(html2).toContain('ร้าน หมูสะเต๊ะบ้านสวน')
      expect(html2).not.toContain('ร้าน ร้าน')
    })

    it('contains zero emojis in StoreModal', () => {
      const html = renderToString(React.createElement(StoreModal, {
        isOpen: true,
        onClose: () => {},
        merchantName: 'ร้านข้าวหอม',
      }))
      expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
    })
  })
})
