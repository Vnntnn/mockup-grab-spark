export type MerchantId = string
export type ReadinessStatus = 'ready' | 'almost' | 'not_ready'
export type ParticipationPreference = 'open' | 'selective' | 'not_now'
export type PolicyStatus = 'clear' | 'under_review'

export interface OperatingHours {
  open: string // 'HH:MM'
  close: string // 'HH:MM' — close <= open means the shop closes after midnight
}

export interface MenuItem {
  name: string
  priceBaht: number
}

export interface Merchant {
  id: MerchantId
  name: string
  category: string
  neighborhood: string
  operatingHours: OperatingHours
  menuCategories: string[]
  readinessStatus: ReadinessStatus
  participationPreference: ParticipationPreference
  policyStatus: PolicyStatus
  scale: 'small' | 'established'
  blurb: string
  sampleMenu: MenuItem[]
}

// ---------- matching ----------
export type MatchFactor = 'complementarity' | 'proximity' | 'hours' | 'readiness' | 'preference'

export interface MatchReason {
  factor: MatchFactor
  label: string
  detail: string
  score: number // 0..1
  weight: number
}

export type EligibilityStatus = 'eligible' | 'ineligible' | 'blocked_by_fairness'

export interface PartnerRecommendation {
  id: string
  sourceMerchantId: MerchantId
  partnerMerchantId: MerchantId
  matchScore: number // 0..100
  matchReasons: MatchReason[]
  eligibilityStatus: EligibilityStatus
  proposedPlanId: string
  benefitForYou: string
  benefitForPartner: string
}

export interface FailedRule {
  id: string
  label: string
}

// ---------- plans ----------
export type CostPayer = 'smallMerchant' | 'partner' | 'gembond'

export interface CostLine {
  id: string
  label: string
  /** null = unresolved; an unresolved amount is never treated as approved */
  amountBaht: number | null
  payer: CostPayer
  trigger: string
  cap?: string
}

export interface CostTerms {
  merchantId: MerchantId
  lines: CostLine[]
  outsideScopeNote: string
}

export interface DiscountTerms {
  requiredFromSmallMerchant: boolean
  note: string
}

export interface RevenueSharingTerms {
  mandatory: boolean
  note: string
}

export interface DataPermission {
  id: string
  label: string
  sensitivity: 'shared' | 'private'
  partnerCanSee: boolean
}

export interface PlanSafeguards {
  renewConsentOnMaterialChange: boolean
  noPenaltyForDeclining: boolean
}

export type CampaignTemplateKind = 'awareness-cobrand' | 'bundle-discount'

export interface CampaignTemplate {
  id: string
  kind: CampaignTemplateKind
  name: string
  durationDays: number
}

export type ConsentStatus = 'pending' | 'accepted' | 'declined' | 'invalidated'

export interface ConsentRecord {
  merchantId: MerchantId
  planId: string
  termsVersion: number
  consentStatus: ConsentStatus
  timestamp: string | null
  relevantDisclosureAcknowledgements: string[]
}

export type PlanLifecycle =
  | 'awaiting'
  | 'interested'
  | 'ready'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'declined'

export type FairnessStatus = 'passed' | 'failed' | 'unresolved'

export interface PlanChange {
  version: number
  at: string
  summary: string
}

export interface GrowthPlan {
  id: string
  participatingMerchantIds: [MerchantId, MerchantId]
  campaignTemplateId: string
  planVersion: number
  title: string
  summary: string
  durationDays: number
  responsibilitiesByMerchant: Record<MerchantId, string[]>
  gembondResponsibilities: string[]
  costTermsByMerchant: Record<MerchantId, CostTerms>
  discountTerms: DiscountTerms
  revenueSharingTerms: RevenueSharingTerms
  dataPermissions: DataPermission[]
  safeguards: PlanSafeguards
  cancellationTerms: string[]
  changeLog: PlanChange[]
  fairnessCheckStatus: FairnessStatus
  consentRecords: ConsentRecord[]
  lifecycleStatus: PlanLifecycle
  updatedAt: string
}

