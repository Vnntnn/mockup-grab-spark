import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { RoleIcon } from '../components/RoleIcon'
import { MAP_LEGEND_NOTE, MAP_POSITION_NOTE, MAP_ZONES, type DemoNetwork, type NetPairing, type NetRestaurant } from '../network'

export interface NetworkMapProps {
  network: DemoNetwork
  restaurantId: string | null
  pairingId: string | null
  onSelectRestaurant: (id: string) => void
  onSelectPairing: (id: string) => void
}

type Tone = 'selected' | 'related' | 'idle'

/**
 * Lines use pathLength=1, so dash sizes are fractions of the line. Three states differ by weight and pattern as well as
 * colour: selected = solid thick (and drawn in when it becomes selected), related = dashed, idle = dotted hairline.
 */
const LINE: Record<Tone, { stroke: string; width: number; dash: string }> = {
  selected: { stroke: '#161616', width: 4, dash: '1' },
  related: { stroke: '#161616', width: 2, dash: '0.05 0.035' },
  idle: { stroke: '#c9d0c9', width: 1.5, dash: '0.012 0.035' },
}

const HEX = (cx: number, cy: number, r: number) =>
  [0, 1, 2, 3, 4, 5].map((i) => `${(cx + r * Math.cos(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)},${(cy + r * Math.sin(Math.PI / 6 + (i * Math.PI) / 3)).toFixed(1)}`).join(' ')

function RestaurantHex({ tone, restaurantId }: { tone: Tone; restaurantId: string }) {
  return (
    <svg viewBox="0 0 48 48" className="size-12" aria-hidden="true" focusable="false">
      {tone === 'selected' && <polygon points={HEX(24, 24, 24)} fill="none" stroke="#161616" strokeWidth="1" strokeLinejoin="round" />}
      <polygon
        points={HEX(24, 24, 20)}
        fill={tone === 'selected' ? '#00b14f' : '#ffffff'}
        stroke="#161616"
        strokeWidth={tone === 'idle' ? 1.5 : 3}
        strokeLinejoin="round"
      />
      <RoleIcon restaurantId={restaurantId} x={12} y={12} width={24} height={24} strokeWidth={2.2} stroke="#0a0a0a" className="size-6" />
    </svg>
  )
}

/** The bond between two restaurants, drawn as two overlapping gems: the same shape as the GemBond mark. */
function BondGem({ tone }: { tone: Tone }) {
  const snap = tone === 'selected'
  const fill = tone === 'selected' ? '#00b14f' : '#ffffff'
  const sw = tone === 'idle' ? 1.5 : 2.5
  return (
    <svg viewBox="0 0 44 32" className={cn('h-8 w-11', tone === 'selected' && 'scale-110')} aria-hidden="true" focusable="false">
      <polygon className={snap ? 'gem-snap-a' : undefined} points={HEX(15, 16, 12)} fill={fill} stroke="#161616" strokeWidth={sw} strokeLinejoin="round" />
      <polygon className={snap ? 'gem-snap-b' : undefined} points={HEX(29, 16, 12)} fill={fill} stroke="#161616" strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  )
}

/**
 * A schematic map. Positions are illustrative (see MAP_POSITION_NOTE), drawn from the fixtures' neighbourhood labels.
 * Restaurants are hexagons, pairings are the two-gem bond on the line between their restaurants. Both are real buttons
 * (keyboard reachable, aria-pressed); the list beside it is the non-map path.
 */
