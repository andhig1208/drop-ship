import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyAdBudgetPlan,
  calculateUnitEconomics,
  evaluateProductTournament,
} from './unitEconomics';
import { evaluateAdPerformance, generateModularAdMatrix } from './adDecisionEngine';
import { auditSeoAndGmcParity, buildProductJsonLd, buildFaqJsonLd } from './seoEngine';
import {
  determineFulfillmentTier,
  calculateSupplierScore,
  evaluateOrderMarginGate,
  validateTcpaSms,
  evaluatePaymentAndWismo,
} from './fulfillmentEngine';
import {
  buildAlgorithmSchedule,
  computeChannelSpacingAudit,
  selectNextAlgorithmSlot,
} from './publishingAgentEngine';
import { createAdminAuthManager } from './adminAuth';

test('Unit economics formulas match 100-video specification thresholds', () => {
  const result = calculateUnitEconomics({
    manufacturingCost: 11.5,
    packagingCost: 1.5,
    shippingCost: 6.5,
    tariffDuty: 0.5,
    retailPrice: 89.0,
    gatewayFeeRate: 0.0375,
    targetCac: 22.0,
    repeatRate6Mo: 0.25,
    competitorMonthlyVisits: 50000,
  });

  assert.equal(result.landedCogs, 20.0);
  assert.equal(result.markupMultiplier, 4.45);
  assert.equal(result.absoluteGrossSpread, 69.0);
  assert.equal(result.viabilityBand, 'RAPID_SCALE');
  assert.ok(result.breakEvenRoas <= 1.36);
  assert.ok(result.ltvCacRatio >= 3.0);
  assert.equal(result.estimatedMonthlyRevenue, 97900);
});

test('3-Round Tournament rejects oversized/fragile items in Round 1 and advances strong candidates', () => {
  const fragile = evaluateProductTournament({
    id: 'frag-1',
    name: 'Glass Lamp',
    category: 'Home',
    weightKg: 3.1,
    fitsShoebox: false,
    isFragileOrChemical: true,
    isRetailCommodity: false,
    activeCompetitors: 3,
    seriousCompetitors: 2,
    revenue30d: 48000,
    videoRevenueSharePct: 78,
    activeAdSets: 24,
    economics: {
      manufacturingCost: 12,
      packagingCost: 2,
      shippingCost: 6,
      tariffDuty: 0,
      retailPrice: 89,
      targetCac: 20,
      repeatRate6Mo: 0.2,
    },
    painUrgencyScore: 80,
    creativeWatchScore: 80,
    logisticsScore: 60,
  });

  assert.equal(fragile.round1Passed, false);
  assert.equal(fragile.verdict, 'ELIMINATED');

  const winner = evaluateProductTournament({
    id: 'win-1',
    name: 'Kova Pulse Pro',
    category: 'Recovery',
    weightKg: 0.65,
    fitsShoebox: true,
    isFragileOrChemical: false,
    isRetailCommodity: false,
    activeCompetitors: 4,
    seriousCompetitors: 2,
    revenue30d: 64000,
    videoRevenueSharePct: 82,
    activeAdSets: 28,
    economics: {
      manufacturingCost: 11,
      packagingCost: 1.5,
      shippingCost: 7,
      tariffDuty: 0.5,
      retailPrice: 89,
      targetCac: 22,
      repeatRate6Mo: 0.28,
    },
    painUrgencyScore: 94,
    creativeWatchScore: 88,
    logisticsScore: 92,
  });

  assert.equal(winner.round1Passed, true);
  assert.equal(winner.round2Passed, true);
  assert.equal(winner.round3Passed, true);
  assert.ok(winner.compositeScore >= 75);
  assert.equal(winner.verdict, 'ADVANCE_TO_STOREFRONT');
});

