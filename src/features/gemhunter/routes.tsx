import { Link, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { HostShell } from './components/HostShell'
import { EmptyNote, PageHead } from './components/ghui'
import { GemHunterEntry } from './screens/GemHunterEntry'
import { GemHunterResults } from './screens/GemHunterResults'
import { HunterDiscovery } from './screens/HunterDiscovery'
import { MenuAuditScreen } from './screens/MenuAudit'
import { PhotoBank } from './screens/PhotoBank'

function GemHunterNotFound() {
  return (
    <>
      <PageHead title="ไม่พบหน้านี้" />
      <EmptyNote
        Icon={Info}
        action={
          <Button asChild className="h-12 text-[17px]">
            <Link to="/gemhunter">กลับไปหน้าคำเชิญแคมเปญ</Link>
          </Button>
        }
      >
        ลิงก์อาจไม่ถูกต้อง กลับไปหน้าคำเชิญแคมเปญได้เลย
      </EmptyNote>
    </>
  )
}

/** Mounted at `/gemhunter/*`. Own shell, separate from the GemBond AppShell. */
export function GemHunterRoutes() {
  return (
    <Routes>
      <Route element={<HostShell />}>
        <Route index element={<GemHunterEntry />} />
        <Route path="menu" element={<MenuAuditScreen />} />
        <Route path="discover" element={<HunterDiscovery />} />
        <Route path="photos" element={<PhotoBank />} />
        <Route path="results" element={<GemHunterResults />} />
        <Route path="*" element={<GemHunterNotFound />} />
      </Route>
    </Routes>
  )
}
