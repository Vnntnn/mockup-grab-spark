import { useEffect, useLayoutEffect } from 'react'
import { ArrowRight, Gem } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { useGemHunter } from '../store'
import { merchantOf } from '../data/seed'
import { GemHunterDemoPanel } from './GemHunterDemoPanel'
import { SIM_LINE } from './copy'
import { Stepper } from './Stepper'
import '../gemhunter.css'

/**
 * Layout for the conceptual host platform GemHunter lives inside. Unlike GemBond: no sidebar, a slim top bar,
 * and the five steps as the navigation under it (so no second progress display is needed anywhere).
 */
export function HostShell() {
  const { state } = useGemHunter()
  const { campaign } = state
  const merchant = merchantOf(campaign.merchantId)
  const { pathname } = useLocation()

  // Dialogs, sheets and toasts render in a portal outside this tree, so the theme class also goes on <html> while mounted.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add('host-platform')
    return () => root.classList.remove('host-platform')
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const stopped = campaign.phase === 'paused' || campaign.phase === 'cancelled'

  return (
    <div className="host-platform min-h-svh bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        ข้ามไปยังเนื้อหา
      </a>

      <p className="bg-foreground px-4 py-2 text-center text-[13px] leading-normal text-background">{SIM_LINE}</p>

      <header className="sticky top-0 z-20 border-b bg-card shadow-(--shadow-edge)">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <p className="flex min-w-0 items-center gap-2.5 text-[17px] leading-normal">
            <Gem className="size-5 shrink-0 text-link" aria-hidden="true" />
            <span className="truncate py-1">
              <span className="font-bold">GemHunter</span>
              <span className="text-muted-foreground"> · {merchant?.name ?? 'ร้านตัวอย่าง'}</span>
            </span>
          </p>
          <GemHunterDemoPanel />
        </div>
        <nav aria-label="ขั้นตอนของแคมเปญ" className="border-t">
          <div className="mx-auto max-w-6xl md:px-5">
            <Stepper campaign={campaign} />
          </div>
        </nav>
      </header>

      <div>
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-6 pb-16 outline-none md:px-8 md:pt-10 md:pb-24">
          {stopped && pathname !== '/gemhunter' && (
            <p className="mb-6 text-[15px]">
              {campaign.phase === 'paused' ? 'คุณพักแคมเปญไว้' : 'แคมเปญนี้ยกเลิกแล้ว'} ร้านขายตามปกติ{' '}
              <Link to="/gemhunter" className="inline-flex min-h-11 items-center gap-1 font-medium text-link underline underline-offset-4">
                ไปที่หน้าคำเชิญ
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          )}
          <div key={pathname} className="gh-screen">
            <Outlet />
          </div>
          {campaign.handoff?.status === 'opened' && (
            <p className="mt-12 border-t pt-5 text-[15px] text-muted-foreground">
              คุณเปิด GemBond จากแคมเปญนี้แล้ว{' '}
              <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1 font-medium text-link underline underline-offset-4">
                ไปที่ GemBond
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          )}
        </main>
      </div>

      <Toaster position="bottom-center" offset="32px" mobileOffset="24px" />
    </div>
  )
}
