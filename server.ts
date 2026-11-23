import 'dotenv/config';
import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  type FulfillmentOrder,
  type StoreProduct,
} from './src/data/storeData.ts';
import { createAdminAuthManager } from './src/engine/adminAuth.ts';
import {
  ALL_CHANNELS,
  buildAlgorithmSchedule,
  selectNextAlgorithmSlot,
  type AccountPhase,
  type DistributionChannel,
  type PublishedAdItem,
  type ScheduledPublishSlot,
} from './src/engine/publishingAgentEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Server-side private admin auth (scrypt + timingSafeEqual + signed Bearer tokens)
const adminAuth = createAdminAuthManager({
  envPasscode: process.env.ADMIN_PASSCODE,
  sessionSecret: process.env.ADMIN_SESSION_SECRET,
});

// Shared store catalog & order ledger (public storefront writes orders, private admin reads/manages)
const storeProducts: StoreProduct[] = [...INITIAL_PRODUCTS];
const storeOrders: FulfillmentOrder[] = [...INITIAL_ORDERS];

// Strip internal cost & ad strategy fields from public storefront responses
function toPublicProduct(product: StoreProduct) {
  const {
    landedCogs: _landedCogs,
    adPainPoint: _adPainPoint,
    adVillain: _adVillain,
    adMechanism: _adMechanism,
    defaultAvatar: _defaultAvatar,
    seoFocusKeyword: _seoFocusKeyword,
    seoMetaDescription: _seoMetaDescription,
    ...publicFields
  } = product;
  return publicFields;
}

// Server-side Gemini client (API key remains strictly server-side)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your API key in Settings > Secrets to run the AI Ad Generator.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AgentProductSnapshot {
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
}

interface AgentRuntimeState {
  phase: AccountPhase;
  dailyAdBudget: number;
  avgCpc: number;
  enabledChannels: DistributionChannel[];
  autopilotEnabled: boolean;
  autopilotIntervalMinutes: number;
  selectedProduct: AgentProductSnapshot;
  queue: PublishedAdItem[];
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
  isRunning: boolean;
  totalGeneratedCount: number;
}

const defaultProd = storeProducts[0];
const agentState: AgentRuntimeState = {
  phase: 'growth',
  dailyAdBudget: 61.71,
  avgCpc: 0.9,
  enabledChannels: [...ALL_CHANNELS],
  autopilotEnabled: false,
  autopilotIntervalMinutes: 90,
  selectedProduct: {
    id: defaultProd.id,
    name: defaultProd.name,
    price: defaultProd.price,
    landedCogs: defaultProd.landedCogs,
    category: defaultProd.category,
    adPainPoint: defaultProd.adPainPoint,
    adVillain: defaultProd.adVillain,
    adMechanism: defaultProd.adMechanism,
    defaultAvatar: defaultProd.defaultAvatar,
    seoFocusKeyword: defaultProd.seoFocusKeyword,
  },
  queue: [],
  lastRunAt: null,
  nextRunAt: null,
  lastError: null,
  isRunning: false,
  totalGeneratedCount: 0,
};

const VALID_PHASES = new Set<AccountPhase>(['warmup', 'growth', 'scale']);
const VALID_CHANNELS = new Set<DistributionChannel>(ALL_CHANNELS);

function sanitizeString(value: unknown, maxLen = 220, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen) || fallback;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

function matchesCronSecret(token: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || !token) return false;
  try {
    const a = Buffer.from(token, 'utf8');
    const b = Buffer.from(cronSecret, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!adminAuth.verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Sign in via /admin.html to access operations.' });
    return;
  }
  next();
}

function requireAdminOrCronAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (adminAuth.verifyToken(token) || matchesCronSecret(token)) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized. Sign in via /admin.html or supply CRON_SECRET.' });
}

function getCurrentSchedule() {
  return buildAlgorithmSchedule({
    phase: agentState.phase,
    dailyAdBudget: agentState.dailyAdBudget,
    enabledChannels: agentState.enabledChannels,
    avgCpc: agentState.avgCpc,
  });
}

