import { ExternalLink, FlaskConical, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DemoCustomerLinks } from '@/components/layout/DemoCustomerLinks'
import { DemoRestart } from '@/components/layout/DemoRestart'

/**
 * Presenter-only drawer for the customer pages. Its contents (and the hooks they use) mount only while the drawer is open,
 * so the customer pages themselves stay free of app-state dependencies.
 */
export function CustomerDemoTools() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-11 shrink-0 gap-2 px-3 text-[15px]" aria-label="เปิดเครื่องมือสาธิต">
          <FlaskConical className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline">เครื่องมือสาธิต</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-5 [&_[data-slot=button]]:h-auto [&_[data-slot=button]]:min-h-11 [&_[data-slot=button]]:py-2 [&_[data-slot=button]]:text-left [&_[data-slot=button]]:whitespace-normal">
        <SheetHeader className="p-0 pr-10">
          <SheetTitle className="text-xl font-bold">เครื่องมือสาธิต</SheetTitle>
          <SheetDescription className="text-[15px]">สำหรับผู้นำเสนอเท่านั้น ไม่ใช่ฟังก์ชันที่ลูกค้าใช้</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5">
          <DemoRestart />
          <DemoCustomerLinks />
          <div className="flex flex-col gap-2">
            <SheetClose asChild>
              <Button asChild variant="outline" className="h-auto min-h-11 justify-start px-4 py-2 text-left text-[15px] whitespace-normal">
                <Link to="/dashboard">
                  <Store data-icon="inline-start" />
                  <span>กลับไปต้นแบบ GemBond</span>
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button asChild variant="outline" className="h-auto min-h-11 min-w-0 justify-start px-4 py-2 text-left text-[15px] whitespace-normal">
                <Link to="/gemhunter">
                  <ExternalLink data-icon="inline-start" />
                  <span>ดูต้นแบบ GemHunter (ในแพลตฟอร์มสั่งอาหาร)</span>
                </Link>
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
