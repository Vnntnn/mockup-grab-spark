import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Meter } from '@/components/visual'
import type { PartnerRecommendation } from '@/domain/types'

export function WhyMatch({ rec }: { rec: PartnerRecommendation }) {
  return (
    <Accordion type="single" collapsible className="mt-4 border-t border-border">
      <AccordionItem value="why" className="border-0">
        <AccordionTrigger className="min-h-12 text-[15px] font-semibold hover:no-underline">
          ทำไมเราถึงแนะนำร้านนี้
        </AccordionTrigger>
        <AccordionContent className="text-[15px]">
          <ul className="mb-4 flex flex-col gap-4">
            {rec.matchReasons.map((r) => (
              <li key={r.factor}>
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-ink">{r.label}</span>
                  <span className="shrink-0 text-[15px] tabular-nums text-muted-foreground">{Math.round(r.score * 100)} คะแนน</span>
                </p>
                <Meter value={r.score} label={`${r.label} ${Math.round(r.score * 100)} คะแนน`} className="my-1.5" />
                <p className="text-[15px] text-muted-foreground">{r.detail}</p>
              </li>
            ))}
          </ul>
          <p className="text-[14px] text-muted-foreground">
            รวม {rec.matchScore} จาก 100 ด้วยน้ำหนักตัวอย่างของต้นแบบ ไม่ได้เรียนรู้จากข้อมูลจริงของตลาด ไม่ใช้ยอดขาย ขนาดร้าน รีวิว หรืองบโฆษณาจัดอันดับ
            คะแนนไม่ใช่การรับประกันผล และไม่ใช่การเข้าร่วมแทนคุณ
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
