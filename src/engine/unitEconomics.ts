export interface UnitEconomicsInput {
  manufacturingCost: number;
  packagingCost: number;
  shippingCost: number;
  tariffDuty: number;
  retailPrice: number;
  gatewayFeeRate?: number; // Default 0.0375 (3.75%, range 3.5%–4.0%)
  targetCac: number;
  repeatRate6Mo: number; // e.g., 0.25 for 25%
  competitorMonthlyVisits?: number;
}

export interface UnitEconomicsResult {
  landedCogs: number;
  markupMultiplier: number;
  gatewayFee: number;
  grossProfitDollars: number;
  grossProfitMarginPct: number;
  absoluteGrossSpread: number;
  breakEvenRoas: number;
  maxCpa: number;
  contributionMarginDollars: number;
  contributionMarginPct: number;
  ltv6Mo: number;
  ltvCacRatio: number;
  estimatedMonthlyRevenue: number;
  viabilityBand: 'REJECT' | 'FLOOR' | 'GREEN_ZONE' | 'RAPID_SCALE';
}

export interface ProductCandidate {
  id: string;
  name: string;
  category: string;
  weightKg: number;
  fitsShoebox: boolean;
  isFragileOrChemical: boolean;
  isRetailCommodity: boolean;
  activeCompetitors: number;
  seriousCompetitors: number;
  revenue30d: number;
  videoRevenueSharePct: number;
  activeAdSets: number;
  economics: UnitEconomicsInput;
  painUrgencyScore: number; // 0-100
  creativeWatchScore: number; // 0-100
  logisticsScore: number; // 0-100
}

export interface TournamentEvaluation {
  round1Passed: boolean;
  round1Reasons: string[];
  round2Passed: boolean;
  round2Reasons: string[];
  round3Passed: boolean;
  round3Reasons: string[];
  compositeScore: number;
  verdict: 'ADVANCE_TO_STOREFRONT' | 'WATCHLIST' | 'ELIMINATED';
  economics: UnitEconomicsResult;
}

export function calculateUnitEconomics(input: UnitEconomicsInput): UnitEconomicsResult {
  const gatewayFeeRate = input.gatewayFeeRate ?? 0.0375;
  const landedCogs = Number(
    (
      Math.max(0, input.manufacturingCost) +
      Math.max(0, input.packagingCost) +
      Math.max(0, input.shippingCost) +
      Math.max(0, input.tariffDuty)
    ).toFixed(2)
  );
  const retailPrice = Math.max(0.01, input.retailPrice);
  const markupMultiplier = landedCogs > 0 ? Number((retailPrice / landedCogs).toFixed(2)) : 0;
  const gatewayFee = Number((retailPrice * gatewayFeeRate).toFixed(2));
  const absoluteGrossSpread = Number((retailPrice - landedCogs).toFixed(2));
  const grossProfitDollars = Number((retailPrice - landedCogs - gatewayFee).toFixed(2));
  const grossProfitMarginPct = Number(((grossProfitDollars / retailPrice) * 100).toFixed(1));
  const breakEvenRoas =
    grossProfitDollars > 0 ? Number((retailPrice / grossProfitDollars).toFixed(2)) : 99.99;
  const maxCpa = Math.max(0, grossProfitDollars);
  const contributionMarginDollars = Number((grossProfitDollars - input.targetCac).toFixed(2));
  const contributionMarginPct = Number(((contributionMarginDollars / retailPrice) * 100).toFixed(1));
  const ltv6Mo = Number((retailPrice * (1 + Math.max(0, input.repeatRate6Mo))).toFixed(2));
  const ltvCacRatio = input.targetCac > 0 ? Number((ltv6Mo / input.targetCac).toFixed(2)) : 0;
  const estimatedMonthlyRevenue = Math.round(
    (input.competitorMonthlyVisits ?? 0) * 0.022 * retailPrice
  );

  let viabilityBand: UnitEconomicsResult['viabilityBand'] = 'REJECT';
  if (markupMultiplier >= 4.0 && absoluteGrossSpread >= 30) {
    viabilityBand = 'RAPID_SCALE';
  } else if (markupMultiplier >= 3.0 && absoluteGrossSpread >= 25) {
    viabilityBand = 'GREEN_ZONE';
  } else if (markupMultiplier >= 2.5 && absoluteGrossSpread >= 25) {
    viabilityBand = 'FLOOR';
  }

  return {
    landedCogs,
    markupMultiplier,
    gatewayFee,
    grossProfitDollars,
    grossProfitMarginPct,
    absoluteGrossSpread,
    breakEvenRoas,
    maxCpa,
    contributionMarginDollars,
    contributionMarginPct,
    ltv6Mo,
    ltvCacRatio,
    estimatedMonthlyRevenue,
    viabilityBand,
  };
}

