export type AdPlatform = 'Meta' | 'TikTok';

export interface AdTelemetryInput {
  platform: AdPlatform;
  spend: number;
  uniqueLinkClicks: number;
  ctrLinkPct: number;
  ctrAllPct: number;
  cpm: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  breakEvenRoas: number;
  breakEvenCpa: number;
  adSetRoas: number;
  isTopOfFunnelAssist?: boolean;
  daysProfitable?: number;
}

export type AdActionVerdict =
  | 'KILL_AD'
  | 'MUTATE_HOOK'
  | 'PIVOT_AVATAR'
  | 'FIX_PDP_OFFER'
  | 'HOLD_ASSIST'
  | 'KEEP_TESTING'
  | 'SCALE_WINNER';

export interface AdDecisionResult {
  verdict: AdActionVerdict;
  gateTriggered: string;
  cpc: number;
  costPerAtc: number | null;
  roas: number;
  headline: string;
  recommendation: string;
  scalePlan?: {
    verticalBumpPct: number;
    minDollarBump: number;
    horizontalAction: string;
  };
}

export function evaluateAdPerformance(input: AdTelemetryInput): AdDecisionResult {
  const cpc =
    input.uniqueLinkClicks > 0 ? Number((input.spend / input.uniqueLinkClicks).toFixed(2)) : 0;
  const costPerAtc =
    input.addToCarts > 0 ? Number((input.spend / input.addToCarts).toFixed(2)) : null;
  const roas = input.spend > 0 ? Number((input.revenue / input.spend).toFixed(2)) : 0;

  // Andromeda Assist Safeguard (Gate 1E override): never kill high-spend ToF assist ad inside a profitable ad set
  if (
    input.isTopOfFunnelAssist &&
    input.adSetRoas >= input.breakEvenRoas &&
    input.purchases === 0 &&
    input.spend >= 20
  ) {
    return {
      verdict: 'HOLD_ASSIST',
      gateTriggered: 'Gate 1E — Andromeda Assist Safeguard',
      cpc,
      costPerAtc,
      roas,
      headline: 'Keep Active as Top-of-Funnel Assist',
      recommendation: `Ad set ROAS (${input.adSetRoas.toFixed(2)}x) exceeds break-even (${input.breakEvenRoas.toFixed(2)}x). Do not disable ToF assist creative feeding downstream conversions.`,
    };
  }

  // Gate 1A: Dead-Link Gate
  if (input.spend >= 5 && input.uniqueLinkClicks === 0) {
    return {
      verdict: 'KILL_AD',
      gateTriggered: 'Gate 1A — Dead-Link Gate',
      cpc: 0,
      costPerAtc,
      roas,
      headline: 'Immediate Kill: Zero Link Clicks',
      recommendation: `Spent $${input.spend.toFixed(2)} with 0 unique link clicks. Terminate creative and rotate visual pattern interrupt.`,
    };
  }
  if (input.uniqueLinkClicks > 0 && cpc > 1.8) {
    return {
      verdict: 'KILL_AD',
      gateTriggered: 'Gate 1A — US CPC Ceiling',
      cpc,
      costPerAtc,
      roas,
      headline: `Immediate Kill: CPC $${cpc.toFixed(2)} > $1.80`,
      recommendation:
        'Click cost exceeds paid social threshold ($1.50–$1.80). Cut spend and replace opening 3-second visual contrast.',
    };
  }

  // CPM & Avatar Diagnostic
  if (input.cpm > 60 && input.ctrAllPct > 4.0) {
    return {
      verdict: 'PIVOT_AVATAR',
      gateTriggered: 'CPM & Avatar Saturation Diagnostic',
      cpc,
      costPerAtc,
      roas,
      headline: `Pivot Sub-Avatar (CPM $${input.cpm.toFixed(2)}, CTR All ${input.ctrAllPct.toFixed(1)}%)`,
      recommendation:
        'High engagement paired with elevated CPM signals an oversaturated demographic auction. Keep creative structure and pivot copy to Sub-Avatar #2.',
    };
  }

  // Gate 1B: Thumbstop / CTR Gate
  const minCtr = input.platform === 'TikTok' ? 1.0 : 1.5;
  if (input.spend >= 15 && input.ctrLinkPct < minCtr) {
    return {
      verdict: 'MUTATE_HOOK',
      gateTriggered: 'Gate 1B — Thumbstop / CTR Gate',
      cpc,
      costPerAtc,
      roas,
      headline: `Mutate 3-Second Hook (CTR ${input.ctrLinkPct.toFixed(2)}% < ${minCtr.toFixed(1)}%)`,
      recommendation:
        'Step 1 Deductive Variation: keep body and CTA constant, swap the 0–3s visual contrast clip and upper-center text overlay.',
    };
  }

  // Gate 1C: Add-to-Cart Gate
  if (input.spend >= 20 && input.addToCarts === 0) {
    if (cpc > 0 && cpc < 1.0) {
      return {
        verdict: 'FIX_PDP_OFFER',
        gateTriggered: 'Gate 1C — PDP Offer Alignment Alert',
        cpc,
        costPerAtc,
        roas,
        headline: `Fix PDP Offer Mismatch (CPLC $${cpc.toFixed(2)}, 0 ATCs)`,
        recommendation:
          'Ad generates cheap qualified clicks (<$1.00 CPLC) but visitors drop on the PDP. Match Slide 1 to Frame 1 of the ad and verify Tier-1 Free Gift visibility.',
      };
    }
    return {
      verdict: 'KILL_AD',
      gateTriggered: 'Gate 1C — Zero Add-to-Cart Gate',
      cpc,
      costPerAtc,
      roas,
      headline: `Kill Ad Set: $${input.spend.toFixed(2)} Spent, 0 ATCs`,
      recommendation:
        'Exceeded $20 Add-to-Cart gate without cart intent. Cut ad set and launch next angle from the 3x5 Andromeda matrix.',
    };
  }

  // Gate 1D: Zero-Purchase Wallet Gate
  const walletCap =
    input.platform === 'TikTok'
      ? Math.max(40, input.breakEvenCpa * 1.5)
      : Math.max(40, input.breakEvenCpa);

  if (input.purchases === 0 && input.spend >= walletCap) {
    if (input.addToCarts >= 3 && cpc < 1.0 && input.spend < input.breakEvenCpa * 1.5) {
      return {
        verdict: 'KEEP_TESTING',
        gateTriggered: 'Gate 1D — 24h High-Intent Grace Window',
        cpc,
        costPerAtc,
        roas,
        headline: 'Extend +24h Grace Window (Strong ATC Velocity)',
        recommendation: `${input.addToCarts} ATCs at $${cpc.toFixed(2)} CPC. Allow spend up to 1.5x break-even CPA ($${(input.breakEvenCpa * 1.5).toFixed(2)}) before final cut.`,
      };
    }
    return {
      verdict: 'KILL_AD',
      gateTriggered: 'Gate 1D — Zero-Purchase Wallet Gate',
      cpc,
      costPerAtc,
      roas,
      headline: `Kill Ad Set: $${input.spend.toFixed(2)} Spent, 0 Purchases`,
      recommendation: `Crossed wallet threshold ($${walletCap.toFixed(2)}) without a conversion. Reallocate budget to fresh PAS concept.`,
    };
  }

  // Scale Gate
  const scaleRoasTarget = Math.max(2.3, Number((input.breakEvenRoas * 1.5).toFixed(2)));
  if (input.purchases >= 3 && roas >= scaleRoasTarget && (input.daysProfitable ?? 2) >= 2) {
    const minDollarBump = Math.max(30, Math.round(input.breakEvenCpa));
    return {
      verdict: 'SCALE_WINNER',
      gateTriggered: 'Winner Graduation — Vertical & Horizontal Scale',
      cpc,
      costPerAtc,
      roas,
      headline: `Scale Winner (${roas.toFixed(2)}x ROAS, ${input.purchases} Orders)`,
      recommendation: `Profitable above ${scaleRoasTarget.toFixed(2)}x scale floor. Increase budget +20%–30% every 24–48h (minimum +$${minDollarBump} bump) and graduate to Champion CBO.`,
      scalePlan: {
        verticalBumpPct: 25,
        minDollarBump,
        horizontalAction:
          'Clone 5x into $50/day Soldier ad sets + 4x distinct manual frame thumbnails',
      },
    };
  }

  // Underperforming post-$100 check
  if (input.spend >= 100 && roas < input.breakEvenRoas) {
    return {
      verdict: 'KILL_AD',
      gateTriggered: 'Gate 1E — Break-Even CPA Ladder',
      cpc,
      costPerAtc,
      roas,
      headline: `Kill Underperformer (ROAS ${roas.toFixed(2)}x < BER ${input.breakEvenRoas.toFixed(2)}x)`,
      recommendation:
        'Sustained spend above $100 remains below break-even ROAS. Pause and run Step 2 Deductive Variation (new body story + CTA).',
    };
  }

  return {
    verdict: 'KEEP_TESTING',
    gateTriggered: 'Active Learning Window',
    cpc,
    costPerAtc,
    roas,
    headline: `Maintain Learning Spend (${roas.toFixed(2)}x ROAS)`,
    recommendation:
      'Metrics remain within baseline guardrails. Gather at least 3 purchases or full 1.0x BER_CPA window before scaling or cutting.',
  };
}

