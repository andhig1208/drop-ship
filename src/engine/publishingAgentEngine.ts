export type DistributionChannel =
  | 'tiktok'
  | 'meta'
  | 'instagram'
  | 'youtube'
  | 'pinterest';

export type AccountPhase = 'warmup' | 'growth' | 'scale';

export interface ChannelAlgorithmSpec {
  channel: DistributionChannel;
  label: string;
  runsPerDay: number;
  minSpacingHours: number;
  peakTimes: string[];
  primarySignal: string;
  algorithmRationale: string;
  antiThrottleGuardrail: string;
  estimatedTrafficPerRun: number;
  isPaidPrimary: boolean;
  enabled: boolean;
}

export interface ScheduledPublishSlot {
  slotId: string;
  order: number;
  time24h: string;
  minutesFromMidnight: number;
  channel: DistributionChannel;
  channelLabel: string;
  format: string;
  hookArchetype: string;
  angle: string;
  objective: string;
  isPaidSlot: boolean;
}

export interface AlgorithmSchedulePlan {
  phase: AccountPhase;
  dailyAdBudget: number;
  totalRunsPerDay: number;
  paidRunsPerDay: number;
  organicRunsPerDay: number;
  avgIntervalMinutes: number;
  projectedDailyOrganicClicks: number;
  projectedDailyPaidClicks: number;
  projectedTotalDailyTraffic: number;
  algorithmEfficiencyScore: number;
  channels: ChannelAlgorithmSpec[];
  slots: ScheduledPublishSlot[];
  guardrailSummary: string;
}

export interface PublishedAdItem {
  id: string;
  slotId: string;
  scheduledTime: string;
  publishedAt: string;
  triggerSource: 'autopilot' | 'manual';
  status: 'published' | 'queued' | 'paused';
  channel: DistributionChannel;
  channelLabel: string;
  productId: string;
  productName: string;
  format: string;
  hookArchetype: string;
  angle: string;
  headline: string;
  visualHook0to3s: string;
  overlayText: string;
  verbalHook: string;
  bodyScript: string;
  ctaLine: string;
  caption: string;
  hashtags: string[];
  seoKeywords: string[];
  algorithmChecklist: string[];
  estimatedReach: string;
  modelUsed: string;
  pushedToCampaigns?: boolean;
}

export interface AlgorithmScheduleInput {
  phase: AccountPhase;
  dailyAdBudget: number;
  enabledChannels?: DistributionChannel[];
  avgCpc?: number;
}

export const ALL_CHANNELS: DistributionChannel[] = [
  'tiktok',
  'meta',
  'instagram',
  'youtube',
  'pinterest',
];

const HOOK_ARCHETYPES = [
  'Negative Contrarian ("Stop doing X")',
  'Visceral Problem-Contrast (0–3s Visual Shock)',
  'Scam / Loss-Aversion Callout',
  'POV Routine ("POV: You wake up stiff")',
  '3-Second Mechanism Reveal + Demo',
  'Tribal Desk-Worker / Sleeper Callout',
  '7-Day Post-Viral Comment Reply',
  'Give Me 15 Seconds Transformation',
  'Founder / Engineer Breakdown',
  'Side-by-Side Villain Comparison',
];

const CREATIVE_ANGLES = [
  'Deep Cervical / Posture Pain Relief',
  'Morning Mobility & Deeper Sleep Quality',
  'Zero-Clinic Cost & Time Efficiency',
  'Verified 30-Day Customer Social Proof',
  'Side-by-Side vs. Generic Marketplace Junk',
  'Objection Crusher (3–5 Day US Ship + 30d Guarantee)',
  'Daily 15-Minute Evening Wind-Down Ritual',
];

const CHANNEL_FORMATS: Record<DistributionChannel, string[]> = {
  tiktok: [
    '9:16 Native UGC Video (28s · 4-Part Hook)',
    '9:16 Comment-Reply Objection Video (22s)',
    '9:16 Visceral Problem-vs-Hero Split Demo (30s)',
    '9:16 Spark Ad Whitelist Cut (25s)',
  ],
  meta: [
    'Andromeda Broad CBO Concept Drop (3–5 Variants)',
    'Andromeda High-Contrast Static + Video Hook Swap',
  ],
  instagram: [
    '9:16 Shareable Reels Routine (DM-Send Optimized)',
    '9:16 Aesthetic Mechanism Breakdown Reel',
  ],
  youtube: [
    '9:16 Seamless Loop YouTube Short (>100% APV)',
    '9:16 Fast-Cut Side-by-Side Test Short',
  ],
  pinterest: [
    '2:3 Rich SEO Shopping Pin + Long-Tail Keyword Alt',
    '2:3 Infographic Routine Comparison Pin',
    '9:16 Idea Video Pin (Visual Search Indexed)',
    '2:3 Gift / Setup Guide SEO Pin',
  ],
};

