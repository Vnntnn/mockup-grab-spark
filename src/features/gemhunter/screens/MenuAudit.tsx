import { useRef } from 'react'
import { useKept } from '@/i18n/keep'
import { ArrowRight, Check, CheckCheck, CircleDashed, History, Lock, Pencil, ShieldCheck, Sparkles, Store, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Disclose, SegMeter } from '../components/ghui'
import { PhaseBadge } from '../components/PhaseBadge'
import { PhotoTile } from '../components/hunter/PhotoTile'
import { useHunterAction } from '../components/useHunterAction'
import { merchantOf } from '../data/seed'
import { apply, approvableItems, isMenuAuditComplete, MAX_TITLE_LENGTH, validateEditedTitle, validateSuggestion } from '../domain'
import type { AttributeSource, MenuAuditItem, MenuHistoryEntry } from '../domain'
import { useGemHunter } from '../store'
import { baht } from '@/lib/format'
import { cn } from '@/lib/utils'

const SOURCE_LABEL: Record<AttributeSource, string> = {
  shop_profile: 'จากโปรไฟล์ร้าน',
  merchant_confirmed: 'ร้านยืนยันแล้ว',
}

const ACTION_LABEL: Record<MenuHistoryEntry['action'], string> = {
  accepted: 'ใช้ชื่อที่แนะนำ',
  edited: 'แก้ชื่อเอง',
  kept: 'ใช้ชื่อเดิม',
}

const len = (s: string) => [...s.trim()].length

/** One tappable name. The whole card is the button: the tick fills and the card takes the wash when it is the chosen one. */
function Option({
  selected,
  active,
  disabled,
  Icon,
  label,
  title,
  muted,
  ariaLabel,
  onClick,
  buttonRef,
}: {
  selected: boolean
  active?: boolean
  disabled?: boolean
  Icon: LucideIcon
  label: string
  title: string
  muted?: boolean
  ariaLabel: string
  onClick: () => void
  buttonRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button ref={buttonRef} type="button" className="gh-option" data-active={active || undefined} aria-pressed={selected} aria-label={ariaLabel} disabled={disabled} onClick={onClick}>
      <span className="flex items-center gap-2 text-[14px] leading-tight font-medium text-muted-foreground">
        <span className="gh-tick" aria-hidden="true">
          {selected ? <Check className="pop size-3.5" strokeWidth={3.5} /> : <Icon className="size-3.5 text-muted-foreground" />}
        </span>
        <span className={cn(selected && 'text-foreground')}>{label}</span>
      </span>
      <span className={cn('block text-[17px] leading-snug', muted ? 'font-medium text-muted-foreground' : 'font-semibold')}>{title}</span>
    </button>
  )
}

