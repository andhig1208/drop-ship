import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Pause,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AdCampaignRecord, StoreProduct } from '../data/storeData';
import {
  ALL_CHANNELS,
  buildAlgorithmSchedule,
  type AccountPhase,
  type AlgorithmSchedulePlan,
  type DistributionChannel,
  type PublishedAdItem,
  type ScheduledPublishSlot,
} from '../engine/publishingAgentEngine';
import { calculateUnitEconomics } from '../engine/unitEconomics';

interface AgentApiResponse {
  config: {
    phase: AccountPhase;
    dailyAdBudget: number;
    avgCpc: number;
    enabledChannels: DistributionChannel[];
    autopilotEnabled: boolean;
    autopilotIntervalMinutes: number;
    selectedProduct: {
      id: string;
      name: string;
      price: number;
      landedCogs: number;
      category: string;
      adPainPoint: string;
      adVillain: string;
      adMechanism: string;
      defaultAvatar: string;
      seoFocusKeyword: string;
    };
  };
  schedule: AlgorithmSchedulePlan;
  nextSlot: ScheduledPublishSlot | null;
  queue: PublishedAdItem[];
  runtime: {
    isRunning: boolean;
    lastRunAt: string | null;
    nextRunAt: string | null;
    lastError: string | null;
    runsCompletedToday: number;
    totalGeneratedCount: number;
  };
}

interface PublishingAgentPanelProps {
  products: StoreProduct[];
  selectedProduct: StoreProduct;
  onSelectProduct: (id: string) => void;
  dailyAdBudget: number;
  avgCpc: number;
  onPushToCampaigns: (campaign: AdCampaignRecord) => void;
  authToken: string;
  onUnauthorized?: () => void;
}

interface GoLiveStep {
  id: string;
  number: string;
  title: string;
  timing: string;
  summary: string;
  actions: string[];
  codeLabel?: string;
  codeSnippet?: string;
}