function timeToMinutes(time24h: string): number {
  const [h, m] = time24h.split(':').map((n) => Number(n));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Computes the algorithm-maximizing daily publishing cadence across all social & search
 * traffic channels, balancing distribution volume against platform anti-spam cooldowns
 * and Meta Andromeda learning-phase stability.
 */
export function buildAlgorithmSchedule(
  input: AlgorithmScheduleInput
): AlgorithmSchedulePlan {
  const enabledSet = new Set<DistributionChannel>(
    input.enabledChannels && input.enabledChannels.length > 0
      ? input.enabledChannels
      : ALL_CHANNELS
  );
  const safeBudget = Math.max(0, Number.isFinite(input.dailyAdBudget) ? input.dailyAdBudget : 62);
  const safeCpc = Math.max(0.1, Number.isFinite(input.avgCpc ?? 0.9) ? (input.avgCpc ?? 0.9) : 0.9);

  // Meta Andromeda cadence scales with daily CBO budget so we never starve or reset learning phase
  const metaRuns =
    input.phase === 'warmup'
      ? 1
      : input.phase === 'scale' || safeBudget >= 100
      ? 2
      : 1;

  const tiktokTimes =
    input.phase === 'warmup'
      ? ['09:00', '18:30']
      : input.phase === 'growth'
      ? ['08:30', '13:00', '19:30']
      : ['08:00', '12:00', '16:00', '20:30'];

  const metaTimes = metaRuns === 2 ? ['06:00', '17:00'] : ['06:00'];

  const instagramTimes =
    input.phase === 'warmup' ? ['11:30'] : ['09:15', '18:15'];

  const youtubeTimes =
    input.phase === 'warmup' ? ['15:00'] : ['11:00', '20:00'];

  const pinterestTimes =
    input.phase === 'warmup'
      ? ['07:30', '14:30']
      : input.phase === 'growth'
      ? ['07:30', '12:30', '17:30']
      : ['07:00', '10:30', '14:30', '18:45'];

  const channels: ChannelAlgorithmSpec[] = [
    {
      channel: 'tiktok',
      label: 'TikTok FYP & Spark',
      runsPerDay: enabledSet.has('tiktok') ? tiktokTimes.length : 0,
      minSpacingHours: 3.5,
      peakTimes: tiktokTimes,
      primarySignal: '3s Hook Hold + Watch Completion (>65%)',
      algorithmRationale:
        'Each upload enters an independent 200–500 view seed pool; spacing 3.5–4.5h avoids self-cannibalization while feeding continuous viral hook tests.',
      antiThrottleGuardrail: 'Max 4/day · ≥ 3.5h spacing · Rotate visual hook every upload',
      estimatedTrafficPerRun: input.phase === 'scale' ? 28 : input.phase === 'growth' ? 22 : 14,
      isPaidPrimary: false,
      enabled: enabledSet.has('tiktok'),
    },
    {
      channel: 'meta',
      label: 'Meta Andromeda CBO',
      runsPerDay: enabledSet.has('meta') ? metaTimes.length : 0,
      minSpacingHours: 10,
      peakTimes: metaTimes,
      primarySignal: 'Net-New Creative Diversity (15 Andromeda Slots)',
      algorithmRationale:
        'Andromeda rewards distinct visual/angle concepts dropped at 06:00 ahead of auction ramp rather than frequent budget edits that reset learning phase.',
      antiThrottleGuardrail:
        '≥ 1 active ad set (3–10 ads) per $100/d CBO · Never touch winning ad budgets > 1x per 24–48h',
      estimatedTrafficPerRun: Math.max(15, Math.round(safeBudget / safeCpc / Math.max(1, metaTimes.length))),
      isPaidPrimary: true,
      enabled: enabledSet.has('meta'),
    },
    {
      channel: 'instagram',
      label: 'Instagram Reels',
      runsPerDay: enabledSet.has('instagram') ? instagramTimes.length : 0,
      minSpacingHours: 6,
      peakTimes: instagramTimes,
      primarySignal: 'Sends per Reach (DM Shares) + Replay Rate',
      algorithmRationale:
        'Reels carry a 6–9h distribution tail; 2 high-shareability clips spaced 9h apart maximize reach without splitting follower engagement.',
      antiThrottleGuardrail: 'Max 2 Reels/day · ≥ 6h spacing · Native non-watermarked export',
      estimatedTrafficPerRun: input.phase === 'scale' ? 19 : input.phase === 'growth' ? 15 : 10,
      isPaidPrimary: false,
      enabled: enabledSet.has('instagram'),
    },
    {
      channel: 'youtube',
      label: 'YouTube Shorts',
      runsPerDay: enabledSet.has('youtube') ? youtubeTimes.length : 0,
      minSpacingHours: 8,
      peakTimes: youtubeTimes,
      primarySignal: 'Viewed vs. Swiped Away (>70%) + >100% Loop APV',
      algorithmRationale:
        'Shorts seed slower (12–24h discovery curve) and index into Google Video SERPs; 2 looped demos/day compound long-tail search traffic.',
      antiThrottleGuardrail: 'Max 2 Shorts/day · ≥ 8h spacing · Seamless loop end-frame',
      estimatedTrafficPerRun: input.phase === 'scale' ? 18 : input.phase === 'growth' ? 14 : 9,
      isPaidPrimary: false,
      enabled: enabledSet.has('youtube'),
    },
    {
      channel: 'pinterest',
      label: 'Pinterest Visual SEO',
      runsPerDay: enabledSet.has('pinterest') ? pinterestTimes.length : 0,
      minSpacingHours: 3,
      peakTimes: pinterestTimes,
      primarySignal: 'Fresh URL Indexing + Outbound Click CTR',
      algorithmRationale:
        'Visual search engine that compounds evergreen $0-CPC buyer-intent clicks when fed fresh keyword-rich Pins every 3–5h.',
      antiThrottleGuardrail: 'Max 4–5 fresh Pins/day · ≥ 3h spacing · Unique alt-text & URL UTM',
      estimatedTrafficPerRun: input.phase === 'scale' ? 16 : input.phase === 'growth' ? 12 : 8,
      isPaidPrimary: false,
      enabled: enabledSet.has('pinterest'),
    },
  ];

  // Build chronological daily slots with zero consecutive hook/angle collisions
  const rawSlots: Omit<ScheduledPublishSlot, 'order'>[] = [];
  let hookIdx = 0;
  let angleIdx = 0;

  for (const ch of channels) {
    if (!ch.enabled) continue;
    const formats = CHANNEL_FORMATS[ch.channel];
    ch.peakTimes.forEach((time24h, idx) => {
      rawSlots.push({
        slotId: `${ch.channel}-${idx + 1}-${time24h.replace(':', '')}`,
        time24h,
        minutesFromMidnight: timeToMinutes(time24h),
        channel: ch.channel,
        channelLabel: ch.label,
        format: formats[idx % formats.length],
        hookArchetype: HOOK_ARCHETYPES[hookIdx % HOOK_ARCHETYPES.length],
        angle: CREATIVE_ANGLES[angleIdx % CREATIVE_ANGLES.length],
        objective: ch.primarySignal,
        isPaidSlot: ch.isPaidPrimary,
      });
      hookIdx += 1;
      angleIdx += 1;
    });
  }

  rawSlots.sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

  // Re-assign hook/angle cleanly in chronological order so consecutive posts never repeat hooks
  const slots: ScheduledPublishSlot[] = rawSlots.map((slot, i) => ({
    ...slot,
    order: i + 1,
    hookArchetype: HOOK_ARCHETYPES[i % HOOK_ARCHETYPES.length],
    angle: CREATIVE_ANGLES[i % CREATIVE_ANGLES.length],
  }));

  const totalRunsPerDay = slots.length;
  const paidRunsPerDay = slots.filter((s) => s.isPaidSlot).length;
  const organicRunsPerDay = totalRunsPerDay - paidRunsPerDay;

  const avgIntervalMinutes =
    totalRunsPerDay > 1
      ? Math.round(
          (slots[slots.length - 1].minutesFromMidnight - slots[0].minutesFromMidnight) /
            (totalRunsPerDay - 1)
        )
      : 0;

  const projectedDailyOrganicClicks = channels
    .filter((c) => c.enabled && !c.isPaidPrimary)
    .reduce((sum, c) => sum + c.runsPerDay * c.estimatedTrafficPerRun, 0);

  const projectedDailyPaidClicks = enabledSet.has('meta')
    ? Math.round(safeBudget / safeCpc)
    : 0;

  const projectedTotalDailyTraffic = projectedDailyOrganicClicks + projectedDailyPaidClicks;

  // Efficiency score rewards multi-channel diversity + spacing discipline
  const enabledCount = channels.filter((c) => c.enabled).length;
  const spacingCheck = computeChannelSpacingAudit(slots, channels);
  const baseDiversity = Math.round((enabledCount / ALL_CHANNELS.length) * 65);
  const spacingPoints = spacingCheck.allSpacingValid ? 25 : 10;
  const phaseBonus = input.phase === 'scale' ? 10 : input.phase === 'growth' ? 8 : 6;
  const algorithmEfficiencyScore = Math.min(100, baseDiversity + spacingPoints + phaseBonus);

  const guardrailSummary =
    input.phase === 'warmup'
      ? `Warm-Up Cadence (${totalRunsPerDay} runs/day): protects fresh domain & ad pixels from shadowbans while building 7-day baseline signals.`
      : input.phase === 'growth'
      ? `Growth Cadence (${totalRunsPerDay} runs/day): optimal algorithm balance across ${enabledCount} channels—maximizes FYP/Reels/Shorts/SEO velocity without tripping spam cooldowns.`
      : `Scale Cadence (${totalRunsPerDay} runs/day): high-velocity Andromeda dual-drop + 7-day post-viral reply schedule tuned for maximum daily traffic capture.`;

  return {
    phase: input.phase,
    dailyAdBudget: Number(safeBudget.toFixed(2)),
    totalRunsPerDay,
    paidRunsPerDay,
    organicRunsPerDay,
    avgIntervalMinutes,
    projectedDailyOrganicClicks,
    projectedDailyPaidClicks,
    projectedTotalDailyTraffic,
    algorithmEfficiencyScore,
    channels,
    slots,
    guardrailSummary,
  };
}

export interface SpacingAuditResult {
  allSpacingValid: boolean;
  zeroConsecutiveHookDuplicates: boolean;
  violations: string[];
}

export function computeChannelSpacingAudit(
  slots: ScheduledPublishSlot[],
  channels: ChannelAlgorithmSpec[]
): SpacingAuditResult {
  const violations: string[] = [];
  const minByChannel = new Map<DistributionChannel, number>();
  channels.forEach((c) => minByChannel.set(c.channel, c.minSpacingHours * 60));

  const byChannel = new Map<DistributionChannel, ScheduledPublishSlot[]>();
  for (const s of slots) {
    const arr = byChannel.get(s.channel) ?? [];
    arr.push(s);
    byChannel.set(s.channel, arr);
  }

  for (const [ch, list] of byChannel.entries()) {
    const sorted = [...list].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
    const minGap = minByChannel.get(ch) ?? 180;
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].minutesFromMidnight - sorted[i - 1].minutesFromMidnight;
      if (gap < minGap) {
        violations.push(
          `${ch}: gap between ${sorted[i - 1].time24h} and ${sorted[i].time24h} is ${gap}m (< ${minGap}m min)`
        );
      }
    }
  }

  let zeroConsecutiveHookDuplicates = true;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].hookArchetype === slots[i - 1].hookArchetype) {
      zeroConsecutiveHookDuplicates = false;
      violations.push(`Consecutive duplicate hook archetype at ${slots[i].time24h}`);
    }
  }

  return {
    allSpacingValid: violations.length === 0,
    zeroConsecutiveHookDuplicates,
    violations,
  };
}

/**
 * Picks the next algorithm slot that hasn't been published yet today, prioritizing
 * upcoming wall-clock slots and wrapping cleanly around the 24h cycle.
 */
export function selectNextAlgorithmSlot(
  slots: ScheduledPublishSlot[],
  completedSlotIds: string[],
  currentMinutesOfDay: number
): ScheduledPublishSlot | null {
  if (slots.length === 0) return null;
  const doneSet = new Set(completedSlotIds);
  const remaining = slots.filter((s) => !doneSet.has(s.slotId));
  const pool = remaining.length > 0 ? remaining : slots;

  const upcoming = pool.find((s) => s.minutesFromMidnight >= currentMinutesOfDay);
  return upcoming ?? pool[0];
}