export function evaluateProductTournament(candidate: ProductCandidate): TournamentEvaluation {
  const econ = calculateUnitEconomics(candidate.economics);

  // Round 1: Hard Exclusion Gate
  const round1Reasons: string[] = [];
  if (candidate.weightKg > 2.0) {
    round1Reasons.push(`Weight ${candidate.weightKg}kg exceeds 2.0kg air-line ceiling`);
  }
  if (!candidate.fitsShoebox) {
    round1Reasons.push('Exceeds shoebox volume (35x25x15cm) shipping limit');
  }
  if (candidate.isFragileOrChemical) {
    round1Reasons.push('Fragile glass/ceramic or uncertified topical chemical');
  }
  if (candidate.isRetailCommodity) {
    round1Reasons.push('Commodity widely stocked at big-box retail stores');
  }
  const round1Passed = round1Reasons.length === 0;

  // Round 2: Velocity & Saturation Gate
  const round2Reasons: string[] = [];
  if (candidate.activeCompetitors < 1) {
    round2Reasons.push('Zero proven active competitors (unvalidated demand)');
  }
  if (candidate.activeCompetitors > 10 || candidate.seriousCompetitors > 5) {
    round2Reasons.push(
      `Oversaturated market (${candidate.activeCompetitors} active / ${candidate.seriousCompetitors} serious stores)`
    );
  }
  if (candidate.revenue30d < 10000) {
    round2Reasons.push('30-day category velocity below $10,000 floor');
  }
  if (candidate.videoRevenueSharePct <= 50) {
    round2Reasons.push('Video attribution share must exceed 50% (not live-dependent)');
  }
  const round2Passed = round2Reasons.length === 0;

  // Round 3: Unit Economics & Composite 100-Point Score
  const round3Reasons: string[] = [];
  if (econ.markupMultiplier < 2.5) {
    round3Reasons.push(`Markup ${econ.markupMultiplier}x is below 2.5x hard floor`);
  }
  if (econ.absoluteGrossSpread < 25) {
    round3Reasons.push(`Gross spread $${econ.absoluteGrossSpread.toFixed(2)} is below $25.00 minimum`);
  }
  if (econ.grossProfitMarginPct < 50) {
    round3Reasons.push(`Gross margin ${econ.grossProfitMarginPct}% is below 50% floor`);
  }

  // Sub-scores (0-100 each)
  const ueScore = Math.min(
    100,
    Math.round(
      Math.min(50, (econ.markupMultiplier / 4.5) * 50) +
        Math.min(50, (econ.absoluteGrossSpread / 45) * 50)
    )
  );
  const velocityScore = Math.min(
    100,
    Math.round(
      (candidate.revenue30d >= 33000 && candidate.revenue30d <= 97000
        ? 60
        : candidate.revenue30d >= 10000
          ? 42
          : 15) + Math.min(40, (candidate.activeAdSets / 25) * 40)
    )
  );
  const lowSatScore =
    candidate.seriousCompetitors <= 3 && candidate.activeCompetitors <= 5
      ? 96
      : candidate.seriousCompetitors <= 5 && candidate.activeCompetitors <= 10
        ? 74
        : 25;

  const compositeScore = Math.round(
    0.25 * ueScore +
      0.2 * velocityScore +
      0.2 * lowSatScore +
      0.15 * Math.min(100, Math.max(0, candidate.painUrgencyScore)) +
      0.1 * Math.min(100, Math.max(0, candidate.creativeWatchScore)) +
      0.1 * Math.min(100, Math.max(0, candidate.logisticsScore))
  );

  if (compositeScore < 75) {
    round3Reasons.push(`Composite score ${compositeScore}/100 below 75/100 advancement cutoff`);
  }

  const round3Passed = round3Reasons.length === 0;

  let verdict: TournamentEvaluation['verdict'] = 'ELIMINATED';
  if (round1Passed && round2Passed && round3Passed) {
    verdict = 'ADVANCE_TO_STOREFRONT';
  } else if (round1Passed && compositeScore >= 65 && econ.markupMultiplier >= 2.5) {
    verdict = 'WATCHLIST';
  }

  return {
    round1Passed,
    round1Reasons,
    round2Passed,
    round2Reasons,
    round3Passed,
    round3Reasons,
    compositeScore,
    verdict,
    economics: econ,
  };
}

