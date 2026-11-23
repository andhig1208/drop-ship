import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Lock, LogOut, ShieldCheck } from 'lucide-react';
import {
  INITIAL_AD_CAMPAIGNS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_RESEARCH_CANDIDATES,
  type AdCampaignRecord,
  type FulfillmentOrder,
  type StoreProduct,
} from './data/storeData';
import type { ProductCandidate } from './engine/unitEconomics';
import { AdStudioView } from './components/AdStudioView';
import { SeoHubView } from './components/SeoHubView';
import { ResearchView } from './components/ResearchView';
import { FulfillmentView } from './components/FulfillmentView';

type AdminSection = 'ads' | 'seo' | 'research' | 'fulfillment';

interface AuthStatus {
  configured: boolean;
  source: 'env' | 'claimed' | 'unconfigured';
  requiresInitialSetup: boolean;
}

const ADMIN_TABS: { id: AdminSection; label: string }[] = [
  { id: 'ads', label: 'Ad Studio' },
  { id: 'seo', label: 'SEO & Schema' },
  { id: 'research', label: 'Research' },
  { id: 'fulfillment', label: 'Fulfillment' },
];

export default function AdminApp() {
  // Auth token lives strictly in React state (never localStorage or sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Auth form state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Operations workspace state
  const [activeSection, setActiveSection] = useState<AdminSection>('ads');
  const [products, setProducts] = useState<StoreProduct[]>(INITIAL_PRODUCTS);
  const [campaigns, setCampaigns] = useState<AdCampaignRecord[]>(INITIAL_AD_CAMPAIGNS);
  const [orders, setOrders] = useState<FulfillmentOrder[]>(INITIAL_ORDERS);
  const [publishedCandidateIds, setPublishedCandidateIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAuthStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/auth/status');
      if (res.ok) {
        const data = (await res.json()) as AuthStatus;
        setAuthStatus(data);
      }
    } catch {
      setAuthError('Unable to reach the operations server. Please refresh.');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadAuthStatus();
  }, []);

  // Load live server products & customer orders once authenticated
  useEffect(() => {
    if (!authToken) return;
    let active = true;
    const headers = { Authorization: `Bearer ${authToken}` };

    Promise.all([
      fetch('/api/admin/products', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/admin/orders', { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(
        ([prodData, orderData]: [
          { products?: StoreProduct[] } | null,
          { orders?: FulfillmentOrder[] } | null,
        ]) => {
          if (!active) return;
          if (prodData?.products && prodData.products.length > 0) {
            setProducts(prodData.products);
            const initialIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
            setPublishedCandidateIds(
              prodData.products.filter((p) => !initialIds.has(p.id)).map((p) => p.id)
            );
          }
          if (orderData?.orders) {
            setOrders(orderData.orders);
          }
        }
      )
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [authToken]);

  const handleUnauthorized = () => {
    setAuthToken(null);
    setAuthError('Your private session expired. Sign in again to continue.');
    loadAuthStatus();
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const isSetup = authStatus?.requiresInitialSetup === true;
    if (isSetup) {
      if (passcodeInput.trim().length < 8) {
        setAuthError('Choose a passcode of at least 8 characters.');
        return;
      }
      if (passcodeInput !== confirmPasscodeInput) {
        setAuthError('Passcodes do not match.');
        return;
      }
    } else if (!passcodeInput.trim()) {
      setAuthError('Enter your private admin passcode.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const endpoint = isSetup ? '/api/admin/auth/claim' : '/api/admin/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() }),
      });
      const data = (await res.json()) as {
        token?: string;
        status?: AuthStatus;
        error?: string;
      };

      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Authentication failed.');
        if (res.status === 409) {
          await loadAuthStatus();
        }
        return;
      }

      setAuthToken(data.token);
      if (data.status) setAuthStatus(data.status);
      setPasscodeInput('');
      setConfirmPasscodeInput('');
    } catch {
      setAuthError('Network error while authenticating with the server.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const tokenToRevoke = authToken;
    setAuthToken(null);
    setPasscodeInput('');
    setConfirmPasscodeInput('');
    if (tokenToRevoke) {
      fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenToRevoke}` },
      }).catch(() => {});
    }
    await loadAuthStatus();
  };

  const handlePublishCandidate = async (candidate: ProductCandidate) => {
    if (!authToken || publishedCandidateIds.includes(candidate.id)) return;
    const landed =
      candidate.economics.manufacturingCost +
      candidate.economics.packagingCost +
      candidate.economics.shippingCost +
      candidate.economics.tariffDuty;

    const newSku: StoreProduct = {
      id: candidate.id,
      sku: `KV-NEW-${candidate.id.toUpperCase()}`,
      slug: candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: candidate.name,
      hookTitle: `${candidate.name} — Engineered Daily Ergonomic Relief`,
      category: candidate.category,
      price: candidate.economics.retailPrice,
      compareAtPrice: Math.round(candidate.economics.retailPrice * 1.45),
      landedCogs: Number(landed.toFixed(2)),
      weightKg: candidate.weightKg,
      rating: 4.9,
      reviewCount: 184,
      imageUrl: INITIAL_PRODUCTS[0].imageUrl,
      shortSubtitle: `Tournament-validated ${candidate.category.toLowerCase()} hardware engineered for lightweight daily comfort and fast 3–5 day US fulfillment.`,
      bullets: [
        'Validated 4x+ unit economics with direct private-agent QC inspection',
        'Shoebox-compact lightweight profile for fast dedicated air transit',
        'Includes 2 zero-COGS free accessories automatically unlocked at Tier 1',
        'Backed by Kova Studio 30-day money-back guarantee with $0 restock fees',
      ],
      variants: [
        { id: 'graphite', label: 'Graphite Charcoal', swatchHex: '#27272A', inStock: true },
        { id: 'slate', label: 'Nordic Slate', swatchHex: '#475569', inStock: true },
      ],
      bundles: [
        { qty: 1, label: '1x Single Unit', discountPct: 0, note: 'Includes 2 Free Gifts' },
        { qty: 2, label: '2x Double Pack', discountPct: 20, note: 'Most Popular · Save 20%' },
        { qty: 3, label: '3x Studio Bundle', discountPct: 28, note: 'Best Value · Save 28%' },
      ],
      freeGifts: [
        {
          id: `gift-${candidate.id}-1`,
          name: 'Protective Travel Storage Sleeve',
          retailValue: 14,
          detail: 'Included free at Tier 1',
        },
        {
          id: `gift-${candidate.id}-2`,
          name: 'Quick-Start Ergonomic Routine Guide (PDF)',
          retailValue: 16,
          detail: 'Instant digital delivery',
        },
      ],
      toggleAddOn: {
        id: `addon-${candidate.id}`,
        name: 'Extended 2-Year Replacement Protection',
        regularPrice: 20,
        offerPrice: 10,
        description: '50% off today — instant no-questions hardware replacement coverage.',
      },
      mechanismHeadline: 'Purpose-built ergonomic geometry validated by real daily buyers.',
      mechanismBody:
        'Promoted directly from Kova Studio’s 3-Round Tournament pipeline after clearing strict physical weight, saturation, and margin thresholds.',
      routineHeadline: 'Zero setup friction right out of the box.',
      routineBody:
        'Designed to integrate into your existing workstation or evening recovery routine in under 60 seconds.',
      day1Outcome: 'Immediate setup and ergonomic support on your first session.',
      day30Outcome: 'Consistent daily comfort and posture durability backed by 30-day returns.',
      surveyStats: [
        { pct: 93, label: 'Noticed daily comfort improvement in Week 1' },
        { pct: 91, label: 'Rated build quality above generic alternatives' },
        { pct: 95, label: 'Would recommend to a colleague' },
      ],
      specs: `Weight: ${candidate.weightKg}kg · Shoebox-compact parcel · Direct factory QC verified.`,
      howToUse: 'Unbox, adjust to your preferred ergonomic position, and use daily for 15+ minutes.',
      adPainPoint: 'daily posture fatigue and uncomfortable generic accessories',
      adVillain: 'cheap single-use alternatives that wear out in weeks',
      adMechanism: 'precision ergonomic support validated for daily comfort',
      defaultAvatar: 'remote knowledge workers seeking posture comfort',
      seoFocusKeyword: candidate.name,
      seoMetaDescription: `Shop the ${candidate.name} from Kova Studio. Fast free 3–5 day US shipping and a 30-day money-back guarantee.`,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ product: newSku }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { products?: StoreProduct[] };
        if (data.products) setProducts(data.products);
        setPublishedCandidateIds((prev) => [...prev, candidate.id]);
        setNotice(`Published "${newSku.name}" to the live public storefront catalog.`);
        setTimeout(() => setNotice(null), 5000);
      }
    } catch {
      setNotice('Could not sync new product to server.');
    }
  };

  // Unauthenticated private gate view
  if (!authToken) {
    const isSetup = authStatus?.requiresInitialSetup === true;
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl border border-neutral-200 p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#111315] text-white flex items-center justify-center">
              {isSetup ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <p className="text-xs font-medium text-[#1D4ED8] pt-1">
              Private Operations File · /admin.html
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#111315] tracking-tight">
              {statusLoading
                ? 'Checking Private Access…'
                : isSetup
                  ? 'Initialize Private Operations Passcode'
                  : 'Kova Studio Operations Sign-In'}
            </h1>
            <p className="text-sm text-[#525866] leading-relaxed">
              {isSetup
                ? 'No ADMIN_PASSCODE secret is set yet. Create a private operator passcode (min 8 characters) to unlock Ad Studio, SEO & Schema, Research, and Fulfillment.'
                : 'Enter your private passcode to access the Autonomous Publishing Agent, SEO Hub, Research Tournament, and Fulfillment Ledger.'}
            </p>
          </div>

          {!statusLoading && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#991B1B]"
                >
                  {authError}
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-passcode"
                  className="block text-xs font-medium text-[#111315] mb-1"
                >
                  {isSetup ? 'Create Private Passcode' : 'Private Passcode'}
                </label>
                <input
                  id="admin-passcode"
                  type="password"
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  required
                  minLength={isSetup ? 8 : 1}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder={isSetup ? 'Minimum 8 characters' : 'Enter operator passcode'}
                  className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              {isSetup && (
                <div>
                  <label
                    htmlFor="admin-passcode-confirm"
                    className="block text-xs font-medium text-[#111315] mb-1"
                  >
                    Confirm Passcode
                  </label>
                  <input
                    id="admin-passcode-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPasscodeInput}
                    onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                    placeholder="Re-enter passcode"
                    className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {authSubmitting
                  ? 'Verifying…'
                  : isSetup
                    ? 'Set Passcode & Open Operations'
                    : 'Unlock Operations Console'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs text-[#525866]">
            <span>Public visitors only see the storefront.</span>
            <a
              href="/"
              className="inline-flex items-center gap-1 font-medium text-[#1D4ED8] hover:text-[#1E40AF] whitespace-nowrap"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated private operations workspace
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111315]">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Private Operations Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-display text-lg font-semibold tracking-tight text-[#111315] whitespace-nowrap">
              Kova Studio Ops
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono-num font-medium text-[#525866] px-2 py-0.5 bg-[#F8F9FA] border border-neutral-200 rounded">
              Private
            </span>
          </div>

          {/* Zone 2: Operations Navigation */}
          <nav
            aria-label="Operations navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {ADMIN_TABS.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(tab.id);
                    window.scrollTo(0, 0);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#111315] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-[#1D4ED8]'
                      : 'text-[#525866] hover:text-[#111315]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Public storefront link + Sign out */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Public Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#525866] hover:text-[#111315] border border-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile operations tabs */}
        <nav
          aria-label="Mobile operations navigation"
          className="md:hidden border-t border-neutral-100 px-4 py-2 flex items-center gap-5 overflow-x-auto text-xs font-medium"
        >
          {ADMIN_TABS.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSection(tab.id);
                  window.scrollTo(0, 0);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                  isActive
                    ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                    : 'text-[#525866] hover:text-[#111315]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {notice && (
        <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-2.5 text-center text-xs font-medium text-[#1D4ED8]">
          {notice}
        </div>
      )}

      <main className="flex-1">
        {activeSection === 'ads' && (
          <AdStudioView
            products={products}
            campaigns={campaigns}
            onAddCampaign={(camp) => setCampaigns((prev) => [camp, ...prev])}
            authToken={authToken}
            onUnauthorized={handleUnauthorized}
          />
        )}

        {activeSection === 'seo' && (
          <SeoHubView
            products={products}
            onInspectProduct={() => {
              window.location.href = '/';
            }}
            onQuickAddProduct={() => {
              window.location.href = '/';
            }}
          />
        )}

        {activeSection === 'research' && (
          <ResearchView
            candidates={INITIAL_RESEARCH_CANDIDATES}
            publishedIds={publishedCandidateIds}
            onPublishCandidate={handlePublishCandidate}
          />
        )}

        {activeSection === 'fulfillment' && <FulfillmentView orders={orders} />}
      </main>
    </div>
  );
}
