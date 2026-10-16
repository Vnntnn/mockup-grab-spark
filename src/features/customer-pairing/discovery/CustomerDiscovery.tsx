import { useCallback, useEffect, useMemo, useRef } from 'react'
import { MemoryRouter, useInRouterContext, useNavigate, useSearchParams } from 'react-router-dom'
import { MousePointerClick, Receipt, Utensils } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { SiteFooter } from '@/components/SiteFooter'
import { LangToggle } from '@/i18n/LangToggle'
import { GemMark } from '@/components/GemMark'
import { useApp } from '@/app/store'
import type { AppState } from '@/domain/types'
import { cn } from '@/lib/utils'
import { DEFAULT_CAMPAIGN_ID } from '../data'
import { withViewTransition } from '../motion'
import { DEMO_NETWORK_NOTE, buildDiscoveryUrl, buildNetwork, parseDiscoveryParams } from '../network'
import { CustomerDemoTools } from '../components/CustomerDemoTools'
import { PairingList, RestaurantList } from './NetworkList'
import { NetworkMap } from './NetworkMap'
import { Spotlight, StartBar } from './Spotlight'

const STEPS = [
  { Icon: MousePointerClick, text: 'เลือกคู่ร้าน' },
  { Icon: Utensils, text: 'เลือกเมนูร้านละ 1 อย่าง' },
  { Icon: Receipt, text: 'สั่งแยกตามร้าน' },
] as const

