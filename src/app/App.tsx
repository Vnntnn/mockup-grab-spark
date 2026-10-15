import { Component, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { Campaigns } from '@/features/campaigns/Campaigns'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { PlanDetail } from '@/features/growth-plans/PlanDetail'
import { GemHunterProvider } from '@/features/gemhunter/store'
import { GemHunterRoutes } from '@/features/gemhunter/routes'
import { PlansList } from '@/features/growth-plans/PlansList'
import { Opportunities } from '@/features/partner-discovery/Opportunities'
import { Results } from '@/features/results/Results'
import { StoreProfile } from '@/features/store-profile/StoreProfile'
import { Support } from '@/features/support/Support'
import { CustomerPairingRoute } from '@/features/customer-pairing/CustomerPairingRoute'
import { DEFAULT_CAMPAIGN_ID } from '@/features/customer-pairing/data'
import { AppProvider } from './store'

function NotFound() {
  return (
    <>
      <PageHeader title="ไม่พบหน้านี้" />
      <Empty className="rounded-2xl border bg-card">
        <EmptyHeader>
          <EmptyDescription className="text-[17px]">ลิงก์อาจไม่ถูกต้อง กลับไปหน้าภาพรวมได้เลย</EmptyDescription>
        </EmptyHeader>
        <Button asChild className="h-12 text-[17px]"><Link to="/dashboard">กลับไปภาพรวม</Link></Button>
      </Empty>
    </>
  )
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold">มีบางอย่างผิดพลาด</h1>
        <p className="mb-4">ข้อมูลตัวอย่างอาจไม่ถูกต้อง ลองรีเซ็ตข้อมูลตัวอย่าง</p>
        <Button
          className="h-12 text-[17px]"
          onClick={() => {
            try { localStorage.removeItem('gembond.demo.v1') } catch { /* ignore */ }
            try { localStorage.removeItem('gembond.gemhunter.v1') } catch { /* ignore */ }
            location.assign('/dashboard')
          }}
        >
          รีเซ็ตข้อมูลตัวอย่าง
        </Button>
      </div>
    )
  }
}

export function App() {
  return (
    <Boundary>
      <AppProvider>
        <GemHunterProvider>
          <BrowserRouter>
            <Routes>
              {/* GemHunter lives in its own host-platform shell, outside the GemBond AppShell */}
              <Route path="/gemhunter/*" element={<GemHunterRoutes />} />
              {/* Customer food pairing customer canvas, outside merchant AppShell */}
              <Route path="/pair" element={<Navigate to={`/pair/${DEFAULT_CAMPAIGN_ID}?step=1`} replace />} />
              <Route path="/pair/:campaignId" element={<CustomerPairingRoute />} />
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/plans" element={<PlansList />} />
                <Route path="/plans/:planId" element={<PlanDetail />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/results" element={<Results />} />
                <Route path="/store" element={<StoreProfile />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GemHunterProvider>
      </AppProvider>
    </Boundary>
  )
}