export interface DailyAdBudgetInput {
  retailPrice: number;
  landedCogs: number;
  gatewayFeeRate?: number; // Default 0.0375 (3.75%)
  dailyProfitGoal: number; // e.g., 100 ($100/day)
  cpc: number; // Cost per click in USD (e.g., 0.90)
  cvrPct: number; // Store conversion rate % (e.g., 3.5)
  seoTrafficSharePct: number; // 0 to 90% of daily traffic from organic SEO ($0 CPC)
}

export interface DailyAdBudgetPlan {
  isViable: boolean;
  reason: string;
  gatewayFeePerOrder: number;
  grossProfitBeforeAds: number;
  paidCpa: number;
  blendedCpa: number;
  netProfitPerOrder: number;
  netMarginPct: number;
  exactOrdersNeeded: number;
  wholeOrdersPerDay: number;
  totalDailyClicksNeeded: number;
  paidClicksPerDay: number;
  seoClicksPerDay: number;
  exactDailyAdBudget: number;
  recommendedDailyAdBudget: number;
  projectedDailyRevenue: number;
  projectedDailyCogs: number;
  projectedDailyGatewayFees: number;
  projectedDailyNetProfit: number;
  requiredPaidRoas: number;
  blendedMer: number;
  maxAllowableCpc: number;
  minBreakEvenCvrPct: number;
}

