import { SimulatedBadge } from '@/components/SimulatedBadge'
import { cn } from '@/lib/utils'

export interface DishSvgArtProps {
  slug: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  standaloneLabel?: string
}

/* ---------------- Shared SVG building blocks ---------------- */

function TableBackground() {
  return (
    <g>
      <rect width="160" height="120" fill="#ede5d8" />
      <path d="M0,0 H160 V26 L0,48 Z" fill="#f5ede0" opacity="0.75" />
      <path d="M0,98 L160,72 V120 H0 Z" fill="#f5ede0" opacity="0.45" />
    </g>
  )
}

function Plate() {
  return (
    <g>
      <ellipse cx="82" cy="65" rx="52" ry="46" fill="#1e1810" opacity="0.08" />
      <ellipse cx="80" cy="60" rx="48" ry="43" fill="#fbf8f2" stroke="#dfd7c6" strokeWidth="1.8" />
      <ellipse cx="80" cy="60" rx="40" ry="36" fill="#f6efe4" stroke="#e6decb" strokeWidth="1" />
    </g>
  )
}

function CucumberSlice({ cx, cy, r = 5.5, rot = 0 }: { cx: number; cy: number; r?: number; rot?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <circle r={r} fill="#bed892" stroke="#679434" strokeWidth="1.2" />
      <circle r={r * 0.65} fill="#e5f1cf" />
      {[0, 120, 240].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={deg}
            cx={Math.cos(rad) * (r * 0.35)}
            cy={Math.sin(rad) * (r * 0.35)}
            r={r * 0.12}
            fill="#80a544"
          />
        )
      })}
    </g>
  )
}

function DippingBowl({
  cx,
  cy,
  r = 11,
  sauceColor,
  glazeColor,
  bits = [],
}: {
  cx: number
  cy: number
  r?: number
  sauceColor: string
  glazeColor?: string
  bits?: Array<{ x: number; y: number; r: number; color: string }>
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="1" cy="2" rx={r + 1.5} ry={r + 1} fill="#1a140d" opacity="0.1" />
      <circle r={r} fill="#fffdf9" stroke="#d5cebd" strokeWidth="1.2" />
      <circle r={r - 2.5} fill={sauceColor} />
      {glazeColor && (
        <circle cx={-r * 0.28} cy={-r * 0.3} r={r * 0.22} fill={glazeColor} opacity="0.35" />
      )}
      {bits.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.color} />
      ))}
    </g>
  )
}

function RiceMound({ cx = 70, cy = 60, rx = 28, ry = 22 }: { cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#faf5e9" stroke="#ebe1cd" strokeWidth="1.2" />
      {[
        [-16, -6], [-6, -11], [6, -8], [15, -4],
        [-12, 4], [0, 2], [10, 5], [-4, 11], [8, 11],
      ].map(([dx, dy], i) => (
        <ellipse
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          rx="1.8"
          ry="0.9"
          fill="#ecdcb9"
          transform={`rotate(${dx * 4} ${cx + dx} ${cy + dy})`}
        />
      ))}
    </g>
  )
}

function LimeWedge({ cx, cy, rot = -20 }: { cx: number; cy: number; rot?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <path d="M-7,0 A7,7 0 0 1 7,0 Z" fill="#7fae35" stroke="#537b22" strokeWidth="1" />
      <path d="M-5,-0.8 A5,5 0 0 1 5,-0.8 Z" fill="#d7eaa2" />
      <path d="M0,-0.8 L0,-4.6 M-2.3,-0.8 L-3.2,-3.6 M2.3,-0.8 L3.2,-3.6" stroke="#7fae35" strokeWidth="0.8" />
    </g>
  )
}

function CorianderSprig({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d="M0,4 Q-2,0 -4,-3 Q-1,-4 0,-1 Q1,-4 4,-3 Q2,0 0,4" fill="#4d8227" stroke="#365e19" strokeWidth="0.6" />
      <path d="M-3,-1 Q-6,-2 -7,-5 Q-4,-5 -3,-3" fill="#58932e" />
      <path d="M2,-1 Q5,-2 7,-4 Q5,-6 3,-3" fill="#58932e" />
    </g>
  )
}

/* ---------------- 1. Khao Man Gai Tom (ข้าวมันไก่ต้ม) ---------------- */

