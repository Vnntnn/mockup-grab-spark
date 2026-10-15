import { useId, type ReactNode } from 'react'
import { SimulatedBadge } from '@/components/SimulatedBadge'
import { cn } from '@/lib/utils'

/**
 * Simulated food photo. An original flat illustration drawn here as SVG (no raster file, no real photo, no real person's image).
 * Three dishes of the demo shop, four "camera angles" picked from the photo label, colours of the table and plate varied by `hue`.
 * The accessible name says it is a simulation and a visible "ภาพจำลอง" chip stays on the image.
 */

export type Dish = 'satay' | 'chicken' | 'wings' | 'plate'
export type Angle = 'top' | 'close' | 'sides' | 'box'

const DISHES: Dish[] = ['satay', 'chicken', 'wings']
const ANGLES: Angle[] = ['top', 'close', 'sides', 'box']

export function dishOf(name: string | undefined, hue: number): Dish {
  if (name) {
    if (name.includes('สะเต๊ะ')) return 'satay'
    if (name.includes('ไก่ย่าง')) return 'chicken'
    if (name.includes('ปีกไก่')) return 'wings'
    return 'plate'
  }
  // no dish given: stay deterministic from the photo hue (demo hues are n * 47)
  return DISHES[(((Math.round(hue / 47) - 1) % 3) + 3) % 3]
}

export function angleOf(label: string, hue: number): Angle {
  if (label.includes('ด้านบน')) return 'top'
  if (label.includes('ใกล้')) return 'close'
  if (label.includes('น้ำจิ้ม') || label.includes('เครื่องเคียง')) return 'sides'
  if (label.includes('กล่อง')) return 'box'
  return ANGLES[((Math.round(hue / 47) % 4) + 4) % 4]
}

/* ---------- food pieces, drawn around (0,0) in a 160 x 120 scene ---------- */

const MEAT = '#a65f2b'
const MEAT_DARK = '#6e3b17'
const MEAT_LIGHT = '#cf9051'
const STICK = '#d8b07a'