test('Ad Decision Engine enforces Gates 1A-1E, Andromeda Assist Safeguard, and Scale rules', () => {
  // Gate 1A: Dead link
  const dead = evaluateAdPerformance({
    platform: 'Meta',
    spend: 8,
    uniqueLinkClicks: 0,
    ctrLinkPct: 0,
    ctrAllPct: 1.1,
    cpm: 28,
    addToCarts: 0,
    purchases: 0,
    revenue: 0,
    breakEvenRoas: 1.35,
    breakEvenCpa: 65,
    adSetRoas: 0,
  });
  assert.equal(dead.verdict, 'KILL_AD');

  // Gate 1E: Andromeda Assist Safeguard
  const assist = evaluateAdPerformance({
    platform: 'Meta',
    spend: 48,
    uniqueLinkClicks: 55,
    ctrLinkPct: 2.4,
    ctrAllPct: 4.5,
    cpm: 24,
    addToCarts: 4,
    purchases: 0,
    revenue: 0,
    breakEvenRoas: 1.4,
    breakEvenCpa: 45,
    adSetRoas: 2.6,
    isTopOfFunnelAssist: true,
  });
  assert.equal(assist.verdict, 'HOLD_ASSIST');

  // Winner Scale
  const winner = evaluateAdPerformance({
    platform: 'Meta',
    spend: 120,
    uniqueLinkClicks: 185,
    ctrLinkPct: 3.2,
    ctrAllPct: 5.4,
    cpm: 22,
    addToCarts: 16,
    purchases: 5,
    revenue: 445,
    breakEvenRoas: 1.35,
    breakEvenCpa: 65,
    adSetRoas: 3.7,
    daysProfitable: 3,
  });
  assert.equal(winner.verdict, 'SCALE_WINNER');
  assert.ok(winner.scalePlan && winner.scalePlan.verticalBumpPct === 25);
});

test('Modular Ad Matrix produces 12 PAS permutations and 15 Andromeda concepts', () => {
  const matrix = generateModularAdMatrix({
    productName: 'Kova Pulse Pro',
    avatar: 'remote engineers with tech neck',
    painPoint: 'stiff neck and tension headaches',
    villain: 'flat memory foam pillows',
    mechanism: 'precision 26-degree heated cervical decompression',
    price: 89,
    offerLine: 'Save 20% + 2 Free Gifts',
  });

  assert.equal(matrix.permutations.length, 12);
  assert.equal(matrix.andromedaConcepts.length, 15);
  assert.equal(matrix.verbalHooks.length, 8);
});

test('SEO and GMC Parity Auditor validates metadata length, schema, and shipping parity', () => {
  const compliant = auditSeoAndGmcParity({
    pageTitle: 'Heated Cervical Traction Pillow for Neck Relief | Kova',
    metaDescription:
      'Relieve neck tension in 15 minutes daily with the Kova Pulse Pro heated cervical traction pillow. Ships free in 3–5 business days with a 30-day guarantee.',
    focusKeyword: 'Cervical Traction Pillow',
    urlSlug: 'kova-pulse-pro-cervical-traction-pillow',
    hasProductJsonLd: true,
    hasFaqJsonLd: true,
    policyLinksCount: 6,
    pdpHandlingDays: 1,
    gmcHandlingDays: 1,
    pdpTransitRange: '3-5',
    gmcTransitRange: '3-5',
    returnWindowDays: 30,
    restockingFeeDollars: 0,
    hasMatchingContactInfo: true,
  });

  assert.equal(compliant.score, 100);
  assert.equal(compliant.gmcParityStatus, 'COMPLIANT');

  const jsonLd = buildProductJsonLd({
    name: 'Kova Pulse Pro',
    description: 'Heated cervical traction pillow',
    sku: 'KV-01',
    price: 89,
    rating: 4.9,
    reviewCount: 1428,
    handlingDays: 1,
    transitMin: 3,
    transitMax: 5,
    url: 'https://kovastudio.com/pulse-pro',
  });
  assert.ok(JSON.parse(jsonLd)['@type'] === 'Product');

  const faqLd = buildFaqJsonLd([{ question: 'How fast is shipping?', answer: '3-5 business days.' }]);
  assert.ok(JSON.parse(faqLd)['@type'] === 'FAQPage');
});

