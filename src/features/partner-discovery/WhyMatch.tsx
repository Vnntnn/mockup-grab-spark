import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import type { PartnerRecommendation } from '@/domain/types'

export function WhyMatch({ rec }: { rec: PartnerRecommendation }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="why" className="border-0">
        <AccordionTrigger className="min-h-11 text-[16px] font-medium text-emerald-700 hover:no-underline">ทำไมเราถึงแนะนำร้านนี้</AccordionTrigger>
        <AccordionContent className="text-[16px]">
          <ul className="mb-4 flex flex-col gap-3">
            {rec.matchReasons.map((r) => (
              <li key={r.factor}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-[14px] text-muted-foreground">{Math.round(r.score * 100)}%</span>
                </div>
                <Progress value={r.score * 100} className="my-1.5 h-2" aria-label={`${r.label} ${Math.round(r.score * 100)} เปอร์เซ็นต์`} />
                <p className="text-[15px] text-muted-foreground">{r.detail}</p>
              </li>
            ))}
          </ul>
          <p className="rounded-xl bg-sage p-3 text-[15px]">
            ความเหมาะสมรวม {rec.matchScore} จาก 100 คำนวณจากเกณฑ์ 5 ข้อข้างบน โดยใช้น้ำหนักตัวอย่างที่ตั้งไว้สำหรับต้นแบบนี้ ไม่ได้เรียนรู้จากข้อมูลจริงของตลาด
            และไม่นำยอดขาย ขนาดร้าน รีวิว หรืองบโฆษณามาจัดอันดับ คะแนนนี้ไม่ใช่การรับประกันผล และไม่ใช่การเข้าร่วมแทนคุณ
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
