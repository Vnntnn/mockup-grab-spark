import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Gem } from '@/components/GemMark'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { baht, initial } from '@/lib/format'
import type { Merchant } from '@/domain/types'

/** Deterministic pseudo-QR so the demo is stable. It encodes nothing. */
function FakeQr({ seed }: { seed: string }) {
  const n = 21
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h = (h * 1664525 + 1013904223) >>> 0
    cells.push(h % 100 < 48)
  }
  const origin = (x: number, y: number): [number, number] | null => {
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]]) if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) return [ox, oy]
    return null
  }
  const finderOn = (lx: number, ly: number) => lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-28 bg-white" role="img" aria-label="QR สาธิต ไม่ได้เชื่อมต่อลิงก์จริง">
      {cells.map((on, i) => {
        const x = i % n
        const y = Math.floor(i / n)
        const o = origin(x, y)
        const filled = o ? finderOn(x - o[0], y - o[1]) : on
        return filled ? <rect key={i} x={x} y={y} width="1" height="1" fill="#161616" /> : null
      })}
    </svg>
  )
}

export function CampaignPreview({ self, partner, campaignId }: { self: Merchant; partner: Merchant; campaignId: string }) {
  const [menuOf, setMenuOf] = useState<Merchant | null>(null)
  const link = `https://gembond.example/c/${campaignId}`
  const store = (m: Merchant, tone: 'self' | 'partner') => (
    <div className="flex flex-1 flex-col justify-between px-1 py-1 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <div>
        <div className="flex items-center gap-3 pb-3">
          <Gem glyph={initial(m.name)} tone={tone} className="size-12 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[22px] font-bold text-ink">{m.name}</p>
            <p className="text-[15px] text-muted-foreground">{m.category} · {m.neighborhood}</p>
          </div>
        </div>
        <p className="text-[15px] text-muted-foreground">เมนูแนะนำของร้าน</p>
        <ul className="mt-1 flex flex-col divide-y divide-border border-y border-border">
          {m.sampleMenu.slice(0, 2).map((i) => (
            <li key={i.name} className="flex justify-between gap-3 py-2.5">
              <span className="truncate">{i.name}</span>
              <span className="figure shrink-0 text-[17px]">{baht(i.priceBaht)}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button variant="outline" className="mt-4 h-11 w-full text-[15px]" onClick={() => setMenuOf(m)}>
        ดูเมนูร้านนี้
      </Button>
    </div>
  )
  return (
    <section aria-labelledby="preview-h" className="surface px-5 py-6 sm:px-7">
      <h3 id="preview-h" className="text-[22px] font-bold text-ink">ตัวอย่างหน้าแคมเปญที่ลูกค้าจะเห็น (จำลอง)</h3>
      <p className="mb-5 text-[15px] text-muted-foreground">มุมมองลูกค้า: เลือกสั่งจากร้านไหนก็ได้ ไม่ต้องสั่งทั้งสองร้าน และไม่มีตะกร้ารวม</p>
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-0 sm:divide-x sm:divide-border">{store(partner, 'partner')}{store(self, 'self')}</div>
      <div className="mt-6 flex flex-wrap items-center gap-5">
        <FakeQr seed={campaignId} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[15px] text-muted-foreground">ลิงก์สาธิตสำหรับโปรโมต (ไม่ได้เผยแพร่จริง)</p>
          <p className="truncate border-b border-border pb-1 font-mono text-[15px]">{link}</p>
          <Button
            variant="outline"
            className="h-11 self-start text-[15px]"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                toast.success('คัดลอกลิงก์สาธิตแล้ว')
              } catch {
                toast.error('คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง')
              }
            }}
          >
            <Copy data-icon="inline-start" />
            คัดลอกลิงก์
          </Button>
        </div>
      </div>
      <Dialog open={!!menuOf} onOpenChange={(o) => !o && setMenuOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[22px]">เมนูตัวอย่าง {menuOf?.name}</DialogTitle>
            <DialogDescription className="text-[15px]">หน้านี้จำลองขึ้นเพื่อสาธิต ไม่ได้เชื่อมต่อระบบสั่งซื้อจริง ไม่มีการชำระเงินหรือจัดส่ง</DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col divide-y rounded-xl border">
            {menuOf?.sampleMenu.map((i) => (
              <li key={i.name} className="flex justify-between gap-3 p-3.5 text-[17px]"><span>{i.name}</span><span className="font-semibold">{baht(i.priceBaht)}</span></li>
            ))}
          </ul>
          <p className="flex items-start gap-2 text-[15px] text-muted-foreground"><ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" />ในการใช้งานจริง ลูกค้าจะไปสั่งต่อที่ช่องทางสั่งอาหารปกติของร้านนี้</p>
          <DialogFooter><Button className="h-12 text-[17px]" onClick={() => setMenuOf(null)}>ปิด</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