function MenuItemCard({
  item,
  price,
  editable,
  editing,
  draft,
  onDraft,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onAccept,
  onKeep,
}: {
  item: MenuAuditItem
  price?: number
  editable: boolean
  editing: boolean
  draft: string
  onDraft: (v: string) => void
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onAccept: () => void
  onKeep: () => void
}) {
  const suggestion = validateSuggestion(item)
  const draftCheck = validateEditedTitle(draft)
  const count = len(draft)
  const over = count > MAX_TITLE_LENGTH
  const inputId = `edit-${item.id}`
  const msgId = `edit-msg-${item.id}`
  const editBtn = useRef<HTMLButtonElement>(null)
  // the edit form disappears on save/cancel: hand focus back to the button that opened it instead of dropping it on <body>
  const closeEdit = (action: () => void) => {
    action()
    editBtn.current?.focus()
  }
  const decided = item.decision !== 'pending'
  const verifiedList = item.suggestionAttributes.filter((a) => item.verifiedAttributes.includes(a) && item.attributeSource[a] !== undefined)
  const unverifiedList = item.suggestionAttributes.filter((a) => !(item.verifiedAttributes.includes(a) && item.attributeSource[a] !== undefined))

  return (
    <li className="gh-card surface overflow-hidden md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
      <PhotoTile hue={47} label="จานอาหารถ่ายจากด้านบน" dish={item.menuItemName} chip={false} className="h-36 rounded-none md:h-full" imageClassName="aspect-auto h-full" />

      <div className="flex min-w-0 flex-col gap-3 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[22px] leading-snug font-bold">{item.menuItemName}</h2>
            {price !== undefined && (
              <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
                <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                {baht(price)} · ราคาคงเดิม
              </p>
            )}
          </div>
          <p className={cn('inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold', decided ? 'text-link' : 'text-muted-foreground')}>
            {decided ? <Check className="pop size-4" strokeWidth={3} aria-hidden="true" /> : <CircleDashed className="size-4" aria-hidden="true" />}
            {decided ? 'เลือกแล้ว' : 'รอคุณเลือก'}
          </p>
        </div>
        {editable ? (
          <>
            <div role="group" aria-label={`เลือกชื่อสำหรับ ${item.menuItemName}`} className="grid gap-2.5 lg:grid-cols-3">
              <Option Icon={History} selected={item.decision === 'kept'} label="ชื่อเดิม" title={item.currentTitle} ariaLabel={`ใช้ชื่อเดิม: ${item.menuItemName}`} onClick={onKeep} />
              <Option Icon={Sparkles} selected={item.decision === 'accepted'} disabled={!suggestion.ok} label="ชื่อที่แนะนำ" title={item.suggestedTitle} ariaLabel={`ใช้ชื่อที่แนะนำ: ${item.menuItemName}`} onClick={onAccept} />
              <Option
                buttonRef={editBtn}
                Icon={Pencil}
                selected={item.decision === 'edited'}
                active={editing}
                label="ตั้งชื่อเอง"
                title={item.decision === 'edited' && item.editedTitle ? item.editedTitle : 'พิมพ์ชื่อที่ต้องการ'}
                muted={!(item.decision === 'edited' && item.editedTitle)}
                ariaLabel={`แก้ไขชื่อ: ${item.menuItemName}`}
                onClick={onEdit}
              />
            </div>
            {!suggestion.ok && (
              <p className="flex items-start gap-2 text-[15px] text-destructive" role="status">
                <TriangleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
                {suggestion.reason} จึงเลือกชื่อนี้ไม่ได้
              </p>
            )}

            {editing && (
              <form
                className="gh-ok flex flex-col gap-2 rounded-xl border-2 border-foreground bg-card p-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  closeEdit(onSaveEdit)
                }}
              >
                <Label htmlFor={inputId} className="text-[17px]">
                  ชื่อเมนูที่คุณต้องการใช้
                </Label>
                <Input
                  id={inputId}
                  value={draft}
                  onChange={(e) => onDraft(e.target.value)}
                  aria-invalid={!draftCheck.ok && draft.length > 0}
                  aria-describedby={msgId}
                  className="h-12 bg-card px-3 text-[17px]"
                  autoFocus
                  onKeyDown={(e) => {
                    // Escape cancels the edit (nothing is saved)
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      closeEdit(onCancelEdit)
                    }
                  }}
                />
                <div id={msgId} role="status" aria-live="polite" className="flex flex-wrap items-start justify-between gap-2 text-[15px]">
                  <p className={cn('flex items-center gap-1.5', !draftCheck.ok ? 'text-destructive' : 'text-muted-foreground')}>
                    {!draftCheck.ok && <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />}
                    {draftCheck.ok ? 'ชื่อนี้จะขึ้นหน้าร้านหลังคุณกดบันทึก' : draftCheck.reason}
                  </p>
                  <p aria-live="off" className={cn('tabular-nums', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                    {count}/{MAX_TITLE_LENGTH} ตัวอักษร
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" className="h-12 px-6 text-[17px]" disabled={!draftCheck.ok}>
                    บันทึกชื่อนี้
                  </Button>
                  <Button type="button" variant="outline" className="h-12 px-6 text-[17px]" onClick={() => closeEdit(onCancelEdit)}>
                    ยกเลิก
                  </Button>
                </div>
              </form>
            )}
          </>
        ) : (
          <p className="flex items-start gap-3 text-[17px]">
            <Store className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>
              <span className="block text-[14px] text-muted-foreground">ชื่อที่ลูกค้าเห็น</span>
              <span className="font-semibold">{item.publishedTitle}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                แก้ได้เฉพาะช่วงตรวจชื่อเมนู
              </span>
            </span>
          </p>
        )}

        {unverifiedList.length > 0 && (
          <ul className="flex flex-col gap-1" aria-label={`ข้อมูลที่ยังไม่ยืนยันของ ${item.menuItemName}`}>
            {unverifiedList.map((a) => (
              <li key={a} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-destructive">
                <TriangleAlert className="size-4" aria-hidden="true" />
                {a}
                <span className="text-[14px]">(ยังไม่ยืนยัน)</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-x-6">
          {verifiedList.length > 0 && (
            <Disclose
              className="min-w-0"
              label={`ข้อมูลในชื่อที่แนะนำ ยืนยันแล้ว ${verifiedList.length} ข้อ`}
              icon={<ShieldCheck className="size-4 shrink-0 text-link" aria-hidden="true" />}
              triggerClassName="text-[14px] font-medium text-muted-foreground"
            >
              <ul className="flex flex-col gap-1 pb-2" aria-label={`ข้อมูลที่ใช้ในชื่อที่แนะนำของ ${item.menuItemName}`}>
                {verifiedList.map((a) => (
                  <li key={a} className="inline-flex items-center gap-1.5 text-[15px]">
                    <Check className="size-4 text-link" strokeWidth={3} aria-hidden="true" />
                    {a}
                    <span className="text-[14px] text-muted-foreground">({SOURCE_LABEL[item.attributeSource[a]!]})</span>
                  </li>
                ))}
              </ul>
            </Disclose>
          )}
          {item.history.length > 0 && (
            <Disclose className="min-w-0" label={`ประวัติที่คุณเลือก (${item.history.length})`} icon={<History className="size-4 shrink-0" aria-hidden="true" />} triggerClassName="text-[14px] font-medium text-muted-foreground">
              <ol className="flex flex-col gap-1.5 pb-2 text-[15px]" aria-label={`ประวัติของ ${item.menuItemName}`}>
                {item.history.map((h, i) => (
                  <li key={`${i}-${h.to}`} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{ACTION_LABEL[h.action]}:</span>
                    {h.from === h.to ? (
                      <span>คงชื่อ “{h.to}”</span>
                    ) : (
                      <span className="inline-flex flex-wrap items-center gap-x-2">
                        “{h.from}”
                        <ArrowRight className="size-4 shrink-0" aria-label="เปลี่ยนเป็น" />“{h.to}”
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Disclose>
          )}
        </div>
      </div>
    </li>
  )
}

export function MenuAuditScreen() {
  const { state } = useGemHunter()
  const { campaign } = state
  const run = useHunterAction()
  const navigate = useNavigate()
  const [editingId, setEditingId] = useKept<string | null>('menu:editing', null)
  const [draft, setDraft] = useKept('menu:draft', '')

  const merchant = merchantOf(campaign.merchantId)
  const priceOf = (name: string) => merchant?.sampleMenu.find((m) => m.name === name)?.priceBaht
  const items = campaign.menuAudit.items
  const editable = campaign.phase === 'menu_review'
  const pending = items.filter((i) => i.decision === 'pending')
  const decidedCount = items.length - pending.length
  const complete = isMenuAuditComplete(campaign.menuAudit)
  const start = apply(state, { type: 'startCampaign' })
  const canStart = editable && start.ok
  const approvable = approvableItems(campaign.menuAudit)
  const beyondReview = campaign.phase !== 'eligibility_check' && campaign.phase !== 'menu_review' && campaign.phase !== 'paused' && campaign.phase !== 'cancelled'

  const beginEdit = (item: MenuAuditItem) => {
    setEditingId(item.id)
    setDraft(item.decision === 'edited' && item.editedTitle ? item.editedTitle : item.suggestedTitle)
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="max-w-[40ch]">
          <h1 className="text-[30px] leading-tight font-bold tracking-tight md:text-[34px]">เลือกชื่อเมนู</h1>
          <p className="mt-2 flex items-start gap-2 text-[17px] leading-snug text-muted-foreground">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden="true" />
            ราคาไม่เปลี่ยน ยังไม่มีอะไรขึ้นหน้าร้านจนกว่าคุณเลือก
          </p>
        </div>

        {items.length > 0 && editable && (
          <div className="flex flex-col gap-3 md:w-80">
            <p role="status" className="flex items-baseline justify-between gap-3">
              <span className="sr-only">
                เลือกแล้ว {decidedCount} จาก {items.length} รายการ
              </span>
              <span aria-hidden="true" className="text-[17px] font-semibold">
                เลือกแล้ว
              </span>
              <span aria-hidden="true" className="figure text-[36px] leading-none">
                {decidedCount}
                <span className="text-[22px] text-muted-foreground">/{items.length}</span>
              </span>
            </p>
            <SegMeter value={decidedCount} total={items.length} />
            {approvable.length > 0 && (
              <Button
                variant="outline"
                className="h-auto min-h-12 gap-2 px-5 py-2 text-[17px] whitespace-normal"
                onClick={() => {
                  const n = approvable.length
                  if (run({ type: 'approveAllSuggestions' }, `ใช้ชื่อที่แนะนำแล้ว ${n} รายการ คุณเปลี่ยนใจรายเมนูได้`)) setEditingId(null)
                }}
              >
                <CheckCheck aria-hidden="true" />
                ใช้ชื่อที่แนะนำกับเมนูที่เหลือ ({approvable.length})
              </Button>
            )}
          </div>
        )}
      </header>

      {campaign.phase === 'eligibility_check' && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-[17px]">คุณยังไม่ได้เริ่มตรวจเมนู เริ่มได้จากหน้าคำเชิญ</p>
          <Button asChild className="h-12 text-[17px]">
            <Link to="/gemhunter">ไปที่หน้าคำเชิญ</Link>
          </Button>
        </div>
      )}
      {(campaign.phase === 'paused' || campaign.phase === 'cancelled') && (
        <div className="mb-6">
          <PhaseBadge phase={campaign.phase} />
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-[17px] text-muted-foreground">ไม่พบเมนูตัวอย่างของร้านนี้ ลองรีเซ็ตเดโมจากเครื่องมือสาธิต</p>
      ) : (
        <ul className="flex flex-col gap-4" aria-label="เมนูที่ต้องเลือกชื่อ">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              price={priceOf(item.menuItemName)}
              editable={editable}
              editing={editingId === item.id}
              draft={draft}
              onDraft={setDraft}
              onEdit={() => beginEdit(item)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                if (run({ type: 'editMenu', itemId: item.id, title: draft }, 'บันทึกชื่อที่คุณแก้แล้ว')) setEditingId(null)
              }}
              onAccept={() => {
                if (run({ type: 'decideMenu', itemId: item.id, decision: 'accepted' }, 'ใช้ชื่อที่แนะนำแล้ว')) setEditingId(null)
              }}
              onKeep={() => {
                if (run({ type: 'decideMenu', itemId: item.id, decision: 'kept' }, 'ใช้ชื่อเดิมต่อไป')) setEditingId(null)
              }}
            />
          ))}
        </ul>
      )}

      {editable && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-lift)] md:-mx-8 md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 md:gap-6">
            <p id="start-note" className="flex min-w-0 items-center gap-2.5 text-[17px] leading-snug" role="status">
              {complete ? <CheckCheck className="size-5 shrink-0 text-link" aria-hidden="true" /> : <CircleDashed className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
              <span>{complete ? 'เลือกครบแล้ว ลูกค้าจะเห็นเฉพาะชื่อที่คุณเลือก' : `เหลืออีก ${pending.length} เมนู`}</span>
            </p>
            <Button
              className="h-14 shrink-0 px-6 text-[17px] md:px-8"
              disabled={!canStart}
              aria-describedby="start-note"
              onClick={() => {
                if (run({ type: 'startCampaign' }, 'เริ่มแคมเปญแล้ว (จำลอง) ลูกค้าจะเห็นเฉพาะชื่อที่คุณเลือก')) navigate('/gemhunter/discover')
              }}
            >
              เริ่มแคมเปญ
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
      {beyondReview && (
        <p className="mt-8 flex flex-col gap-3 text-[17px] sm:flex-row sm:items-center sm:gap-5">
          แคมเปญเริ่มไปแล้ว
          <Button asChild className="h-12 self-start px-6 text-[17px]">
            <Link to="/gemhunter/discover">
              ดูหน้าที่ลูกค้าเห็น
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </p>
      )}
    </>
  )
}
