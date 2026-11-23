import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import {
  KLAVIYO_FLOWS,
  SUPPLIER_NODES,
  type FulfillmentOrder,
} from '../data/storeData';
import {
  calculateSupplierScore,
  determineFulfillmentTier,
  evaluateOrderMarginGate,
  evaluatePaymentAndWismo,
  validateTcpaSms,
} from '../engine/fulfillmentEngine';

interface FulfillmentViewProps {
  orders: FulfillmentOrder[];
}

export function FulfillmentView({ orders }: FulfillmentViewProps) {
  const [dailyOrderVolume, setDailyOrderVolume] = useState(24);
  const [disputeRatePct, setDisputeRatePct] = useState(0.32);
  const [wismoDaysStalled, setWismoDaysStalled] = useState(2);

  // TCPA SMS Validator state
  const [smsText, setSmsText] = useState(
    'Kova Studio: Your Kova Pulse Pro bundle is still reserved. Finish checkout now for free 3-5 day US shipping and 2 free gifts: kovastudio.com/bag'
  );
  const [hoursSinceLastSms, setHoursSinceLastSms] = useState(54);

  const activeTier = determineFulfillmentTier(dailyOrderVolume, dailyOrderVolume * 14);
  const riskStatus = evaluatePaymentAndWismo(disputeRatePct, wismoDaysStalled);
  const smsValidation = validateTcpaSms(smsText, hoursSinceLastSms);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-neutral-200">
        <p className="text-xs font-medium text-[#1D4ED8] mb-1">
          Autonomous Logistics, Lifecycle Retention & Risk Governance
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#111315] tracking-tight">
          Fulfillment Routing & Lifecycle Operations
        </h1>
        <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
          Transition seamlessly from validation marketplaces to 1688 private agents and domestic
          3PLs, enforce the 5% net margin order circuit breaker, and govern Klaviyo/SMS and payment
          processor health.
        </p>
      </div>

      {/* 4-Stage Fulfillment Tier State Machine */}
      <section className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#111315]">
              Volume-Based Fulfillment Tier Routing
            </h2>
            <p className="text-xs text-[#525866]">
              Slide daily order volume to preview automated routing transitions and warehouse
              buffering
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="daily-orders-slider" className="text-xs font-medium text-[#525866]">
              Daily Orders:
            </label>
            <input
              id="daily-orders-slider"
              type="range"
              min={1}
              max={100}
              value={dailyOrderVolume}
              onChange={(e) => setDailyOrderVolume(Number(e.target.value))}
              className="w-36 accent-[#1D4ED8] cursor-pointer"
            />
            <span className="font-mono-num text-sm font-semibold text-[#111315] w-16 text-right">
              {dailyOrderVolume}/day
            </span>
          </div>
        </div>

        {/* 4 Stage Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { stage: 1, title: 'Stage 1 · Validation', range: '0–4 orders/day' },
            { stage: 2, title: 'Stage 2 · VIP Link', range: '5–9 orders/day' },
            { stage: 3, title: 'Stage 3 · Private Agent', range: '10–49 orders/day' },
            { stage: 4, title: 'Stage 4 · Domestic 3PL', range: '50+ orders/day' },
          ].map((s) => {
            const isCurrent = activeTier.stage === s.stage;
            return (
              <div
                key={s.stage}
                className={`p-3.5 rounded-lg border ${
                  isCurrent
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04]'
                    : 'border-neutral-200 bg-[#F8F9FA]'
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    isCurrent ? 'text-[#1D4ED8]' : 'text-[#525866]'
                  }`}
                >
                  {s.title}
                </p>
                <p className="font-mono-num text-xs text-[#111315] mt-0.5">{s.range}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 text-sm">
          <div>
            <p className="text-xs text-[#525866]">Active Node & Shipping Line</p>
            <p className="font-semibold text-[#111315] mt-0.5">{activeTier.activeNode}</p>
            <p className="text-xs text-[#525866] mt-0.5">
              {activeTier.shippingLine} · {activeTier.avgTransitDays}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#525866]">Micro-Buffer & Inventory Policy</p>
            <p className="text-sm text-[#111315] mt-0.5">{activeTier.bufferPolicy}</p>
          </div>
          <div>
            <p className="text-xs text-[#525866]">Packaging & Cost Advantage</p>
            <p className="text-sm text-[#111315] mt-0.5">{activeTier.packagingTier}</p>
            <p className="text-xs text-[#16A34A] mt-0.5">{activeTier.cogsAdvantage}</p>
          </div>
        </div>
      </section>

      {/* Live Order Ledger with 5% Net Margin Hard Circuit Breaker */}
      <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111315]">
              Live Order Fulfillment Ledger ({orders.length} Orders)
            </h2>
            <p className="text-xs text-[#525866]">
              Every storefront checkout order runs through the 5.0% net margin gate and 17TRACK scan
              monitor
            </p>
          </div>
          <span className="font-mono-num text-xs text-[#525866]">
            Hard Floor: Net Margin ≥ 5.0%
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                <th className="py-3 px-5">Order</th>
                <th className="py-3 px-5">Customer & Channel</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Landed COGS</th>
                <th className="py-3 px-4 text-right">Net Margin</th>
                <th className="py-3 px-5">Tracking & WISMO State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((ord) => {
                const gate = evaluateOrderMarginGate(
                  ord.retailTotal,
                  ord.landedCogs,
                  0.0375,
                  ord.allocatedCpa
                );
                const wismo = evaluatePaymentAndWismo(disputeRatePct, ord.daysWithoutScan);
                return (
                  <tr key={ord.id} className="hover:bg-[#F8F9FA]/70">
                    <td className="py-3.5 px-5">
                      <p className="font-mono-num font-semibold text-[#111315]">{ord.id}</p>
                      <p className="text-xs text-[#525866]">{ord.createdAt}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-[#111315]">{ord.customerName}</p>
                      <p className="text-xs text-[#525866]">
                        {ord.productName} · {ord.sourceChannel}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-right text-[#111315]">
                      ${ord.retailTotal.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-right text-[#525866]">
                      ${ord.landedCogs.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-right">
                      <span
                        className={`font-semibold ${
                          gate.approved ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {gate.netMarginPct.toFixed(1)}%
                      </span>
                      <p className="text-[11px] text-[#525866]">
                        {gate.approved ? 'PO Dispatched' : '#review-orders'}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-mono-num text-xs text-[#111315]">{ord.trackingCode}</p>
                      <p
                        className={`text-xs mt-0.5 ${
                          wismo.wismoAction === 'STANDARD_TRACKING'
                            ? 'text-[#525866]'
                            : 'text-[#D97706] font-medium'
                        }`}
                      >
                        {ord.carrier} ·{' '}
                        {wismo.wismoAction === 'DAY_5_REASSURANCE'
                          ? 'Day 5 Reassurance Sent'
                          : wismo.wismoAction === 'DAY_8_ESCALATION'
                            ? 'Day 8 15%-Credit Escalation'
                            : 'Origin Scan Verified'}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supplier Redundancy Scorecard (1 Primary + 2 Backups) */}
      <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="font-display text-base font-semibold text-[#111315]">
            Supplier Redundancy Matrix (1 Primary + 2 Failover Nodes)
          </h2>
          <p className="text-xs text-[#525866]">
            Pass threshold ≥ 85/100 · &lt;2.0% defective ceiling · ≤11-day hard delivery SLA
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          {SUPPLIER_NODES.map((node) => {
            const scoreRes = calculateSupplierScore({
              dispatchHours: node.dispatchHours,
              avgTransitDays: node.avgTransitDays,
              defectiveRatePct: node.defectiveRatePct,
              landedCogsToRetailPct: node.landedCogsToRetailPct,
              storeRating: node.storeRating,
            });
            return (
              <div key={node.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#1D4ED8]">{node.role}</p>
                    <h3 className="font-display text-sm font-semibold text-[#111315] mt-0.5">
                      {node.name}
                    </h3>
                    <p className="text-xs text-[#525866]">{node.location}</p>
                  </div>
                  <span className="font-mono-num text-base font-semibold text-[#16A34A]">
                    {scoreRes.score}/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-[#525866]">Dispatch:</span>{' '}
                    <span className="font-mono-num text-[#111315]">{node.dispatchHours}h</span>
                  </div>
                  <div>
                    <span className="text-[#525866]">Transit:</span>{' '}
                    <span className="font-mono-num text-[#111315]">{node.avgTransitDays}d avg</span>
                  </div>
                  <div>
                    <span className="text-[#525866]">Defect Rate:</span>{' '}
                    <span className="font-mono-num text-[#111315]">{node.defectiveRatePct}%</span>
                  </div>
                  <div>
                    <span className="text-[#525866]">Buffer:</span>{' '}
                    <span className="font-mono-num text-[#111315]">{node.bufferUnits} units</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Grid: Klaviyo 4-Flow Abandonment & TCPA SMS Validator + Payment Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Klaviyo 4 Flows + TCPA SMS Validator */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111315]">
              Klaviyo 4-Trigger Abandonment & US TCPA SMS Guardrails
            </h2>
            <p className="text-xs text-[#525866] mt-0.5">
              Captures Site, Browse, Added-to-Cart, and Checkout triggers while enforcing &lt;160
              chars, 0 emojis, and 48h SMS cooldown
            </p>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
            {KLAVIYO_FLOWS.map((flow) => (
              <div key={flow.id} className="p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#111315]">{flow.trigger}</p>
                  <p className="text-[#525866] mt-0.5">{flow.delay}</p>
                </div>
                <span className="font-mono-num text-[#1D4ED8] font-medium shrink-0">
                  {flow.recoveryShare}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="tcpa-sms" className="font-semibold text-[#111315]">
                TCPA SMS Draft Validator
              </label>
              <span
                className={`font-mono-num font-medium ${
                  smsValidation.charCount > 160 || smsValidation.hasEmoji
                    ? 'text-[#DC2626]'
                    : 'text-[#16A34A]'
                }`}
              >
                {smsValidation.charCount}/160 chars · {smsValidation.estimatedSegments} segment(s)
              </span>
            </div>
            <textarea
              id="tcpa-sms"
              rows={2}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="sms-hours" className="text-[#525866]">
                  Hours since last abandon SMS:
                </label>
                <input
                  id="sms-hours"
                  type="number"
                  min={0}
                  max={120}
                  value={hoursSinceLastSms}
                  onChange={(e) => setHoursSinceLastSms(Number(e.target.value))}
                  className="w-20 px-2 py-1 font-mono-num border border-neutral-300 rounded-md"
                />
              </div>
              {smsValidation.tcpaCompliant ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                  <Check className="w-4 h-4" />
                  <span>TCPA Compliant · Single Segment</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
                  <AlertCircle className="w-4 h-4" />
                  <span>{smsValidation.issues[0]}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Processor & WISMO Risk Governance */}
        <div className="lg:col-span-5 bg-[#F8F9FA] rounded-xl border border-neutral-200 p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-[#111315]">
              Payment Risk & WISMO Escalator
            </h2>
            <p className="text-xs text-[#525866] mt-0.5">
              Keep chargebacks &lt;0.50% to prevent 30%–50% rolling reserves
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="dispute-rate" className="font-medium text-[#111315]">
                  Rolling Dispute Rate (%)
                </label>
                <span className="font-mono-num font-semibold text-[#111315]">
                  {disputeRatePct.toFixed(2)}%
                </span>
              </div>
              <input
                id="dispute-rate"
                type="range"
                min={0}
                max={1.2}
                step={0.05}
                value={disputeRatePct}
                onChange={(e) => setDisputeRatePct(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] cursor-pointer"
              />
              <p
                className={`text-xs mt-1.5 font-medium ${
                  riskStatus.processorStatus === 'NOMINAL'
                    ? 'text-[#16A34A]'
                    : riskStatus.processorStatus === 'THROTTLE_ADS'
                      ? 'text-[#D97706]'
                      : 'text-[#DC2626]'
                }`}
              >
                {riskStatus.processorGuidance}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="wismo-days" className="font-medium text-[#111315]">
                  Days Without Carrier Origin Scan
                </label>
                <span className="font-mono-num font-semibold text-[#111315]">
                  Day {wismoDaysStalled}
                </span>
              </div>
              <input
                id="wismo-days"
                type="range"
                min={0}
                max={10}
                step={1}
                value={wismoDaysStalled}
                onChange={(e) => setWismoDaysStalled(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] cursor-pointer"
              />
              <p className="text-xs text-[#525866] mt-1.5 leading-relaxed">
                {riskStatus.wismoGuidance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
