import { useKept } from '@/i18n/keep'
import { Check, Store } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import { AREAS, MENU_CATEGORY_OPTIONS } from '@/data/merchants'
import { useApp } from '@/app/store'
import { matching, selfOf } from '@/app/selectors'
import { PREFERENCE_LABEL, READINESS_LABEL } from '@/lib/copy'
import type { ParticipationPreference, ReadinessStatus } from '@/domain/types'

/** Half-hour choices in 24-hour time (the native time input follows the browser's locale and shows AM/PM in a Thai screen). */
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const timeOptions = (current: string) => (HALF_HOURS.includes(current) ? HALF_HOURS : [...HALF_HOURS, current].sort())

function TimeSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full text-[17px] data-[size=default]:h-12"><SelectValue>{value} น.</SelectValue></SelectTrigger>
      <SelectContent>
        <SelectGroup>{timeOptions(value).map((t) => <SelectItem key={t} value={t} className="min-h-11 text-[17px]">{t} น.</SelectItem>)}</SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function StoreProfile() {
  const { state, dispatch } = useApp()
  const me = selfOf(state)
  const patch = (p: Parameters<typeof dispatch>[0] extends infer A ? A extends { type: 'updateMerchant'; patch: infer P } ? P : never : never) => dispatch({ type: 'updateMerchant', patch: p })
  const [costText, setCostText] = useKept('store:cost', state.variableCostPct === null ? '' : String(state.variableCostPct))
  const costNum = costText === '' ? null : Number(costText)
  const costInvalid = costNum !== null && (Number.isNaN(costNum) || costNum < 0 || costNum > 100)
  const recCount = matching(state).recommendations.length

  return (
    <>
      <PageHeader title="ร้านของฉัน" />

      <p className="surface mb-8 flex items-center gap-3 px-5 py-4 text-[17px]" role="status">
        <Store className="size-6 shrink-0 text-link" aria-hidden="true" />
        <span>ร้านที่เหมาะกับคุณตอนนี้ <strong className="figure text-[22px]">{recCount}</strong> ร้าน<span className="block text-[14px] text-muted-foreground">อัปเดตทันทีเมื่อแก้ข้อมูลด้านล่าง</span></span>
      </p>

      <div className="flex flex-col gap-12">
        {/* Section 1: ข้อมูลร้าน */}
        <section aria-labelledby="section-profile" className="border-t border-border pt-8">
          <h2 id="section-profile" className="mb-4 text-[22px] font-bold text-ink">
            ข้อมูลร้านและเวลาทำการ
          </h2>
          <FieldGroup>
            <Field>
              <FieldLabel>ชื่อร้าน</FieldLabel>
              <p className="text-[17px] font-medium text-foreground">{me.name}</p>
              <FieldDescription>{me.category} · ร้านตัวอย่างสำหรับสาธิต</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="area">ย่านที่ให้บริการ</FieldLabel>
              <Select value={me.neighborhood} onValueChange={(v) => patch({ neighborhood: v })}>
                <SelectTrigger id="area" className="w-full text-[17px] data-[size=default]:h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>{Object.values(AREAS).map((a) => <SelectItem key={a} value={a} className="min-h-11 text-[17px]">{a}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <FieldSet>
              <FieldLegend variant="label">เวลาเปิดขาย</FieldLegend>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="open">เปิดร้าน</FieldLabel>
                  <TimeSelect id="open" value={me.operatingHours.open} onChange={(v) => patch({ operatingHours: { ...me.operatingHours, open: v } })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="close">ปิดร้าน</FieldLabel>
                  <TimeSelect id="close" value={me.operatingHours.close} onChange={(v) => patch({ operatingHours: { ...me.operatingHours, close: v } })} />
                </Field>
              </div>
            </FieldSet>
            <FieldSet data-invalid={me.menuCategories.length === 0}>
              <FieldLegend variant="label">หมวดเมนูที่ขาย</FieldLegend>
              <ToggleGroup
                type="multiple"
                variant="outline"
                spacing={2}
                className="flex flex-wrap"
                value={me.menuCategories}
                onValueChange={(v) => patch({ menuCategories: v })}
                aria-label="หมวดเมนูที่ขาย"
              >
                {MENU_CATEGORY_OPTIONS.map((c) => (
                  <ToggleGroupItem key={c} value={c} className="h-11 gap-1.5 px-4 text-[15px] data-[state=on]:border-ink data-[state=on]:bg-brand data-[state=on]:font-bold data-[state=on]:text-ink">
                    {me.menuCategories.includes(c) && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                    {c}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {me.menuCategories.length === 0 && <FieldError>เลือกอย่างน้อย 1 หมวด เพื่อให้เราจับคู่ร้านได้</FieldError>}
            </FieldSet>
          </FieldGroup>
        </section>

        {/* Section 2: ความพร้อมและความสนใจ */}
        <section aria-labelledby="section-readiness" className="border-t border-border pt-8">
          <h2 id="section-readiness" className="mb-4 text-[22px] font-bold text-ink">
            ความพร้อมและความสนใจ
          </h2>
          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">ความพร้อมของร้าน</FieldLegend>
              <RadioGroup value={me.readinessStatus} onValueChange={(v) => patch({ readinessStatus: v as ReadinessStatus })}>
                {(Object.keys(READINESS_LABEL) as ReadinessStatus[]).map((k) => (
                  <div key={k} className="flex min-h-11 items-center gap-3">
                    <RadioGroupItem value={k} id={`r-${k}`} aria-label={READINESS_LABEL[k]} className="size-5" />
                    <Label htmlFor={`r-${k}`} className="flex min-h-11 flex-1 items-center text-[17px] font-normal">{READINESS_LABEL[k]}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">ความสนใจร่วมกิจกรรมกับร้านอื่น</FieldLegend>
              <RadioGroup value={me.participationPreference} onValueChange={(v) => patch({ participationPreference: v as ParticipationPreference })}>
                {(Object.keys(PREFERENCE_LABEL) as ParticipationPreference[]).map((k) => (
                  <div key={k} className="flex min-h-11 items-center gap-3">
                    <RadioGroupItem value={k} id={`p-${k}`} aria-label={PREFERENCE_LABEL[k]} className="size-5" />
                    <Label htmlFor={`p-${k}`} className="flex min-h-11 flex-1 items-center text-[17px] font-normal">{PREFERENCE_LABEL[k]}</Label>
                  </div>
                ))}
              </RadioGroup>
              <FieldDescription>เลือก "ยังไม่ต้องการตอนนี้" เราจะไม่แนะนำแผนใหม่ ไม่มีผลต่อการขายปกติ</FieldDescription>
            </FieldSet>
          </FieldGroup>
        </section>

        {/* Section 3: ต้นทุนโดยประมาณ */}
        <section aria-labelledby="section-cost" className="border-t border-border pt-8">
          <h2 id="section-cost" className="mb-2 text-[22px] font-bold text-ink">
            ต้นทุนโดยประมาณ (ไม่บังคับ)
          </h2>
          <p className="mb-4 max-w-[64ch] text-[15px] text-muted-foreground">
            ใช้ประเมินกำไรในหน้า "ผลลัพธ์" เท่านั้น เก็บในเครื่องนี้ ไม่แชร์ให้ร้านคู่ค้า
          </p>
          <Field data-invalid={costInvalid}>
            <FieldLabel htmlFor="cost">ต้นทุนวัตถุดิบและบรรจุภัณฑ์ คิดเป็นกี่ % ของยอดขาย</FieldLabel>
            <div className="flex items-center gap-3">
              <Input
                id="cost"
                inputMode="decimal"
                className="h-12 max-w-40 text-[17px] tabular-nums"
                aria-invalid={costInvalid}
                placeholder="เช่น 38"
                value={costText}
                onChange={(e) => {
                  setCostText(e.target.value)
                  const n = e.target.value === '' ? null : Number(e.target.value)
                  if (n === null) dispatch({ type: 'setVariableCostPct', value: null })
                  else if (!Number.isNaN(n) && n >= 0 && n <= 100) dispatch({ type: 'setVariableCostPct', value: n })
                }}
              />
              <span className="font-semibold">%</span>
              {costText !== '' && <Button variant="outline" className="h-11 text-[15px]" onClick={() => { setCostText(''); dispatch({ type: 'setVariableCostPct', value: null }) }}>ล้างค่า</Button>}
            </div>
            {costInvalid && <FieldError>ใส่ตัวเลข 0 ถึง 100</FieldError>}
          </Field>
        </section>

        <p className="flex flex-wrap items-center gap-x-3 border-t border-border pt-8 text-[17px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-link"><Check className="size-4" aria-hidden="true" />การขายปกติ: ปกติ</span>
          <span className="text-muted-foreground">การปฏิเสธหรือยกเลิกแผนของ GemBond ไม่เปลี่ยนสถานะการขายของร้านคุณ</span>
        </p>
      </div>
    </>
  )
}
