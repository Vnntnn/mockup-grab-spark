import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, MemoryRouter, useNavigate, useParams, useInRouterContext } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { SiteFooter } from '@/components/SiteFooter'
import { LangToggle } from '@/i18n/LangToggle'
import { toast } from '@/i18n/toast'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { baht } from '@/lib/format'
import { useApp } from '@/app/store'
import type { AppState } from '@/domain/types'
import { DEFAULT_CAMPAIGN_ID, resolvePairingCampaign } from './data'
import { withViewTransition } from './motion'
import { sharePairingLink } from './share'
import { usePairingNavigation } from './hooks/usePairingNavigation'
import { PairProgress } from './components/PairProgress'
import { PairingHeader } from './components/PairingHeader'
import { CustomerDemoTools } from './components/CustomerDemoTools'
import { SelectionDock } from './components/SelectionDock'
import { StoreModal } from './components/StoreModal'
import { Screen1Discover } from './screens/Screen1Discover'
import { Screen2SelectMain } from './screens/Screen2SelectMain'
import { Screen3SelectComplement } from './screens/Screen3SelectComplement'
import { Screen4Result } from './screens/Screen4Result'
import { shortName } from './network'
import type { PairingCampaignData } from './types'

export interface CustomerPairingRouteProps {
  campaignId?: string
  testState?: AppState
}

function RecoveryView() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex items-center gap-2">
        <LangToggle />
        <CustomerDemoTools />
      </div>
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xs flex flex-col items-center gap-4">
        <div className="size-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <AlertCircle className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-ink">ไม่พบแคมเปญที่คุณค้นหา</h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          ลิงก์แคมเปญนี้อาจหมดอายุหรือไม่ถูกต้อง คุณสามารถดูตัวอย่างแคมเปญที่เปิดใช้งานอยู่ได้
        </p>
        <Button asChild className="min-h-[48px] px-6 text-[15px] font-semibold mt-2">
          <Link to={`/pair/${DEFAULT_CAMPAIGN_ID}?step=1`}>
            ดูแคมเปญตัวอย่าง
          </Link>
        </Button>
        <Link to="/pair" className="pr-body flex min-h-[48px] items-center font-semibold text-link decoration-1 underline underline-offset-[0.4em]">
          ดูร้านและคู่ร้านทั้งหมด
        </Link>
      </div>
      <SiteFooter merchantLink className="mt-6 w-full max-w-md" />
    </div>
  )
}