function KhaoManGaiTom() {
  const slices = [
    { x: 50, y: 44, rot: -14, w: 11, h: 22 },
    { x: 61, y: 47, rot: -10, w: 11, h: 24 },
    { x: 72, y: 50, rot: -6, w: 11, h: 24 },
    { x: 83, y: 54, rot: -2, w: 11, h: 22 },
  ]

  return (
    <g>
      <RiceMound cx={70} cy={60} rx={29} ry={23} />
      <CucumberSlice cx={44} cy={76} rot={15} />
      <CucumberSlice cx={53} cy={82} rot={-10} />

      {/* Tender boiled chicken slices */}
      {slices.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
          <rect x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} rx="4" fill="#fcf8f0" stroke="#d8c8ad" strokeWidth="1" />
          {/* Pale golden poached skin edge */}
          <path
            d={`M${-s.w / 2 + 1},${-s.h / 2 + 3} Q${0},${-s.h / 2 + 1} ${s.w / 2 - 1},${-s.h / 2 + 3}`}
            stroke="#d4b172"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Delicate moisture highlight */}
          <line x1={-s.w / 4} y1={-s.h / 4} x2={s.w / 4} y2={-s.h / 4} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </g>
      ))}

      <CorianderSprig cx={72} cy={55} />

      {/* Fermented soybean ginger-chili dipping sauce */}
      <DippingBowl
        cx={114}
        cy={44}
        r={12}
        sauceColor="#4a2d16"
        glazeColor="#ffffff"
        bits={[
          { x: -3, y: -2, r: 1.1, color: '#e5c46e' }, // ginger
          { x: 2, y: -3, r: 1.0, color: '#e5c46e' },
          { x: -1, y: 3, r: 1.2, color: '#c93822' },  // red chili
          { x: 3, y: 2, r: 1.0, color: '#4a882a' },   // green chili
          { x: 0, y: -1, r: 0.9, color: '#e5c46e' },
        ]}
      />
    </g>
  )
}

/* ---------------- 2. Khao Man Gai Tod (ข้าวมันไก่ทอด) ---------------- */

function KhaoManGaiTod() {
  const slices = [
    { x: 50, y: 44, rot: -14, w: 12, h: 22 },
    { x: 61, y: 47, rot: -10, w: 12, h: 24 },
    { x: 72, y: 50, rot: -6, w: 12, h: 24 },
    { x: 83, y: 54, rot: -2, w: 12, h: 22 },
  ]

  return (
    <g>
      <RiceMound cx={70} cy={60} rx={29} ry={23} />
      <CucumberSlice cx={44} cy={76} rot={15} />
      <CucumberSlice cx={53} cy={82} rot={-10} />

      {/* Crispy golden fried chicken cutlet slices */}
      {slices.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
          {/* Crispy golden-brown crumb shell */}
          <rect x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} rx="4" fill="#c46816" stroke="#8c4308" strokeWidth="1" />
          {/* Juicy tender meat core */}
          <rect x={-s.w / 2 + 1.8} y={-s.h / 2 + 2} width={s.w - 3.6} height={s.h - 4} rx="2" fill="#fef5e6" />
          {/* Crispy crumb crunch texture */}
          <line x1={-s.w / 2 + 1} y1={-s.h / 2 + 1.5} x2={s.w / 2 - 1} y2={-s.h / 2 + 1.5} stroke="#f6ca68" strokeWidth="1.6" strokeLinecap="round" />
          <line x1={-s.w / 2 + 1} y1={s.h / 2 - 1.5} x2={s.w / 2 - 1} y2={s.h / 2 - 1.5} stroke="#d97d24" strokeWidth="1.6" strokeLinecap="round" />
          {[[-2, -3], [1, 2], [-1, 5], [2, -5]].map(([bx, by], bi) => (
            <circle key={bi} cx={bx} cy={by} r="0.75" fill="#d88022" />
          ))}
        </g>
      ))}

      {/* Sweet chili dipping sauce */}
      <DippingBowl
        cx={114}
        cy={44}
        r={12}
        sauceColor="#d23c1d"
        glazeColor="#ffffff"
        bits={[
          { x: -3, y: -2, r: 1.1, color: '#8a1808' },
          { x: 2, y: -2, r: 0.9, color: '#fbedbe' }, // garlic
          { x: -1, y: 3, r: 1.0, color: '#8a1808' },
          { x: 3, y: 2, r: 0.8, color: '#fbedbe' },
        ]}
      />
    </g>
  )
}