export function NetworkMap({ network, restaurantId, pairingId, onSelectRestaurant, onSelectPairing }: NetworkMapProps) {
  const activePairing = network.pairings.find((p) => p.id === pairingId) ?? null
  const selectedIds = new Set<string>(activePairing ? [activePairing.first.id, activePairing.second.id] : restaurantId ? [restaurantId] : [])
  const relatedIds = new Set<string>()
  if (restaurantId && !activePairing) {
    for (const p of network.pairings) {
      if (p.first.id === restaurantId) relatedIds.add(p.second.id)
      if (p.second.id === restaurantId) relatedIds.add(p.first.id)
    }
  }
  const restaurantTone = (r: NetRestaurant): Tone => (selectedIds.has(r.id) ? 'selected' : relatedIds.has(r.id) ? 'related' : 'idle')
  const pairingTone = (p: NetPairing): Tone =>
    p.id === pairingId ? 'selected' : restaurantId && !activePairing && (p.first.id === restaurantId || p.second.id === restaurantId) ? 'related' : 'idle'

  const mid = (p: NetPairing) => ({ x: (p.first.place.x + p.second.place.x) / 2, y: (p.first.place.y + p.second.place.y) / 2 })
  // the lines are drawn in real pixels (not a stretched 0..100 box) so dashes and the draw-in stay true at any map size
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 500 })
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const px = (x: number) => (x / 100) * size.w
  const py = (y: number) => (y / 100) * size.h
  const order = [...network.pairings].sort((a, b) => Number(pairingTone(a) !== 'idle') - Number(pairingTone(b) !== 'idle'))

  return (
    <div>
      <div
        ref={boxRef}
        role="group"
        aria-label="แผนที่สมมติของร้านที่เข้าร่วมและคู่ร้าน"
        className="relative aspect-square w-full overflow-hidden min-[400px]:aspect-[6/5] rounded-xl border border-border bg-card sm:aspect-[4/3]"
      >
        <svg viewBox={`0 0 ${size.w} ${size.h}`} className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
          {MAP_ZONES.map((z, i) => (
            <rect key={z.neighborhood} x={px(z.x)} y={0} width={px(z.width)} height={size.h} fill={i % 2 ? '#eef1ee' : '#ffffff'} />
          ))}
          <line x1={px(66)} y1="0" x2={px(66)} y2={size.h} stroke="#c9d0c9" strokeWidth="1" />
          {order.map((p, i) => {
            const tone = pairingTone(p)
            const t = LINE[tone]
            return (
              <line
                // remounting on a tone change replays the draw, so choosing a pairing visibly connects its two restaurants
                key={`${p.id}-${tone}`}
                x1={px(p.first.place.x)}
                y1={py(p.first.place.y)}
                x2={px(p.second.place.x)}
                y2={py(p.second.place.y)}
                pathLength={1}
                stroke={t.stroke}
                strokeWidth={t.width}
                strokeDasharray={t.dash}
                strokeLinecap="round"
                className={tone === 'selected' ? 'pr-draw' : 'pr-swap'}
                style={{ ['--i' as string]: tone === 'selected' ? 0 : i + 5 }}
              />
            )
          })}
        </svg>

        {MAP_ZONES.map((z) => (
          <span
            key={z.neighborhood}
            aria-hidden="true"
            className="pr-caption pointer-events-none absolute top-2 leading-tight text-muted-foreground"
            style={{ left: `calc(${z.x}% + 8px)`, maxWidth: `calc(${z.width}% - 14px)` }}
          >
            {z.neighborhood}
          </span>
        ))}

        {network.pairings.map((p) => {
          const tone = pairingTone(p)
          const m = mid(p)
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={tone === 'selected'}
              aria-label={`คู่ร้าน ${p.first.shortName} กับ ${p.second.shortName}`}
              onClick={() => onSelectPairing(p.id)}
              className="pr-pop absolute z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
              style={{ left: `${m.x}%`, top: `${m.y}%`, ['--i' as string]: 6 }}
            >
              {/* keyed by tone: choosing it mounts a fresh ring, which plays once */}
              {tone === 'selected' && <span key="ping" aria-hidden="true" className="pr-ping pointer-events-none absolute inset-1 rounded-full border-2 border-brand" />}
              <span className="rounded-full bg-card/80 p-0.5 transition-transform duration-[var(--dur-micro)]">
                <BondGem key={tone} tone={tone} />
              </span>
            </button>
          )
        })}

        {network.restaurants.map((r, i) => {
          const tone = restaurantTone(r)
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={tone === 'selected'}
              aria-label={`${r.name} ${r.role.section} อยู่ใน ${r.pairingIds.length} คู่ร้าน`}
              onClick={() => onSelectRestaurant(r.id)}
              className="pr-pop absolute z-20 flex w-24 -translate-x-1/2 -translate-y-6 cursor-pointer flex-col items-center rounded-lg"
              style={{ left: `${r.place.x}%`, top: `${r.place.y}%`, ['--i' as string]: i }}
            >
              {tone === 'selected' && <span key="ping" aria-hidden="true" className="pr-ping pointer-events-none absolute left-1/2 top-0 size-12 -translate-x-1/2 rounded-full border-2 border-brand" />}
              <span className={cn('transition-transform duration-[var(--dur-micro)] ease-out', tone === 'selected' && 'scale-110')}>
                <RestaurantHex tone={tone} restaurantId={r.id} />
              </span>
              <span
                className={cn(
                  'pr-caption -mt-0.5 text-center leading-tight text-ink [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_0_5px_#fff]',
                  tone === 'idle' ? 'font-semibold' : 'font-bold',
                )}
              >
                {r.shortName}
              </span>
            </button>
          )
        })}
      </div>
      <p className="pr-caption mt-2 text-muted-foreground">
        <span>{MAP_LEGEND_NOTE}</span> <span>{MAP_POSITION_NOTE}</span>
      </p>
    </div>
  )
}
