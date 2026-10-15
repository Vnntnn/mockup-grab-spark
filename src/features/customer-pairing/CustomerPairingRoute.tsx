import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, MemoryRouter, useParams, useInRouterContext } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { baht } from '@/lib/format'
import { useApp } from '@/app/store'
import type { AppState } from '@/domain/types'
import { DEFAULT_CAMPAIGN_ID, resolvePairingCampaign } from './data'
import { usePairingNavigation } from './hooks/usePairingNavigation'
import { PairingHeader } from './components/PairingHeader'
import { SelectionDock } from './components/SelectionDock'
import { StoreModal } from './components/StoreModal'
import { Screen1Discover } from './screens/Screen1Discover'
import { Screen2SelectMain } from './screens/Screen2SelectMain'
import { Screen3SelectComplement } from './screens/Screen3SelectComplement'
import { Screen4Result } from './screens/Screen4Result'
import type { PairingCampaignData } from './types'

export interface CustomerPairingRouteProps {
  campaignId?: string
  testState?: AppState
}

function RecoveryView() {
  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#0A0A0A] font-['Sarabun',sans-serif] flex flex-col items-center justify-center p-6 text-center">
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
      </div>
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

  const [storeModalMerchant, setStoreModalMerchant] = useState<string | null>(null)

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
    : 'ยังไม่ได้เลือกเมนู'

  const summaryText3 = selectedDishB
    ? `เลือกแล้ว: ${selectedDishB.name} · ${baht(selectedDishB.priceBaht)}`
    : 'ยังไม่ได้เลือกของว่าง'

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

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('คัดลอกลิงก์คู่เมนูนี้แล้ว')
      } catch {
        toast.error('ไม่สามารถคัดลอกลิงก์ได้')
      }
    }
  }, [data.campaignId, nav.urlState, selectedDishA, selectedDishB, shareTitle])

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-[#0A0A0A] font-['Sarabun',sans-serif] flex flex-col">
      <PairingHeader
        step={nav.urlState.step}
        onBack={nav.urlState.step > 1 ? nav.goBack : undefined}
        onShare={nav.urlState.step === 4 ? handleShare : undefined}
      />

      <main className="flex-1">
        {nav.urlState.step === 1 && (
          <div className="max-w-5xl mx-auto w-full px-4 py-4">
            <Screen1Discover
              data={data}
              onStart={nav.goToNextStep}
              onLoadSample={nav.goToSample}
            />
          </div>
        )}

        {nav.urlState.step === 2 && (
          <div className="max-w-5xl mx-auto w-full px-4 py-4">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-7">
                <Screen2SelectMain
                  data={data}
                  selectedSlug={nav.urlState.dishA}
                  onSelect={(dish) => nav.selectDish('A', dish.slug)}
                />
              </div>
              <div className="hidden lg:block lg:col-span-5">
                <SelectionDock
                  variant="desktop-sidebar"
                  step={2}
                  isEditing={nav.urlState.isEditing}
                  summaryText={summaryText2}
                  isEnabled={!!nav.urlState.dishA}
                  onNext={nav.goToNextStep}
                />
              </div>
            </div>
            <SelectionDock
              step={2}
              isEditing={nav.urlState.isEditing}
              summaryText={summaryText2}
              isEnabled={!!nav.urlState.dishA}
              onNext={nav.goToNextStep}
            />
          </div>
        )}

        {nav.urlState.step === 3 && (
          <div className="max-w-5xl mx-auto w-full px-4 py-4">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-7">
                <Screen3SelectComplement
                  data={data}
                  selectedDishA={selectedDishA}
                  selectedSlugB={nav.urlState.dishB}
                  onSelectB={(dish) => nav.selectDish('B', dish.slug)}
                  onEditA={() => nav.goToStep(2)}
                />
              </div>
              <div className="hidden lg:block lg:col-span-5">
                <SelectionDock
                  variant="desktop-sidebar"
                  step={3}
                  isEditing={nav.urlState.isEditing}
                  summaryText={summaryText3}
                  isEnabled={!!nav.urlState.dishB}
                  onNext={nav.goToNextStep}
                />
              </div>
            </div>
            <SelectionDock
              step={3}
              isEditing={nav.urlState.isEditing}
              summaryText={summaryText3}
              isEnabled={!!nav.urlState.dishB}
              onNext={nav.goToNextStep}
            />
          </div>
        )}

        {nav.urlState.step === 4 && selectedDishA && selectedDishB && (
          <div className="max-w-5xl mx-auto w-full px-4 py-6">
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
            />
          </div>
        )}
      </main>

      <StoreModal
        isOpen={!!storeModalMerchant}
        onClose={() => setStoreModalMerchant(null)}
        merchantName={storeModalMerchant || ''}
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
