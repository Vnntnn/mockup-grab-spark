import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Ban, Check, Clock, FlaskConical, Hand, Info, Star, Store, ThumbsDown, ThumbsUp, X, XCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { rewardFor, type HunterSubmission } from '../../domain'
import { useGemHunter } from '../../store'
import { PhotoTile } from './PhotoTile'
import { StarRating } from './StarRating'
import { bankGroup } from './phase'
import { useRun } from './useRun'

/** What the corner tag on the photo says. Always an icon and words, never colour alone. */
function stateTag(s: HunterSubmission): { Icon: LucideIcon; text: string; strong?: boolean } {
  if (s.moderation === 'pending') return { Icon: Clock, text: 'รอตรวจ' }
  if (s.moderation === 'rejected') return { Icon: XCircle, text: 'ไม่ผ่านตรวจ' }
  if (!s.photo.imageUseConsent) return { Icon: Ban, text: 'ใช้รูปไม่ได้' }
  if (s.photo.merchantDecision === 'approved') return { Icon: Check, text: 'ใช้แล้ว' }
  if (s.photo.merchantDecision === 'rejected') return { Icon: ThumbsDown, text: 'ไม่ใช้' }
  return { Icon: Hand, text: 'รอคุณเลือก', strong: true }
}

function Tag({ Icon, text, strong }: { Icon: LucideIcon; text: string; strong?: boolean }) {
  return (
    <span className={cn('absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] leading-5 font-semibold shadow-(--shadow-raise)', strong ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground')}>
      <Icon className="size-4" aria-hidden="true" />
      {text}
    </span>
  )
}

/** One submission in the merchant's photo bank. `open` is false when the campaign phase does not allow moderation or photo decisions. */
export function SubmissionCard({ s, open, className }: { s: HunterSubmission; open: boolean; className?: string }) {
  const run = useRun()
  const { state } = useGemHunter()
  const uid = useId()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removedNote, setRemovedNote] = useState<string | null>(null)
  const isCover = state.campaign.coverPhotoId === s.photo.id
  const reward = rewardFor(s)
  const group = bankGroup(s)

  const canDecide = s.moderation === 'approved' && s.photo.imageUseConsent
  const noDecideWhy = s.moderation === 'rejected' ? 'รูปต้องผ่านการตรวจสอบก่อน รายการนี้ไม่ผ่าน จึงยังใช้รูปนี้ไม่ได้' : 'ผู้ส่งยังไม่ได้ยินยอมให้ใช้รูปนี้'
  const label = `${s.menuItemName} โดย ${s.hunterId}`
  const why = `${uid}-why`
  const decision = s.photo.merchantDecision
  const tag = stateTag(s)

  const decide = (d: 'approved' | 'rejected') => {
    // The reducer clears storefront and cover when a photo is rejected. Remember what was removed so the merchant is told, not surprised.
    const wasCover = isCover
    const removed = d === 'rejected' && (wasCover || s.photo.onStorefront)
    const r = run(
      { type: 'decidePhoto', submissionId: s.id, decision: d },
      d === 'approved' ? 'อนุมัติรูปแล้ว เลือกใช้เป็นรูปหน้าร้านได้' : removed ? 'บันทึกแล้ว จะไม่ใช้รูปนี้ และเอารูปออกจากหน้าร้านแล้ว' : 'บันทึกแล้ว จะไม่ใช้รูปนี้',
    )
    if (r.ok) {
      setConfirmRemove(false)
      setRemovedNote(removed ? (wasCover ? 'รูปนี้ถูกเอาออกจากหน้าร้านและไม่เป็นรูปปกแล้ว คุณเลือกรูปปกใหม่ได้จากรูปอื่นที่ใช้หน้าร้านอยู่' : 'รูปนี้ถูกเอาออกจากหน้าร้านแล้ว') : null)
    }
  }

  const heading = (
    <div>
      <p className="text-[22px] leading-snug font-bold">{s.menuItemName}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[14px] text-muted-foreground">
        <StarRating value={s.rating} />
        <span>
          โดย {s.hunterId} · {s.submittedAt}
        </span>
      </p>
    </div>
  )

  /* waiting on the platform: nothing for the merchant to do, so it is a quiet row, not a full card */
  if (group === 'wait') {
    return (
      <li className={cn('gh-card surface flex gap-3 p-3 md:gap-4 md:p-4', className)}>
        <PhotoTile hue={s.photo.hue} label={s.photo.label} dish={s.menuItemName} chipAt="bottom" className="w-32 shrink-0 self-start rounded-xl md:w-44" imageClassName="aspect-[4/3]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {heading}
          <p className="text-[17px] leading-snug">“{s.reviewText}”</p>
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            รอตรวจ
            <span className="font-normal text-muted-foreground">ยังเลือกรูปนี้ไม่ได้</span>
          </p>
          {open && <DemoModeration id={s.id} menuItemName={s.menuItemName} hunterId={s.hunterId} />}
        </div>
      </li>
    )
  }

  const reasonBlock = (children: ReactNode) => <p className="text-[15px] text-muted-foreground">{children}</p>

  return (
    <li className={cn('gh-card surface flex flex-col overflow-hidden', group === 'mine' && 'border-foreground', className)}>
      <PhotoTile hue={s.photo.hue} label={s.photo.label} dish={s.menuItemName} chipAt="bottom" imageClassName="aspect-[16/10]">
        <Tag {...tag} />
        {isCover && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[14px] leading-5 font-semibold text-background">
            <Star className="size-4 fill-current" aria-hidden="true" />
            รูปปกของร้าน
          </span>
        )}
      </PhotoTile>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        {heading}
        <p className="text-[17px] leading-snug">“{s.reviewText}”</p>

        {s.moderation === 'rejected' && (
          <div className="flex flex-col gap-1.5 rounded-xl bg-danger-soft p-3 text-[15px]">
            <p>
              <strong className="font-semibold">ไม่ผ่านการตรวจสอบ:</strong> {s.moderationNote ?? 'ไม่ระบุเหตุผล'} รีวิวนี้จะไม่ถูกนับ
            </p>
            {!reward.eligible && <p className="text-[14px] text-muted-foreground">ไม่ได้รับคูปองตัวอย่างเพราะไม่ผ่านการตรวจเนื้อหา (ไม่เกี่ยวกับจำนวนดาว)</p>}
          </div>
        )}
        {s.moderation !== 'rejected' && !reward.eligible && reasonBlock('ไม่ได้รับคูปองตัวอย่างเพราะไม่ผ่านการตรวจเนื้อหา (ไม่เกี่ยวกับจำนวนดาว)')}
        {s.moderation === 'approved' && s.moderationNote && <p className="text-[14px] text-muted-foreground">หมายเหตุจากการตรวจสอบ: {s.moderationNote}</p>}

        {s.moderation !== 'pending' && !canDecide && (
          <p id={why} className="text-[15px] text-muted-foreground">
            {noDecideWhy}
          </p>
        )}

        {canDecide && decision === 'pending' && (
          <div className="mt-auto flex flex-col gap-2 pt-1">
            {!open && <p className="text-[15px] text-muted-foreground">ตอนนี้แคมเปญไม่เปิดให้เลือกรูป</p>}
            <div className="flex gap-2">
              <Button className="h-12 flex-1 px-4 text-[17px]" disabled={!open} aria-label={`ใช้รูปนี้ได้ (${label})`} onClick={() => decide('approved')}>
                <ThumbsUp data-icon="inline-start" />
                ใช้รูปนี้
              </Button>
              <Button variant="outline" className="h-12 px-5 text-[17px]" disabled={!open} aria-label={`ไม่ใช้รูปนี้ (${label})`} onClick={() => decide('rejected')}>
                <ThumbsDown data-icon="inline-start" />
                ไม่ใช้
              </Button>
            </div>
          </div>
        )}

        {canDecide && decision === 'approved' && (
          <div className="mt-auto flex flex-col gap-1 border-t pt-2">
            <div className="flex min-h-11 items-center gap-3">
              <Switch
                id={`${uid}-sf`}
                checked={s.photo.onStorefront}
                disabled={!open}
                onCheckedChange={(on) => run({ type: 'setStorefront', submissionId: s.id, on }, on ? 'ตั้งเป็นรูปหน้าร้านแล้ว' : 'เอารูปนี้ออกจากหน้าร้านแล้ว')}
              />
              <Label htmlFor={`${uid}-sf`} className="min-h-11 flex-1 cursor-pointer gap-2 text-[17px] leading-snug">
                <Store className="size-4 shrink-0" aria-hidden="true" />
                {s.photo.onStorefront ? 'แสดงในหน้าร้านอยู่' : 'แสดงในหน้าร้าน'}
              </Label>
            </div>
            {s.photo.onStorefront && (
              <div className="gh-ok flex min-h-11 items-center gap-3">
                <Switch
                  id={`${uid}-cover`}
                  checked={isCover}
                  disabled={!open}
                  onCheckedChange={(on) => run({ type: 'setCover', submissionId: s.id, on }, on ? 'ตั้งเป็นรูปปกแล้ว (รูปปกมีได้รูปเดียว)' : 'เอารูปนี้ออกจากการเป็นรูปปกแล้ว')}
                />
                <Label htmlFor={`${uid}-cover`} className="min-h-11 flex-1 cursor-pointer gap-2 text-[17px] leading-snug">
                  <Star className="size-4 shrink-0" aria-hidden="true" />
                  <span>
                    ตั้งเป็นรูปปก <span className="text-[14px] font-normal text-muted-foreground">(มีได้รูปเดียว)</span>
                  </span>
                </Label>
              </div>
            )}
            {confirmRemove ? (
              <div className="gh-ok mt-1 flex flex-col gap-2 rounded-xl bg-secondary p-3">
                <p className="text-[15px]">รูปนี้อยู่หน้าร้านอยู่ ถ้าไม่ใช้ จะเอาออกจากหน้าร้านด้วย (ไม่กระทบรีวิวและการขายตามปกติ)</p>
                <div className="flex flex-wrap gap-2">
                  <Button className="h-11 px-4 text-[17px]" onClick={() => decide('rejected')}>
                    ยืนยันไม่ใช้รูปนี้
                  </Button>
                  <Button variant="outline" className="h-11 px-4 text-[17px]" onClick={() => setConfirmRemove(false)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="h-11 self-start px-2 text-[15px] text-muted-foreground underline underline-offset-4"
                disabled={!open}
                onClick={() => (s.photo.onStorefront ? setConfirmRemove(true) : decide('rejected'))}
              >
                เปลี่ยนใจ ไม่ใช้รูปนี้
              </Button>
            )}
          </div>
        )}

        {canDecide && decision === 'rejected' && (
          <div className="mt-auto pt-1">
            <Button variant="outline" className="h-11 px-4 text-[17px]" disabled={!open} onClick={() => decide('approved')}>
              <ThumbsUp data-icon="inline-start" />
              เปลี่ยนใจ ใช้รูปนี้
            </Button>
          </div>
        )}

        <div aria-live="polite">
          {removedNote && (
            <p className="gh-ok flex items-start gap-2 rounded-xl bg-secondary p-3 text-[15px]" role="status">
              <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
              {removedNote}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/** Demo-only stand-in for the platform's moderators. Dashed and labelled so it never reads as part of the real product. */
function DemoModeration({ id, menuItemName, hunterId }: { id: string; menuItemName: string; hunterId: string }) {
  const about = `${menuItemName} โดย ${hunterId}`
  const run = useRun()
  return (
    <div className="mt-auto flex flex-wrap items-center gap-x-1 gap-y-0 border-t border-dashed border-input pt-1 text-[14px] text-muted-foreground">
      <span className="inline-flex basis-full items-center gap-1.5 pt-1 font-medium">
        <FlaskConical className="size-4" aria-hidden="true" />
        เฉพาะสาธิต: ตัวแทนผู้ตรวจสอบของแพลตฟอร์ม
      </span>
      <Button variant="ghost" className="h-11 gap-1.5 px-3 text-[15px]" aria-label={`จำลอง: ผ่านการตรวจสอบ (${about})`} onClick={() => run({ type: 'moderate', submissionId: id, result: 'approved' }, 'จำลองแล้ว: ผ่านการตรวจสอบ')}>
        <Check className="size-4" aria-hidden="true" />
        จำลอง: ผ่าน
      </Button>
      <Button
        variant="ghost"
        className="h-11 gap-1.5 px-3 text-[15px]"
        aria-label={`จำลอง: ไม่ผ่าน รูปไม่ตรงเมนู (${about})`}
        onClick={() => run({ type: 'moderate', submissionId: id, result: 'rejected', note: 'รูปไม่ตรงกับเมนูที่รีวิว' }, 'จำลองแล้ว: ไม่ผ่านการตรวจสอบ')}
      >
        <X className="size-4" aria-hidden="true" />
        จำลอง: ไม่ผ่าน
      </Button>
    </div>
  )
}