function Content({ state }: { state: AppState }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const network = useMemo(() => buildNetwork(state.merchants), [state.merchants])
  const sel = useMemo(() => parseDiscoveryParams(params, network), [params, network])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)
  const featured = network.pairings.find((p) => p.id === DEFAULT_CAMPAIGN_ID) ?? network.pairings[0]

  // a stale or tampered link (unknown id, stray params) degrades to the nearest valid selection
  useEffect(() => {
    if (sel.needsCanonicalization) navigate(sel.canonical, { replace: true })
  }, [sel.needsCanonicalization, sel.canonical, navigate])

  const update = useCallback(
    (next: { restaurantId?: string | null; pairingId?: string | null; view?: 'map' | 'list' }) => {
      navigate(
        buildDiscoveryUrl({ restaurantId: next.restaurantId ?? null, pairingId: next.pairingId ?? null, view: next.view ?? sel.view }),
        { replace: true },
      )
    },
    [navigate, sel.view],
  )

  const selectRestaurant = useCallback((id: string) => update({ restaurantId: id }), [update])
  const selectPairing = useCallback((id: string) => update({ pairingId: id }), [update])
  const clearSelection = useCallback(() => update({}), [update])
  const start = useCallback(
    // one of the two selective page transitions in the app: leaving the map for the dish steps
    (pairingId: string) => withViewTransition(() => navigate(`/pair/${pairingId}?step=2`, { state: { inJourney: true, journeyDepth: 2 } })),
    [navigate],
  )

  const hasSelection = !!sel.pairingId || !!sel.restaurantId
  const spotlightPairing = sel.pairingId ? (network.pairings.find((p) => p.id === sel.pairingId) ?? null) : sel.restaurantId ? null : (featured ?? null)
  const spotlightRestaurant = !spotlightPairing && sel.restaurantId ? (network.restaurants.find((r) => r.id === sel.restaurantId) ?? null) : null

  // choosing something swaps the spotlight; bring it into view and tell assistive tech by moving focus to its heading
  const selectionKey = `${sel.pairingId ?? ''}|${sel.restaurantId ?? ''}`
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const top = spotRef.current?.getBoundingClientRect().top ?? 0
    // a picked pairing is named in the bottom bar on phones, so the map stays in view; a restaurant has no bar, so show its panel
    if (sel.restaurantId && (top < 0 || top > window.innerHeight * 0.6)) spotRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    headingRef.current?.focus({ preventScroll: true })
  }, [selectionKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape goes back to the suggested pairing from anywhere (focus may be on the body after a navigation)
  useEffect(() => {
    if (!hasSelection) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [hasSelection, clearSelection])

  const switchBtn = (v: 'map' | 'list') =>
    cn(
      'pr-body pr-press min-h-[48px] flex-1 cursor-pointer rounded-[0.625rem] border px-4 font-semibold',
      sel.view === v ? 'border-ink bg-ink text-white' : 'border-border bg-card text-foreground',
    )

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        <p className="flex items-center gap-2 font-heading text-xl font-bold">
          <GemMark className="size-8" snap />
          GemBond
        </p>
        <div className="flex items-center gap-3">
          <p className="pr-caption hidden text-right text-muted-foreground min-[400px]:block">ข้อมูลตัวอย่างเพื่อสาธิต</p>
          <LangToggle />
          <CustomerDemoTools />
        </div>
      </header>

      <main className={cn('mx-auto max-w-6xl px-4 lg:px-6 lg:pb-12', spotlightPairing ? 'pb-44' : 'pb-12')}>
        <p className="pr-caption pt-1 text-muted-foreground min-[400px]:hidden">ข้อมูลตัวอย่างเพื่อสาธิต</p>
        <h1 className="pr-display pr-rise pt-1 lg:pt-4" style={{ ['--i' as string]: 0 }}>
          จับคู่เมนูจากสองร้าน
        </h1>
        <ol aria-label="ขั้นตอนการจับคู่เมนู" className="pr-rise mt-3 grid max-w-2xl grid-cols-3 gap-3 [@media(max-height:760px)]:hidden" style={{ ['--i' as string]: 1 }}>
          {STEPS.map(({ Icon, text }, i) => (
            <li key={text} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-accent text-ink">
                <Icon className="size-5" aria-hidden="true" />
                <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[12px] font-bold leading-none text-white">
                  {i + 1}
                </span>
              </span>
              <span className="pr-caption font-semibold leading-snug text-ink">{text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-x-10">
          <div className="pr-rise" style={{ ['--i' as string]: 2 }}>
            <div className="mb-3 flex gap-2" role="group" aria-label="เลือกมุมมอง">
              {(['map', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={sel.view === v}
                  onClick={() => update({ restaurantId: sel.restaurantId, pairingId: sel.pairingId, view: v })}
                  className={switchBtn(v)}
                >
                  {v === 'map' ? 'แผนที่' : 'รายการ'}
                </button>
              ))}
            </div>

            {sel.view === 'map' ? (
              <div>
                <NetworkMap
                  network={network}
                  restaurantId={sel.restaurantId}
                  pairingId={sel.pairingId ?? spotlightPairing?.id ?? null}
                  onSelectRestaurant={selectRestaurant}
                  onSelectPairing={selectPairing}
                />
              </div>
            ) : (
              <div>
                <PairingList pairings={network.pairings} onSelectPairing={selectPairing} heading="คู่ร้านทั้งหมด" selectedId={spotlightPairing?.id} />
                <section className="mt-6" aria-labelledby="restaurant-list-heading">
                  <h2 id="restaurant-list-heading" className="pr-name pb-2">
                    ร้านทั้งหมด ({network.restaurants.length})
                  </h2>
                  <RestaurantList network={network} restaurantId={sel.restaurantId} onSelectRestaurant={selectRestaurant} />
                </section>
              </div>
            )}
          </div>

          <div ref={spotRef} className="pr-rise mt-6 scroll-mt-3 lg:mt-[3.75rem]" style={{ ['--i' as string]: 3 }}>
            <Spotlight
              ref={headingRef}
              network={network}
              pairing={spotlightPairing}
              restaurant={spotlightRestaurant}
              isSuggested={!hasSelection}
              onSelectRestaurant={selectRestaurant}
              onSelectPairing={selectPairing}
              onBack={clearSelection}
              onStart={start}
            />
          </div>
        </div>
        <p className="pr-caption mt-8 text-muted-foreground">{DEMO_NETWORK_NOTE}</p>
        <SiteFooter merchantLink className="mt-6" />
      </main>
      {spotlightPairing && <StartBar pairing={spotlightPairing} onStart={start} />}
      <Toaster position="bottom-center" />
    </div>
  )
}

function Live() {
  const { state } = useApp()
  return <Content state={state} />
}

/** `/pair`: where a customer starts. Selection lives in the URL (?pairing=, ?restaurant=, ?view=) so Back, reload and links work. */
export function CustomerDiscovery({ testState }: { testState?: AppState }) {
  const inRouter = useInRouterContext()
  if (!inRouter) {
    return (
      <MemoryRouter initialEntries={['/pair']}>
        <CustomerDiscovery testState={testState} />
      </MemoryRouter>
    )
  }
  return testState ? <Content state={testState} /> : <Live />
}