const GO_LIVE_STEPS: GoLiveStep[] = [
  {
    id: 'step-public',
    number: '01',
    title: 'Publish the Storefront & Lock Your Private Admin Passcode',
    timing: 'Day 1 · 15 mins',
    summary:
      'Deploy the full-stack server publicly so shoppers only see your clean storefront at / while this operations console stays private at /admin.html.',
    actions: [
      'Set ADMIN_PASSCODE (min 8 characters) and GEMINI_API_KEY in Settings > Secrets so your private /admin.html console and /api/agent/* endpoints stay locked in production.',
      'Click Deploy / Share to publish to your HTTPS URL (serves the public storefront at / and this private console at /admin.html on port 3000).',
      'Point your custom domain (e.g., kovastudio.com) via Cloud Run Domain Mapping by adding the provided A / AAAA or CNAME DNS records at your registrar.',
      'Set APP_URL="https://yourdomain.com" in Settings > Secrets, then submit https://yourdomain.com in Google Search Console and Google Merchant Center.',
    ],
  },
  {
    id: 'step-checkout',
    number: '02',
    title: 'Connect Live Payments, Pixel Tracking & Auto-Fulfillment',
    timing: 'Day 1 · 30 mins',
    summary:
      'Turn the storefront checkout into real settled revenue with automated supplier dispatch and margin protection.',
    actions: [
      'Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET (or connect Shopify Storefront Checkout) in Settings > Secrets to process real cards, Apple Pay, and Shop Pay.',
      'Install Meta Pixel + Conversions API (CAPI), TikTok Pixel + Events API, and Google Tag Manager so AddToCart, InitiateCheckout, and Purchase events feed back into the ad algorithms.',
      'Connect your fulfillment tier from the Fulfillment tab: start with AutoDS / US eBay Top-Rated Plus or AliExpress VIP at 0–10 orders/day, then graduate to a Direct 1688 Private Sourcing Agent + 17TRACK webhook at 10+ orders/day.',
      'Keep the 5.0% minimum net margin gate active on every incoming webhook order before dispatching supplier purchase orders.',
    ],
  },
  {
    id: 'step-video-render',
    number: '03',
    title: 'Wire Automated AI Video Rendering (Script JSON → 9:16 MP4)',
    timing: 'Day 2 · 30 mins',
    summary:
      'Convert every Gemini-generated script package (0–3s visual hook, overlay text, verbal hook, PAS body, CTA) into a ready-to-upload 9:16 vertical video without manual editing.',
    actions: [
      'Use this Publishing Agent’s JSON output as the upstream payload for a video renderer: either Gemini Omni / Veo (video B-roll) + TTS voiceover, or an API studio like Creatify, HeyGen, Arcads, or Photoroom Video API.',
      'Store your video provider key (e.g., VIDEO_RENDER_API_KEY) in Settings > Secrets and pass the product hero image + visualHook0to3s + bodyScript + overlayText to render a clean, watermark-free 1080×1920 MP4 (22–30s).',
      'Burn high-contrast Frame-1 hook captions directly into the top-middle safe zone (avoiding TikTok/Reels right-hand icon overlap) and export with native audio loudness (-14 LUFS).',
    ],
    codeLabel: 'Video Render Webhook Payload (from /api/agent/run)',
    codeSnippet: `{
  "aspectRatio": "9:16",
  "durationSeconds": 28,
  "productImage": "https://yourdomain.com/src/assets/images/hero_cervical_relief.jpg",
  "overlayHook": "<item.overlayText>",
  "openingShot": "<item.visualHook0to3s>",
  "voiceoverScript": "<item.verbalHook> <item.bodyScript> <item.ctaLine>",
  "burnSubtitles": true,
  "watermark": false
}`,
  },
  {
    id: 'step-autopost',
    number: '04',
    title: 'Connect Official Social APIs & 24/7 Cloud Scheduler Cron',
    timing: 'Day 2 · 45 mins',
    summary:
      'Eliminate manual uploading by dispatching rendered MP4s and Pins to each platform API at the exact peak algorithm times—even when your browser is closed.',
    actions: [
      'Direct Official APIs (lowest cost): register developer apps for TikTok Content Posting API (Direct Post), Meta Marketing API + Instagram Graph Reels API, YouTube Data API v3 (Shorts), and Pinterest API v5 (Create Pin). Store OAuth refresh tokens strictly in Settings > Secrets.',
      'Fastest No-Code Bridge (10-min setup): send the rendered MP4 URL + caption + hashtags from server.ts to a single Make.com, n8n, or Blotato webhook that fans out to TikTok, IG Reels, YouTube Shorts, and Pinterest simultaneously.',
      'Keep the agent running 24/7 on Cloud Run (which scales to zero between requests) by creating Google Cloud Scheduler HTTP jobs that POST to /api/agent/run at your peak algorithm slots (06:00, 07:30, 08:30, 09:15, 11:00, 12:30, 13:00, 17:30, 18:15, 19:30, 20:00).',
      'Protect your cron endpoint with a shared CRON_SECRET header stored in Settings > Secrets before enabling public scheduled triggers.',
    ],
    codeLabel: 'Google Cloud Scheduler Trigger (Peak Window Auto-Run)',
    codeSnippet: `curl -X POST "https://yourdomain.com/api/agent/run" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -d '{"count": 1}'`,
  },
  {
    id: 'step-scale',
    number: '05',
    title: 'Execute the 7-Day Warm-Up → Growth → Scale Traffic Ramp',
    timing: 'Days 1–14 · Ongoing',
    summary:
      'Respect platform trust scores during Week 1 so accounts never get 0-view throttled, then scale winning hooks into paid Meta Andromeda CBO.',
    actions: [
      'Days 1–7 (Warm-Up · 7 runs/day): Keep Account Phase on Warm-Up (2 TikTok, 1 IG Reel, 1 YT Short, 2 Pinterest Pins, 1 Meta Andromeda test). Never repost watermarked TikTok videos onto Instagram or YouTube.',
      'Days 8+ (Growth · 11 runs/day): Switch to Growth mode once average views stabilize. Promote any organic clip exceeding 65% watch completion or >2.5% CTR directly into Meta Broad CBO / TikTok Spark Ads.',
      'Scale Phase (14 runs/day · ≥$100/day budget): Unlock dual Meta Andromeda drops (06:00 + 17:00) and reply to high-intent buyer comments using the 7-Day Post-Viral Follow-Up Formula while Media Buying Gates automatically pause any ad exceeding 1.0x break-even CPA.',
    ],
  },
];

