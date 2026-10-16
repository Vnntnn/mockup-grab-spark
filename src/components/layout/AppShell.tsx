import { BarChart3, ClipboardList, Compass, LayoutDashboard, Megaphone, Store, type LucideIcon } from 'lucide-react'
import { SiteFooter } from '@/components/SiteFooter'
import { LangToggle } from '@/i18n/LangToggle'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GemMark, Gem } from '@/components/GemMark'
import { DemoPanel } from './DemoPanel'
import { useApp } from '@/app/store'
import { selfOf } from '@/app/selectors'
import { DEMO_NOTE, DEMO_NOTE_SHORT } from '@/lib/copy'
import { initial } from '@/lib/format'
import { cn } from '@/lib/utils'
import { isDecisionRoute } from './nav-utils'

type NavItem = { to: string; label: string; short: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'ภาพรวม', short: 'ภาพรวม', icon: LayoutDashboard },
  { to: '/opportunities', label: 'หาโอกาสเติบโต', short: 'โอกาส', icon: Compass },
  { to: '/plans', label: 'แผนของฉัน', short: 'แผน', icon: ClipboardList },
  { to: '/campaigns', label: 'แคมเปญ', short: 'แคมเปญ', icon: Megaphone },
  { to: '/results', label: 'ผลลัพธ์', short: 'ผลลัพธ์', icon: BarChart3 },
]
const STORE: NavItem = { to: '/store', label: 'ร้านของฉัน', short: 'ร้านของฉัน', icon: Store }

export function AppShell() {
  const { state } = useApp()
  const me = selfOf(state)
  const { pathname } = useLocation()
  const planHelp = pathname.startsWith('/plans/') ? pathname.split('/')[2] : null
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex min-h-12 items-center px-2.5 text-[15px] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
      isActive ? 'font-bold text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:bg-brand' : 'text-muted-foreground hover:text-ink',
    )

  const isDecision = isDecisionRoute(pathname)

  return (
    <div className="min-h-svh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">
        ข้ามไปยังเนื้อหา
      </a>

      {/* the only place that says "demo": one line, with the presenter tools beside it */}
      <div className="on-ink bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
          <p className="py-2 text-[14px] leading-snug">
            <span className="md:hidden">{DEMO_NOTE_SHORT}</span>
            <span className="max-md:hidden">{DEMO_NOTE}</span>
          </p>
          <DemoPanel className="shrink-0" />
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-border bg-card shadow-[var(--shadow-edge)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/dashboard" className="flex min-h-12 items-center gap-2" aria-label="GemBond หน้าภาพรวม">
            <GemMark className="size-8" snap />
            <span className="text-[22px] font-bold text-ink">GemBond</span>
          </Link>
          <nav aria-label="เมนูหลัก" className="-mr-3 hidden items-stretch lg:flex">
            {[...NAV, STORE].map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={tab}>
                <Icon className="mr-1.5 size-[18px]" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <Link to={STORE.to} className="flex min-h-12 min-w-11 items-center justify-center gap-2 text-[15px] font-medium lg:hidden" aria-label={`${me.name} ไปหน้าร้านของฉัน`}>
            <Gem glyph={initial(me.name)} tone="self" className="size-8" />
            <span className="hidden sm:inline">ร้านของฉัน</span>
          </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className={cn("mx-auto max-w-5xl px-4 pt-6 pb-36 outline-none md:px-6 md:pt-10 lg:pb-24", isDecision && "pb-48 min-[480px]:pb-36")}>
        <div key={pathname} className="rise">
          <Outlet />
        </div>
        <p className="mt-16 border-t border-border pt-6 text-[15px] text-muted-foreground">
          ไม่เข้าใจข้อไหน หรือมีเรื่องอยากแจ้ง?{' '}
          <Link to={planHelp ? `/support?plan=${planHelp}` : '/support'} className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
            ขอความช่วยเหลือ
          </Link>
        </p>
        <SiteFooter className="mt-6" />
      </main>

      {!isDecision && (
        <nav aria-label="เมนูหลัก (มือถือ)" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
          {NAV.map(({ to, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[14px] leading-none outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive ? 'font-bold text-ink before:absolute before:inset-x-3 before:top-0 before:h-[3px] before:bg-brand' : 'font-medium text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[22px]" aria-hidden="true" />
                  <span className="truncate">{short}</span>
                  {isActive && <span className="sr-only">(หน้าปัจจุบัน)</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      <Toaster position="bottom-center" offset={{ bottom: '96px', left: '16px', right: '16px' }} mobileOffset={{ bottom: '140px', left: '16px', right: '16px' }} />
    </div>
  )
}
