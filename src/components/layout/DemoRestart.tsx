import { Play } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { useApp } from '@/app/store'
import { useGemHunter } from '@/features/gemhunter/store'
import { todayISO } from '@/lib/dates'

/** Every screen of the three demo areas, grouped, so a presenter can jump straight to any page. */
const PAGES: { group: string; links: { label: string; to: string }[] }[] = [
  {
    group: 'GemBond ฝั่งร้านค้า',
    links: [
      { label: 'ภาพรวม', to: '/dashboard' },
      { label: 'หาโอกาสเติบโต', to: '/opportunities' },
      { label: 'แผนของฉัน', to: '/plans' },
      { label: 'รายละเอียดแผน (ร้านข้าวหอม)', to: '/plans/plan-m-khaohom' },
      { label: 'แคมเปญ', to: '/campaigns' },
      { label: 'ผลลัพธ์', to: '/results' },
      { label: 'ร้านของฉัน', to: '/store' },
      { label: 'ขอความช่วยเหลือ', to: '/support' },
    ],
  },
  {
    group: 'GemBond ฝั่งลูกค้า',
    links: [
      { label: 'แผนที่คู่ร้าน', to: '/pair' },
      { label: 'รายการคู่ร้าน', to: '/pair?view=list' },
      { label: 'ภาพรวมคู่ร้านที่เลือก', to: '/pair/camp-plan-m-khaohom?step=1' },
      { label: 'เลือกจานหลัก', to: '/pair/camp-plan-m-khaohom?step=2' },
      { label: 'เลือกของว่าง', to: '/pair/camp-plan-m-khaohom?step=3&dishA=khao-man-gai-tom' },
      { label: 'ผลคู่เมนูตัวอย่าง', to: '/pair/camp-plan-m-khaohom?step=4&dishA=khao-man-gai-tom&dishB=moo-satay-10&sample=true' },
    ],
  },
  {
    group: 'GemHunter',
    links: [
      { label: 'คำเชิญแคมเปญ', to: '/gemhunter' },
      { label: 'ตรวจเมนู', to: '/gemhunter/menu' },
      { label: 'นักชิม', to: '/gemhunter/discover' },
      { label: 'รูปอาหาร', to: '/gemhunter/photos' },
      { label: 'ผลลัพธ์ GemHunter', to: '/gemhunter/results' },
    ],
  },
]

/**
 * Presenter shortcuts, rendered inside a demo-tools drawer: put one flow back at its first state and open its first screen.
 * The customer flow keeps its state in the URL only, so "from the start" there is just the first screen.
 */
export function DemoRestart() {
  const { dispatch: gemBond } = useApp()
  const { dispatch: gemHunter } = useGemHunter()
  const navigate = useNavigate()

  const start = (label: string, to: string, done: string, reset?: () => void) => (
    <SheetClose asChild>
      <Button
        variant="outline"
        className="h-auto min-h-11 justify-start px-4 py-2 text-left text-[15px] whitespace-normal"
        onClick={() => {
          reset?.()
          navigate(to)
          toast.success(done)
        }}
      >
        <Play data-icon="inline-start" />
        <span>{label}</span>
      </Button>
    </SheetClose>
  )
  const resetMerchant = () => gemBond({ type: 'reset', today: todayISO() })
  const resetHunter = () => gemHunter({ type: 'reset' })

  return (
    <section aria-labelledby="demo-restart" className="flex flex-col gap-2 border-y border-border py-4">
      <h3 id="demo-restart" className="text-[17px] font-bold">
        เริ่มเดโมตั้งแต่ต้น
      </h3>
      {start('เริ่มฝั่งร้านค้า GemBond ตั้งแต่ต้น', '/dashboard', 'เริ่มฝั่งร้านค้า GemBond ตั้งแต่ต้นแล้ว', resetMerchant)}
      {start('เริ่มฝั่งลูกค้า GemBond ตั้งแต่ต้น', '/pair', 'เริ่มฝั่งลูกค้า GemBond ตั้งแต่ต้นแล้ว')}
      {start('เริ่ม GemHunter ตั้งแต่ต้น', '/gemhunter', 'เริ่ม GemHunter ตั้งแต่ต้นแล้ว', resetHunter)}
      {start('เริ่มเดโมทั้งหมดตั้งแต่ต้น (GemHunter แล้วต่อ GemBond)', '/gemhunter', 'เริ่มเดโมทั้งหมดตั้งแต่ต้นแล้ว', () => {
        resetHunter()
        resetMerchant()
      })}
      <p className="text-sm text-muted-foreground">
        ปุ่มเหล่านี้ล้างข้อมูลตัวอย่างของฝั่งนั้นกลับเป็นค่าเริ่มต้นแล้วเปิดหน้าแรก ฝั่งลูกค้าไม่มีข้อมูลที่ต้องล้าง เพราะเก็บการเลือกไว้ในลิงก์
      </p>
      <h3 className="mt-3 text-[17px] font-bold">ไปที่หน้า</h3>
      {PAGES.map((g) => (
        <nav key={g.group} aria-label={g.group} className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-muted-foreground">{g.group}</p>
          <div className="flex flex-wrap gap-2">
            {g.links.map((l) => (
              <SheetClose asChild key={l.to}>
                <Button asChild variant="outline" className="h-auto min-h-11 justify-start px-3 py-2 text-left text-[15px] whitespace-normal">
                  <Link to={l.to}>{l.label}</Link>
                </Button>
              </SheetClose>
            ))}
          </div>
        </nav>
      ))}
    </section>
  )
}