function CustomerPairingActive({
  data,
  campaignId,
}: {
  data: PairingCampaignData
  campaignId: string
}) {
  const validSlugsA = useMemo(() => data.menuA.map((d) => d.slug), [data.menuA])
  const validSlugsB = useMemo(() => data.menuB.map((d) => d.slug), [data.menuB])

  const nav = usePairingNavigation({
    campaignId,
    validSlugsA,
    validSlugsB,
  })

  useEffect(() => {
    if (nav.urlState.wasDemoted) {
      toast.info('กรุณาเลือกเมนูให้ครบถ้วนก่อนดูผลลัพธ์')
    }
  }, [nav.urlState.wasDemoted])

  const navigate = useNavigate()
  const goDiscovery = useCallback(() => navigate(`/pair?pairing=${data.campaignId}`), [navigate, data.campaignId])
  const [storeModalMerchant, setStoreModalMerchant] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current) }, [])

  const selectedDishA = useMemo(
    () => data.menuA.find((d) => d.slug === nav.urlState.dishA) ?? null,
    [data.menuA, nav.urlState.dishA]
  )

  const selectedDishB = useMemo(
    () => data.menuB.find((d) => d.slug === nav.urlState.dishB) ?? null,
    [data.menuB, nav.urlState.dishB]
  )

  const summaryText2 = selectedDishA
    ? `เลือกแล้ว: ${selectedDishA.name} · ${baht(selectedDishA.priceBaht)}`
    : 'กรุณาเลือก 1 รายการ'

  const summaryText3 =
    selectedDishA && selectedDishB
      ? `${selectedDishA.name} + ${selectedDishB.name}`
      : `เลือก${data.roleB.pick}เพื่อจับคู่`

  // On a step change (not first paint): back to the top and focus the new heading, so keyboard and screen-reader users land on the new screen.
  const dockStep = nav.urlState.step === 2 || nav.urlState.step === 3
  const mainRef = useRef<HTMLElement>(null)
  const prevStep = useRef(nav.urlState.step)
  useEffect(() => {
    if (prevStep.current === nav.urlState.step) return
    prevStep.current = nav.urlState.step
    window.scrollTo(0, 0)
    const heading = mainRef.current?.querySelector('h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }, [nav.urlState.step])

  const shareTitle = nav.urlState.isSample
    ? 'คู่เมนูตัวอย่างสำหรับการสาธิต - GemBond'
    : 'คู่เมนูที่คุณเลือก - GemBond'

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined') return
    const query = new URLSearchParams()
    query.set('step', '4')
    if (nav.urlState.dishA) query.set('dishA', nav.urlState.dishA)
    if (nav.urlState.dishB) query.set('dishB', nav.urlState.dishB)
    if (nav.urlState.isSample) query.set('sample', 'true')
    const shareUrl = `${window.location.origin}/pair/${data.campaignId}?${query.toString()}`
    const shareText =
      selectedDishA && selectedDishB
        ? `${selectedDishA.name} x ${selectedDishB.name}`
        : shareTitle

    const outcome = await sharePairingLink({ title: shareTitle, text: shareText, url: shareUrl })
    if (outcome === 'copied') {
      toast.success('คัดลอกลิงก์คู่เมนูนี้แล้ว')
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1800)
    }
    else if (outcome === 'failed') toast.error('ไม่สามารถคัดลอกลิงก์ได้')
  }, [data.campaignId, nav.urlState, selectedDishA, selectedDishB, shareTitle])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* header and the pair being built stay pinned together while the menu scrolls beneath them */}
      <div className="sticky top-0 z-30 bg-background">
        <PairingHeader
          step={nav.urlState.step}
          onBack={nav.urlState.step > 1 ? nav.goBack : goDiscovery}
        />
        {dockStep && (
          <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:px-6">
            <PairProgress
              data={data}
              dishA={selectedDishA}
              dishB={selectedDishB}
              active={nav.urlState.step === 3 ? 'B' : 'A'}
              onEditA={() => nav.goToStep(2)}
            />
          </div>
        )}
      </div>

      <main ref={mainRef} className="flex-1 [&_h1]:outline-none">
        {nav.urlState.step === 1 && (
          <div key="s1" className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:px-6">
            <Screen1Discover
              data={data}
              onStart={() => withViewTransition(nav.goToNextStep)}
              onLoadSample={() => withViewTransition(nav.goToSample)}
              onDiscover={goDiscovery}
            />
          </div>
        )}

        {nav.urlState.step === 2 && (
          <div key="s2" className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:px-6">
            <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12">
              <div className="lg:col-span-7">
                <Screen2SelectMain
                  data={data}
                  selectedSlug={nav.urlState.dishA}
                  onSelect={(dish) => nav.selectDish('A', dish.slug)}
                />
              </div>
              <div className="hidden lg:col-span-5 lg:block lg:pt-4">
                <SelectionDock
                  variant="desktop-sidebar"
                  dishA={selectedDishA}
                  dishB={selectedDishB}
                  slotA={{ restaurant: shortName(data.restaurantA.name), pick: data.roleA.pick }}
                  slotB={{ restaurant: shortName(data.restaurantB.name), pick: data.roleB.pick }}
                  step={2}
                  nextRestaurant={shortName(data.restaurantB.name)}
                  isEditing={nav.urlState.isEditing}
                  summaryText={summaryText2}
                  isEnabled={!!nav.urlState.dishA}
                  onNext={nav.goToNextStep}
                />
              </div>
            </div>
            <SelectionDock
              step={2}
              nextRestaurant={shortName(data.restaurantB.name)}
              isEditing={nav.urlState.isEditing}
              summaryText={summaryText2}
              isEnabled={!!nav.urlState.dishA}
              onNext={nav.goToNextStep}
            />
          </div>
        )}

        {nav.urlState.step === 3 && (
          <div key="s3" className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:px-6">
            <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12">
              <div className="lg:col-span-7">
                <Screen3SelectComplement
                  data={data}
                  selectedSlugB={nav.urlState.dishB}
                  onSelectB={(dish) => nav.selectDish('B', dish.slug)}
                />
              </div>
              <div className="hidden lg:col-span-5 lg:block lg:pt-4">
                <SelectionDock
                  variant="desktop-sidebar"
                  dishA={selectedDishA}
                  dishB={selectedDishB}
                  slotA={{ restaurant: shortName(data.restaurantA.name), pick: data.roleA.pick }}
                  slotB={{ restaurant: shortName(data.restaurantB.name), pick: data.roleB.pick }}
                  step={3}
                  isEditing={nav.urlState.isEditing}
                  summaryText={summaryText3}
                  isEnabled={!!nav.urlState.dishB}
                  onNext={() => withViewTransition(nav.goToNextStep)}
                />
              </div>
            </div>
            <SelectionDock
              step={3}
              isEditing={nav.urlState.isEditing}
              summaryText={summaryText3}
              isEnabled={!!nav.urlState.dishB}
              onNext={() => withViewTransition(nav.goToNextStep)}
            />
          </div>
        )}

        {nav.urlState.step === 4 && selectedDishA && selectedDishB && (
          <div key="s4" className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-6xl lg:px-6">
            <Screen4Result
              data={data}
              dishA={selectedDishA}
              dishB={selectedDishB}
              isSample={nav.urlState.isSample}
              onEditA={() => nav.startEditing(2)}
              onEditB={() => nav.startEditing(3)}
              onReset={nav.startOver}
              onOpenStore={(m) => setStoreModalMerchant(m)}
              onShare={handleShare}
              copied={copied}
              onDiscover={goDiscovery}
            />
          </div>
        )}
      </main>
      <SiteFooter merchantLink className="mx-auto w-full max-w-6xl px-4" />

      <StoreModal
        isOpen={!!storeModalMerchant}
        onClose={() => setStoreModalMerchant(null)}
        merchantName={storeModalMerchant || ''}
      />
      {/* /pair lives outside AppShell, so it needs its own toaster. Only the bottom offset is set (a string offset would squeeze the sides); it clears the selection dock on steps 2 and 3. */}
      <Toaster
        toastOptions={{ classNames: { toast: '!rounded-[0.625rem] !border-0 !bg-ink !text-[15px] !text-white' } }}
        position="bottom-center"
        offset={{ bottom: dockStep ? '120px' : '24px' }}
        mobileOffset={{ bottom: dockStep ? '120px' : '24px', left: '16px', right: '16px' }}
      />
    </div>
  )
}

