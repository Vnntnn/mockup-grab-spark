import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DishSvgArtProps {
  slug: string
  className?: string
  standaloneLabel?: string
}

/* ---------------- Shared SVG building blocks ---------------- */

function Plate() {
  return (
    <g>
      <ellipse cx="81" cy="64" rx="50" ry="45" fill="#16241c" opacity="0.1" />
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
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fffaf0" stroke="#cfbf98" strokeWidth="1.6" />
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
  // sliced poached chicken, laid flat and fanned over the rice: pale meat with a thin golden skin edge
  const slices = [
    { x: 49, y: 56, rot: -28 },
    { x: 59, y: 51, rot: -16 },
    { x: 70, y: 48, rot: -4 },
    { x: 81, y: 49, rot: 10 },
    { x: 91, y: 54, rot: 24 },
  ]

  return (
    <g>
      <RiceMound cx={70} cy={60} rx={29} ry={23} />
      <CucumberSlice cx={44} cy={78} rot={15} />
      <CucumberSlice cx={53} cy={84} rot={-10} />

      {slices.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
          <ellipse rx="13" ry="7.2" fill="#fbf1d6" stroke="#c9a15a" strokeWidth="1.2" />
          <path d="M-11,-3.2 Q0,-7.4 11,-3.2" stroke="#e1bd73" strokeWidth="2" strokeLinecap="round" fill="none" />
          <line x1="-6" y1="1.6" x2="5" y2="1.6" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
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
  // boneless fried chicken cut into strips and laid across the rice: wide, flat, crumb-coated
  const slices = [
    { x: 52, y: 54, rot: -26, w: 22, h: 11 },
    { x: 63, y: 49, rot: -12, w: 22, h: 11 },
    { x: 75, y: 48, rot: 4, w: 22, h: 11 },
    { x: 86, y: 53, rot: 20, w: 22, h: 11 },
  ]

  return (
    <g>
      <RiceMound cx={70} cy={62} rx={29} ry={23} />
      <CucumberSlice cx={44} cy={78} rot={15} />
      <CucumberSlice cx={53} cy={84} rot={-10} />

      {slices.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
          <path
            d={`M${-s.w / 2},0 Q${-s.w / 2 + 2},${-s.h / 2 - 1} 0,${-s.h / 2} Q${s.w / 2 - 2},${-s.h / 2 - 1} ${s.w / 2},1 Q${s.w / 2 - 3},${s.h / 2 + 1} 0,${s.h / 2} Q${-s.w / 2 + 2},${s.h / 2 + 1} ${-s.w / 2},0Z`}
            fill="#d98a22"
            stroke="#7c3a06"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d={`M${-s.w / 2 + 4},${-s.h / 2 + 3} Q0,${-s.h / 2 - 0.5} ${s.w / 2 - 4},${-s.h / 2 + 3}`} stroke="#fbe3a8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {[[-6, -1], [-1, 2], [4, -1], [7, 2], [1, -3], [-4, 3]].map(([bx, by], bi) => (
            <circle key={bi} cx={bx} cy={by} r="0.9" fill={bi % 2 ? '#8e4a0c' : '#f2b64f'} />
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
  // ten sticks, counted: the name promises "10 ไม้", so the picture shows exactly ten
  const skewers = Array.from({ length: 10 }, (_, i) => -25.2 + i * 5.6)

  return (
    <g>
      <g transform="translate(68 60) rotate(-16)">
        {skewers.map((y, idx) => (
          <g key={idx} transform={`translate(0 ${y})`}>
            {/* bamboo stick */}
            <rect x="-28" y="-0.8" width="56" height="1.6" rx="0.8" fill="#d8b07a" />
            {/* pork pieces */}
            {[-17, -7, 3].map((x, mi) => (
              <g key={mi}>
                <rect x={x} y="-2.7" width="9" height="5.4" rx="2.6" fill="#c9772b" />
                <rect x={x + 1.2} y="-2.1" width="5.8" height="1.5" rx="0.75" fill="#ecad58" />
                <rect x={x + 6} y="-2.7" width="1.3" height="5.4" fill="#632e0c" opacity="0.5" />
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
      {/* Bone end: these are chicken pieces, not patties */}
      <g>
        <rect x="13" y="-2" width="13" height="5.4" rx="2.7" fill="#f6eedc" stroke="#c9b894" strokeWidth="1" />
        <circle cx="26.5" cy="-1.6" r="3.3" fill="#f6eedc" stroke="#c9b894" strokeWidth="1" />
        <circle cx="26.5" cy="3.4" r="3.3" fill="#f6eedc" stroke="#c9b894" strokeWidth="1" />
      </g>
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

/* ---------------- Drinks and desserts (top-down glass and bowl on the plate) ---------------- */

function Glass({ liquid, rim = '#e9eeee', children }: { liquid: string; rim?: string; children?: ReactNode }) {
  return (
    <g>
      <circle cx="80" cy="60" r="31" fill="#ffffff" stroke={rim} strokeWidth="2.4" />
      <circle cx="80" cy="60" r="26.5" fill={liquid} />
      {children}
    </g>
  )
}

function IceCube({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return <rect x={x} y={y} width="10" height="10" rx="2.4" fill="#ffffff" opacity="0.5" stroke="#ffffff" strokeWidth="0.8" transform={`rotate(${r} ${x + 5} ${y + 5})`} />
}

function Straw({ color }: { color: string }) {
  return <rect x="86" y="30" width="5" height="34" rx="2.5" fill={color} transform="rotate(24 88 47)" />
}

function ThaiIcedTea() {
  return (
    <g>
      <Glass liquid="#d9722a">
        <path d="M60,56 C68,46 82,52 90,46 C96,42 100,50 98,58" stroke="#fbe9d2" strokeWidth="4.2" fill="none" strokeLinecap="round" opacity="0.95" />
        <path d="M62,70 C72,64 82,72 94,66" stroke="#fbe9d2" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />
        <IceCube x={62} y={44} r={12} />
        <IceCube x={84} y={72} r={-10} />
      </Glass>
      <Straw color="#3a2a1e" />
    </g>
  )
}

function LemonTea() {
  return (
    <g>
      <Glass liquid="#d7a23a">
        <IceCube x={64} y={72} r={8} />
        <g transform="translate(70 52)">
          <circle r="11" fill="#f5e27a" stroke="#c9ad2e" strokeWidth="1.6" />
          <circle r="8.3" fill="#fbf0a8" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1="0" y1="0" x2={8 * Math.cos((a * Math.PI) / 180)} y2={8 * Math.sin((a * Math.PI) / 180)} stroke="#e3cf55" strokeWidth="1" />
          ))}
        </g>
        <g transform="translate(92 66)">
          <circle r="8.5" fill="#f5e27a" stroke="#c9ad2e" strokeWidth="1.5" />
          <circle r="6.2" fill="#fbf0a8" />
        </g>
        <IceCube x={82} y={40} r={-14} />
      </Glass>
      <Straw color="#2c4a2a" />
    </g>
  )
}

function GreenMilkTea() {
  return (
    <g>
      <Glass liquid="#9cc47a">
        <path d="M58,60 C66,50 78,58 88,50 C96,44 102,54 98,62" stroke="#f2f7e6" strokeWidth="4.4" fill="none" strokeLinecap="round" opacity="0.95" />
        <path d="M62,72 C70,66 84,74 96,68" stroke="#f2f7e6" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        <IceCube x={70} y={40} r={10} />
        <IceCube x={64} y={66} r={-8} />
      </Glass>
      <Straw color="#f0f0ea" />
    </g>
  )
}

function Bowl({ milk, children }: { milk: string; children?: ReactNode }) {
  return (
    <g>
      <circle cx="80" cy="60" r="33" fill="#ffffff" stroke="#d9d4c6" strokeWidth="2.4" />
      <circle cx="80" cy="60" r="28" fill={milk} stroke="#eadfc5" strokeWidth="1" />
      {children}
    </g>
  )
}

function BuaLoi() {
  const balls: Array<[number, number, string]> = [
    [64, 50, '#7a4a9a'], [76, 44, '#6aa84f'], [90, 50, '#e08a3c'], [58, 64, '#e08a3c'], [72, 58, '#7a4a9a'],
    [86, 64, '#6aa84f'], [66, 76, '#6aa84f'], [80, 74, '#7a4a9a'], [94, 74, '#e08a3c'],
  ]
  return (
    <Bowl milk="#f6ead0">
      {balls.map(([x, y, c], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill={c} stroke="#ffffff" strokeWidth="1" opacity="0.95" />
      ))}
      <g transform="translate(78 60)">
        <ellipse rx="9" ry="8" fill="#ffffff" stroke="#e6dcc3" strokeWidth="1" />
        <circle r="4.6" fill="#f2b630" />
      </g>
    </Bowl>
  )
}

function MangoStickyRice() {
  return (
    <g>
      <ellipse cx="64" cy="62" rx="22" ry="17" fill="#fbf8ee" stroke="#e4dcc6" strokeWidth="1.4" />
      {[[-10, -4], [0, -8], [10, -3], [-6, 4], [6, 6], [-14, 6]].map(([dx, dy], i) => (
        <ellipse key={i} cx={64 + dx} cy={62 + dy} rx="3.2" ry="1.6" fill="#ece3cb" transform={`rotate(${dx * 5} ${64 + dx} ${62 + dy})`} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${86 + i * 3} ${42 + i * 11}) rotate(${-24 + i * 8})`}>
          <path d="M-16,-6 C-6,-12 8,-10 16,-4 C10,6 -6,8 -16,-6Z" fill="#f3b72e" stroke="#c98a14" strokeWidth="1.2" />
          <path d="M-10,-4 C-2,-8 6,-7 11,-3" stroke="#fbd877" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {[[58, 56], [66, 60], [70, 52], [62, 66]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill="#2e2a24" />
      ))}
    </g>
  )
}

function LodChong() {
  const noodles = [
    'M56,52 C62,46 68,58 74,52 C80,46 84,58 90,52',
    'M54,62 C60,56 66,68 72,62 C78,56 84,68 92,62',
    'M58,72 C64,66 70,78 76,72 C82,66 88,76 94,70',
  ]
  return (
    <Bowl milk="#fbf3dc">
      {noodles.map((d, i) => (
        <path key={i} d={d} stroke="#5fae4f" strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
      <IceCube x={70} y={40} r={14} />
      <IceCube x={88} y={72} r={-8} />
      <circle cx="94" cy="48" r="3" fill="#f0d9a8" />
    </Bowl>
  )
}

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
    case 'thai-iced-tea':
      return <ThaiIcedTea />
    case 'lemon-tea':
      return <LemonTea />
    case 'green-milk-tea':
      return <GreenMilkTea />
    case 'bua-loi':
      return <BuaLoi />
    case 'mango-sticky-rice':
      return <MangoStickyRice />
    case 'lod-chong':
      return <LodChong />
    default:
      return <GenericDishPlate />
  }
}

/* ---------------- Main Component ---------------- */

/** The bare plate drawing alone (no figure, no caption). Callers own the simulation caption. */
export function DishPlate({ slug, className, label }: { slug: string; className?: string; label?: string }) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': 'true' as const }
  return (
    <svg viewBox="22 12 114 102" className={cn('block h-auto w-full select-none overflow-visible', className)} {...a11y}>
      <Plate />
      <FoodIllustration slug={slug} />
    </svg>
  )
}

/**
 * One dish as a bare top-down plate, no tile behind it. The simulation caption is part of the figure (a figcaption
 * under the plate), never an overlay on the food, and stays in the accessibility tree.
 */
export function DishSvgArt({ slug, className, standaloneLabel }: DishSvgArtProps) {
  return (
    <figure className={cn('m-0 flex w-full flex-col gap-1', className)}>
      <DishPlate slug={slug} label={standaloneLabel} />
      <figcaption className="pr-caption text-center opacity-90">ภาพจำลอง</figcaption>
    </figure>
  )
}
