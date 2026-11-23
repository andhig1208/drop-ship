export interface FulfillmentTierInfo {
  stage: 1 | 2 | 3 | 4;
  name: string;
  activeNode: string;
  shippingLine: string;
  avgTransitDays: string;
  bufferPolicy: string;
  packagingTier: string;
  cogsAdvantage: string;
}

export function determineFulfillmentTier(
  dailyOrders: number,
  totalOrders: number
): FulfillmentTierInfo {
  if (dailyOrders >= 50) {
    return {
      stage: 4,
      name: 'Stage 4: Branded Packaging & Domestic 3PL',
      activeNode: 'US/EU Regional 3PL Warehouse + ImportYeti OEM Factory',
      shippingLine: 'USPS Priority / UPS Ground Local Dispatch',
      avgTransitDays: '1–3 business days',
      bufferPolicy: '500–1,000+ bulk units pre-positioned + 45-day CNY buffer',
      packagingTier: 'Custom rigid boxes, embossed logo & branded inserts (500+ MOQ)',
      cogsAdvantage: 'Lowest unit COGS + fastest domestic delivery',
    };
  }
  if (dailyOrders >= 10 || totalOrders >= 50) {
    return {
      stage: 3,
      name: 'Stage 3: Direct 1688 Private Sourcing Agent',
      activeNode: 'Dedicated Shenzhen/Yiwu Private Sourcing Team (ERP Sync)',
      shippingLine: 'YunExpress Dedicated Air Line (Tier 1 Default)',
      avgTransitDays: '5–8 business days (8.1d historical US avg)',
      bufferPolicy: '5–10 unit single-SKU / 40-unit multi-variant agent micro-buffer',
      packagingTier: 'Custom poly mailers & branded thank-you cards (50–100 MOQ)',
      cogsAdvantage: '5%–15% below AliExpress + zero 7% marketplace fee',
    };
  }
  if (dailyOrders >= 5) {
    return {
      stage: 2,
      name: 'Stage 2: Private AliExpress VIP Listing',
      activeNode: 'Hidden Direct-Seller AliExpress VIP Link (Non-Pure-Choice)',
      shippingLine: 'YunExpress / 4PX / CNE Express Dedicated Air',
      avgTransitDays: '7–10 business days',
      bufferPolicy: 'Zero upfront inventory; <24h priority seller dispatch',
      packagingTier: 'Blind dropship (zero supplier invoices/flyers)',
      cogsAdvantage: 'Volume discount unlocked + hidden order velocity from spy tools',
    };
  }
  return {
    stage: 1,
    name: 'Stage 1: Zero-Risk Validation',
    activeNode: 'Vetted Public Marketplaces (Non-Pure-Choice / US eBay Top-Rated Plus)',
    shippingLine: 'Standard Tracked Air / Domestic US Express',
    avgTransitDays: '4–10 business days',
    bufferPolicy: '$0 inventory risk during initial creative testing',
    packagingTier: '1 local print-shop prototype box (<$30) strictly for UGC shoots',
    cogsAdvantage: 'Zero fixed overhead or subscription lock-in',
  };
}

export interface SupplierMetrics {
  dispatchHours: number; // <24-48h target
  avgTransitDays: number; // <=11d hard SLA
  defectiveRatePct: number; // <2.0%
  landedCogsToRetailPct: number; // <=33.3%
  storeRating: number; // >=4.5-4.9
}

export interface SupplierScoreResult {
  score: number;
  passed: boolean;
  breakdown: {
    dispatch: number;
    transit: number;
    quality: number;
    economics: number;
    reputation: number;
  };
  flags: string[];
}

export function calculateSupplierScore(metrics: SupplierMetrics): SupplierScoreResult {
  const flags: string[] = [];

  const dispatch =
    metrics.dispatchHours <= 24 ? 30 : metrics.dispatchHours <= 48 ? 25 : 10;
  if (metrics.dispatchHours > 48) flags.push('Dispatch exceeds 48h ceiling');

  const transit =
    metrics.avgTransitDays <= 8
      ? 25
      : metrics.avgTransitDays <= 11
        ? 20
        : metrics.avgTransitDays <= 13
          ? 10
          : 0;
  if (metrics.avgTransitDays > 11) flags.push('Transit exceeds 11-day hard delivery SLA');

  const quality =
    metrics.defectiveRatePct < 1.0
      ? 20
      : metrics.defectiveRatePct < 2.0
        ? 16
        : 5;
  if (metrics.defectiveRatePct >= 2.0) flags.push('Defective rate >= 2.0% chargeback risk');

  const economics =
    metrics.landedCogsToRetailPct <= 25
      ? 15
      : metrics.landedCogsToRetailPct <= 33.3
        ? 12
        : 5;
  if (metrics.landedCogsToRetailPct > 33.3) flags.push('Landed COGS exceeds 1/3 of retail price');

  const reputation =
    metrics.storeRating >= 4.8 ? 10 : metrics.storeRating >= 4.5 ? 8 : 3;
  if (metrics.storeRating < 4.5) flags.push('Store rating below 4.5-star minimum');

  const score = dispatch + transit + quality + economics + reputation;

  return {
    score,
    passed: score >= 85 && metrics.avgTransitDays <= 11 && metrics.defectiveRatePct < 2.0,
    breakdown: { dispatch, transit, quality, economics, reputation },
    flags,
  };
}