test('Fulfillment tier transitions, 5% margin gate, TCPA SMS, and WISMO rules operate accurately', () => {
  assert.equal(determineFulfillmentTier(3, 12).stage, 1);
  assert.equal(determineFulfillmentTier(7, 30).stage, 2);
  assert.equal(determineFulfillmentTier(18, 120).stage, 3);
  assert.equal(determineFulfillmentTier(75, 1400).stage, 4);

  const supplier = calculateSupplierScore({
    dispatchHours: 18,
    avgTransitDays: 7.5,
    defectiveRatePct: 0.8,
    landedCogsToRetailPct: 22.4,
    storeRating: 4.9,
  });
  assert.equal(supplier.passed, true);
  assert.equal(supplier.score, 100);

  const okOrder = evaluateOrderMarginGate(89, 20, 0.0375, 18);
  assert.equal(okOrder.approved, true);
  assert.equal(okOrder.action, 'DISPATCH_PO');

  const haltedOrder = evaluateOrderMarginGate(28, 19, 0.0375, 12);
  assert.equal(haltedOrder.approved, false);
  assert.equal(haltedOrder.action, 'HALT_REVIEW_ORDERS');

  const goodSms = validateTcpaSms(
    'Kova Studio: Your Kova Pulse Pro cart is reserved. Complete checkout for free 3-5 day US shipping + 2 free gifts: kovastudio.com/c/84',
    52
  );
  assert.equal(goodSms.tcpaCompliant, true);
  assert.equal(goodSms.hasEmoji, false);

  const badSms = validateTcpaSms('Claim your deal 🔥 before it sells out!', 12);
  assert.equal(badSms.tcpaCompliant, false);
  assert.equal(badSms.hasEmoji, true);

  const riskDay8 = evaluatePaymentAndWismo(0.95, 8);
  assert.equal(riskDay8.processorStatus, 'HIGH_RISK_RESERVE');
  assert.equal(riskDay8.wismoAction, 'DAY_8_ESCALATION');
});

test('Daily ad budget planner computes $100/day profit ad budget, SEO traffic savings, and unprofitable guardrails', () => {
  // 100% paid traffic on Kova Pulse Pro ($89 retail, $20 COGS, $0.90 CPC, 3.5% CVR)
  const paidOnly = calculateDailyAdBudgetPlan({
    retailPrice: 89,
    landedCogs: 20,
    dailyProfitGoal: 100,
    cpc: 0.9,
    cvrPct: 3.5,
    seoTrafficSharePct: 0,
  });

  assert.equal(paidOnly.isViable, true);
  assert.equal(paidOnly.paidCpa, 25.71);
  assert.equal(paidOnly.netProfitPerOrder, 39.95);
  assert.equal(paidOnly.wholeOrdersPerDay, 3);
  assert.equal(paidOnly.recommendedDailyAdBudget, 77.13);
  assert.ok(paidOnly.projectedDailyNetProfit >= 100);
  assert.equal(paidOnly.seoClicksPerDay, 0);

  // With 25% organic SEO traffic, required ad spend drops
  const withSeo = calculateDailyAdBudgetPlan({
    retailPrice: 89,
    landedCogs: 20,
    dailyProfitGoal: 100,
    cpc: 0.9,
    cvrPct: 3.5,
    seoTrafficSharePct: 25,
  });

  assert.equal(withSeo.isViable, true);
  assert.ok(withSeo.recommendedDailyAdBudget < paidOnly.recommendedDailyAdBudget);
  assert.ok(withSeo.seoClicksPerDay > 0);
  assert.ok(withSeo.netMarginPct > paidOnly.netMarginPct);

  // Unprofitable traffic (high CPC + low CVR where CPA > gross profit)
  const unprofitable = calculateDailyAdBudgetPlan({
    retailPrice: 44,
    landedCogs: 8.5,
    dailyProfitGoal: 100,
    cpc: 1.5,
    cvrPct: 2.0,
    seoTrafficSharePct: 0,
  });

  assert.equal(unprofitable.isViable, false);
  assert.ok(unprofitable.paidCpa > unprofitable.grossProfitBeforeAds);
  assert.ok(unprofitable.maxAllowableCpc < 1.5);
});