/* ---------------- 3. Khao Na Gai (ข้าวหน้าไก่เทอริยากิ) ---------------- */

function KhaoNaGai() {
  const chickenStrips = [
    { d: 'M-18,-7 C-19,-14 -6,-16 6,-13 C14,-11 18,-4 14,4 C10,11 -4,11 -12,7 C-16,4 -17,0 -18,-7Z', x: 62, y: 50, rot: -12 },
    { d: 'M-17,-5 C-18,-13 -4,-15 8,-11 C16,-9 19,-2 15,6 C11,12 -3,13 -12,8 C-16,5 -17,1 -17,-5Z', x: 80, y: 55, rot: 8 },
    { d: 'M-16,-4 C-17,-11 -5,-13 6,-10 C13,-8 16,-2 13,5 C10,10 -2,11 -10,7 C-14,4 -15,1 -16,-4Z', x: 68, y: 68, rot: -4 },
  ]

  const sesameSeeds = [
    [58, 48], [64, 46], [68, 52], [62, 54],
    [76, 51], [82, 49], [86, 56], [79, 58],
    [64, 66], [70, 64], [74, 70], [67, 71],
  ]

  const scallionRings = [
    [56, 44], [72, 47], [84, 53], [61, 62], [76, 66],
  ]

  return (
    <g>
      <RiceMound cx={72} cy={60} rx={30} ry={24} />

      {/* Pickled red ginger (beni shoga) ribbons */}
      <g transform="translate(43 73)">
        <path d="M-4,3 Q0,-1 4,2 Q2,6 -2,5" stroke="#d94968" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M-2,6 Q2,3 6,5" stroke="#e66380" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>

      {/* Savory teriyaki chicken pieces */}
      {chickenStrips.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <path d={c.d} fill="#5c240d" stroke="#3b1607" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M-10,-5 Q-2,-10 8,-7" stroke="#e08f4c" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M-12,1 Q-2,-3 9,0" stroke="#964016" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      ))}

      {/* White sesame seeds */}
      {sesameSeeds.map(([sx, sy], i) => (
        <ellipse
          key={i}
          cx={sx}
          cy={sy}
          rx="1.1"
          ry="0.6"
          fill="#fffbee"
          transform={`rotate(${((i * 37) % 60) - 30} ${sx} ${sy})`}
        />
      ))}

      {/* Scallion rings */}
      {scallionRings.map(([sx, sy], i) => (
        <g key={i} transform={`translate(${sx} ${sy})`}>
          <circle r="2.8" fill="#529633" stroke="#3a6f20" strokeWidth="0.8" />
          <circle r="1.5" fill="#c3eb81" />
        </g>
      ))}

      {/* Teriyaki reduction side cup */}
      <DippingBowl
        cx={115}
        cy={43}
        r={11}
        sauceColor="#3d1808"
        glazeColor="#ffffff"
        bits={[
          { x: -1, y: -1, r: 0.8, color: '#fffbee' },
          { x: 2, y: 1, r: 0.8, color: '#fffbee' },
        ]}
      />
    </g>
  )
}

/* ---------------- 4. Moo Satay 10 (หมูสะเต๊ะ 10 ไม้) ---------------- */

function MooSatay10() {
  const skewers = [-16, -8, 0, 8, 16]

  return (
    <g>
      {/* 5 skewered pork satay sticks */}
      <g transform="translate(68 60) rotate(-18)">
        {skewers.map((y, idx) => (
          <g key={idx} transform={`translate(0 ${y})`}>
            {/* Bamboo stick */}
            <rect x="-38" y="-1" width="76" height="2" rx="1" fill="#d8b07a" />
            {/* Meat chunks */}
            {[-25, -14, -3, 8].map((x, mi) => (
              <g key={mi}>
                <rect x={x} y="-4.2" width="11.5" height="8.4" rx="3.4" fill="#c9772b" />
                <rect x={x + 1.5} y="-3.4" width="7.8" height="2.2" rx="1.1" fill="#ecad58" />
                <rect x={x + 7.5} y="-4.2" width="1.8" height="8.4" fill="#632e0c" opacity="0.5" />
              </g>
            ))}
          </g>
        ))}
      </g>

      {/* Peanut sauce bowl */}
      <g transform="translate(116 38)">
        <ellipse cx="1" cy="2" rx={13.5} ry={12} fill="#1a140d" opacity="0.1" />
        <circle r={12} fill="#fffdf9" stroke="#d5cebd" strokeWidth="1.2" />
        <circle r={9.5} fill="#ab511a" />
        {/* Coconut cream swirl */}
        <path d="M-4,-2 C-1,-6 5,-3 4,2 C3,5 -2,4 -3,1" stroke="#fff7e5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {/* Crushed peanut bits */}
        {[[-2, -3], [2, -2], [3, 3], [-2, 4]].map(([bx, by], i) => (
          <circle key={i} cx={bx} cy={by} r="0.85" fill="#f5cca2" />
        ))}
      </g>

      {/* Ajad bowl (cucumber, shallots, red chili relish) */}
      <g transform="translate(114 78)">
        <ellipse cx="1" cy="2" rx={12.5} ry={11} fill="#1a140d" opacity="0.1" />
        <circle r={11} fill="#fffdf9" stroke="#d5cebd" strokeWidth="1.2" />
        <circle r={8.5} fill="#edf6e8" opacity="0.9" />
        {/* Relish elements inside ajad */}
        <CucumberSlice cx={-2} cy={-2} r={3.6} />
        <CucumberSlice cx={3} cy={3} r={3.2} />
        {/* Shallot sliver */}
        <path d="M-3,3 Q0,6 3,4 Q1,2 -3,3" fill="#a43962" stroke="#7e2446" strokeWidth="0.5" />
        {/* Red chili bit */}
        <circle cx={1} cy={-4} r="1.1" fill="#cf3422" />
      </g>
    </g>
  )
}

/* ---------------- 5. Gai Yang (ไก่ย่างสมุนไพร) ---------------- */

function GrilledCut({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path
        d="M-18,-4 C-20,-15 -5,-20 6,-16 C17,-13 23,-1 16,8 C10,16 -7,16 -15,9 C-19,5 -19,0 -18,-4Z"
        fill="#c06421"
        stroke="#7f390e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Grill char marks */}
      <path d="M-10,-9 L6,-13 M-12,-3 L10,-7 M-10,4 L8,0" stroke="#431904" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Roasted glaze sheen */}
      <path d="M-9,-13 C-3,-16 5,-15 10,-12" stroke="#f0aa5c" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Herb specks */}
      {[[-4, 8], [8, 4], [-12, 1], [3, -3]].map(([a, b], idx) => (
        <ellipse key={idx} cx={a} cy={b} rx="1.6" ry="0.9" fill="#477926" transform={`rotate(${a * 6} ${a} ${b})`} />
      ))}
    </g>
  )
}