export interface OrderMarginGateResult {
  netProfit: number;
  netMarginPct: number;
  approved: boolean;
  action: 'DISPATCH_PO' | 'HALT_REVIEW_ORDERS';
  reason: string;
}

export function evaluateOrderMarginGate(
  retailTotal: number,
  landedCogs: number,
  gatewayFeeRate = 0.0375,
  allocatedAdCpa = 18
): OrderMarginGateResult {
  const gatewayFee = retailTotal * gatewayFeeRate;
  const netProfit = Number((retailTotal - landedCogs - gatewayFee - allocatedAdCpa).toFixed(2));
  const netMarginPct = retailTotal > 0 ? Number(((netProfit / retailTotal) * 100).toFixed(1)) : 0;
  const approved = netMarginPct >= 5.0;

  return {
    netProfit,
    netMarginPct,
    approved,
    action: approved ? 'DISPATCH_PO' : 'HALT_REVIEW_ORDERS',
    reason: approved
      ? `Net margin ${netMarginPct}% clears 5.0% circuit breaker — automated PO dispatched`
      : `Net margin ${netMarginPct}% dropped below 5.0% hard gate — order halted to #review-orders`,
  };
}

export interface SmsValidationResult {
  charCount: number;
  hasEmoji: boolean;
  estimatedSegments: number;
  tcpaCompliant: boolean;
  issues: string[];
}

export function validateTcpaSms(
  message: string,
  hoursSinceLastAbandonSms: number
): SmsValidationResult {
  const trimmed = message.trim();
  const charCount = trimmed.length;
  // Detect extended pictographic emojis (which force UCS-2 encoding and consume 60-70 char capacity)
  const hasEmoji = /\p{Extended_Pictographic}/u.test(trimmed);
  const maxSingleSegment = hasEmoji ? 70 : 160;
  const estimatedSegments = charCount === 0 ? 0 : Math.ceil(charCount / maxSingleSegment);

  const issues: string[] = [];
  if (charCount === 0) {
    issues.push('Message body cannot be empty');
  }
  if (charCount > 160) {
    issues.push(`Exceeds 160-character single-SMS ceiling (${charCount} chars doubles carrier cost)`);
  }
  if (hasEmoji) {
    issues.push('Contains emoji — triggers UCS-2 encoding and cuts single-SMS limit to 70 chars');
  }
  if (hoursSinceLastAbandonSms < 48) {
    issues.push(
      `US TCPA violation: only ${hoursSinceLastAbandonSms}h since last abandonment SMS (48h minimum cooldown)`
    );
  }

  return {
    charCount,
    hasEmoji,
    estimatedSegments,
    tcpaCompliant: issues.length === 0,
    issues,
  };
}

export interface RiskGovernanceResult {
  processorStatus: 'NOMINAL' | 'THROTTLE_ADS' | 'HIGH_RISK_RESERVE';
  processorGuidance: string;
  wismoAction: 'STANDARD_TRACKING' | 'DAY_5_REASSURANCE' | 'DAY_8_ESCALATION';
  wismoGuidance: string;
}

export function evaluatePaymentAndWismo(
  disputeRatePct: number,
  daysWithoutOriginScan: number
): RiskGovernanceResult {
  let processorStatus: RiskGovernanceResult['processorStatus'] = 'NOMINAL';
  let processorGuidance =
    'Dispute rate strictly below 0.50% target. 24h Visa/Mastercard pre-dispute alerts active.';

  if (disputeRatePct >= 0.9) {
    processorStatus = 'HIGH_RISK_RESERVE';
    processorGuidance =
      'Card network High Risk threshold (>=0.90%) breached. Freeze ad scale, auto-refund alerts, and compile Adobe-signed bank-intranet dossiers.';
  } else if (disputeRatePct >= 0.65) {
    processorStatus = 'THROTTLE_ADS';
    processorGuidance =
      'Soft ad-scale throttle triggered (0.65%–0.89%). Audit SKU defect rate and enforce 17TRACK origin scan checks.';
  }

  let wismoAction: RiskGovernanceResult['wismoAction'] = 'STANDARD_TRACKING';
  let wismoGuidance = 'Automated Klaviyo milestone tracking active (Received -> Picked Up -> Transit).';

  if (daysWithoutOriginScan >= 8) {
    wismoAction = 'DAY_8_ESCALATION';
    wismoGuidance =
      'Day 8 stall detected: dispatch proactive email offering 15% courtesy credit to wait OR 1-click self-service cancellation & instant refund.';
  } else if (daysWithoutOriginScan >= 5) {
    wismoAction = 'DAY_5_REASSURANCE';
    wismoGuidance =
      'Day 5 pre-ship ceiling reached: send automated QA reassurance email restating PDP delivery window and query Backup Supplier #2.';
  }

  return {
    processorStatus,
    processorGuidance,
    wismoAction,
    wismoGuidance,
  };
}
