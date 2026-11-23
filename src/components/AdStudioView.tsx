import { useState, type FormEvent } from 'react';
import { Check, Copy, Plus } from 'lucide-react';
import type { AdCampaignRecord, StoreProduct } from '../data/storeData';
import {
  evaluateAdPerformance,
  generateModularAdMatrix,
  type AdPlatform,
} from '../engine/adDecisionEngine';
import {
  calculateDailyAdBudgetPlan,
  calculateUnitEconomics,
} from '../engine/unitEconomics';
import { PublishingAgentPanel } from './PublishingAgentPanel';

interface AdStudioViewProps {
  products: StoreProduct[];
  campaigns: AdCampaignRecord[];
  onAddCampaign: (campaign: AdCampaignRecord) => void;
  authToken: string;
  onUnauthorized?: () => void;
}

const VERDICT_META: Record<
  string,
  { label: string; colorClass: string }
> = {
  SCALE_WINNER: { label: 'Scale Winner', colorClass: 'text-[#16A34A]' },
  HOLD_ASSIST: { label: 'Hold ToF Assist', colorClass: 'text-[#1D4ED8]' },
  KEEP_TESTING: { label: 'Keep Testing', colorClass: 'text-[#525866]' },
  MUTATE_HOOK: { label: 'Mutate 3s Hook', colorClass: 'text-[#D97706]' },
  PIVOT_AVATAR: { label: 'Pivot Sub-Avatar', colorClass: 'text-[#D97706]' },
  FIX_PDP_OFFER: { label: 'Fix PDP Offer', colorClass: 'text-[#D97706]' },
  KILL_AD: { label: 'Kill Ad Set', colorClass: 'text-[#DC2626]' },
};