function computeNextRunIso(): string | null {
  if (!agentState.autopilotEnabled) return null;
  const ms = Math.max(1, agentState.autopilotIntervalMinutes) * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

function serializeAgentResponse() {
  const schedule = getCurrentSchedule();
  const completedSlotIds = agentState.queue.map((q) => q.slotId);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlot = selectNextAlgorithmSlot(schedule.slots, completedSlotIds, currentMinutes);

  return {
    config: {
      phase: agentState.phase,
      dailyAdBudget: agentState.dailyAdBudget,
      avgCpc: agentState.avgCpc,
      enabledChannels: agentState.enabledChannels,
      autopilotEnabled: agentState.autopilotEnabled,
      autopilotIntervalMinutes: agentState.autopilotIntervalMinutes,
      selectedProduct: agentState.selectedProduct,
    },
    schedule,
    nextSlot,
    queue: agentState.queue,
    runtime: {
      isRunning: agentState.isRunning,
      lastRunAt: agentState.lastRunAt,
      nextRunAt: agentState.nextRunAt,
      lastError: agentState.lastError,
      runsCompletedToday: agentState.queue.length,
      totalGeneratedCount: agentState.totalGeneratedCount,
    },
  };
}

function extractReadableApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number; status?: string } };
    if (parsed?.error?.message) {
      return `Gemini API (${parsed.error.code ?? parsed.error.status ?? 'Error'}): ${parsed.error.message}`;
    }
  } catch {
    // Not raw JSON
  }
  return raw;
}

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') || msg.includes('429');
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateCreativeWithGemini(
  slot: ScheduledPublishSlot,
  product: AgentProductSnapshot,
  triggerSource: 'autopilot' | 'manual'
): Promise<PublishedAdItem> {
  const ai = getGeminiClient();
  const candidateModels = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];

  const prompt = [
    `Generate one production-ready, high-converting social media ad / post package for Kova Studio.`,
    `Target Channel: ${slot.channelLabel} (${slot.channel})`,
    `Scheduled Peak Window: ${slot.time24h}`,
    `Creative Format: ${slot.format}`,
    `Hook Archetype: ${slot.hookArchetype}`,
    `Creative Angle: ${slot.angle}`,
    `Primary Algorithm Signal to Maximize: ${slot.objective}`,
    `Product Name: ${product.name}`,
    `Category: ${product.category}`,
    `Price: $${product.price.toFixed(2)} (Free 3-5 day US shipping, 30-day money-back guarantee, 2 free gifts unlocked)`,
    `Target Sub-Avatar: ${product.defaultAvatar}`,
    `Pain Point: ${product.adPainPoint}`,
    `Villain (old broken solution): ${product.adVillain}`,
    `Hero Mechanism: ${product.adMechanism}`,
    `Primary SEO Keyword: ${product.seoFocusKeyword}`,
    `Requirements:`,
    `- Follow the 4-Part 3-Second Hook Stack (visual hook + crisp overlay text <= 8 words + punchy verbal hook).`,
    `- Body script must be a tight, filmable 20-30 second Problem-Agitate-Solve (Villain vs. Hero) voiceover + shot direction.`,
    `- Keep copy direct, human, non-hype, and compliant with Meta/TikTok/YouTube/Pinterest ad policies (no medical cure claims).`,
    `- Include 4-6 platform-relevant hashtags and 3-5 high-intent SEO search keywords.`,
    `- Include 3 concrete algorithm optimization checklist items specific to ${slot.channelLabel}.`,
  ].join('\n');

  const requestConfig = {
    systemInstruction:
      'You are an autonomous e-commerce creative director and social media distribution engineer for Kova Studio. Return strictly valid JSON matching the schema.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: 'Short campaign/post headline under 70 chars' },
        visualHook0to3s: {
          type: Type.STRING,
          description: 'Exact 0-3 second visual shot direction designed to stop the scroll',
        },
        overlayText: {
          type: Type.STRING,
          description: 'Frame-1 on-screen text overlay (max 8 words)',
        },
        verbalHook: {
          type: Type.STRING,
          description: 'Spoken opening line for 0-3 seconds',
        },
        bodyScript: {
          type: Type.STRING,
          description: 'Concise 0:03-0:24 Villain-vs-Hero demonstration script with visual cues',
        },
        ctaLine: {
          type: Type.STRING,
          description: '0:24-0:30 call to action with offer and risk reversal',
        },
        caption: {
          type: Type.STRING,
          description: 'Native platform post caption optimized for saves, comments, and clicks',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '4 to 6 hashtags without spaces',
        },
        seoKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 to 5 buyer-intent SEO phrases for social search and alt-text',
        },
        algorithmChecklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 platform-specific algorithm cues verified for this post',
        },
        estimatedReach: {
          type: Type.STRING,
          description: 'Realistic projected initial distribution band, e.g., "1.8k–4.5k impressions"',
        },
      },
      required: [
        'headline',
        'visualHook0to3s',
        'overlayText',
        'verbalHook',
        'bodyScript',
        'ctaLine',
        'caption',
        'hashtags',
        'seoKeywords',
        'algorithmChecklist',
        'estimatedReach',
      ],
    },
  };

  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
  let usedModel = candidateModels[0];
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    usedModel = candidateModels[attempt];
    try {
      response = await ai.models.generateContent({
        model: usedModel,
        contents: prompt,
        config: requestConfig,
      });
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < candidateModels.length - 1 && isTransientError(err)) {
        await sleep(900 * (attempt + 1));
        continue;
      }
      throw new Error(extractReadableApiError(err));
    }
  }

  if (!response) {
    throw new Error(extractReadableApiError(lastErr ?? 'Gemini API request failed.'));
  }

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('Gemini returned an empty response for the ad creative.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    throw new Error('Failed to parse structured JSON ad creative from Gemini.');
  }

  const nowIso = new Date().toISOString();
  return {
    id: `pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slotId: slot.slotId,
    scheduledTime: slot.time24h,
    publishedAt: nowIso,
    triggerSource,
    status: 'published',
    channel: slot.channel,
    channelLabel: slot.channelLabel,
    productId: product.id,
    productName: product.name,
    format: slot.format,
    hookArchetype: slot.hookArchetype,
    angle: slot.angle,
    headline: sanitizeString(parsed.headline, 120, `${product.name} — ${slot.angle}`),
    visualHook0to3s: sanitizeString(parsed.visualHook0to3s, 260, 'Close-up visual contrast demo'),
    overlayText: sanitizeString(parsed.overlayText, 90, `Stop using ${product.adVillain}`),
    verbalHook: sanitizeString(parsed.verbalHook, 220, 'Watch this 15-minute daily reset.'),
    bodyScript: sanitizeString(parsed.bodyScript, 900, 'Demonstrate product relief step-by-step.'),
    ctaLine: sanitizeString(parsed.ctaLine, 220, 'Tap below for 20% off 2-packs + 2 free gifts.'),
    caption: sanitizeString(parsed.caption, 500, `${product.name} — free 3-5 day US delivery.`),
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags
          .map((h) => sanitizeString(h, 40))
          .filter(Boolean)
          .slice(0, 6)
      : ['#ergonomics', '#neckrelief', '#kovastudio'],
    seoKeywords: Array.isArray(parsed.seoKeywords)
      ? parsed.seoKeywords
          .map((k) => sanitizeString(k, 60))
          .filter(Boolean)
          .slice(0, 5)
      : [product.seoFocusKeyword],
    algorithmChecklist: Array.isArray(parsed.algorithmChecklist)
      ? parsed.algorithmChecklist
          .map((c) => sanitizeString(c, 120))
          .filter(Boolean)
          .slice(0, 3)
      : [slot.objective],
    estimatedReach: sanitizeString(parsed.estimatedReach, 60, '1.5k–4.2k seed impressions'),
    modelUsed: usedModel,
    pushedToCampaigns: false,
  };
}

async function executeAgentSlot(
  requestedSlotId: string | undefined,
  triggerSource: 'autopilot' | 'manual'
): Promise<PublishedAdItem> {
  if (agentState.isRunning) {
    throw new Error('The publishing agent is already executing a creative generation run.');
  }

  const schedule = getCurrentSchedule();
  if (schedule.slots.length === 0) {
    throw new Error('Enable at least one distribution channel before running the publishing agent.');
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const completedSlotIds = agentState.queue.map((q) => q.slotId);
  const slot =
    (requestedSlotId
      ? schedule.slots.find((s) => s.slotId === requestedSlotId)
      : null) ??
    selectNextAlgorithmSlot(schedule.slots, completedSlotIds, currentMinutes);

  if (!slot) {
    throw new Error('No algorithm publishing slot is available.');
  }

  agentState.isRunning = true;
  agentState.lastError = null;
  try {
    const item = await generateCreativeWithGemini(slot, agentState.selectedProduct, triggerSource);
    agentState.queue = [item, ...agentState.queue].slice(0, 40);
    agentState.lastRunAt = item.publishedAt;
    agentState.totalGeneratedCount += 1;
    agentState.nextRunAt = computeNextRunIso();
    return item;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unexpected error while running the AI Ad Generator.';
    agentState.lastError = message;
    throw new Error(message);
  } finally {
    agentState.isRunning = false;
  }
}

// Live server-side Autopilot Scheduler tick (checks every 15 seconds)
setInterval(() => {
  if (!agentState.autopilotEnabled || agentState.isRunning) return;
  if (!agentState.nextRunAt) {
    agentState.nextRunAt = computeNextRunIso();
    return;
  }
  const dueMs = Date.parse(agentState.nextRunAt);
  if (Number.isFinite(dueMs) && Date.now() >= dueMs) {
    executeAgentSlot(undefined, 'autopilot').catch((err) => {
      console.error('[PublishingAgent] Scheduled run failed:', err instanceof Error ? err.message : err);
      agentState.nextRunAt = computeNextRunIso();
    });
  }
}, 15000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Minimal public health endpoint for deployment checks
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // PUBLIC STOREFRONT API (Customer-safe only — zero internal margins or COGS)
  // ---------------------------------------------------------------------------
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json({ products: storeProducts.map(toPublicProduct) });
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const customerName = sanitizeString(body.customerName, 120);
    const customerEmail = sanitizeString(body.customerEmail, 160);
    const address = sanitizeString(body.address, 200);
    const city = sanitizeString(body.city, 80);
    const postalCode = sanitizeString(body.postalCode, 30);
    const promoCode = sanitizeString(body.promoCode, 24).toUpperCase();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (
      !customerName ||
      !customerEmail ||
      !customerEmail.includes('@') ||
      !address ||
      !city ||
      !postalCode ||
      rawItems.length === 0
    ) {
      res.status(400).json({
        error: 'Please complete all shipping fields and include at least one item in your bag.',
      });
      return;
    }

    let computedSubtotal = 0;
    let computedCogs = 0;
    let totalUnits = 0;
    const summaryParts: string[] = [];

    for (const raw of rawItems.slice(0, 20)) {
      if (!raw || typeof raw !== 'object') continue;
      const entry = raw as Record<string, unknown>;
      const productId = sanitizeString(entry.productId, 64);
      const product = storeProducts.find((p) => p.id === productId);
      if (!product) continue;

      const qtyRaw = typeof entry.quantity === 'number' && Number.isFinite(entry.quantity) ? entry.quantity : 1;
      const qty = Math.max(1, Math.min(20, Math.round(qtyRaw)));
      const isAddOn = entry.isToggleAddOn === true;

      if (isAddOn) {
        computedSubtotal += product.toggleAddOn.offerPrice * qty;
        computedCogs += Number((product.toggleAddOn.offerPrice * 0.25).toFixed(2)) * qty;
        totalUnits += qty;
        summaryParts.push(`${product.toggleAddOn.name} (${qty}x)`);
      } else {
        const bundleQtyRaw =
          typeof entry.bundleQty === 'number' && (entry.bundleQty === 1 || entry.bundleQty === 2 || entry.bundleQty === 3)
            ? entry.bundleQty
            : 1;
        const bundle = product.bundles.find((b) => b.qty === bundleQtyRaw) ?? product.bundles[0];
        const unitPrice = Number((product.price * (1 - bundle.discountPct / 100)).toFixed(2));
        computedSubtotal += unitPrice * qty;
        computedCogs += product.landedCogs * qty;
        totalUnits += qty;
        summaryParts.push(`${product.name} (${qty}x)`);
      }
    }

    if (totalUnits === 0) {
      res.status(400).json({ error: 'No valid catalog items were included in the order.' });
      return;
    }

    const discountPct = promoCode === 'SAVE15' ? 15 : promoCode === 'KOVA10' ? 10 : 0;
    const discountAmount = Number(((computedSubtotal * discountPct) / 100).toFixed(2));
    const finalTotal = Math.max(0, Number((computedSubtotal - discountAmount).toFixed(2)));

    const orderId = `KV-${1049 + storeOrders.length - INITIAL_ORDERS.length}`;
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newOrder: FulfillmentOrder = {
      id: orderId,
      createdAt: stamp,
      customerName,
      customerEmail,
      productName: summaryParts.join(', '),
      quantity: totalUnits,
      retailTotal: finalTotal,
      landedCogs: Number(computedCogs.toFixed(2)),
      allocatedCpa: 18.0,
      carrier: 'YunExpress Dedicated Air',
      trackingCode: `YT26326${Math.floor(1000000000 + Math.random() * 899999999)}`,
      daysWithoutScan: 0,
      promisedWindow: 'Delivered free in 3–5 business days',
      sourceChannel: 'Direct Storefront',
    };

    storeOrders.unshift(newOrder);

    res.status(201).json({
      orderId,
      total: finalTotal,
      estimatedDelivery: '3–5 business days (Free)',
    });
  });

  // ---------------------------------------------------------------------------
  // PRIVATE ADMIN AUTHENTICATION ROUTES
  // ---------------------------------------------------------------------------
  app.get('/api/admin/auth/status', (_req: Request, res: Response) => {
    res.json(adminAuth.getStatus());
  });

  app.post('/api/admin/auth/claim', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = adminAuth.claimFirstPasscode(body.passcode);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ token: result.token, status: adminAuth.getStatus() });
  });

  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = adminAuth.login(body.passcode);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ token: result.token, status: adminAuth.getStatus() });
  });

  app.post('/api/admin/auth/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    adminAuth.revokeToken(token);
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // PROTECTED PRIVATE OPERATIONS API (Requires Bearer Admin Token)
  // ---------------------------------------------------------------------------
  app.get('/api/admin/products', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ products: storeProducts });
  });

  app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const product = body.product as StoreProduct | undefined;
    if (
      !product ||
      typeof product !== 'object' ||
      typeof product.id !== 'string' ||
      typeof product.name !== 'string' ||
      typeof product.price !== 'number' ||
      !Number.isFinite(product.price) ||
      product.price <= 0
    ) {
      res.status(400).json({ error: 'Invalid product payload.' });
      return;
    }

    if (!storeProducts.some((p) => p.id === product.id)) {
      storeProducts.push(product);
    }

    res.status(201).json({ products: storeProducts });
  });

  app.get('/api/admin/orders', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ orders: storeOrders });
  });

  // Get full agent state + algorithm-optimized daily schedule
  app.get('/api/agent/state', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(serializeAgentResponse());
  });

  // Update algorithm cadence configuration & autopilot toggle
  app.post('/api/agent/config', requireAdminAuth, (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (typeof body.phase === 'string' && VALID_PHASES.has(body.phase as AccountPhase)) {
      agentState.phase = body.phase as AccountPhase;
    }

    if (typeof body.dailyAdBudget === 'number' && Number.isFinite(body.dailyAdBudget)) {
      agentState.dailyAdBudget = Math.max(0, Math.min(50000, body.dailyAdBudget));
    }

    if (typeof body.avgCpc === 'number' && Number.isFinite(body.avgCpc)) {
      agentState.avgCpc = Math.max(0.1, Math.min(25, body.avgCpc));
    }

    if (Array.isArray(body.enabledChannels)) {
      const filtered = body.enabledChannels.filter(
        (ch): ch is DistributionChannel =>
          typeof ch === 'string' && VALID_CHANNELS.has(ch as DistributionChannel)
      );
      if (filtered.length > 0) {
        agentState.enabledChannels = Array.from(new Set(filtered));
      }
    }

    if (
      typeof body.autopilotIntervalMinutes === 'number' &&
      Number.isFinite(body.autopilotIntervalMinutes)
    ) {
      agentState.autopilotIntervalMinutes = Math.max(
        5,
        Math.min(720, Math.round(body.autopilotIntervalMinutes))
      );
    }

    if (typeof body.autopilotEnabled === 'boolean') {
      agentState.autopilotEnabled = body.autopilotEnabled;
      agentState.nextRunAt = computeNextRunIso();
    } else if (agentState.autopilotEnabled && !agentState.nextRunAt) {
      agentState.nextRunAt = computeNextRunIso();
    }

    if (body.selectedProduct && typeof body.selectedProduct === 'object') {
      const sp = body.selectedProduct as Record<string, unknown>;
      agentState.selectedProduct = {
        id: sanitizeString(sp.id, 64, agentState.selectedProduct.id),
        name: sanitizeString(sp.name, 100, agentState.selectedProduct.name),
        price:
          typeof sp.price === 'number' && Number.isFinite(sp.price) && sp.price > 0
            ? sp.price
            : agentState.selectedProduct.price,
        landedCogs:
          typeof sp.landedCogs === 'number' && Number.isFinite(sp.landedCogs) && sp.landedCogs >= 0
            ? sp.landedCogs
            : agentState.selectedProduct.landedCogs,
        category: sanitizeString(sp.category, 80, agentState.selectedProduct.category),
        adPainPoint: sanitizeString(sp.adPainPoint, 200, agentState.selectedProduct.adPainPoint),
        adVillain: sanitizeString(sp.adVillain, 200, agentState.selectedProduct.adVillain),
        adMechanism: sanitizeString(sp.adMechanism, 200, agentState.selectedProduct.adMechanism),
        defaultAvatar: sanitizeString(
          sp.defaultAvatar,
          160,
          agentState.selectedProduct.defaultAvatar
        ),
        seoFocusKeyword: sanitizeString(
          sp.seoFocusKeyword,
          100,
          agentState.selectedProduct.seoFocusKeyword
        ),
      };
    }

    res.json(serializeAgentResponse());
  });

  // Trigger live Gemini ad generation + publishing for next optimal slot (or specified slotId)
  app.post('/api/agent/run', requireAdminOrCronAuth, async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const slotId = typeof body.slotId === 'string' ? body.slotId.slice(0, 64) : undefined;
    const countRaw = typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : 1;
    const count = Math.max(1, Math.min(3, Math.round(countRaw)));

    try {
      const created: PublishedAdItem[] = [];
      for (let i = 0; i < count; i++) {
        const item = await executeAgentSlot(i === 0 ? slotId : undefined, 'manual');
        created.push(item);
      }
      res.status(201).json({
        created,
        state: serializeAgentResponse(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate ad creative.';
      const status = message.includes('GEMINI_API_KEY')
        ? 503
        : message.includes('already executing')
        ? 409
        : 500;
      res.status(status).json({ error: message, state: serializeAgentResponse() });
    }
  });

  // Update status or pushedToCampaigns flag on a published ad item
  app.patch('/api/agent/queue/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = sanitizeString(req.params.id, 64);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const idx = agentState.queue.findIndex((q) => q.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Published ad item not found.' });
      return;
    }

    const existing = agentState.queue[idx];
    const nextStatus =
      body.status === 'published' || body.status === 'paused' || body.status === 'queued'
        ? body.status
        : existing.status;
    const nextPushed =
      typeof body.pushedToCampaigns === 'boolean'
        ? body.pushedToCampaigns
        : existing.pushedToCampaigns;

    agentState.queue[idx] = {
      ...existing,
      status: nextStatus,
      pushedToCampaigns: nextPushed,
    };

    res.json(serializeAgentResponse());
  });

  // Delete an item from the queue
  app.delete('/api/agent/queue/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = sanitizeString(req.params.id, 64);
    agentState.queue = agentState.queue.filter((q) => q.id !== id);
    res.json(serializeAgentResponse());
  });

  // Prevent search engine indexing of the private HTML file
  app.use(['/admin', '/admin.html'], (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
  });

  // Serve Vite middleware in development, or built static files in production
  if (!IS_PROD) {
    app.get('/admin', (_req: Request, res: Response) => {
      res.redirect(302, '/admin.html');
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get(['/admin', '/admin.html'], (_req: Request, res: Response) => {
      const adminPath = path.join(distDir, 'admin.html');
      if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
      } else {
        res.status(404).send('Private admin build not found. Run npm run build first.');
      }
    });
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Production build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kova Studio Server] Running on http://0.0.0.0:${PORT} (${IS_PROD ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('[Kova Studio Server] Fatal startup error:', err);
  process.exit(1);
});