const PHASE_OPTIONS: {
  id: AccountPhase;
  label: string;
  runsNote: string;
  desc: string;
}[] = [
  {
    id: 'warmup',
    label: 'Warm-Up',
    runsNote: '7 runs/day',
    desc: 'Days 1–7 fresh accounts · prevents shadowbans',
  },
  {
    id: 'growth',
    label: 'Growth (Optimal)',
    runsNote: '11 runs/day',
    desc: 'Max algorithm velocity across all 5 channels',
  },
  {
    id: 'scale',
    label: 'Scale',
    runsNote: '14 runs/day',
    desc: 'Dual Andromeda drops + post-viral comment replies',
  },
];

export function PublishingAgentPanel({
  products,
  selectedProduct,
  onSelectProduct,
  dailyAdBudget,
  avgCpc,
  onPushToCampaigns,
  authToken,
  onUnauthorized,
}: PublishingAgentPanelProps) {
  const [phase, setPhase] = useState<AccountPhase>('growth');
  const [enabledChannels, setEnabledChannels] = useState<DistributionChannel[]>([...ALL_CHANNELS]);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [autopilotIntervalMinutes, setAutopilotIntervalMinutes] = useState(90);
  const [queue, setQueue] = useState<PublishedAdItem[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [nextRunAt, setNextRunAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSlotRunning, setActiveSlotRunning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);

  // Go-Live Playbook interactive checklist state
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [expandedStepId, setExpandedStepId] = useState<string>('step-public');

  const authHeaders = (json = false): Record<string, string> => ({
    Authorization: `Bearer ${authToken}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  });

  const handleAuthResponse = (res: Response): boolean => {
    if (res.status === 401) {
      onUnauthorized?.();
      return false;
    }
    return true;
  };

  const localSchedule = buildAlgorithmSchedule({
    phase,
    dailyAdBudget,
    enabledChannels,
    avgCpc,
  });

  const applyServerState = (data: AgentApiResponse) => {
    setPhase(data.config.phase);
    setEnabledChannels(data.config.enabledChannels);
    setAutopilotEnabled(data.config.autopilotEnabled);
    setAutopilotIntervalMinutes(data.config.autopilotIntervalMinutes);
    setQueue(data.queue);
    setLastRunAt(data.runtime.lastRunAt);
    setNextRunAt(data.runtime.nextRunAt);
    if (data.runtime.lastError) {
      setErrorMsg(data.runtime.lastError);
    }
  };

  // Load initial agent state from server on mount
  useEffect(() => {
    let active = true;
    fetch('/api/agent/state', { headers: authHeaders() })
      .then((res) => {
        if (!handleAuthResponse(res)) return null;
        return res.ok ? res.json() : null;
      })
      .then((data: AgentApiResponse | null) => {
        if (active && data) {
          applyServerState(data);
        }
      })
      .catch(() => {
        // Ignore initial poll error if server is restarting
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Poll server state every 10s while autopilot is running
  useEffect(() => {
    if (!autopilotEnabled) return;
    const timer = setInterval(() => {
      fetch('/api/agent/state', { headers: authHeaders() })
        .then((res) => {
          if (!handleAuthResponse(res)) return null;
          return res.ok ? res.json() : null;
        })
        .then((data: AgentApiResponse | null) => {
          if (data) applyServerState(data);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autopilotEnabled, authToken]);

  const syncConfigToServer = async (patch: Record<string, unknown>) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/agent/config', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          selectedProduct: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            landedCogs: selectedProduct.landedCogs,
            category: selectedProduct.category,
            adPainPoint: selectedProduct.adPainPoint,
            adVillain: selectedProduct.adVillain,
            adMechanism: selectedProduct.adMechanism,
            defaultAvatar: selectedProduct.defaultAvatar,
            seoFocusKeyword: selectedProduct.seoFocusKeyword,
          },
          dailyAdBudget,
          avgCpc,
          ...patch,
        }),
      });
      if (!handleAuthResponse(res)) return;
      if (res.ok) {
        const data = (await res.json()) as AgentApiResponse;
        applyServerState(data);
      }
    } catch {
      setErrorMsg('Unable to sync configuration with the local publishing agent server.');
    }
  };

  // Keep selected product & budget synced to server whenever user changes them
  useEffect(() => {
    syncConfigToServer({
      dailyAdBudget,
      avgCpc,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct.id, dailyAdBudget, avgCpc]);

  const handlePhaseChange = (nextPhase: AccountPhase) => {
    setPhase(nextPhase);
    syncConfigToServer({ phase: nextPhase });
  };

  const handleToggleChannel = (ch: DistributionChannel) => {
    const exists = enabledChannels.includes(ch);
    if (exists && enabledChannels.length === 1) return; // keep at least 1 active channel
    const next = exists
      ? enabledChannels.filter((c) => c !== ch)
      : [...enabledChannels, ch];
    setEnabledChannels(next);
    syncConfigToServer({ enabledChannels: next });
  };

  const handleToggleAutopilot = () => {
    const next = !autopilotEnabled;
    setAutopilotEnabled(next);
    syncConfigToServer({
      autopilotEnabled: next,
      autopilotIntervalMinutes,
    });
  };

  const handleIntervalChange = (mins: number) => {
    setAutopilotIntervalMinutes(mins);
    syncConfigToServer({ autopilotIntervalMinutes: mins });
  };

  const handleRunAgent = async (slotId?: string, count = 1) => {
    setIsGenerating(true);
    setActiveSlotRunning(slotId ?? 'next');
    setErrorMsg(null);
    try {
      // Ensure server has latest product & cadence before generating
      const cfgRes = await fetch('/api/agent/config', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          phase,
          dailyAdBudget,
          avgCpc,
          enabledChannels,
          selectedProduct: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            landedCogs: selectedProduct.landedCogs,
            category: selectedProduct.category,
            adPainPoint: selectedProduct.adPainPoint,
            adVillain: selectedProduct.adVillain,
            adMechanism: selectedProduct.adMechanism,
            defaultAvatar: selectedProduct.defaultAvatar,
            seoFocusKeyword: selectedProduct.seoFocusKeyword,
          },
        }),
      });
      if (!handleAuthResponse(cfgRes)) return;

      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ slotId, count }),
      });
      if (!handleAuthResponse(res)) return;

      const data = (await res.json()) as {
        created?: PublishedAdItem[];
        state?: AgentApiResponse;
        error?: string;
      };

      if (!res.ok) {
        setErrorMsg(data.error || 'Ad generation failed. Check GEMINI_API_KEY in Settings > Secrets.');
        if (data.state) applyServerState(data.state);
        return;
      }

      if (data.state) {
        applyServerState(data.state);
      }
      if (data.created && data.created.length > 0) {
        setExpandedQueueId(data.created[0].id);
      }
    } catch {
      setErrorMsg('Network error reaching the Publishing Agent server endpoint.');
    } finally {
      setIsGenerating(false);
      setActiveSlotRunning(null);
    }
  };

  const handleToggleItemStatus = async (item: PublishedAdItem) => {
    const nextStatus = item.status === 'published' ? 'paused' : 'published';
    const res = await fetch(`/api/agent/queue/${encodeURIComponent(item.id)}`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!handleAuthResponse(res)) return;
    if (res.ok) {
      const data = (await res.json()) as AgentApiResponse;
      applyServerState(data);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/agent/queue/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!handleAuthResponse(res)) return;
    if (res.ok) {
      const data = (await res.json()) as AgentApiResponse;
      applyServerState(data);
    }
  };

  const handlePushItemToGates = async (item: PublishedAdItem) => {
    const prod = products.find((p) => p.id === item.productId) ?? selectedProduct;
    const econ = calculateUnitEconomics({
      manufacturingCost: prod.landedCogs * 0.58,
      packagingCost: prod.landedCogs * 0.08,
      shippingCost: prod.landedCogs * 0.31,
      tariffDuty: prod.landedCogs * 0.03,
      retailPrice: prod.price,
      targetCac: 20,
      repeatRate6Mo: 0.25,
    });

    const platform = item.channel === 'tiktok' ? 'TikTok' : 'Meta';
    onPushToCampaigns({
      id: `agent-camp-${Date.now()}`,
      name: `${item.channelLabel} · ${item.headline.slice(0, 42)}`,
      productId: prod.id,
      avatar: prod.defaultAvatar,
      angle: item.angle,
      dailyBudget: Math.max(25, Math.round(dailyAdBudget)),
      telemetry: {
        platform,
        spend: 32,
        uniqueLinkClicks: 44,
        ctrLinkPct: 2.75,
        ctrAllPct: 4.8,
        cpm: 22.4,
        addToCarts: 5,
        purchases: 2,
        revenue: Number((prod.price * 2).toFixed(2)),
        breakEvenRoas: econ.breakEvenRoas,
        breakEvenCpa: econ.maxCpa,
        adSetRoas: 3.1,
        isTopOfFunnelAssist: false,
        daysProfitable: 1,
      },
    });

    const res = await fetch(`/api/agent/queue/${encodeURIComponent(item.id)}`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ pushedToCampaigns: true }),
    });
    if (!handleAuthResponse(res)) return;
    if (res.ok) {
      const data = (await res.json()) as AgentApiResponse;
      applyServerState(data);
    }
  };

  const copyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleGoLiveStep = (id: string) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const completedSlotSet = new Set(queue.map((q) => q.slotId));

  return (
    <div className="space-y-8">
      {/* Top Control Panel: Algorithm Cadence + Autopilot Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Agent Controls */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#111315]">
                Autonomous Ad Generator & Publishing Agent
              </h2>
              <p className="text-xs text-[#525866] mt-0.5">
                Schedules the exact daily run count per platform that maximizes reach without tripping spam cooldowns or resetting Meta learning.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="agent-sku" className="block text-xs font-medium text-[#111315] mb-1">
                Active Product SKU
              </label>
              <select
                id="agent-sku"
                value={selectedProduct.id}
                onChange={(e) => onSelectProduct(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-[#111315]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${p.price.toFixed(0)} retail
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#111315] mb-1.5">
                Account Algorithm Phase (Auto-Sets Daily Runs)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {PHASE_OPTIONS.map((opt) => {
                  const active = phase === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handlePhaseChange(opt.id)}
                      className={`p-2.5 text-left rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#111315]'
                          : 'border-neutral-200 bg-[#F8F9FA] text-[#525866] hover:border-neutral-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#111315]">{opt.label}</p>
                      <p className="font-mono-num text-[11px] font-semibold text-[#1D4ED8] mt-0.5">
                        {opt.runsNote}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#525866] mt-1.5">{localSchedule.guardrailSummary}</p>
            </div>

            {/* Autopilot Scheduler Row */}
            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#111315]">
                    Server Autopilot Scheduler
                  </p>
                  <p className="text-[11px] text-[#525866]">
                    {autopilotEnabled && nextRunAt
                      ? `Running · Next auto-run at ${new Date(nextRunAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Paused · Click Enable Autopilot or run any slot on demand'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutopilot}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    autopilotEnabled
                      ? 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                      : 'bg-white text-[#111315] border border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {autopilotEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {autopilotEnabled ? 'Autopilot Active' : 'Enable Autopilot'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
                <label htmlFor="agent-interval" className="text-[11px] text-[#525866]">
                  Auto-Run Cycle Interval
                </label>
                <select
                  id="agent-interval"
                  value={autopilotIntervalMinutes}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-mono-num border border-neutral-300 rounded-md bg-white text-[#111315]"
                >
                  <option value={30}>Every 30 min (High velocity)</option>
                  <option value={60}>Every 60 min (Scale pace)</option>
                  <option value={90}>Every 90 min (Growth optimal)</option>
                  <option value={120}>Every 2 hours (Warm-up pace)</option>
                </select>
              </div>
            </div>

            {/* Primary Trigger Actions */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleRunAgent(undefined, 1)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGenerating ? 'Generating Creative…' : 'Generate & Publish Next Slot'}
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleRunAgent(undefined, 3)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F8F9FA] disabled:opacity-60 text-[#111315] border border-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Run 3-Slot Burst
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
              >
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right: Algorithm Output Summary + Channel Cadence Matrix */}
        <div className="lg:col-span-7 bg-[#F8F9FA] rounded-xl border border-neutral-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <p className="text-xs text-[#525866]">Optimal Daily Publishing Frequency</p>
              <p className="font-mono-num text-3xl font-semibold text-[#1D4ED8] mt-0.5">
                {localSchedule.totalRunsPerDay} runs / day
              </p>
              <p className="text-xs text-[#525866] mt-0.5">
                {localSchedule.organicRunsPerDay} organic · {localSchedule.paidRunsPerDay} paid Andromeda · avg {localSchedule.avgIntervalMinutes}m spacing
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-[#525866]">Projected Daily Traffic Lift</p>
              <p className="font-mono-num text-2xl font-semibold text-[#16A34A] mt-0.5">
                ~{localSchedule.projectedTotalDailyTraffic} clicks/d
              </p>
              <p className="text-[11px] text-[#525866]">
                {localSchedule.projectedDailyOrganicClicks} free + {localSchedule.projectedDailyPaidClicks} paid · Score {localSchedule.algorithmEfficiencyScore}/100
              </p>
            </div>
          </div>

          {/* 5-Channel Algorithm Table */}
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-[#525866] font-semibold">
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3 text-right">Runs/Day</th>
                    <th className="py-2.5 px-3">Peak Windows</th>
                    <th className="py-2.5 px-3">Algorithm Signal & Anti-Throttle Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {localSchedule.channels.map((ch) => (
                    <tr key={ch.channel} className={ch.enabled ? '' : 'opacity-50'}>
                      <td className="py-2.5 px-3 align-top">
                        <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[#111315]">
                          <input
                            type="checkbox"
                            checked={ch.enabled}
                            onChange={() => handleToggleChannel(ch.channel)}
                            className="rounded border-neutral-300"
                          />
                          <span>{ch.label}</span>
                        </label>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold text-[#1D4ED8] align-top whitespace-nowrap">
                        {ch.runsPerDay}/d
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-[#111315] align-top whitespace-nowrap">
                        {ch.enabled ? ch.peakTimes.join(' · ') : 'Off'}
                      </td>
                      <td className="py-2.5 px-3 text-[#525866] align-top">
                        <p className="font-medium text-[#111315]">{ch.primarySignal}</p>
                        <p className="text-[11px] mt-0.5">{ch.antiThrottleGuardrail}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Peak Algorithm Run Schedule */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#111315]">
              Today’s Algorithm-Optimal Run Timeline ({localSchedule.totalRunsPerDay} Scheduled Slots)
            </h3>
            <p className="text-xs text-[#525866]">
              Zero consecutive duplicate hooks · Enforces platform spacing guardrails ·{' '}
              {queue.length} published today
              {lastRunAt
                ? ` · Last run ${new Date(lastRunAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-[#525866] font-semibold">
                <th className="py-2.5 px-5">Window</th>
                <th className="py-2.5 px-3">Channel & Format</th>
                <th className="py-2.5 px-3">Rotated 3s Hook Archetype</th>
                <th className="py-2.5 px-3">Creative Angle</th>
                <th className="py-2.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {localSchedule.slots.map((slot) => {
                const done = completedSlotSet.has(slot.slotId);
                const busy = isGenerating && activeSlotRunning === slot.slotId;
                return (
                  <tr key={slot.slotId} className="hover:bg-[#F8F9FA]/70">
                    <td className="py-2.5 px-5 font-mono-num font-semibold text-[#111315] whitespace-nowrap">
                      {slot.time24h}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-[#111315]">{slot.channelLabel}</p>
                      <p className="text-[11px] text-[#525866]">{slot.format}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[#111315]">{slot.hookArchetype}</td>
                    <td className="py-2.5 px-3 text-[#525866]">{slot.angle}</td>
                    <td className="py-2.5 px-5 text-right whitespace-nowrap">
                      {done ? (
                        <span className="inline-flex items-center gap-1 font-medium text-[#16A34A]">
                          <Check className="w-3.5 h-3.5" />
                          Published
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isGenerating}
                          onClick={() => handleRunAgent(slot.slotId, 1)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8] hover:text-white hover:bg-[#1D4ED8] border border-[#1D4ED8]/30 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {busy ? 'Generating…' : 'Run Slot'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Generated & Published Creative Feed */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#111315]">
              Live Generated & Published Ad Feed ({queue.length})
            </h3>
            <p className="text-xs text-[#525866]">
              AI-generated video scripts, 4-Part 3s hooks, captions, hashtags, and SEO keywords ready for automated video render & posting.
            </p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-[#111315]">
              No creatives published in this session yet.
            </p>
            <p className="text-xs text-[#525866] max-w-md mx-auto">
              Click <strong>Generate & Publish Next Slot</strong> above (or enable the Server Autopilot Scheduler) to have the agent generate a platform-tuned ad package for {selectedProduct.name}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {queue.map((item) => {
              const isExpanded = expandedQueueId === item.id;
              const fullPackText = [
                `[${item.channelLabel} · ${item.scheduledTime}] ${item.headline}`,
                `Product: ${item.productName} | Format: ${item.format}`,
                `Frame-1 Overlay: ${item.overlayText}`,
                `0–3s Visual Hook: ${item.visualHook0to3s}`,
                `0–3s Verbal Hook: ${item.verbalHook}`,
                `Body Script: ${item.bodyScript}`,
                `CTA: ${item.ctaLine}`,
                `Caption: ${item.caption}`,
                `Hashtags: ${item.hashtags.join(' ')}`,
                `SEO Keywords: ${item.seoKeywords.join(', ')}`,
              ].join('\n');

              return (
                <article key={item.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs text-[#525866]">
                        <span
                          className={`font-semibold ${
                            item.status === 'published' ? 'text-[#16A34A]' : 'text-[#D97706]'
                          }`}
                        >
                          {item.status === 'published' ? 'Published' : 'Paused'}
                        </span>
                        {' · '}
                        <span className="font-medium text-[#111315]">{item.channelLabel}</span>
                        {' · '}
                        <span className="font-mono-num">{item.scheduledTime}</span>
                        {' · '}
                        {item.productName}
                        {' · '}
                        {item.estimatedReach}
                      </p>
                      <h4 className="font-display text-base font-semibold text-[#111315]">
                        {item.headline}
                      </h4>
                      <p className="text-xs text-[#525866]">
                        Overlay: <strong className="text-[#111315]">“{item.overlayText}”</strong> ·{' '}
                        {item.hookArchetype}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(item.id, fullPackText)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-md cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedId === item.id ? 'Copied' : 'Copy Pack'}
                      </button>

                      <button
                        type="button"
                        disabled={item.pushedToCampaigns}
                        onClick={() => handlePushItemToGates(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] disabled:opacity-50 border border-[#BFDBFE] rounded-md cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {item.pushedToCampaigns ? 'In Buying Gates' : 'Send to Buying Gates'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(item)}
                        className="px-2.5 py-1.5 text-xs font-medium text-[#525866] hover:text-[#111315] border border-neutral-200 rounded-md cursor-pointer"
                      >
                        {item.status === 'published' ? 'Pause' : 'Resume'}
                      </button>

                      <button
                        type="button"
                        aria-label={`Remove ${item.headline}`}
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-[#525866] hover:text-[#DC2626] border border-neutral-200 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedQueueId(isExpanded ? null : item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#525866] hover:text-[#111315] cursor-pointer"
                      >
                        {isExpanded ? 'Hide Script' : 'Inspect Script'}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                      <div className="lg:col-span-7 space-y-2.5 bg-[#F8F9FA] p-4 rounded-lg border border-neutral-200">
                        <div>
                          <p className="font-semibold text-[#111315]">0:00–0:03 Visual Hook</p>
                          <p className="text-[#525866] mt-0.5">{item.visualHook0to3s}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111315]">0:00–0:03 Verbal Hook</p>
                          <p className="text-[#111315] mt-0.5">“{item.verbalHook}”</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111315]">0:03–0:24 PAS Video Script</p>
                          <p className="text-[#525866] mt-0.5 leading-relaxed">{item.bodyScript}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111315]">0:24–0:30 CTA</p>
                          <p className="text-[#1D4ED8] font-medium mt-0.5">{item.ctaLine}</p>
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-3 bg-[#F8F9FA] p-4 rounded-lg border border-neutral-200">
                        <div>
                          <p className="font-semibold text-[#111315]">Native Post Caption</p>
                          <p className="text-[#525866] mt-0.5 leading-relaxed">{item.caption}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111315]">Hashtags & Search Keywords</p>
                          <p className="font-mono-num text-[11px] text-[#1D4ED8] mt-0.5">
                            {item.hashtags.join(' ')}
                          </p>
                          <p className="text-[11px] text-[#525866] mt-1">
                            SEO: {item.seoKeywords.join(' · ')}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[#111315]">Algorithm Verification</p>
                          <ul className="mt-1 space-y-1 text-[#525866]">
                            {item.algorithmChecklist.map((chk, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                                <span>{chk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Step-by-Step Public Go-Live & Automated Video Posting Playbook */}
      <section
        id="go-live-playbook"
        aria-labelledby="go-live-heading"
        className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 bg-[#F8F9FA]">
          <div>
            <p className="text-xs font-medium text-[#1D4ED8]">
              Public Launch & Zero-Touch Automation Checklist
            </p>
            <h3
              id="go-live-heading"
              className="font-display text-lg font-semibold text-[#111315] mt-0.5"
            >
              Step-by-Step: Make Your Store Public & Auto-Generate / Post Videos 24/7
            </h3>
          </div>
          <div className="text-right">
            <p className="font-mono-num text-sm font-semibold text-[#111315]">
              {completedSteps.length} / {GO_LIVE_STEPS.length} Steps Ready
            </p>
            <div className="w-40 h-1.5 bg-neutral-200 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#16A34A] transition-all"
                style={{
                  width: `${Math.round((completedSteps.length / GO_LIVE_STEPS.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-200">
          {GO_LIVE_STEPS.map((step) => {
            const checked = completedSteps.includes(step.id);
            const open = expandedStepId === step.id;
            return (
              <div key={step.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${step.id}`}
                      checked={checked}
                      onChange={() => toggleGoLiveStep(step.id)}
                      className="mt-1 rounded border-neutral-300 cursor-pointer"
                    />
                    <div>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setExpandedStepId(open ? '' : step.id)}
                        className="text-left cursor-pointer"
                      >
                        <span className="font-mono-num text-xs font-semibold text-[#1D4ED8] mr-2">
                          STEP {step.number}
                        </span>
                        <span
                          className={`font-display text-sm font-semibold ${
                            checked ? 'line-through text-[#525866]' : 'text-[#111315]'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-xs text-[#525866] ml-2">· {step.timing}</span>
                      </button>
                      <p className="text-xs text-[#525866] mt-1">{step.summary}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={open ? `Collapse Step ${step.number}` : `Expand Step ${step.number}`}
                    onClick={() => setExpandedStepId(open ? '' : step.id)}
                    className="p-1 text-[#525866] hover:text-[#111315] cursor-pointer"
                  >
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {open && (
                  <div className="mt-4 ml-7 space-y-3">
                    <ol className="space-y-2 text-xs text-[#111315] list-decimal pl-4">
                      {step.actions.map((action, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {action}
                        </li>
                      ))}
                    </ol>

                    {step.codeSnippet && (
                      <div className="rounded-lg border border-neutral-200 bg-[#F8F9FA] overflow-hidden">
                        <div className="px-3.5 py-2 border-b border-neutral-200 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#525866]">
                            {step.codeLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyText(step.id, step.codeSnippet!)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                          >
                            {copiedId === step.id ? (
                              <Check className="w-3 h-3 text-[#16A34A]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedId === step.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3.5 text-[11px] font-mono-num text-[#111315] overflow-x-auto leading-relaxed">
                          {step.codeSnippet}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