export function AdStudioView({
  products,
  campaigns,
  onAddCampaign,
  authToken,
  onUnauthorized,
}: AdStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'agent' | 'budget' | 'creative' | 'buying'>('agent');
  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ?? products[0];

  // Daily Profit & Ad Budget Planner state (default $100/day profit goal)
  const [dailyProfitGoal, setDailyProfitGoal] = useState(100);
  const [plannerCpc, setPlannerCpc] = useState(0.9);
  const [plannerCvrPct, setPlannerCvrPct] = useState(3.5);
  const [seoSharePct, setSeoSharePct] = useState(20);

  const [avatarInput, setAvatarInput] = useState(selectedProduct.defaultAvatar);
  const [offerInput, setOfferInput] = useState('Save 20% + 2 Free Gifts');
  const [selectedPermId, setSelectedPermId] = useState('H1-B1-CTA1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Media Buying Gate Simulator state
  const [simPlatform, setSimPlatform] = useState<AdPlatform>('Meta');
  const [simName, setSimName] = useState('');
  const [simSpend, setSimSpend] = useState(62);
  const [simClicks, setSimClicks] = useState(88);
  const [simCtrLink, setSimCtrLink] = useState(2.85);
  const [simCtrAll, setSimCtrAll] = useState(4.9);
  const [simCpm, setSimCpm] = useState(23.5);
  const [simAtcs, setSimAtcs] = useState(8);
  const [simPurchases, setSimPurchases] = useState(3);
  const [simRevenue, setSimRevenue] = useState(267);
  const [simAdSetRoas, setSimAdSetRoas] = useState(3.4);
  const [simIsAssist, setSimIsAssist] = useState(false);

  const productEcon = calculateUnitEconomics({
    manufacturingCost: selectedProduct.landedCogs * 0.58,
    packagingCost: selectedProduct.landedCogs * 0.08,
    shippingCost: selectedProduct.landedCogs * 0.31,
    tariffDuty: selectedProduct.landedCogs * 0.03,
    retailPrice: selectedProduct.price,
    targetCac: 20,
    repeatRate6Mo: 0.25,
  });

  const budgetPlan = calculateDailyAdBudgetPlan({
    retailPrice: selectedProduct.price,
    landedCogs: selectedProduct.landedCogs,
    gatewayFeeRate: 0.0375,
    dailyProfitGoal,
    cpc: plannerCpc,
    cvrPct: plannerCvrPct,
    seoTrafficSharePct: seoSharePct,
  });

  const matrix = generateModularAdMatrix({
    productName: selectedProduct.name,
    avatar: avatarInput.trim() || selectedProduct.defaultAvatar,
    painPoint: selectedProduct.adPainPoint,
    villain: selectedProduct.adVillain,
    mechanism: selectedProduct.adMechanism,
    price: selectedProduct.price,
    offerLine: offerInput.trim() || 'Save 20% + 2 Free Gifts',
  });

  const activePermutation =
    matrix.permutations.find((p) => p.id === selectedPermId) ?? matrix.permutations[0];

  const simEvaluation = evaluateAdPerformance({
    platform: simPlatform,
    spend: simSpend,
    uniqueLinkClicks: simClicks,
    ctrLinkPct: simCtrLink,
    ctrAllPct: simCtrAll,
    cpm: simCpm,
    addToCarts: simAtcs,
    purchases: simPurchases,
    revenue: simRevenue,
    breakEvenRoas: productEcon.breakEvenRoas,
    breakEvenCpa: productEcon.maxCpa,
    adSetRoas: simAdSetRoas,
    isTopOfFunnelAssist: simIsAssist,
    daysProfitable: simPurchases >= 3 ? 2 : 1,
  });

  const handleProductChange = (newId: string) => {
    setSelectedProductId(newId);
    const prod = products.find((p) => p.id === newId);
    if (prod) {
      setAvatarInput(prod.defaultAvatar);
    }
  };

  const handleCopyScript = () => {
    const fullText = [
      `[${activePermutation.id}] ${activePermutation.hookArchetype} | Overlay: "${activePermutation.overlayPill}"`,
      `0:00–0:03 (Hook): ${activePermutation.beats.hook0to3s}`,
      `0:03–0:09 (Villain): ${activePermutation.beats.villain3to9s}`,
      `0:09–0:18 (Hero Demo): ${activePermutation.beats.hero9to18s}`,
      `0:18–0:24 (Objection): ${activePermutation.beats.objection18to24s}`,
      `0:24–0:30 (CTA): ${activePermutation.beats.cta24to30s}`,
    ].join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullText).catch(() => {});
    }
    setCopiedId(activePermutation.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleAddSimCampaign = (e: FormEvent) => {
    e.preventDefault();
    const label =
      simName.trim() ||
      `${simPlatform} Broad · ${selectedProduct.name} · Test #${campaigns.length + 1}`;
    onAddCampaign({
      id: `camp-${Date.now()}`,
      name: label,
      productId: selectedProduct.id,
      avatar: avatarInput.trim() || selectedProduct.defaultAvatar,
      angle: activePermutation.hookArchetype,
      dailyBudget: simPlatform === 'TikTok' ? 50 : 100,
      telemetry: {
        platform: simPlatform,
        spend: simSpend,
        uniqueLinkClicks: simClicks,
        ctrLinkPct: simCtrLink,
        ctrAllPct: simCtrAll,
        cpm: simCpm,
        addToCarts: simAtcs,
        purchases: simPurchases,
        revenue: simRevenue,
        breakEvenRoas: productEcon.breakEvenRoas,
        breakEvenCpa: productEcon.maxCpa,
        adSetRoas: simAdSetRoas,
        isTopOfFunnelAssist: simIsAssist,
        daysProfitable: simPurchases >= 3 ? 2 : 1,
      },
    });
    setSimName('');
  };

  const totalAdSpend = campaigns.reduce((sum, c) => sum + c.telemetry.spend, 0);
  const totalAdRevenue = campaigns.reduce((sum, c) => sum + c.telemetry.revenue, 0);
  const blendedRoas = totalAdSpend > 0 ? totalAdRevenue / totalAdSpend : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 pb-6 border-b border-neutral-200">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#1D4ED8] mb-1">
              Paid & Organic Social Media Acquisition
            </p>
            <h1 className="font-display text-3xl font-semibold text-[#111315] tracking-tight">
              Social Ad Creative & Media Buying Engine
            </h1>
            <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
              Run the autonomous algorithm-timed ad generator & publishing agent, plan $100/day profit ad budgets, build modular Villain-vs-Hero scripts, and enforce automated Kill / Scale gates.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Ad Studio workspace"
            className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-[#F8F9FA] border border-neutral-200 rounded-lg self-start xl:self-end shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'agent'}
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'agent'
                  ? 'bg-white text-[#111315] shadow-sm'
                  : 'text-[#525866] hover:text-[#111315]'
              }`}
            >
              Publishing Agent
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'budget'}
              onClick={() => setActiveTab('budget')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-white text-[#111315] shadow-sm'
                  : 'text-[#525866] hover:text-[#111315]'
              }`}
            >
              Daily Budget Planner
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'creative'}
              onClick={() => setActiveTab('creative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'creative'
                  ? 'bg-white text-[#111315] shadow-sm'
                  : 'text-[#525866] hover:text-[#111315]'
              }`}
            >
              Creative Studio
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'buying'}
              onClick={() => setActiveTab('buying')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'buying'
                  ? 'bg-white text-[#111315] shadow-sm'
                  : 'text-[#525866] hover:text-[#111315]'
              }`}
            >
              Buying Gates ({campaigns.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Daily Ad Budget (${dailyProfitGoal}/d Goal)</p>
          <p className="font-mono-num text-xl font-semibold text-[#1D4ED8] mt-1">
            {budgetPlan.isViable ? `$${budgetPlan.recommendedDailyAdBudget.toFixed(2)}/d` : 'Not Viable'}
          </p>
          <p className="text-xs text-[#525866] mt-0.5">
            {budgetPlan.isViable
              ? `${budgetPlan.wholeOrdersPerDay} orders/d · ${budgetPlan.paidClicksPerDay} paid clicks`
              : `Max CPC $${budgetPlan.maxAllowableCpc.toFixed(2)}`}
          </p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Net Margin After Ad Costs</p>
          <p
            className={`font-mono-num text-xl font-semibold mt-1 ${
              budgetPlan.isViable ? 'text-[#16A34A]' : 'text-[#DC2626]'
            }`}
          >
            {budgetPlan.netMarginPct.toFixed(1)}%
          </p>
          <p className="text-xs text-[#525866] mt-0.5">
            ${budgetPlan.netProfitPerOrder.toFixed(2)}/order · ${budgetPlan.blendedCpa.toFixed(2)} blended CPA
          </p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Active Spend / Revenue</p>
          <p className="font-mono-num text-xl font-semibold text-[#111315] mt-1">
            ${totalAdSpend.toFixed(0)} / ${totalAdRevenue.toFixed(0)}
          </p>
          <p className="text-xs text-[#525866] mt-0.5">Blended ROAS {blendedRoas.toFixed(2)}x</p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Creative & Andromeda Slots</p>
          <p className="font-mono-num text-xl font-semibold text-[#111315] mt-1">
            12 PAS / 15 Slots
          </p>
          <p className="text-xs text-[#525866] mt-0.5">Target BER ≤ {productEcon.breakEvenRoas.toFixed(2)}x</p>
        </div>
      </div>

      {/* TAB: Autonomous Publishing Agent & Go-Live Playbook */}
      {activeTab === 'agent' && (
        <PublishingAgentPanel
          products={products}
          selectedProduct={selectedProduct}
          onSelectProduct={handleProductChange}
          dailyAdBudget={budgetPlan.isViable ? budgetPlan.recommendedDailyAdBudget : 62}
          avgCpc={plannerCpc}
          onPushToCampaigns={onAddCampaign}
          authToken={authToken}
          onUnauthorized={onUnauthorized}
        />
      )}

      {/* TAB 0: Daily Profit & Ad Budget Planner */}
      {activeTab === 'budget' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Inputs Card */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#111315]">
                  Traffic & Ad Cost Inputs
                </h2>
                <p className="text-xs text-[#525866] mt-0.5">
                  Calculates Paid CPA directly from CPC ÷ CVR and blends free organic SEO visits.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="plan-sku" className="block text-xs font-medium text-[#111315] mb-1">
                    Product SKU
                  </label>
                  <select
                    id="plan-sku"
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-[#111315]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price.toFixed(0)} retail / ${p.landedCogs.toFixed(2)} COGS
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="plan-profit" className="block text-xs font-medium text-[#111315] mb-1">
                      Daily Net Profit Goal ($)
                    </label>
                    <input
                      id="plan-profit"
                      type="number"
                      step="any"
                      min={10}
                      value={dailyProfitGoal}
                      onChange={(e) => setDailyProfitGoal(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="plan-cpc" className="block text-xs font-medium text-[#111315] mb-1">
                      Avg Ad CPC ($/click)
                    </label>
                    <input
                      id="plan-cpc"
                      type="number"
                      step="any"
                      min={0.05}
                      value={plannerCpc}
                      onChange={(e) => setPlannerCpc(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="plan-cvr" className="block text-xs font-medium text-[#111315] mb-1">
                      Store Conv. Rate (CVR %)
                    </label>
                    <input
                      id="plan-cvr"
                      type="number"
                      step="any"
                      min={0.2}
                      max={25}
                      value={plannerCvrPct}
                      onChange={(e) => setPlannerCvrPct(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="plan-seo" className="block text-xs font-medium text-[#111315] mb-1">
                      Organic SEO Traffic (%)
                    </label>
                    <input
                      id="plan-seo"
                      type="number"
                      step="5"
                      min={0}
                      max={80}
                      value={seoSharePct}
                      onChange={(e) => setSeoSharePct(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-2">
                  {[
                    { label: '100% Paid Meta ($0.90 / 3.5%)', cpc: 0.9, cvr: 3.5, seo: 0 },
                    { label: 'Paid + 25% SEO ($0.90 / 3.5%)', cpc: 0.9, cvr: 3.5, seo: 25 },
                    { label: 'Conservative ($1.10 / 2.5%)', cpc: 1.1, cvr: 2.5, seo: 0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPlannerCpc(preset.cpc);
                        setPlannerCvrPct(preset.cvr);
                        setSeoSharePct(preset.seo);
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-medium text-[#525866] hover:text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily P&L & Traffic Breakdown */}
            <div className="lg:col-span-7 bg-[#F8F9FA] rounded-xl border border-neutral-200 p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                  <p className="text-xs text-[#525866]">
                    Recommended Daily Ad Spend ({selectedProduct.name})
                  </p>
                  <p
                    className={`font-mono-num text-3xl font-semibold mt-0.5 ${
                      budgetPlan.isViable ? 'text-[#1D4ED8]' : 'text-[#DC2626]'
                    }`}
                  >
                    {budgetPlan.isViable
                      ? `$${budgetPlan.recommendedDailyAdBudget.toFixed(2)} / day`
                      : 'Unprofitable Traffic Mix'}
                  </p>
                </div>
                {budgetPlan.isViable && (
                  <div className="text-right">
                    <p className="text-xs text-[#525866]">Projected Daily Net Profit</p>
                    <p className="font-mono-num text-2xl font-semibold text-[#16A34A]">
                      ${budgetPlan.projectedDailyNetProfit.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-[#525866]">
                      Exact ${dailyProfitGoal} floor: ${budgetPlan.exactDailyAdBudget.toFixed(2)}/d ad spend
                    </p>
                  </div>
                )}
              </div>

              <p
                className={`text-sm leading-relaxed ${
                  budgetPlan.isViable ? 'text-[#111315]' : 'text-[#DC2626] font-medium'
                }`}
              >
                {budgetPlan.reason}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-200">
                <div>
                  <p className="text-xs text-[#525866]">Paid CPA / Blended CPA</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    ${budgetPlan.paidCpa.toFixed(2)} / ${budgetPlan.blendedCpa.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-[#525866]">
                    Max CPC ${budgetPlan.maxAllowableCpc.toFixed(2)} · Min CVR {budgetPlan.minBreakEvenCvrPct}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#525866]">Daily Traffic Target</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    {budgetPlan.totalDailyClicksNeeded} visits/d
                  </p>
                  <p className="text-[11px] text-[#525866]">
                    {budgetPlan.paidClicksPerDay} paid + {budgetPlan.seoClicksPerDay} free SEO
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#525866]">Orders & ROAS Target</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    {budgetPlan.wholeOrdersPerDay} orders/d
                  </p>
                  <p className="text-[11px] text-[#525866]">
                    Paid ROAS {budgetPlan.requiredPaidRoas.toFixed(2)}x · MER {budgetPlan.blendedMer.toFixed(2)}x
                  </p>
                </div>
              </div>

              {budgetPlan.isViable && (
                <div className="bg-white rounded-lg border border-neutral-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[#525866]">Daily Revenue</p>
                    <p className="font-mono-num text-sm font-semibold text-[#111315] mt-0.5">
                      ${budgetPlan.projectedDailyRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#525866]">Landed COGS</p>
                    <p className="font-mono-num text-sm font-semibold text-[#525866] mt-0.5">
                      -${budgetPlan.projectedDailyCogs.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#525866]">Gateway (3.75%)</p>
                    <p className="font-mono-num text-sm font-semibold text-[#525866] mt-0.5">
                      -${budgetPlan.projectedDailyGatewayFees.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#525866]">Daily Ad Spend</p>
                    <p className="font-mono-num text-sm font-semibold text-[#1D4ED8] mt-0.5">
                      -${budgetPlan.recommendedDailyAdBudget.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All-Catalog $100/day Comparison Matrix */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-[#111315]">
                  Catalog Daily Ad Budget Comparison (Goal: ${dailyProfitGoal}/day Profit)
                </h3>
                <p className="text-xs text-[#525866]">
                  Evaluated at ${plannerCpc.toFixed(2)} CPC · {plannerCvrPct.toFixed(1)}% CVR ·{' '}
                  {seoSharePct}% organic SEO traffic share
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                    <th className="py-3 px-5">Product</th>
                    <th className="py-3 px-4 text-right">Retail / COGS</th>
                    <th className="py-3 px-4 text-right">Blended CPA</th>
                    <th className="py-3 px-4 text-right">Net Profit / Order</th>
                    <th className="py-3 px-4 text-right">Orders / Day</th>
                    <th className="py-3 px-4 text-right">Traffic / Day</th>
                    <th className="py-3 px-5 text-right">Daily Ad Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((prod) => {
                    const rowPlan = calculateDailyAdBudgetPlan({
                      retailPrice: prod.price,
                      landedCogs: prod.landedCogs,
                      gatewayFeeRate: 0.0375,
                      dailyProfitGoal,
                      cpc: plannerCpc,
                      cvrPct: plannerCvrPct,
                      seoTrafficSharePct: seoSharePct,
                    });
                    return (
                      <tr key={prod.id} className="hover:bg-[#F8F9FA]/70">
                        <td className="py-3 px-5 font-medium text-[#111315]">{prod.name}</td>
                        <td className="py-3 px-4 font-mono-num text-right text-[#525866]">
                          ${prod.price.toFixed(0)} / ${prod.landedCogs.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-right text-[#111315]">
                          ${rowPlan.blendedCpa.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 font-mono-num text-right font-medium ${
                            rowPlan.isViable ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          ${rowPlan.netProfitPerOrder.toFixed(2)} ({rowPlan.netMarginPct.toFixed(1)}%)
                        </td>
                        <td className="py-3 px-4 font-mono-num text-right text-[#111315]">
                          {rowPlan.isViable ? `${rowPlan.wholeOrdersPerDay}/d` : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-right text-[#525866]">
                          {rowPlan.isViable
                            ? `${rowPlan.paidClicksPerDay} paid + ${rowPlan.seoClicksPerDay} SEO`
                            : '—'}
                        </td>
                        <td className="py-3 px-5 font-mono-num text-right font-semibold text-[#1D4ED8]">
                          {rowPlan.isViable
                            ? `$${rowPlan.recommendedDailyAdBudget.toFixed(2)}/d`
                            : 'Unprofitable'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Modular Creative Studio */}
      {activeTab === 'creative' && (
        <div className="space-y-10">
          {/* Brief Controls */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ad-sku" className="block text-xs font-medium text-[#111315] mb-1">
                Product SKU
              </label>
              <select
                id="ad-sku"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-[#111315]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ad-avatar" className="block text-xs font-medium text-[#111315] mb-1">
                Blue-Ocean Sub-Avatar
              </label>
              <input
                id="ad-avatar"
                type="text"
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ad-offer" className="block text-xs font-medium text-[#111315] mb-1">
                Frame-1 Text Overlay Offer
              </label>
              <input
                id="ad-offer"
                type="text"
                value={offerInput}
                onChange={(e) => setOfferInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          {/* 12 Modular PAS Permutations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#111315]">
                  12 Video Permutations (3×2×2)
                </h2>
                <span className="text-xs text-[#525866]">Click to inspect beats</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {matrix.permutations.map((perm) => {
                  const selected = perm.id === activePermutation.id;
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => setSelectedPermId(perm.id)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.05]'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <p className="font-mono-num text-xs font-semibold text-[#111315]">
                        {perm.id}
                      </p>
                      <p className="text-[11px] text-[#525866] mt-0.5 truncate">
                        {perm.hookArchetype}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Time-Coded 30-Second Villain-vs-Hero PAS Script */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                <div>
                  <p className="font-mono-num text-xs font-semibold text-[#1D4ED8]">
                    {activePermutation.id} · {activePermutation.hookArchetype}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-[#111315] mt-0.5">
                    30-Second Villain-vs-Hero PAS Script
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-lg cursor-pointer"
                >
                  {copiedId === activePermutation.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Copied Script</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-[#F8F9FA] rounded-lg border border-neutral-200 text-xs text-[#525866] flex flex-wrap justify-between gap-2">
                <span>
                  Frame-1 Overlay:{' '}
                  <strong className="text-[#111315]">{activePermutation.overlayPill}</strong>
                </span>
                <span>
                  Organic Targets: <strong className="font-mono-num text-[#111315]">≥70%</strong> 2s
                  view · <strong className="font-mono-num text-[#111315]">&gt;30%</strong> 3s hook ·{' '}
                  <strong className="font-mono-num text-[#111315]">≥33%</strong> watch time
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { time: '0.0s – 3.0s', label: 'Dual Pattern-Interrupt Hook', text: activePermutation.beats.hook0to3s },
                  { time: '3.0s – 9.0s', label: 'Villain Agitation', text: activePermutation.beats.villain3to9s },
                  { time: '9.0s – 18.0s', label: 'Hero Mechanism Demo', text: activePermutation.beats.hero9to18s },
                  { time: '18.0s – 24.0s', label: 'Objection Crusher & Price Anchor', text: activePermutation.beats.objection18to24s },
                  { time: '24.0s – 30.0s', label: 'Direct Offer CTA', text: activePermutation.beats.cta24to30s },
                ].map((beat) => (
                  <div
                    key={beat.time}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-3 border-b border-neutral-100 last:border-b-0"
                  >
                    <div className="sm:col-span-4">
                      <p className="font-mono-num text-xs font-semibold text-[#1D4ED8]">
                        {beat.time}
                      </p>
                      <p className="text-xs font-medium text-[#111315]">{beat.label}</p>
                    </div>
                    <p className="sm:col-span-8 text-sm text-[#111315] leading-relaxed">
                      “{beat.text}”
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Formats x 5 Angles Meta Andromeda Matrix */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-[#111315]">
                  Meta Andromeda 3×5 Concept Matrix (15 Distinct Creative Slots)
                </h2>
                <p className="text-xs text-[#525866]">
                  Prevents Meta Andromeda auction clustering by separating visual formats across 5
                  buyer angles
                </p>
              </div>
              <span className="font-mono-num text-xs text-[#525866]">
                1 Active Ad Set (3–10 ads) / $100/d CBO
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                    <th className="py-3 px-5">Code</th>
                    <th className="py-3 px-5">Angle</th>
                    <th className="py-3 px-5">Format</th>
                    <th className="py-3 px-5">Frame-1 Visual Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {matrix.andromedaConcepts.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8F9FA]/70">
                      <td className="py-2.5 px-5 font-mono-num text-xs font-semibold text-[#111315]">
                        {c.id}
                      </td>
                      <td className="py-2.5 px-5 text-xs font-medium text-[#111315]">{c.angle}</td>
                      <td className="py-2.5 px-5 text-xs text-[#525866]">{c.format}</td>
                      <td className="py-2.5 px-5 text-xs text-[#525866]">{c.openingVisual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Media Buying Kill / Mutate / Scale Decision Engine */}
      {activeTab === 'buying' && (
        <div className="space-y-8">
          {/* Active Campaigns Telemetry Ledger */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-[#111315]">
                  Live Paid Social Campaigns & Gate Evaluations
                </h2>
                <p className="text-xs text-[#525866]">
                  Evaluates Gates 1A–1E, CPM saturation, and Andromeda ToF assist protection
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                    <th className="py-3 px-5">Campaign / Creative</th>
                    <th className="py-3 px-4 text-right">Spend</th>
                    <th className="py-3 px-4 text-right">CTR Link</th>
                    <th className="py-3 px-4 text-right">CPC</th>
                    <th className="py-3 px-4 text-right">CPM</th>
                    <th className="py-3 px-4 text-right">ATCs / Orders</th>
                    <th className="py-3 px-4 text-right">ROAS</th>
                    <th className="py-3 px-5">Automated Verdict & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {campaigns.map((camp) => {
                    const evalRes = evaluateAdPerformance(camp.telemetry);
                    const meta = VERDICT_META[evalRes.verdict] ?? VERDICT_META.KEEP_TESTING;
                    return (
                      <tr key={camp.id} className="hover:bg-[#F8F9FA]/70 align-top">
                        <td className="py-3.5 px-5">
                          <p className="font-medium text-[#111315] text-sm">{camp.name}</p>
                          <p className="text-xs text-[#525866] mt-0.5">
                            {camp.telemetry.platform} · {camp.avatar} · Budget{' '}
                            <span className="font-mono-num">${camp.dailyBudget}/d</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right text-[#111315]">
                          ${camp.telemetry.spend.toFixed(0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right text-[#111315]">
                          {camp.telemetry.ctrLinkPct.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right text-[#111315]">
                          ${evalRes.cpc.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right text-[#525866]">
                          ${camp.telemetry.cpm.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right text-[#111315]">
                          {camp.telemetry.addToCarts} / {camp.telemetry.purchases}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-right font-semibold text-[#111315]">
                          {evalRes.roas.toFixed(2)}x
                        </td>
                        <td className="py-3.5 px-5 max-w-xs">
                          <p className={`text-xs font-semibold ${meta.colorClass}`}>
                            {meta.label} · {evalRes.gateTriggered}
                          </p>
                          <p className="text-xs text-[#525866] mt-0.5 leading-snug">
                            {evalRes.recommendation}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Gate Simulator & Campaign Logger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleAddSimCampaign}
              className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 space-y-5"
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-[#111315]">
                  Media Buying Gate Simulator
                </h3>
                <p className="text-xs text-[#525866] mt-0.5">
                  Adjust live telemetry to test Kill / Mutate / Avatar Pivot / Scale gates and add
                  the campaign to your ledger.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sim-name" className="block text-xs font-medium text-[#111315] mb-1">
                    Campaign Label (Optional)
                  </label>
                  <input
                    id="sim-name"
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="e.g. Meta Broad · Pulse Pro · H2 Scam Hook"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-plat" className="block text-xs font-medium text-[#111315] mb-1">
                    Ad Platform
                  </label>
                  <select
                    id="sim-plat"
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value as AdPlatform)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="Meta">Meta Broad CBO / Andromeda</option>
                    <option value="TikTok">TikTok Smart+ Website Sales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="sim-spend" className="block text-xs font-medium text-[#111315] mb-1">
                    Spend ($)
                  </label>
                  <input
                    id="sim-spend"
                    type="number"
                    min={0}
                    value={simSpend}
                    onChange={(e) => setSimSpend(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-clicks" className="block text-xs font-medium text-[#111315] mb-1">
                    Link Clicks
                  </label>
                  <input
                    id="sim-clicks"
                    type="number"
                    min={0}
                    value={simClicks}
                    onChange={(e) => setSimClicks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-ctrl" className="block text-xs font-medium text-[#111315] mb-1">
                    CTR Link (%)
                  </label>
                  <input
                    id="sim-ctrl"
                    type="number"
                    step="any"
                    min={0}
                    value={simCtrLink}
                    onChange={(e) => setSimCtrLink(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-cpm" className="block text-xs font-medium text-[#111315] mb-1">
                    CPM ($)
                  </label>
                  <input
                    id="sim-cpm"
                    type="number"
                    step="any"
                    min={0}
                    value={simCpm}
                    onChange={(e) => setSimCpm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-ctra" className="block text-xs font-medium text-[#111315] mb-1">
                    CTR All (%)
                  </label>
                  <input
                    id="sim-ctra"
                    type="number"
                    step="any"
                    min={0}
                    value={simCtrAll}
                    onChange={(e) => setSimCtrAll(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-atcs" className="block text-xs font-medium text-[#111315] mb-1">
                    Add to Carts
                  </label>
                  <input
                    id="sim-atcs"
                    type="number"
                    min={0}
                    value={simAtcs}
                    onChange={(e) => setSimAtcs(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-orders" className="block text-xs font-medium text-[#111315] mb-1">
                    Purchases
                  </label>
                  <input
                    id="sim-orders"
                    type="number"
                    min={0}
                    value={simPurchases}
                    onChange={(e) => setSimPurchases(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sim-rev" className="block text-xs font-medium text-[#111315] mb-1">
                    Revenue ($)
                  </label>
                  <input
                    id="sim-rev"
                    type="number"
                    min={0}
                    value={simRevenue}
                    onChange={(e) => setSimRevenue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-100">
                <label className="inline-flex items-center gap-2 text-xs text-[#111315] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simIsAssist}
                    onChange={(e) => setSimIsAssist(e.target.checked)}
                    className="rounded border-neutral-300 text-[#1D4ED8]"
                  />
                  <span>
                    Top-of-Funnel Andromeda Assist (Ad Set ROAS{' '}
                    <span className="font-mono-num">{simAdSetRoas.toFixed(1)}x</span>)
                  </span>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Campaign to Ledger</span>
                </button>
              </div>
            </form>

            {/* Live Verdict Output Card */}
            <div className="lg:col-span-5 bg-[#F8F9FA] rounded-xl border border-neutral-200 p-6 space-y-4">
              <div>
                <p className="text-xs text-[#525866]">{simEvaluation.gateTriggered}</p>
                <h3
                  className={`font-display text-xl font-semibold mt-1 ${
                    VERDICT_META[simEvaluation.verdict]?.colorClass ?? 'text-[#111315]'
                  }`}
                >
                  {simEvaluation.headline}
                </h3>
              </div>

              <p className="text-sm text-[#111315] leading-relaxed">
                {simEvaluation.recommendation}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-200 text-xs">
                <div>
                  <p className="text-[#525866]">CPC</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    ${simEvaluation.cpc.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[#525866]">Cost / ATC</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    {simEvaluation.costPerAtc !== null
                      ? `$${simEvaluation.costPerAtc.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#525866]">Live ROAS</p>
                  <p className="font-mono-num text-base font-semibold text-[#111315]">
                    {simEvaluation.roas.toFixed(2)}x
                  </p>
                </div>
              </div>

              {simEvaluation.scalePlan && (
                <div className="p-3.5 bg-white rounded-lg border border-neutral-200 text-xs space-y-1">
                  <p className="font-semibold text-[#16A34A]">Autonomous Scaling Plan</p>
                  <p className="text-[#111315]">
                    Vertical: +{simEvaluation.scalePlan.verticalBumpPct}% every 24–48h (min +$
                    {simEvaluation.scalePlan.minDollarBump} bump)
                  </p>
                  <p className="text-[#525866]">
                    Horizontal: {simEvaluation.scalePlan.horizontalAction}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
