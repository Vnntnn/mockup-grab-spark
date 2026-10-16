import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** Who made this prototype. Shown at the bottom of every page (merchant, GemHunter and customer sides). */
export function SiteFooter({ className, merchantLink }: { className?: string; merchantLink?: boolean }) {
  return (
    <footer className={cn('border-t border-border py-6 text-center text-[14px] leading-relaxed text-muted-foreground', className)}>
      <p>© 2026 ต้นแบบนี้จัดทำเพื่อการแข่งขันกรณีศึกษา GrabSpark</p>
      <p>ผู้จัดทำ: Thanabodee Angkuldee สมาชิกกลุ่ม “Miska Muska”</p>
      {merchantLink && (
        <p className="mt-1">
          <Link to="/dashboard" className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
            เปิดต้นแบบฝั่งร้านค้า
          </Link>
        </p>
      )}
    </footer>
  )
}
