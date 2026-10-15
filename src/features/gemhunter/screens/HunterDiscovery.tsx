import { useState } from 'react'
import { Camera, Clock3, Info, MapPin, ShoppingBag, Sparkles, Star, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { baht } from '@/lib/format'
import { evidenceOf, fmtRating, storefrontPhotos, storefrontTitle, type GemHunterPhase } from '../domain'
import { merchantOf } from '../data/seed'
import { useGemHunter } from '../store'
import { EmptyNote, H2, VoucherTerms } from '../components/ghui'
import { PhotoTile } from '../components/hunter/PhotoTile'
import { PhoneMockupFrame } from '../components/PhoneMockupFrame'
import { isMissionLive } from '../components/hunter/phase'

/** Said to the presenter, not the customer: this page is only a preview until the campaign runs. */
function notLiveText(phase: GemHunterPhase): { text: string; to: string; cta: string } {
  if (phase === 'eligibility_check') return { text: 'แคมเปญยังไม่เริ่ม ลูกค้าจึงยังไม่เห็นภารกิจและคูปองนี้', to: '/gemhunter', cta: 'ไปที่หน้าคำเชิญ' }
  if (phase === 'menu_review') return { text: 'แคมเปญยังไม่เริ่ม ลูกค้าจึงยังไม่เห็นภารกิจและคูปองนี้', to: '/gemhunter/menu', cta: 'ไปเลือกชื่อเมนู' }
  if (phase === 'paused') return { text: 'แคมเปญพักอยู่ ร้านยังขายตามปกติผ่านช่องทางสั่งอาหารเดิม', to: '/gemhunter', cta: 'ไปที่หน้าคำเชิญ' }
  if (phase === 'cancelled') return { text: 'แคมเปญนี้ปิดแล้ว การขายตามปกติของร้านไม่ได้รับผลกระทบ', to: '/gemhunter', cta: 'ไปที่หน้าคำเชิญ' }
  return { text: 'แคมเปญนี้จบแล้ว ร้านยังขายตามปกติผ่านช่องทางสั่งอาหารเดิม', to: '/gemhunter/results', cta: 'ดูผลลัพธ์' }
}

export function HunterDiscovery() {
  const { state } = useGemHunter()
  const c = state.campaign
  const merchant = merchantOf(c.merchantId)
  const [orderNote, setOrderNote] = useState(false)

  if (!merchant) {
    return <EmptyNote Icon={Info}>ไม่พบข้อมูลร้านสำหรับหน้าตัวอย่างนี้ ลองรีเซ็ตข้อมูลสาธิตของ GemHunter</EmptyNote>
  }

  const photos = storefrontPhotos(c)
  // the cover is always one of the storefront photos (domain invariant); fall back to the grid if it ever is not
  const cover = photos.find((p) => p.id === c.coverPhotoId)
  const others = photos.filter((p) => p.id !== cover?.id)
  const subOf = (photoId: string) => c.submissions.find((s) => s.photo.id === photoId)
  const dishOf = (photoId: string) => subOf(photoId)?.menuItemName
  const live = isMissionLive(c.phase)
  const { mission } = c
  const v = mission.voucher
  const notLive = notLiveText(c.phase)
  const ev = evidenceOf(c)
  const newTitles = c.menuAudit.items.filter((i) => storefrontTitle(c, i) !== i.menuItemName).length

  // what the merchant's choices have put on the page: said only when there is something to say
  const onPage = [newTitles > 0 && `ชื่อเมนูใหม่ ${newTitles} เมนู`, photos.length > 0 && `รูปจากลูกค้า ${photos.length} รูป`, cover && 'มีรูปปก'].filter(Boolean).join(' · ')
  const hasNote = !live || onPage !== ''

  return (
    <div className="mx-auto flex max-w-[27rem] flex-col gap-4">
      {/* presenter side: this page is only a preview until the campaign runs */}
      {hasNote && (
        <div aria-label="สิ่งที่ขึ้นหน้าร้านแล้ว" role="group" className="flex flex-col gap-1">
          {onPage !== '' && <p className="text-[17px] leading-snug font-semibold">ขึ้นหน้าร้านแล้ว: {onPage}</p>}
          {!live && (
            <p className="text-[15px] leading-snug">
              {notLive.text}{' '}
              <Link to={notLive.to} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
                {notLive.cta}
              </Link>
            </p>
          )}
        </div>
      )}

      <PhoneMockupFrame>
        <article className="gh-phone" aria-label={`หน้าร้าน ${merchant.name} ที่ลูกค้าเห็น`}>
          {cover ? (
            <div className="relative">
              <PhotoTile hue={cover.hue} label={cover.label} dish={dishOf(cover.id)} imageClassName="aspect-[4/3]" chipAt="top" />
              {subOf(cover.id) && (
                <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 text-[14px] leading-5 font-semibold">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  {subOf(cover.id)?.rating}
                </span>
              )}
            </div>
          ) : (
            <p className="flex items-start gap-2.5 bg-secondary px-5 py-3 text-[15px] leading-snug text-muted-foreground" role="status">
              <Camera className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {photos.length === 0 ? 'ยังไม่มีรูปหน้าร้าน รูปจะขึ้นเมื่อผ่านการตรวจสอบและร้านอนุมัติแล้วเท่านั้น' : 'ร้านยังไม่ได้เลือกรูปปก'}
            </p>
          )}

        <div className="flex flex-col gap-5 p-5">
          <div>
            <h1 className="text-[30px] leading-tight font-bold tracking-tight">{merchant.name}</h1>
            <p className="text-[17px] text-muted-foreground">{merchant.category}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px]">
              {ev.validReviews > 0 && ev.averageRating !== null && (
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Star className="size-4 fill-current" aria-hidden="true" />
                  {fmtRating(ev.averageRating)}
                  <span className="font-normal text-muted-foreground">({ev.validReviews} รีวิว)</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {merchant.neighborhood}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                {merchant.operatingHours.open} – {merchant.operatingHours.close} น.
              </span>
            </p>
          </div>

          <div>
            <Button variant="outline" className="h-12 w-full gap-2 px-6 text-[17px]" aria-expanded={orderNote} onClick={() => setOrderNote((o) => !o)}>
              <ShoppingBag data-icon="inline-start" />
              สั่งผ่านช่องทางปกติของร้าน
            </Button>
            {orderNote && (
              <p className="gh-ok mt-2 text-[15px] leading-relaxed text-muted-foreground" role="status">
                จำลอง: ในระบบจริงปุ่มนี้จะพาไปสั่งที่ช่องทางสั่งอาหารปกติของร้าน ต้นแบบนี้ไม่มีตะกร้า ไม่จ่ายเงิน และไม่สั่งซื้อรวมหลายร้าน
              </p>
            )}
          </div>

          {live && (
            <section aria-labelledby="mission-h" className="rounded-2xl bg-accent p-5">
              <h2 id="mission-h" className="flex items-start gap-2.5 text-[22px] leading-snug font-bold">
                <Ticket className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
                {mission.title}
              </h2>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[17px]">
                <span className="text-[17px]">รับคูปอง</span>
                <strong className="figure text-[30px] leading-none">
                  {v.valueRangeBaht.min}–{v.valueRangeBaht.max} บาท
                </strong>
                <span className="text-[14px] text-muted-foreground">จากแพลตฟอร์ม (ตัวอย่าง ไม่มีคูปองจริง)</span>
              </p>
              <Button asChild className="mt-4 h-12 w-full px-5 text-[17px]">
                <Link to="/gemhunter/photos?view=hunter">
                  <Camera data-icon="inline-start" />
                  ส่งรูปและรีวิวหลังสั่ง
                </Link>
              </Button>
              <VoucherTerms className="mt-1" />
            </section>
          )}

          <section aria-labelledby="menu-h">
            <H2 id="menu-h">เมนูของร้าน</H2>
            <ul className="mt-1 divide-y">
              {merchant.sampleMenu.map((m) => {
                const audit = c.menuAudit.items.find((i) => i.menuItemName === m.name)
                const title = audit ? storefrontTitle(c, audit) : m.name
                return (
                  <li key={m.name} className="flex items-center gap-4 py-3">
                    <PhotoTile hue={47} label="จานอาหารถ่ายจากด้านบน" dish={m.name} chip={false} className="size-[4.5rem] shrink-0 rounded-xl" imageClassName="h-full aspect-square" />
                    <span className="min-w-0 flex-1 text-[17px] leading-snug">
                      {title}
                      {title !== m.name && (
                        <span className="mt-0.5 flex items-center gap-1 text-[14px] text-muted-foreground">
                          <Sparkles className="size-3.5" aria-hidden="true" />
                          ชื่อใหม่ที่ร้านอนุมัติ
                        </span>
                      )}
                    </span>
                    <span className="figure shrink-0 text-[17px]">{baht(m.priceBaht)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="text-[14px] text-muted-foreground">ภาพอาหารเป็นภาพจำลอง ราคาเป็นราคาปกติของร้าน</p>
          </section>

          {photos.length > 0 && (
            <section aria-labelledby="photos-h">
              <H2 id="photos-h">รูปจากลูกค้า</H2>
              {others.length > 0 ? (
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {others.map((p) => {
                    const sub = subOf(p.id)
                    return (
                      <li key={p.id} className="gh-card">
                        <PhotoTile hue={p.hue} label={p.label} dish={sub?.menuItemName} className="rounded-xl">
                          {sub && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[14px] leading-5 font-semibold">
                              <Star className="size-3.5 fill-current" aria-hidden="true" />
                              {sub.rating}
                            </span>
                          )}
                        </PhotoTile>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-[17px] text-muted-foreground">ตอนนี้มีเฉพาะรูปปกของร้าน</p>
              )}
            </section>
          )}
        </div>
      </article>
      </PhoneMockupFrame>
    </div>
  )
}
