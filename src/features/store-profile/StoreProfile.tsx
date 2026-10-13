import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Panel } from '@/components/Panel'
import { ResetButton } from '@/components/layout/ResetButton'
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

export function StoreProfile() {
  const { state, dispatch } = useApp()
  const me = selfOf(state)
  const patch = (p: Parameters<typeof dispatch>[0] extends infer A ? A extends { type: 'updateMerchant'; patch: infer P } ? P : never : never) => dispatch({ type: 'updateMerchant', patch: p })
  const [costText, setCostText] = useState(state.variableCostPct === null ? '' : String(state.variableCostPct))
  const costNum = costText === '' ? null : Number(costText)
  const costInvalid = costNum !== null && (Number.isNaN(costNum) || costNum < 0 || costNum > 100)
  const recCount = matching(state).recommendations.length

  return (
    <>
      <PageHeader title="ร้านของฉัน" lead="ข้อมูลสั้น ๆ ที่ใช้เลือกร้านที่เหมาะกับคุณ แก้แล้วบันทึกให้อัตโนมัติ" />
      <p className="mb-6 rounded-xl bg-sage p-3.5 text-[15px]">ตอนนี้มีร้านที่แนะนำให้คุณ {recCount} ร้าน จะเปลี่ยนไปตามข้อมูลด้านล่าง</p>

      <div className="flex flex-col gap-6">
        <Panel title="ข้อมูลร้าน">
          <FieldGroup>
            <Field>
              <FieldLabel>ชื่อร้าน</FieldLabel>
              <p className="text-[17px]">{me.name}</p>
              <FieldDescription>{me.category} · ร้านตัวอย่างสำหรับสาธิต</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="area">ย่านที่ให้บริการ</FieldLabel>
              <Select value={me.neighborhood} onValueChange={(v) => patch({ neighborhood: v })}>
                <SelectTrigger id="area" className="w-full text-[16px] data-[size=default]:h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>{Object.values(AREAS).map((a) => <SelectItem key={a} value={a} className="min-h-11 text-[16px]">{a}</SelectItem>)}</SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <FieldSet>
              <FieldLegend variant="label">เวลาเปิดขาย</FieldLegend>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="open">เปิด</FieldLabel>
                  <Input id="open" type="time" className="h-12 text-[16px]" value={me.operatingHours.open} onChange={(e) => e.target.value && patch({ operatingHours: { ...me.operatingHours, open: e.target.value } })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="close">ปิด</FieldLabel>
                  <Input id="close" type="time" className="h-12 text-[16px]" value={me.operatingHours.close} onChange={(e) => e.target.value && patch({ operatingHours: { ...me.operatingHours, close: e.target.value } })} />
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
                {MENU_CATEGORY_OPTIONS.map((c) => <ToggleGroupItem key={c} value={c} className="h-11 px-4 text-[15px]">{c}</ToggleGroupItem>)}
              </ToggleGroup>
              {me.menuCategories.length === 0 && <FieldError>เลือกอย่างน้อย 1 หมวด เพื่อให้เราจับคู่ร้านได้</FieldError>}
            </FieldSet>
          </FieldGroup>
        </Panel>

        <Panel title="ความพร้อมและความสนใจ">
          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">ความพร้อมของร้าน</FieldLegend>
              <RadioGroup value={me.readinessStatus} onValueChange={(v) => patch({ readinessStatus: v as ReadinessStatus })}>
                {(Object.keys(READINESS_LABEL) as ReadinessStatus[]).map((k) => (
                  <div key={k} className="flex min-h-11 items-center gap-3">
                    <RadioGroupItem value={k} id={`r-${k}`} className="size-5" />
                    <Label htmlFor={`r-${k}`} className="flex min-h-11 flex-1 items-center text-[16px] font-normal">{READINESS_LABEL[k]}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">ความสนใจร่วมกิจกรรมกับร้านอื่น</FieldLegend>
              <RadioGroup value={me.participationPreference} onValueChange={(v) => patch({ participationPreference: v as ParticipationPreference })}>
                {(Object.keys(PREFERENCE_LABEL) as ParticipationPreference[]).map((k) => (
                  <div key={k} className="flex min-h-11 items-center gap-3">
                    <RadioGroupItem value={k} id={`p-${k}`} className="size-5" />
                    <Label htmlFor={`p-${k}`} className="flex min-h-11 flex-1 items-center text-[16px] font-normal">{PREFERENCE_LABEL[k]}</Label>
                  </div>
                ))}
              </RadioGroup>
              <FieldDescription>เลือก "ยังไม่ต้องการตอนนี้" แล้วเราจะไม่แนะนำแผนใหม่ให้ ไม่มีผลต่อการขายปกติ</FieldDescription>
            </FieldSet>
          </FieldGroup>
        </Panel>

        <Panel title="ข้อกำหนดที่ GemBond ตั้งให้ร้านคุณเสมอ" icon={<Lock />}>
          <ul className="flex flex-col gap-2">
            {['ไม่บังคับให้ลดราคา', 'ไม่บังคับแบ่งยอดขายให้ร้านอื่น', 'ไม่มีค่าใช้จ่ายที่ไม่บอกล่วงหน้า', 'เปลี่ยนเงื่อนไขสำคัญต้องขอยืนยันใหม่'].map((t) => (
              <li key={t} className="flex items-start gap-3"><ShieldCheck className="mt-1 size-5 shrink-0 text-success" aria-hidden="true" />{t}</li>
            ))}
          </ul>
          <p className="mt-3 text-[15px] text-muted-foreground">ข้อเหล่านี้ใช้กับทุกแผน ปรับลดไม่ได้ในต้นแบบนี้</p>
        </Panel>

        <Panel title="ต้นทุนโดยประมาณ (ไม่บังคับ)">
          <Field data-invalid={costInvalid}>
            <FieldLabel htmlFor="cost">ต้นทุนวัตถุดิบและบรรจุภัณฑ์ คิดเป็นกี่ % ของยอดขาย</FieldLabel>
            <div className="flex items-center gap-3">
              <Input
                id="cost"
                inputMode="decimal"
                className="h-12 max-w-40 text-[16px]"
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
              <span>%</span>
              {costText !== '' && <Button variant="outline" className="h-11 text-[15px]" onClick={() => { setCostText(''); dispatch({ type: 'setVariableCostPct', value: null }) }}>ล้างค่า</Button>}
            </div>
            {costInvalid && <FieldError>ใส่ตัวเลข 0 ถึง 100</FieldError>}
            <FieldDescription>
              ใช้คำนวณกำไรโดยประมาณที่หน้า "ผลลัพธ์" เท่านั้น เก็บไว้ในเครื่องนี้ และไม่แชร์ให้ร้านคู่ค้า ถ้าไม่ใส่ เราจะบอกว่า "ข้อมูลยังไม่เพียงพอสำหรับการประเมินกำไร" แทนการเดา
            </FieldDescription>
          </Field>
        </Panel>

        <Panel title="สถานะการขายของร้านคุณ" icon={<ShieldCheck />}>
          <p>การขายตามปกติ: <strong>ปกติ</strong></p>
          <p className="mt-1 text-[15px] text-muted-foreground">การปฏิเสธหรือยกเลิกแผนของ GemBond ไม่เปลี่ยนสถานะนี้ และไม่ลดสิทธิการขายตามปกติของร้านคุณ</p>
        </Panel>

        <div><ResetButton /></div>
      </div>
    </>
  )
}