function CustomerPairingContent({
  campaignId: propCampaignId,
  state,
}: {
  campaignId?: string
  state: AppState
}) {
  const params = useParams<{ campaignId: string }>()
  const resolvedCampaignId = propCampaignId ?? params.campaignId

  const data = useMemo(
    () =>
      resolvePairingCampaign(
        resolvedCampaignId,
        state.merchants,
        state.plans,
        state.campaigns
      ),
    [resolvedCampaignId, state.merchants, state.plans, state.campaigns]
  )

  if (!data || !resolvedCampaignId) {
    return <RecoveryView />
  }

  return <CustomerPairingActive data={data} campaignId={resolvedCampaignId} />
}

function CustomerPairingRouteLive(props: CustomerPairingRouteProps) {
  const { state } = useApp()
  return <CustomerPairingContent {...props} state={state} />
}

export function CustomerPairingRoute(props: CustomerPairingRouteProps) {
  const inRouter = useInRouterContext()

  if (!inRouter) {
    return (
      <MemoryRouter initialEntries={[`/pair/${props.campaignId ?? ''}`]}>
        <CustomerPairingRoute {...props} />
      </MemoryRouter>
    )
  }

  if (props.testState) {
    return <CustomerPairingContent {...props} state={props.testState} />
  }

  return <CustomerPairingRouteLive {...props} />
}