export function calculateDailyAdBudgetPlan(input: DailyAdBudgetInput): DailyAdBudgetPlan {
  const gatewayFeeRate = input.gatewayFeeRate ?? 0.0375;
  const retailPrice = Math.max(0.01, input.retailPrice);
  const landedCogs = Math.max(0, input.landedCogs);
  const dailyProfitGoal = Math.max(1, input.dailyProfitGoal);
  const cpc = Math.max(0.01, input.cpc);
  const cvrDec = Math.max(0.001, input.cvrPct / 100);
  const seoShare = Math.min(0.9, Math.max(0, input.seoTrafficSharePct / 100));
  const paidShare = 1 - seoShare;

  const gatewayFeePerOrder = Number((retailPrice * gatewayFeeRate).toFixed(2));
  const grossProfitBeforeAds = Number((retailPrice - landedCogs - gatewayFeePerOrder).toFixed(2));
  const paidCpa = Number((cpc / cvrDec).toFixed(2));
  const blendedCpa = Number((paidCpa * paidShare).toFixed(2));
  const netProfitPerOrder = Number((grossProfitBeforeAds - blendedCpa).toFixed(2));
  const netMarginPct = Number(((netProfitPerOrder / retailPrice) * 100).toFixed(1));

  const maxAllowableCpc =
    grossProfitBeforeAds > 0 ? Number((grossProfitBeforeAds * cvrDec).toFixed(2)) : 0;
  const minBreakEvenCvrPct =
    grossProfitBeforeAds > 0 ? Number(((cpc / grossProfitBeforeAds) * 100).toFixed(2)) : 100;

  if (grossProfitBeforeAds <= 0 || netProfitPerOrder <= 0) {
    return {
      isViable: false,
      reason:
        grossProfitBeforeAds <= 0
          ? 'Landed COGS and gateway fees exceed retail price.'
          : `Blended CPA ($${blendedCpa.toFixed(2)}) exceeds gross profit per order ($${grossProfitBeforeAds.toFixed(2)}). Lower CPC below $${maxAllowableCpc.toFixed(2)} or raise CVR above ${minBreakEvenCvrPct.toFixed(2)}%.`,
      gatewayFeePerOrder,
      grossProfitBeforeAds,
      paidCpa,
      blendedCpa,
      netProfitPerOrder,
      netMarginPct,
      exactOrdersNeeded: 0,
      wholeOrdersPerDay: 0,
      totalDailyClicksNeeded: 0,
      paidClicksPerDay: 0,
      seoClicksPerDay: 0,
      exactDailyAdBudget: 0,
      recommendedDailyAdBudget: 0,
      projectedDailyRevenue: 0,
      projectedDailyCogs: 0,
      projectedDailyGatewayFees: 0,
      projectedDailyNetProfit: 0,
      requiredPaidRoas: 0,
      blendedMer: 0,
      maxAllowableCpc,
      minBreakEvenCvrPct,
    };
  }

  const exactOrdersNeeded = Number((dailyProfitGoal / netProfitPerOrder).toFixed(2));
  const wholeOrdersPerDay = Math.max(1, Math.ceil(exactOrdersNeeded));

  const totalDailyClicksNeeded = Math.ceil(wholeOrdersPerDay / cvrDec);
  const seoClicksPerDay = Math.round(totalDailyClicksNeeded * seoShare);
  const paidClicksPerDay = Math.max(0, totalDailyClicksNeeded - seoClicksPerDay);

  const exactDailyAdBudget = Number((exactOrdersNeeded * blendedCpa).toFixed(2));
  const recommendedDailyAdBudget = Number((wholeOrdersPerDay * blendedCpa).toFixed(2));

  const projectedDailyRevenue = Number((wholeOrdersPerDay * retailPrice).toFixed(2));
  const projectedDailyCogs = Number((wholeOrdersPerDay * landedCogs).toFixed(2));
  const projectedDailyGatewayFees = Number((wholeOrdersPerDay * gatewayFeePerOrder).toFixed(2));
  const projectedDailyNetProfit = Number(
    (
      projectedDailyRevenue -
      projectedDailyCogs -
      projectedDailyGatewayFees -
      recommendedDailyAdBudget
    ).toFixed(2)
  );

  const requiredPaidRoas = Number((retailPrice / paidCpa).toFixed(2));
  const blendedMer =
    recommendedDailyAdBudget > 0
      ? Number((projectedDailyRevenue / recommendedDailyAdBudget).toFixed(2))
      : 0;

  return {
    isViable: true,
    reason: `At $${cpc.toFixed(2)} CPC and ${input.cvrPct.toFixed(1)}% CVR, ${wholeOrdersPerDay} orders/day (${totalDailyClicksNeeded} daily visits) clears your $${dailyProfitGoal.toFixed(0)}/day profit target.`,
    gatewayFeePerOrder,
    grossProfitBeforeAds,
    paidCpa,
    blendedCpa,
    netProfitPerOrder,
    netMarginPct,
    exactOrdersNeeded,
    wholeOrdersPerDay,
    totalDailyClicksNeeded,
    paidClicksPerDay,
    seoClicksPerDay,
    exactDailyAdBudget,
    recommendedDailyAdBudget,
    projectedDailyRevenue,
    projectedDailyCogs,
    projectedDailyGatewayFees,
    projectedDailyNetProfit,
    requiredPaidRoas,
    blendedMer,
    maxAllowableCpc,
    minBreakEvenCvrPct,
  };
}