function Satay() {
  return (
    <g transform="rotate(-16)">
      {[-19, -9.5, 0, 9.5, 19].map((y) => (
        <g key={y} transform={`translate(0 ${y})`}>
          <rect x="-40" y="-1" width="80" height="2" rx="1" fill={STICK} />
          {[-28, -16, -4, 8].map((x) => (
            <g key={x}>
              <rect x={x} y="-4.2" width="12.5" height="8.4" rx="3.6" fill={MEAT} />
              <rect x={x + 1.6} y="-3.4" width="8.6" height="2.2" rx="1.1" fill={MEAT_LIGHT} />
              <rect x={x + 8} y="-4.2" width="1.8" height="8.4" fill={MEAT_DARK} opacity="0.45" />
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

function ChickenPiece({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-17,-3 C-19,-14 -4,-19 6,-15 C17,-12 22,-1 15,7 C9,15 -8,15 -15,8 C-18,4 -18,0 -17,-3Z" fill="#c9772b" stroke="#8a4a1a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-9,-8 L6,-12 M-11,-2 L10,-6 M-9,5 L8,1" stroke="#6e3b17" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <path d="M-8,-12 C-2,-15 6,-14 10,-11" stroke="#e8a85a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {[[-4, 9], [8, 4], [-12, 1], [3, -3]].map(([a, b]) => (
        <ellipse key={`${a}${b}`} cx={a} cy={b} rx="1.6" ry="0.9" fill="#4f7d2f" transform={`rotate(${a * 6} ${a} ${b})`} />
      ))}
    </g>
  )
}

function Chicken() {
  return (
    <g>
      <ChickenPiece x={-20} y={-9} r={-18} />
      <ChickenPiece x={15} y={-13} r={14} s={0.95} />
      <ChickenPiece x={-2} y={13} r={4} s={0.92} />
      <path d="M-34,26 C-14,20 12,20 34,26" stroke="#7aa63f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Wing({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M-16,0 C-16,-10 -2,-13 8,-9 C14,-7 21,-10 26,-4 C28,1 23,6 16,6 C10,6 6,11 -2,10 C-11,9 -16,6 -16,0Z" fill="#dc9a35" stroke="#a8661b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M-11,-5 C-4,-9 4,-8 9,-5" stroke="#f6d38a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {[[-8, 3], [0, 4], [8, 1], [16, 0], [-2, -3], [12, -4]].map(([a, b]) => (
        <circle key={`${a}${b}`} cx={a} cy={b} r="1.15" fill="#f2c36a" />
      ))}
      <path d="M22,-6 L27,-9 M22,-1 L28,-2" stroke="#e8d8c0" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

function Wings() {
  return (
    <g>
      <Wing x={-12} y={-17} r={-8} />
      <Wing x={-6} y={4} r={6} />
      <Wing x={4} y={22} r={-4} />
      {[[-34, -4], [-30, 14], [24, -20], [30, 6], [18, 12]].map(([a, b]) => (
        <rect key={`${a}${b}`} x={a} y={b} width="6" height="1.8" rx="0.9" fill="#8a5a22" transform={`rotate(${a * 3} ${a} ${b})`} />
      ))}
      <path d="M26,22 C30,16 38,16 41,20 C37,25 31,26 26,22Z" fill="#6f9a3c" />
    </g>
  )
}

function GenericPlate() {
  return (
    <g>
      <ellipse cx="0" cy="4" rx="26" ry="14" fill="#f4ead2" stroke="#d9c9a3" strokeWidth="1.2" />
      {[[-12, 0], [0, -4], [12, 1], [-3, 8]].map(([a, b]) => (
        <circle key={`${a}${b}`} cx={a} cy={b} r="7" fill="#d08a3c" stroke="#9a5d1f" strokeWidth="1" />
      ))}
      <path d="M-26,18 C-10,12 10,12 26,18" stroke="#7aa63f" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Food({ dish }: { dish: Dish }) {
  if (dish === 'satay') return <Satay />
  if (dish === 'chicken') return <Chicken />
  if (dish === 'wings') return <Wings />
  return <GenericPlate />
}

/* ---------- accents (sauce bowl, sides) ---------- */

function Bowl({ x, y, r, sauce, bits }: { x: number; y: number; r: number; sauce: string; bits: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="1.5" cy="2" rx={r + 1} ry={r + 0.5} fill="#161616" opacity="0.1" />
      <circle r={r} fill="#fffdf6" stroke="#d9d2bd" strokeWidth="1.2" />
      <circle r={r - 3} fill={sauce} />
      <circle cx={-r * 0.28} cy={-r * 0.3} r={r * 0.22} fill="#fff" opacity="0.28" />
      {[[-2, 1], [2, -2], [3, 3], [-3, -3]].map(([a, b]) => (
        <circle key={`${a}${b}`} cx={a * (r / 10)} cy={b * (r / 10)} r="0.9" fill={bits} />
      ))}
    </g>
  )
}

function Cucumber({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="5.4" fill="#bcd68b" stroke="#6f9a3c" strokeWidth="1.3" />
      <circle r="3.4" fill="#e3f0c6" />
      {[0, 120, 240].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 1.7} cy={Math.sin((a * Math.PI) / 180) * 1.7} r="0.6" fill="#8aab52" />
      ))}
    </g>
  )
}

function Lime({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-20)`}>
      <path d="M-7,0 A7,7 0 0 1 7,0 Z" fill="#8fbf3f" stroke="#5f8a2a" strokeWidth="1" />
      <path d="M-4.5,-0.8 A4.5,4.5 0 0 1 4.5,-0.8 Z" fill="#d4e8a0" />
      <path d="M0,-0.8 L0,-4.6 M-2.3,-0.8 L-3.2,-3.6 M2.3,-0.8 L3.2,-3.6" stroke="#8fbf3f" strokeWidth="0.7" />
    </g>
  )
}

function accentFor(dish: Dish) {
  switch (dish) {
    case 'satay':
      return { sauce: '#c9772b', bits: '#f0c987' }
    case 'chicken':
      return { sauce: '#d6451f', bits: '#f6c04b' }
    case 'wings':
      return { sauce: '#8a5322', bits: '#e8b25d' }
    default:
      return { sauce: '#d6a33f', bits: '#fff2c9' }
  }
}

function Side({ dish, x, y, r }: { dish: Dish; x: number; y: number; r: number }) {
  const a = accentFor(dish)
  return <Bowl x={x} y={y} r={r} sauce={a.sauce} bits={a.bits} />
}

function Extra({ dish, x, y }: { dish: Dish; x: number; y: number }) {
  return dish === 'satay' ? <Cucumber x={x} y={y} /> : <Lime x={x} y={y} />
}

/* ---------- scene ---------- */

function Scene({ dish, angle, hue, uid }: { dish: Dish; angle: Angle; hue: number; uid: string }) {
  // one warm family of table tops (sand, tan, light wood): the demo hues only pick which, never a rainbow
  const wood = 28 + (Math.round(hue / 47) % 5) * 7
  const table = `hsl(${wood} 34% 82%)`
  const tableLight = `hsl(${wood} 34% 87%)`
  const plate = `hsl(42 26% 97%)`
  const rim = `hsl(42 20% 86%)`

  const tableBg = (
    <>
      <rect width="160" height="120" fill={table} />
      <path d="M0,0 H160 V30 L0,52 Z" fill={tableLight} opacity="0.7" />
      <path d="M0,96 L160,70 V120 H0Z" fill={tableLight} opacity="0.45" />
    </>
  )

  if (angle === 'box') {
    const clip = `${uid}-box`
    return (
      <>
        {tableBg}
        <ellipse cx="82" cy="66" rx="58" ry="46" fill="#161616" opacity="0.1" />
        <g transform="translate(80 62)">
          <rect x="-54" y="-44" width="108" height="88" rx="10" fill="#d6ad78" stroke="#a9814d" strokeWidth="1.6" />
          <rect x="-47" y="-31" width="94" height="68" rx="6" fill="#b98a55" />
          <clipPath id={clip}>
            <rect x="-47" y="-31" width="94" height="68" rx="6" />
          </clipPath>
          <g clipPath={`url(#${clip})`}>
            <rect x="-47" y="-31" width="94" height="68" fill="#f4ecd8" />
            <g transform="translate(0 3) scale(0.95)">
              <Food dish={dish} />
            </g>
          </g>
          <rect x="-54" y="-44" width="108" height="11" rx="5" fill="#e6c595" stroke="#a9814d" strokeWidth="1.2" />
          <rect x="-14" y="-42" width="28" height="7" rx="2" fill="#fff" opacity="0.7" />
        </g>
        <Extra dish={dish} x={140} y={104} />
      </>
    )
  }

  if (angle === 'close') {
    return (
      <>
        {tableBg}
        <g transform="translate(80 60) scale(1.7)">
          <circle r="46" fill={plate} stroke={rim} strokeWidth="2" />
          <circle r="38" fill="none" stroke={rim} strokeWidth="1" />
          <g transform="translate(-3 -2)">
            <Food dish={dish} />
          </g>
        </g>
      </>
    )
  }

  if (angle === 'sides') {
    return (
      <>
        {tableBg}
        <ellipse cx="58" cy="68" rx="46" ry="44" fill="#161616" opacity="0.1" />
        <g transform="translate(55 62) scale(0.9)">
          <circle r="46" fill={plate} stroke={rim} strokeWidth="2" />
          <circle r="38" fill="none" stroke={rim} strokeWidth="1" />
          <Food dish={dish} />
        </g>
        <Side dish={dish} x={128} y={36} r={13} />
        <g transform="translate(126 90)">
          <circle r="14" fill="#fffdf6" stroke="#d9d2bd" strokeWidth="1.2" />
          <Extra dish={dish} x={-4} y={-3} />
          <Extra dish={dish} x={4} y={4} />
        </g>
      </>
    )
  }

  // top-down plate
  return (
    <>
      {tableBg}
      <ellipse cx="83" cy="66" rx="48" ry="46" fill="#161616" opacity="0.1" />
      <g transform="translate(80 60)">
        <circle r="46" fill={plate} stroke={rim} strokeWidth="2" />
        <circle r="38" fill="none" stroke={rim} strokeWidth="1" />
        <Food dish={dish} />
        <Side dish={dish} x={28} y={26} r={10} />
        <Extra dish={dish} x={-33} y={26} />
        <Extra dish={dish} x={-25} y={33} />
      </g>
    </>
  )
}

/**
 * `children` are overlay chips (rating, moderation, cover). They sit on the image, so each must carry its own opaque background.
 * `chip` controls the "ภาพจำลอง" mark; `caption` adds the old text caption under the image.
 */
export function PhotoTile({
  hue,
  label,
  dish,
  className,
  imageClassName,
  caption = false,
  chip = true,
  chipAt = 'bottom',
  children,
}: {
  hue: number
  label: string
  dish?: string
  className?: string
  imageClassName?: string
  caption?: boolean
  chip?: boolean
  chipAt?: 'top' | 'bottom'
  children?: ReactNode
}) {
  const uid = useId().replace(/:/g, '')
  const d = dishOf(dish, hue)
  const angle = angleOf(label, hue)
  return (
    <figure className={cn('relative m-0 overflow-hidden', className)}>
      <svg
        viewBox="0 0 160 120"
        className={cn('block aspect-[4/3] w-full', imageClassName)}
        role="img"
        aria-label={`ภาพจำลอง: ${label}${dish ? ` (${dish})` : ''}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Scene dish={d} angle={angle} hue={hue} uid={uid} />
      </svg>
      {chip && (
        <div aria-hidden="true" className={cn('pointer-events-none absolute left-2', chipAt === 'top' ? 'top-2' : 'bottom-2')}>
          <SimulatedBadge text="ภาพจำลอง" className="text-[14px]" />
        </div>
      )}
      {children}
      {caption && (
        <figcaption className="px-1 pt-2 text-[14px]">
          <span className="font-medium">{label}</span>
          <span className="block text-muted-foreground">ภาพจำลอง ไม่ใช่รูปถ่ายจริง</span>
        </figcaption>
      )}
    </figure>
  )
}
