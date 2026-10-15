export interface WaterfallInputs {
  baseline: number
  marketTrend: number
  gemBondUplift: number
}

export interface WaterfallSegments {
  total: number
  baselinePercent: number
  marketPercent: number
  boostPercent: number
}

export function computeWaterfallSegments(inputs: WaterfallInputs): WaterfallSegments {
  const total = Math.max(1, inputs.baseline + inputs.marketTrend + inputs.gemBondUplift)
  return {
    total,
    baselinePercent: (inputs.baseline / total) * 100,
    marketPercent: (inputs.marketTrend / total) * 100,
    boostPercent: (inputs.gemBondUplift / total) * 100,
  }
}

/**
 * The three-part split (baseline + expected anyway + estimated from the campaign) is only meaningful when each part is a
 * non-negative count and the campaign period actually sold more than the scaled baseline. Otherwise the ledger is shown alone.
 */
export function canShowOrderSplit(i: { observed: number; expectedAnyway: number; fromCampaign: number } | null): i is { observed: number; expectedAnyway: number; fromCampaign: number } {
  return i !== null && i.observed > 0 && i.expectedAnyway >= 0 && i.fromCampaign >= 0
}