export interface ModularPermutation {
  id: string;
  hookCode: string;
  bodyCode: string;
  ctaCode: string;
  hookArchetype: string;
  overlayPill: string;
  beats: {
    hook0to3s: string;
    villain3to9s: string;
    hero9to18s: string;
    objection18to24s: string;
    cta24to30s: string;
  };
}

export interface AndromedaConcept {
  id: string;
  angle: string;
  format: string;
  conceptTitle: string;
  openingVisual: string;
}

export function generateModularAdMatrix(params: {
  productName: string;
  avatar: string;
  painPoint: string;
  villain: string;
  mechanism: string;
  price: number;
  offerLine: string;
}): {
  permutations: ModularPermutation[];
  andromedaConcepts: AndromedaConcept[];
  verbalHooks: { archetype: string; script: string }[];
} {
  const { productName, avatar, painPoint, villain, mechanism, price, offerLine } = params;

  const hooks = [
    {
      code: 'H1',
      archetype: 'Tribal / Symptom Callout',
      pill: 'Stop Blaming Your Mattress',
      line: `Built for ${avatar} waking up with ${painPoint}: you don't need another painkiller—you are fighting daily compression.`,
    },
    {
      code: 'H2',
      archetype: 'Loss-Aversion "Scam" Hook',
      pill: 'Day 1 vs Day 14 Test',
      line: `I 100% thought the ${productName} was overhyped until my physical therapist forced me to test it for 7 straight nights.`,
    },
    {
      code: 'H3',
      archetype: 'Investment / Failed-Attempts',
      pill: offerLine,
      line: `I wasted $400 on ${villain} before discovering why none of them actually address ${painPoint}.`,
    },
  ];

  const bodies = [
    {
      code: 'B1',
      villainBeat: `Ordinary ${villain} lock your body into flat, unnatural tension for 8 hours—making ${painPoint} worse every week.`,
      heroBeat: `Watch what happens in the first 10 minutes with ${productName}: ${mechanism} visibly decompresses pressure without bulky straps.`,
      objectionBeat: `Instead of spending $${(price * 5).toFixed(0)} on recurring clinic visits, it's $${price.toFixed(0)} once with a full 30-day risk-free guarantee.`,
    },
    {
      code: 'B2',
      villainBeat: `Most ${avatar} keep replacing ${villain} every 6 months because standard materials flatten out and lose structural support by week three.`,
      heroBeat: `We engineered ${productName} around ${mechanism}—so Day 30 feels as dialed-in as Day 1, right at home in 15 minutes a day.`,
      objectionBeat: `Over 10,000 verified customers rated it 4.9 stars, and every order includes our 30-day free return guarantee.`,
    },
  ];

  const ctas = [
    {
      code: 'CTA1',
      line: `Tap Shop Now below to claim ${offerLine} plus free 3–5 day US shipping before this batch sells out.`,
    },
    {
      code: 'CTA2',
      line: `Click below to unlock ${offerLine} and test ${productName} risk-free at home for 30 days.`,
    },
  ];

  const permutations: ModularPermutation[] = [];
  for (const h of hooks) {
    for (const b of bodies) {
      for (const c of ctas) {
        permutations.push({
          id: `${h.code}-${b.code}-${c.code}`,
          hookCode: h.code,
          bodyCode: b.code,
          ctaCode: c.code,
          hookArchetype: h.archetype,
          overlayPill: h.pill,
          beats: {
            hook0to3s: h.line,
            villain3to9s: b.villainBeat,
            hero9to18s: b.heroBeat,
            objection18to24s: b.objectionBeat,
            cta24to30s: c.line,
          },
        });
      }
    }
  }

  const angles = [
    'Immediate Relief / Vanity',
    'Daily Routine / Ritual',
    'Skeptic Conversion',
    'Day 1 vs Day 30 Mechanism',
    'Price Anchor Comparison',
  ];
  const formats = [
    'Silent 3s Visual Contrast Demo',
    'Founder / Specialist VSL',
    'UGC Compilation + Native Static',
  ];

  const andromedaConcepts: AndromedaConcept[] = [];
  let idx = 1;
  for (const angle of angles) {
    for (const format of formats) {
      andromedaConcepts.push({
        id: `AND-${String(idx).padStart(2, '0')}`,
        angle,
        format,
        conceptTitle: `${angle} · ${format}`,
        openingVisual:
          format === 'Silent 3s Visual Contrast Demo'
            ? `Split-screen contrast: sagging ${villain} vs. ${productName} contour fit`
            : format === 'Founder / Specialist VSL'
              ? `Creator holding ${productName} in warm home daylight explaining ${mechanism}`
              : `Fast 1.2s customer unboxing + ${offerLine} native upper-center caption`,
      });
      idx++;
    }
  }

  const verbalHooks = [
    {
      archetype: 'Tribal / Symptom Callout',
      script: `If you're a ${avatar} dealing with ${painPoint} every evening, here is why ${villain} keeps failing you.`,
    },
    {
      archetype: 'Investment / Failed-Attempts',
      script: `I tried 4 different ${villain} over two years before realizing ${mechanism} was the missing piece.`,
    },
    {
      archetype: 'Loss-Aversion "Scam" Hook',
      script: `I was convinced ${productName} was an internet gimmick until I tracked my comfort score from Day 1 to Day 14.`,
    },
    {
      archetype: 'Insider Conspiracy Hook',
      script: `Why did nobody tell us that standard ${villain} actually intensifies ${painPoint} after 30 days?`,
    },
    {
      archetype: 'Time-Commitment Contract',
      script: `Give me 15 seconds and I'll show you how to relieve ${painPoint} at home for under $${Math.ceil(price / 10) * 10}.`,
    },
    {
      archetype: 'POV Negative Trigger',
      script: `POV: You finally finish work as a ${avatar} and ${painPoint} ruins the rest of your night.`,
    },
    {
      archetype: 'Emotional Gift Reaction',
      script: `I surprised my partner with ${productName} after months of ${painPoint} and they refused to give it back.`,
    },
    {
      archetype: 'Founder Identity Hook',
      script: `Hi, I'm Elena from Kova Studio — we engineered ${productName} after testing 19 failed prototypes.`,
    },
  ];

  return { permutations, andromedaConcepts, verbalHooks };
}
