import { useState } from 'react';
import { Check, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { ProductCandidate } from '../engine/unitEconomics';
import {
  calculateUnitEconomics,
  evaluateProductTournament,
} from '../engine/unitEconomics';

interface ResearchViewProps {
  candidates: ProductCandidate[];
  publishedIds: string[];
  onPublishCandidate: (candidate: ProductCandidate) => void;
}

export function ResearchView({
  candidates,
  publishedIds,
  onPublishCandidate,
}: ResearchViewProps) {
  // Interactive Unit Economics Sandbox
  const [mfgCost, setMfgCost] = useState(11.5);
  const [pkgCost, setPkgCost] = useState(1.5);
  const [shipCost, setShipCost] = useState(6.5);
  const [tariff, setTariff] = useState(0.5);
  const [retailPrice, setRetailPrice] = useState(89.0);
  const [targetCac, setTargetCac] = useState(22.0);
  const [repeatRatePct, setRepeatRatePct] = useState(25);
  const [monthlyVisits, setMonthlyVisits] = useState(48000);

  const econ = calculateUnitEconomics({
    manufacturingCost: mfgCost,
    packagingCost: pkgCost,
    shippingCost: shipCost,
    tariffDuty: tariff,
    retailPrice,
    gatewayFeeRate: 0.0375,
    targetCac,
    repeatRate6Mo: repeatRatePct / 100,
    competitorMonthlyVisits: monthlyVisits,
  });

  const bandMeta: Record<typeof econ.viabilityBand, { label: string; tone: string }> = {
    RAPID_SCALE: { label: 'Rapid-Scaling Target Zone (4.0x–5.0x+)', tone: 'text-[#16A34A]' },
    GREEN_ZONE: { label: 'Paid-Ads Profit Green Zone (≥3.0x)', tone: 'text-[#16A34A]' },
    FLOOR: { label: 'Viability Floor Only (2.5x–2.99x)', tone: 'text-[#D97706]' },
    REJECT: { label: 'Reject SKU — Fails Markup or $25 Spread Floor', tone: 'text-[#DC2626]' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <p className="text-xs font-medium text-[#1D4ED8] mb-1">
          Product Discovery & Financial Viability
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#111315] tracking-tight">
          3-Round Tournament & Unit Economics Engine
        </h1>
        <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
          Enforce 3.0x–5.0x Landed COGS markup, ≥$25 gross dollar spread, Break-Even ROAS, and
          LTV:CAC ≥ 3.0 before promoting candidates to the storefront.
        </p>
      </div>

      {/* Interactive Unit Economics Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#111315]">
              Unit Economics & Break-Even Calculator
            </h2>
            <p className="text-xs text-[#525866] mt-0.5">
              Includes 3.75% payment gateway fee and 2.2% Shopify CVR traffic revenue estimation
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="ue-mfg" className="block text-xs font-medium text-[#111315] mb-1">
                Unit Mfg ($)
              </label>
              <input
                id="ue-mfg"
                type="number"
                step="0.5"
                min={0}
                value={mfgCost}
                onChange={(e) => setMfgCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-pkg" className="block text-xs font-medium text-[#111315] mb-1">
                Packaging ($)
              </label>
              <input
                id="ue-pkg"
                type="number"
                step="0.5"
                min={0}
                value={pkgCost}
                onChange={(e) => setPkgCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-ship" className="block text-xs font-medium text-[#111315] mb-1">
                Air Line ($)
              </label>
              <input
                id="ue-ship"
                type="number"
                step="0.5"
                min={0}
                value={shipCost}
                onChange={(e) => setShipCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-duty" className="block text-xs font-medium text-[#111315] mb-1">
                Tariff ($)
              </label>
              <input
                id="ue-duty"
                type="number"
                step="0.25"
                min={0}
                value={tariff}
                onChange={(e) => setTariff(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-100">
            <div>
              <label htmlFor="ue-retail" className="block text-xs font-medium text-[#111315] mb-1">
                Retail AOV ($)
              </label>
              <input
                id="ue-retail"
                type="number"
                step="1"
                min={1}
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-cac" className="block text-xs font-medium text-[#111315] mb-1">
                Target CPA ($)
              </label>
              <input
                id="ue-cac"
                type="number"
                step="1"
                min={1}
                value={targetCac}
                onChange={(e) => setTargetCac(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-rep" className="block text-xs font-medium text-[#111315] mb-1">
                6m Repeat (%)
              </label>
              <input
                id="ue-rep"
                type="number"
                min={0}
                max={100}
                value={repeatRatePct}
                onChange={(e) => setRepeatRatePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ue-visits" className="block text-xs font-medium text-[#111315] mb-1">
                Comp. Visits/m
              </label>
              <input
                id="ue-visits"
                type="number"
                step="2000"
                min={0}
                value={monthlyVisits}
                onChange={(e) => setMonthlyVisits(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Live Formula Outputs */}
        <div className="lg:col-span-6 bg-[#F8F9FA] rounded-xl border border-neutral-200 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200">
            <div>
              <p className="text-xs text-[#525866]">Unit Economics Verdict</p>
              <p className={`font-display text-lg font-semibold mt-0.5 ${bandMeta[econ.viabilityBand].tone}`}>
                {bandMeta[econ.viabilityBand].label}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[#525866]">Landed COGS</p>
              <p className="font-mono-num text-xl font-semibold text-[#111315]">
                ${econ.landedCogs.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#525866]">COGS Markup</p>
              <p className="font-mono-num text-lg font-semibold text-[#111315]">
                {econ.markupMultiplier.toFixed(2)}x
              </p>
              <p className="text-[11px] text-[#525866]">Floor ≥ 2.5x · Target 3–5x</p>
            </div>
            <div>
              <p className="text-xs text-[#525866]">Gross Spread</p>
              <p className="font-mono-num text-lg font-semibold text-[#111315]">
                ${econ.absoluteGrossSpread.toFixed(2)}
              </p>
              <p className="text-[11px] text-[#525866]">Min $25 · Optimal $30–45+</p>
            </div>
            <div>
              <p className="text-xs text-[#525866]">Break-Even ROAS</p>
              <p className="font-mono-num text-lg font-semibold text-[#1D4ED8]">
                {econ.breakEvenRoas.toFixed(2)}x
              </p>
              <p className="text-[11px] text-[#525866]">Max CPA ${econ.maxCpa.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[#525866]">Contribution Margin</p>
              <p
                className={`font-mono-num text-lg font-semibold ${
                  econ.contributionMarginPct >= 25 ? 'text-[#16A34A]' : 'text-[#D97706]'
                }`}
              >
                {econ.contributionMarginPct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#525866]">
                ${econ.contributionMarginDollars.toFixed(2)} net / order
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525866]">6-Mo LTV : CAC</p>
              <p
                className={`font-mono-num text-lg font-semibold ${
                  econ.ltvCacRatio >= 3.0 ? 'text-[#16A34A]' : 'text-[#D97706]'
                }`}
              >
                {econ.ltvCacRatio.toFixed(2)} : 1
              </p>
              <p className="text-[11px] text-[#525866]">6-mo LTV ${econ.ltv6Mo.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[#525866]">Est. Comp. Rev/mo</p>
              <p className="font-mono-num text-lg font-semibold text-[#111315]">
                ${econ.estimatedMonthlyRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#525866]">At 2.2% Shopify CVR</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Round Tournament Product Candidate Pipeline */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#111315]">
            3-Round Tournament Candidate Queue
          </h2>
          <p className="text-xs text-[#525866] mt-0.5">
            Candidates passing Round 1 (Exclusion), Round 2 (Saturation), and Round 3 (≥75/100 Score)
            can be published directly into the live storefront catalog.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {candidates.map((cand) => {
            const evaluation = evaluateProductTournament(cand);
            const isPublished = publishedIds.includes(cand.id);
            return (
              <article
                key={cand.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#525866]">
                      {cand.category} · <span className="font-mono-num">{cand.weightKg}kg</span>
                    </p>
                    <h3 className="font-display text-base font-semibold text-[#111315] mt-0.5">
                      {cand.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num text-lg font-semibold text-[#111315]">
                      {evaluation.compositeScore}/100
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        evaluation.verdict === 'ADVANCE_TO_STOREFRONT'
                          ? 'text-[#16A34A]'
                          : 'text-[#DC2626]'
                      }`}
                    >
                      {evaluation.verdict === 'ADVANCE_TO_STOREFRONT' ? 'Qualified' : 'Eliminated'}
                    </p>
                  </div>
                </div>

                {/* 3 Tournament Gates */}
                <div className="space-y-2 text-xs pt-2 border-t border-neutral-100">
                  {[
                    {
                      label: 'Round 1: Hard Exclusion Gate',
                      passed: evaluation.round1Passed,
                      note: evaluation.round1Passed
                        ? 'Shoebox-compact, lightweight, non-fragile'
                        : evaluation.round1Reasons[0],
                    },
                    {
                      label: 'Round 2: Velocity & Saturation Gate',
                      passed: evaluation.round2Passed,
                      note: evaluation.round2Passed
                        ? `${cand.seriousCompetitors} serious stores · $${(cand.revenue30d / 1000).toFixed(1)}k/30d · ${cand.videoRevenueSharePct}% video`
                        : evaluation.round2Reasons[0],
                    },
                    {
                      label: 'Round 3: Unit Economics & Score',
                      passed: evaluation.round3Passed,
                      note: evaluation.round3Passed
                        ? `${evaluation.economics.markupMultiplier}x markup · $${evaluation.economics.absoluteGrossSpread} spread · BER ${evaluation.economics.breakEvenRoas}x`
                        : evaluation.round3Reasons[0],
                    },
                  ].map((gate) => (
                    <div key={gate.label} className="flex items-start gap-2">
                      {gate.passed ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-[#111315]">{gate.label}</p>
                        <p className="text-[#525866]">{gate.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-neutral-100">
                  {evaluation.verdict === 'ADVANCE_TO_STOREFRONT' ? (
                    <button
                      type="button"
                      disabled={isPublished}
                      onClick={() => onPublishCandidate(cand)}
                      className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 ${
                        isPublished
                          ? 'bg-[#F8F9FA] text-[#16A34A] border border-neutral-200 cursor-default'
                          : 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white cursor-pointer'
                      }`}
                    >
                      {isPublished ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Live in Storefront Catalog</span>
                        </>
                      ) : (
                        <>
                          <span>Publish to Storefront Catalog</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <p className="text-xs text-[#DC2626] font-medium text-center py-2">
                      Blocked by Tournament Gate — Do Not Test
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
