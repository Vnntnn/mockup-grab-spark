import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useApp } from '@/app/store'
import { SUPPORT_CATEGORIES } from '@/lib/copy'
import { fmtFull } from '@/lib/dates'
import type { SupportCategoryId } from '@/domain/types'

export function Support() {
  const { state, dispatch } = useApp()
  const [params] = useSearchParams()
  const planId = params.get('plan') && state.plans[params.get('plan')!] ? params.get('plan') : null
  const [category, setCategory] = useState<SupportCategoryId | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState(false)
  const [sent, setSent] = useState<SupportCategoryId | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return setError(true)
    dispatch({ type: 'submitSupport', category, note: note.trim(), planId })
    setSent(category)
    setCategory('')
    setNote('')
    setError(false)
  }

  return (
    <>
      <PageHeader title="ขอความช่วยเหลือ" lead="เล่าให้เราฟังว่าติดตรงไหน ไม่ต้องใช้ศัพท์เฉพาะ" />
      <Alert className="mb-6 border-saffron/50 bg-saffron-soft text-saffron-ink">
        <AlertTitle className="text-[16px]">ต้นแบบสาธิต</AlertTitle>
        <AlertDescription className="text-[15px] text-saffron-ink/90">คำขอนี้บันทึกไว้ในเครื่องนี้เท่านั้น ไม่ได้ส่งถึงทีมงานจริง</AlertDescription>
      </Alert>

      {sent && (
        <Alert className="mb-6 border-success/40 bg-success-soft text-success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle className="text-[16px]">บันทึกคำขอของคุณแล้ว (จำลอง)</AlertTitle>
          <AlertDescription className="text-[15px] text-success/90">
            ในระบบจริง ทีมงานจะติดต่อกลับ ระหว่างนี้ คุณยังเลือกไม่เข้าร่วมแผนได้ทุกเมื่อ
            {sent === 'cancel_plan' && <> ถ้าต้องการยกเลิกแคมเปญ ทำได้เองที่หน้า <Link to="/campaigns" className="underline">แคมเปญ</Link> ไม่มีค่าปรับ</>}
          </AlertDescription>
        </Alert>
      )}

      <Panel>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FieldSet data-invalid={error}>
              <FieldLegend variant="label">เรื่องที่อยากแจ้ง</FieldLegend>
              <RadioGroup value={category} onValueChange={(v) => { setCategory(v as SupportCategoryId); setError(false) }} aria-invalid={error}>
                {SUPPORT_CATEGORIES.map((c) => (
                  <div key={c.id} className="flex min-h-12 items-start gap-3 rounded-xl border p-3">
                    <RadioGroupItem value={c.id} id={`s-${c.id}`} className="mt-1 size-5" />
                    <Label htmlFor={`s-${c.id}`} className="flex flex-col items-start gap-0.5 text-[16px] font-medium">
                      {c.label}
                      <span className="text-[14px] font-normal text-muted-foreground">{c.hint}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {error && <FieldError>เลือกเรื่องที่อยากแจ้งก่อนส่ง</FieldError>}
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="note">เล่าเพิ่มเติม (ไม่บังคับ)</FieldLabel>
              <Textarea id="note" rows={4} className="text-[16px]" value={note} onChange={(e) => setNote(e.target.value)} />
              {planId && <FieldDescription>เกี่ยวกับแผน: {state.plans[planId].title}</FieldDescription>}
            </Field>
            <Button type="submit" className="h-12 self-start px-6 text-[16px]">บันทึกคำขอ</Button>
          </FieldGroup>
        </form>
      </Panel>

      {state.supportRequests.length > 0 && (
        <Panel title="คำขอที่บันทึกไว้ในเครื่องนี้" className="mt-6">
          <ul className="flex flex-col divide-y">
            {state.supportRequests.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <p className="font-medium">{SUPPORT_CATEGORIES.find((c) => c.id === r.category)?.label}</p>
                {r.note && <p className="text-[15px]">{r.note}</p>}
                <p className="text-[14px] text-muted-foreground">{fmtFull(r.createdAt)} · บันทึกในเครื่อง ยังไม่ได้ส่งจริง</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
