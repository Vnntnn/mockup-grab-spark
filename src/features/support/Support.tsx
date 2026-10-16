import { useKept } from '@/i18n/keep'
import { CheckCircle2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from '@/i18n/toast'
import { PageHeader } from '@/components/PageHeader'
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
  const [category, setCategory] = useKept<SupportCategoryId | ''>('support:category', '')
  const [note, setNote] = useKept('support:note', '')
  const [error, setError] = useKept('support:error', false)
  const [sent, setSent] = useKept<SupportCategoryId | null>('support:sent', null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return setError(true)
    dispatch({ type: 'submitSupport', category, note: note.trim(), planId })
    setSent(category)
    toast.success('บันทึกคำขอแล้ว (จำลอง ยังไม่ได้ส่งถึงทีมงานจริง)')
    setCategory('')
    setNote('')
    setError(false)
  }

  return (
    <>
      <PageHeader title="ขอความช่วยเหลือ" lead="เล่าให้เราฟังว่าติดตรงไหน" />

      {sent && (
        <Alert className="mb-6 border-0 bg-accent text-ink" role="status">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle className="text-[17px]">บันทึกคำขอของคุณแล้ว (จำลอง)</AlertTitle>
          <AlertDescription className="text-[15px] text-ink">
            ในระบบจริง ทีมงานจะติดต่อกลับ ระหว่างนี้ คุณยังเลือกไม่เข้าร่วมแผนได้ทุกเมื่อ
            {sent === 'cancel_plan' && <> ถ้าต้องการยกเลิกแคมเปญ ทำได้เองที่หน้า <Link to="/campaigns" className="underline font-medium">แคมเปญ</Link> ไม่มีค่าปรับ</>}
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl">
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <FieldSet data-invalid={error}>
              <FieldLegend variant="label">เรื่องที่อยากแจ้ง</FieldLegend>
              <RadioGroup value={category} onValueChange={(v) => { setCategory(v as SupportCategoryId); setError(false) }} aria-invalid={error} className="gap-0 divide-y divide-border border-y border-border">
                {SUPPORT_CATEGORIES.map((c) => (
                  <div key={c.id} className="flex min-h-12 items-start gap-3 px-1 py-3.5 transition-colors hover:bg-card">
                    <RadioGroupItem value={c.id} id={`s-${c.id}`} aria-label={c.label} className="mt-1 size-5" />
                    <Label htmlFor={`s-${c.id}`} className="flex flex-col items-start gap-0.5 text-[17px] font-medium cursor-pointer">
                      {c.label}
                      <span className="text-[15px] font-normal text-muted-foreground">{c.hint}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {error && <FieldError>เลือกเรื่องที่อยากแจ้งก่อนส่ง</FieldError>}
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="note">เล่าเพิ่มเติม (ไม่บังคับ)</FieldLabel>
              <Textarea id="note" rows={4} className="text-[17px]" value={note} onChange={(e) => setNote(e.target.value)} />
              {planId && <FieldDescription>เกี่ยวกับแผน: {state.plans[planId].title}</FieldDescription>}
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="submit" className="h-12 px-6 text-[17px] font-bold">บันทึกคำขอ</Button>
              <span className="text-[15px] text-muted-foreground">คำขอนี้บันทึกในเครื่องนี้สำหรับเดโม ไม่ได้ส่งถึงทีมงานจริง</span>
            </div>
          </FieldGroup>
        </form>
      </div>

      {state.supportRequests.length > 0 && (
        <section aria-labelledby="saved-h" className="mt-14 max-w-2xl">
          <h2 id="saved-h" className="border-t border-border pt-8 text-[22px] font-bold text-ink">คำขอที่บันทึกไว้ในเครื่องนี้</h2>
          <ul className="flex flex-col divide-y divide-border">
            {state.supportRequests.map((r) => (
              <li key={r.id} className="py-3">
                <p className="font-medium">{SUPPORT_CATEGORIES.find((c) => c.id === r.category)?.label}</p>
                {r.note && <p className="text-[15px]">{r.note}</p>}
                <p className="text-[15px] text-muted-foreground">{fmtFull(r.createdAt)} · บันทึกในเครื่อง ยังไม่ได้ส่งจริง</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