test('Publishing agent schedules algorithm-optimal runs/day across warmup, growth, and scale without spacing or hook collisions', () => {
  const warmup = buildAlgorithmSchedule({
    phase: 'warmup',
    dailyAdBudget: 62,
  });
  assert.equal(warmup.totalRunsPerDay, 7);
  assert.equal(warmup.paidRunsPerDay, 1);
  assert.equal(warmup.organicRunsPerDay, 6);

  const growth = buildAlgorithmSchedule({
    phase: 'growth',
    dailyAdBudget: 61.71,
  });
  assert.equal(growth.totalRunsPerDay, 11);
  assert.equal(growth.paidRunsPerDay, 1);
  assert.equal(growth.organicRunsPerDay, 10);

  const growthAudit = computeChannelSpacingAudit(growth.slots, growth.channels);
  assert.equal(growthAudit.allSpacingValid, true);
  assert.equal(growthAudit.zeroConsecutiveHookDuplicates, true);

  const scale = buildAlgorithmSchedule({
    phase: 'scale',
    dailyAdBudget: 140,
  });
  assert.equal(scale.totalRunsPerDay, 14);
  assert.equal(scale.paidRunsPerDay, 2);
  assert.ok(scale.projectedTotalDailyTraffic > growth.projectedTotalDailyTraffic);

  const scaleAudit = computeChannelSpacingAudit(scale.slots, scale.channels);
  assert.equal(scaleAudit.allSpacingValid, true);
  assert.equal(scaleAudit.zeroConsecutiveHookDuplicates, true);

  // Next slot selection picks upcoming uncompleted slot and wraps cleanly
  const firstSlot = selectNextAlgorithmSlot(growth.slots, [], 500);
  assert.ok(firstSlot && firstSlot.minutesFromMidnight >= 500);

  const nextAfterFirst = selectNextAlgorithmSlot(growth.slots, [firstSlot.slotId], 500);
  assert.ok(nextAfterFirst && nextAfterFirst.slotId !== firstSlot.slotId);
});

test('Private admin auth manager enforces first-run claim lock, scrypt verification, Bearer tokens, and env override', () => {
  // 1. Unconfigured local preview flow
  const localAuth = createAdminAuthManager({});
  assert.equal(localAuth.getStatus().requiresInitialSetup, true);
  assert.equal(localAuth.getStatus().source, 'unconfigured');

  // Reject short passcode on claim
  const shortClaim = localAuth.claimFirstPasscode('short');
  assert.equal(shortClaim.ok, false);
  assert.equal(shortClaim.status, 400);

  // Claim valid passcode
  const claimed = localAuth.claimFirstPasscode('kova-ops-2026!');
  assert.equal(claimed.ok, true);
  assert.equal(claimed.status, 201);
  assert.ok(claimed.token);
  assert.equal(localAuth.getStatus().requiresInitialSetup, false);
  assert.equal(localAuth.getStatus().source, 'claimed');

  // Second claim attempt is locked out
  const secondClaim = localAuth.claimFirstPasscode('another-pass-99');
  assert.equal(secondClaim.ok, false);
  assert.equal(secondClaim.status, 409);

  // Token verification & revocation
  assert.equal(localAuth.verifyToken(claimed.token), true);
  assert.equal(localAuth.verifyToken('forged.token'), false);
  localAuth.revokeToken(claimed.token);
  assert.equal(localAuth.verifyToken(claimed.token), false);

  // Login checks
  const badLogin = localAuth.login('wrong-password');
  assert.equal(badLogin.ok, false);
  assert.equal(badLogin.status, 401);

  const goodLogin = localAuth.login('kova-ops-2026!');
  assert.equal(goodLogin.ok, true);
  assert.ok(goodLogin.token && localAuth.verifyToken(goodLogin.token));

  // 2. Environment passcode overrides claim flow immediately
  const envAuth = createAdminAuthManager({ envPasscode: 'prod-secret-pass-99' });
  assert.equal(envAuth.getStatus().requiresInitialSetup, false);
  assert.equal(envAuth.getStatus().source, 'env');
  assert.equal(envAuth.claimFirstPasscode('override-attempt').status, 409);
  assert.equal(envAuth.login('wrong').status, 401);
  const envLogin = envAuth.login('prod-secret-pass-99');
  assert.equal(envLogin.ok, true);
  assert.equal(envAuth.verifyToken(envLogin.token), true);
});



