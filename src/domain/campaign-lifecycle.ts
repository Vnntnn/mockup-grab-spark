import { validateConsent } from './consent'
import { totalCommitmentBaht, refreshPlan } from './plans'
import { addDays } from '@/lib/dates'
import type { ActivationCheck, Campaign, CampaignStatus, GrowthPlan, Merchant, PlanLifecycle } from './types'

const STATUS_OF: Record<PlanLifecycle, CampaignStatus> = {
  awaiting: 'awaiting_consent',
  interested: 'awaiting_consent',
  ready: 'ready',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
  declined: 'awaiting_consent', // never launched; shown nowhere while declined
}

export const campaignStatusFor = (plan: GrowthPlan): CampaignStatus => STATUS_OF[plan.lifecycleStatus]

export function createCampaign(plan: GrowthPlan): Campaign {
  return {
    id: `camp-${plan.id}`,
    planId: plan.id,
    planVersion: plan.planVersion,
    startDate: null,
    endDate: null,
    status: campaignStatusFor(plan),
    agreedResponsibilities: plan.responsibilitiesByMerchant,
    measurementConfiguration: { baselineDays: 7, comparison: 'similar_stores', attribution: 'campaign_link' },
  }
}

/** Keep a not-yet-running campaign in step with its plan (version, responsibilities, status). */
export function syncCampaign(plan: GrowthPlan, campaign: Campaign): Campaign {
  const status = campaignStatusFor(plan)
  const running = ['active', 'completed', 'cancelled'].includes(campaign.status)
  return {
    ...campaign,
    status,
    planVersion: running ? campaign.planVersion : plan.planVersion,
    agreedResponsibilities: running ? campaign.agreedResponsibilities : plan.responsibilitiesByMerchant,
  }
}

/** The four conditions that must all hold before a campaign may become Active. */
export function checkActivation(plan: GrowthPlan, merchants: Merchant[]): ActivationCheck[] {
  const consent = validateConsent(plan)
  const names = (ids: string[]) => ids.map((id) => merchants.find((m) => m.id === id)?.name ?? id).join(', ')
  const stale = consent.staleVersion.length > 0
  const committed = plan.participatingMerchantIds.map((id) => totalCommitmentBaht(plan, id))
  const notReady = merchants.filter(
    (m) => plan.participatingMerchantIds.includes(m.id) && (m.readinessStatus === 'not_ready' || m.policyStatus !== 'clear'),
  )
  return [
    {
      id: 'all-consented',
      label: 'ร้านทั้งสองฝ่ายยืนยันแล้ว',
      passed: !consent.missing.length,
      detail: consent.missing.length ? `ยังรอ: ${names(consent.missing)}` : 'ครบทุกร้าน',
    },
    {
      id: 'same-version',
      label: `ทั้งสองร้านยืนยันเงื่อนไขฉบับเดียวกัน (ฉบับที่ ${plan.planVersion})`,
      passed: !stale && !consent.missing.length,
      detail: stale ? `เงื่อนไขเปลี่ยนแล้ว ต้องยืนยันใหม่: ${names(consent.staleVersion)}` : consent.missing.length ? 'ยังไม่ครบ' : 'ตรงกัน',
    },
    {
      id: 'fairness',
      label: 'ผ่านการตรวจความเป็นธรรม',
      passed: plan.fairnessCheckStatus === 'passed',
      detail: plan.fairnessCheckStatus === 'passed' ? 'ผ่านทุกข้อ' : 'ยังไม่ผ่าน จึงเริ่มไม่ได้',
    },
    {
      id: 'conditions',
      label: 'เงื่อนไขการเงินและความพร้อมของร้านครบ',
      passed: committed.every((c) => c !== null) && !notReady.length,
      detail: committed.some((c) => c === null)
        ? 'มีค่าใช้จ่ายที่ยังไม่ทราบจำนวน'
        : notReady.length
          ? `ยังไม่พร้อม: ${names(notReady.map((m) => m.id))}`
          : 'ไม่มีค่าใช้จ่ายค้างและทุกร้านพร้อม',
    },
  ]
}

export type TransitionResult =
  | { ok: true; plan: GrowthPlan; campaign: Campaign }
  | { ok: false; reasons: string[] }

export function activateCampaign(plan: GrowthPlan, campaign: Campaign, merchants: Merchant[], today: string): TransitionResult {
  if (plan.lifecycleStatus !== 'ready') return { ok: false, reasons: ['แผนยังไม่อยู่ในสถานะพร้อมเริ่ม'] }
  const failed = checkActivation(plan, merchants).filter((c) => !c.passed)
  if (failed.length) return { ok: false, reasons: failed.map((f) => f.label) }
  return {
    ok: true,
    plan: refreshPlan({ ...plan, lifecycleStatus: 'active' }, today),
    campaign: {
      ...campaign,
      planVersion: plan.planVersion,
      status: 'active',
      startDate: today,
      endDate: addDays(today, plan.durationDays - 1),
    },
  }
}

/** Demo clock moves to the day after the end date. */
export function completeCampaign(plan: GrowthPlan, campaign: Campaign): TransitionResult {
  if (campaign.status !== 'active' || !campaign.endDate) return { ok: false, reasons: ['แคมเปญยังไม่เริ่ม'] }
  const now = addDays(campaign.endDate, 1)
  return {
    ok: true,
    plan: refreshPlan({ ...plan, lifecycleStatus: 'completed' }, now),
    campaign: { ...campaign, status: 'completed' },
  }
}

/** Merchant withdrawal from an agreed plan (ready or active). Never penalised. Before agreement, use decline. */
export function cancelCampaign(plan: GrowthPlan, campaign: Campaign, now: string): TransitionResult {
  if (plan.lifecycleStatus !== 'ready' && plan.lifecycleStatus !== 'active') return { ok: false, reasons: ['ยกเลิกได้เฉพาะแผนที่ร้านทั้งสองยืนยันแล้วหรือกำลังดำเนินการ'] }
  return {
    ok: true,
    plan: refreshPlan({ ...plan, lifecycleStatus: 'cancelled' }, now),
    campaign: { ...campaign, status: 'cancelled' },
  }
}
