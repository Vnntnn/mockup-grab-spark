import { BarChart3, ClipboardList, Compass, Info, LayoutDashboard, LifeBuoy, Megaphone, Store, type LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { GemMark, Gem } from '@/components/GemMark'
import { DemoPanel } from './DemoPanel'
import { ResetButton } from './ResetButton'
import { useApp } from '@/app/store'
import { selfOf } from '@/app/selectors'
import { DEMO_NOTE } from '@/lib/copy'
import { initial } from '@/lib/format'
import { cn } from '@/lib/utils'

const NAV: { to: string; label: string; short: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'ภาพรวม', short: 'ภาพรวม', icon: LayoutDashboard },
  { to: '/opportunities', label: 'หาโอกาสเติบโต', short: 'โอกาส', icon: Compass },
  { to: '/plans', label: 'แผนของฉัน', short: 'แผน', icon: ClipboardList },
  { to: '/campaigns', label: 'แคมเปญ', short: 'แคมเปญ', icon: Megaphone },
  { to: '/results', label: 'ผลลัพธ์', short: 'ผลลัพธ์', icon: BarChart3 },
  { to: '/store', label: 'ร้านของฉัน', short: 'ร้านฉัน', icon: Store },
]

export function AppShell() {
  const { state } = useApp()
  const me = selfOf(state)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-svh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        ข้ามไปยังเนื้อหา
      </a>

      {/* tablet: icon rail, desktop: full sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col bg-sidebar py-5 text-sidebar-foreground md:flex lg:w-64">
        <Link to="/dashboard" className="mb-6 flex items-center gap-3 rounded-lg px-5 lg:px-6" aria-label="GemBond หน้าภาพรวม">
          <GemMark className="size-9 shrink-0" />
          <span className="hidden text-[22px] font-semibold tracking-tight text-white lg:block">GemBond</span>
        </Link>
        <nav aria-label="เมนูหลัก" className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[16px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring',
                  isActive ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('size-[22px] shrink-0', isActive && 'text-saffron')} aria-hidden="true" />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="sr-only lg:hidden">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden flex-col gap-3 px-4 lg:flex">
          <Link
            to="/support"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-sidebar-foreground/85 hover:bg-sidebar-accent/60"
          >
            <LifeBuoy className="size-5" aria-hidden="true" />
            ขอความช่วยเหลือ
          </Link>
          <ResetButton variant="ghost" className="justify-start border border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white" />
        </div>
      </aside>

      <div className="md:pl-20 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur md:px-8">
          <Link to="/dashboard" className="flex min-h-11 items-center gap-2 md:hidden" aria-label="GemBond หน้าภาพรวม">
            <GemMark className="size-8" />
            <span className="text-xl font-semibold text-forest">GemBond</span>
          </Link>
          <p className="hidden items-center gap-2 rounded-full bg-saffron-soft px-3 py-1.5 text-[14px] font-medium text-saffron-ink md:inline-flex">
            <Info className="size-4" aria-hidden="true" />
            ข้อมูลตัวอย่างเพื่อสาธิต
          </p>
          <Link to="/store" className="ml-auto flex min-h-11 items-center gap-2.5 rounded-full border bg-card py-1 pr-4 pl-1.5 hover:bg-secondary" aria-label={`บัญชีสาธิต: ${me.name} ไปหน้าร้านของฉัน`}>
            <Gem glyph={initial(me.name)} tone="self" className="size-8" />
            <span className="max-w-[10.5rem] truncate text-[15px] font-medium sm:max-w-none">{me.name}</span>
          </Link>
        </header>

        <div className="border-b bg-saffron-soft/60 px-4 py-2 text-[14px] text-saffron-ink md:px-8">
          <p className="mx-auto flex max-w-4xl items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {DEMO_NOTE}
          </p>
        </div>

        <main id="main" className="mx-auto max-w-4xl px-4 pt-6 pb-40 md:px-8 md:pt-8 md:pb-28">
          <Outlet />
        </main>
      </div>

      <nav aria-label="เมนูหลัก (มือถือ)" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex min-h-16 flex-col items-center justify-center gap-0.5 px-0.5 text-[13px] leading-tight font-medium', isActive ? 'text-forest' : 'text-muted-foreground')
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex h-7 w-12 items-center justify-center rounded-full', isActive && 'bg-saffron-soft')}>
                  <Icon className="size-[22px]" aria-hidden="true" />
                </span>
                {short}
                {isActive && <span className="sr-only">(หน้าปัจจุบัน)</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <DemoPanel />
      <Toaster position="top-center" />
    </div>
  )
}