export interface FairnessCheck {
  id: string
  label: string
  status: 'pass' | 'fail' | 'unresolved'
  detail: string
}

export interface FairnessReport {
  status: FairnessStatus
  checks: FairnessCheck[]
}

// ---------- campaigns ----------
export type CampaignStatus = 'awaiting_consent' | 'ready' | 'active' | 'completed' | 'cancelled'

export interface MeasurementConfiguration {
  baselineDays: number
  comparison: 'similar_stores'
  attribution: 'campaign_link'
}

export interface Campaign {
  id: string
  planId: string
  planVersion: number
  startDate: string | null // YYYY-MM-DD
  endDate: string | null
  status: CampaignStatus
  agreedResponsibilities: Record<MerchantId, string[]>
  measurementConfiguration: MeasurementConfiguration
}

export interface ActivationCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

// ---------- results ----------
export interface DailySeries {
  orders: number[]
  revenueBaht: number[]
}

export interface ComparisonGroup {
  label: string
  storeCount: number
  ordersChangePct: number
}

/** The merchant's own pre-campaign history is shared; each partner seed only supplies the campaign side. */
export interface ResultsSeed {
  /** Daily pattern for the campaign period. It repeats to cover the actual campaign length. */
  campaign: DailySeries
  /** Days of data actually reported. Omit when the report is complete. */
  reportedDays?: number
  clicks: number
  attributedOrders: number
  promotionalCostsBaht: number
  comparisonGroup: ComparisonGroup | null
}

export interface DateRange {
  start: string
  end: string
}

export type DataQualityStatus = 'sufficient' | 'limited' | 'insufficient'
export type InsufficientReason = 'baseline_short' | 'campaign_incomplete' | 'baseline_zero' | 'invalid_values'

export interface CampaignResults {
  campaignId: string
  reportingPeriod: DateRange
  baselinePeriod: DateRange
  orders: { baseline: number; campaign: number }
  revenue: { baseline: number; campaign: number }
  promotionalCosts: number
  /** null when the merchant has not given a cost estimate */
  relevantVariableCosts: number | null
  attributableClicks: number
  attributedOrders: number
  dataQualityStatus: DataQualityStatus
  derived: {
    /** Day counts actually reported. Changes are compared per day so unequal periods never mislead. */
    baselineDays: number
    campaignDays: number
    periodDays: number
    insufficientReason: InsufficientReason | null
    ordersChangePct: number
    revenueChangePct: number
    clickToOrderPct: number
    /** null when there is no comparison group or the baseline is too short */
    /** Baseline orders scaled to the campaign's length (equals the baseline total when the periods match). */
    baselineOrdersScaled: number
    expectedOrders: number | null
    estimatedIncrementalOrders: number | null
    contribution: number | null
    expectedBaselineContribution: number | null
    incrementalContribution: number | null
    comparisonLabel: string | null
  }
}

export type NextActionKind = 'continue' | 'change_message' | 'review_menu' | 'revise' | 'add_costs' | 'need_data'

export interface NextAction {
  kind: NextActionKind
  title: string
  body: string
}

// ---------- app state ----------
export type SupportCategoryId =
  | 'not_understand'
  | 'unexpected_cost'
  | 'unfair_terms'
  | 'cancel_plan'
  | 'other'

export interface SupportRequest {
  id: string
  category: SupportCategoryId
  note: string
  planId: string | null
  createdAt: string
}


export interface AppState {
  version: number
  today: string // YYYY-MM-DD, the demo clock
  selfId: MerchantId
  merchants: Record<MerchantId, Merchant>
  /** Normal selling rights. Declining or cancelling never changes this. */
  sellingStatus: 'normal'
  variableCostPct: number | null
  plans: Record<string, GrowthPlan>
  campaigns: Record<string, Campaign>
  supportRequests: SupportRequest[]
}
