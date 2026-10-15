import { campaignStatusFor } from './campaign-lifecycle'
import { validateConsent } from './consent'
import { validateGrowthPlan } from './fairness'
import { deriveLifecycle } from './plans'
import type { AppState } from './types'

/** Properties that must hold in EVERY reachable state. Returns human-readable violations (empty = consistent). */
export function checkInvariants(s: AppState): string[] {
  const bad: string[] = []
  if (s.sellingStatus !== 'normal') bad.push('selling status changed')
  const running = Object.values(s.campaigns).filter((c) => c.status === 'active')
  if (running.length > 1) bad.push(`more than one active campaign: ${running.map((c) => c.id).join(', ')}`)
  for (const p of Object.values(s.plans)) {
    const tag = p.id
    const camp = s.campaigns[p.id]
    const fair = validateGrowthPlan(p).status
    if (p.fairnessCheckStatus !== fair) bad.push(`${tag}: stored fairness ${p.fairnessCheckStatus} != computed ${fair}`)
    if (fair !== 'passed') bad.push(`${tag}: a plan that fails fairness is present`)
    if (p.lifecycleStatus !== deriveLifecycle(p, fair) && !['active', 'completed', 'cancelled'].includes(p.lifecycleStatus))
      bad.push(`${tag}: lifecycle ${p.lifecycleStatus} != derived ${deriveLifecycle(p, fair)}`)
    if (!camp) bad.push(`${tag}: no campaign`)
    else {
      if (camp.status !== campaignStatusFor(p)) bad.push(`${tag}: campaign ${camp.status} contradicts plan ${p.lifecycleStatus}`)
      if (['active', 'completed'].includes(camp.status) && (!camp.startDate || !camp.endDate)) bad.push(`${tag}: running campaign without dates`)
      if (['awaiting_consent', 'ready'].includes(camp.status) && camp.startDate) bad.push(`${tag}: unlaunched campaign has a start date`)
    }
    if (['ready', 'active', 'completed'].includes(p.lifecycleStatus)) {
      // consent is checked against the current version for ready; active/completed were activated under their version
      if (p.lifecycleStatus === 'ready' && !validateConsent(p).ok) bad.push(`${tag}: ready without valid consent`)
      if (camp && ['active', 'completed'].includes(camp.status) && camp.planVersion !== p.planVersion) bad.push(`${tag}: running under a different terms version`)
      if (['active', 'completed'].includes(p.lifecycleStatus) && !validateConsent(p).ok) bad.push(`${tag}: ${p.lifecycleStatus} without valid consent`)
    }
    const ids = p.consentRecords.map((r) => r.merchantId)
    if (new Set(ids).size !== ids.length || ids.length !== p.participatingMerchantIds.length) bad.push(`${tag}: consent records not one-per-merchant`)
    for (const r of p.consentRecords) {
      if (!p.participatingMerchantIds.includes(r.merchantId)) bad.push(`${tag}: consent from a non-participant`)
      if (r.consentStatus === 'accepted' && r.termsVersion !== p.planVersion) bad.push(`${tag}: accepted consent for stale version ${r.termsVersion}`)
      if (r.termsVersion > p.planVersion) bad.push(`${tag}: consent for a future version`)
    }
    if (p.changeLog[p.changeLog.length - 1]?.version !== p.planVersion) bad.push(`${tag}: change log does not end at planVersion`)
    if (p.lifecycleStatus === 'declined' && !p.consentRecords.some((r) => r.consentStatus === 'declined')) bad.push(`${tag}: declined without a decline record`)
  }
  return bad
}