function GaiYang() {
  return (
    <g>
      <g transform="translate(62 60)">
        <GrilledCut x={-14} y={-8} r={-18} />
        <GrilledCut x={18} y={-12} r={14} s={0.95} />
        <GrilledCut x={3} y={13} r={4} s={0.92} />
      </g>

      <LimeWedge cx={40} cy={76} rot={-15} />
      <CucumberSlice cx={49} cy={82} rot={10} />

      {/* Spicy tamarind Jaew dipping sauce with roasted rice powder */}
      <DippingBowl
        cx={115}
        cy={42}
        r={12}
        sauceColor="#4a1c10"
        glazeColor="#ffffff"
        bits={[
          { x: -3, y: -2, r: 1.1, color: '#d8b77a' }, // toasted rice powder
          { x: 1, y: -3, r: 0.9, color: '#d8b77a' },
          { x: 3, y: 1, r: 1.0, color: '#4c8e2b' },  // scallion
          { x: -1, y: 3, r: 1.1, color: '#992612' },  // chili
          { x: 0, y: 0, r: 0.8, color: '#d8b77a' },
        ]}
      />
    </g>
  )
}

/* ---------------- 6. Peek Gai Tod (ปีกไก่ทอดน้ำปลา) ---------------- */

function WingPiece({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      {/* Crispy wing cut */}
      <path
        d="M-16,0 C-16,-10 -2,-13 8,-9 C14,-7 21,-10 26,-4 C28,1 23,6 16,6 C10,6 6,11 -2,10 C-11,9 -16,6 -16,0Z"
        fill="#dc9a35"
        stroke="#a8661b"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Golden fried highlight */}
      <path d="M-11,-5 C-4,-9 4,-8 9,-5" stroke="#f6d38a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Crispy bubble blisters */}
      {[[-8, 3], [0, 4], [8, 1], [16, 0], [-2, -3], [12, -4]].map(([a, b], idx) => (
        <circle key={idx} cx={a} cy={b} r="1.15" fill="#f2c36a" />
      ))}
      {/* Bone tips */}
      <path d="M22,-6 L27,-9 M22,-1 L28,-2" stroke="#ebe2d3" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

function PeekGaiTod() {
  return (
    <g>
      <g transform="translate(68 58)">
        <WingPiece x={-12} y={-17} r={-8} />
        <WingPiece x={-6} y={4} r={6} />
        <WingPiece x={4} y={22} r={-4} />

        {/* Scattered crispy fried garlic chips */}
        {[[-28, -6], [-24, 12], [20, -18], [26, 6], [14, 12]].map(([a, b], idx) => (
          <rect
            key={idx}
            x={a}
            y={b}
            width="6"
            height="2"
            rx="1"
            fill="#8d5a22"
            stroke="#5c350e"
            strokeWidth="0.6"
            transform={`rotate(${a * 4} ${a} ${b})`}
          />
        ))}
      </g>

      <LimeWedge cx={40} cy={76} rot={-15} />

      {/* Sweet garlic fish sauce dipping bowl */}
      <DippingBowl
        cx={115}
        cy={40}
        r={12}
        sauceColor="#b66522"
        glazeColor="#ffffff"
        bits={[
          { x: -2, y: -2, r: 1.0, color: '#f5d996' },
          { x: 2, y: 1, r: 1.1, color: '#a6301a' },
          { x: -1, y: 3, r: 0.9, color: '#f5d996' },
        ]}
      />
    </g>
  )
}

/* ---------------- Fallback dish art ---------------- */

function GenericDishPlate() {
  return (
    <g>
      <RiceMound cx={66} cy={60} rx={27} ry={21} />
      {/* Golden protein pieces */}
      {[[-6, 48], [4, 52], [-2, 60]].map(([gx, gy], i) => (
        <g key={i} transform={`translate(${gx + 68} ${gy})`}>
          <ellipse cx="0" cy="0" rx="9" ry="6" fill="#c47025" stroke="#874109" strokeWidth="1" />
          <ellipse cx="0" cy="-1.5" rx="6" ry="3" fill="#ecaa5c" opacity="0.6" />
        </g>
      ))}
      <CucumberSlice cx={44} cy={76} rot={15} />
      <CorianderSprig cx={68} cy={54} />
      <DippingBowl cx={115} cy={42} r={11} sauceColor="#b35a1f" glazeColor="#ffffff" />
    </g>
  )
}

/* ---------------- Food dispatcher ---------------- */

function FoodIllustration({ slug }: { slug: string }) {
  switch (slug) {
    case 'khao-man-gai-tom':
      return <KhaoManGaiTom />
    case 'khao-man-gai-tod':
      return <KhaoManGaiTod />
    case 'khao-na-gai':
      return <KhaoNaGai />
    case 'moo-satay-10':
      return <MooSatay10 />
    case 'gai-yang':
      return <GaiYang />
    case 'peek-gai-tod':
      return <PeekGaiTod />
    default:
      return <GenericDishPlate />
  }
}

/* ---------------- Main Component ---------------- */

export function DishSvgArt({
  slug,
  size = 'md',
  className,
  standaloneLabel,
}: DishSvgArtProps) {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-24 aspect-[4/3]',
    md: 'w-full aspect-[4/3] max-w-sm',
    lg: 'w-full aspect-[4/3] max-w-md',
  }

  const svgA11yProps = standaloneLabel
    ? { role: 'img' as const, 'aria-label': standaloneLabel }
    : { 'aria-hidden': 'true' as const }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-[#ede5d8]',
        sizeClasses[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 160 120"
        className="block h-full w-full object-cover select-none"
        preserveAspectRatio="xMidYMid slice"
        {...svgA11yProps}
      >
        <TableBackground />
        <Plate />
        <FoodIllustration slug={slug} />
      </svg>
      {/* Simulation badge is unconditionally rendered */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 z-10">
        <SimulatedBadge
          text="ภาพจำลอง"
          variant="pill"
          className={size === 'sm' ? 'scale-75 origin-bottom-left text-[11px] px-2 py-0' : 'text-[12px]'}
        />
      </div>
    </div>
  )
}
