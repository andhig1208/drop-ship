import { useState } from 'react';
import { Check, Copy, ArrowRight, AlertCircle } from 'lucide-react';
import { SEO_GUIDES, STORE_FAQS, type StoreProduct } from '../data/storeData';
import {
  auditSeoAndGmcParity,
  buildFaqJsonLd,
  buildProductJsonLd,
} from '../engine/seoEngine';

interface SeoHubViewProps {
  products: StoreProduct[];
  onInspectProduct: (productId: string) => void;
  onQuickAddProduct: (product: StoreProduct) => void;
}

export function SeoHubView({
  products,
  onInspectProduct,
  onQuickAddProduct,
}: SeoHubViewProps) {
  const [activeTab, setActiveTab] = useState<'guides' | 'auditor' | 'schema'>('guides');
  const [selectedGuideId, setSelectedGuideId] = useState(SEO_GUIDES[0].id);

  // Live SEO & GMC Parity Auditor state
  const flagship = products[0];
  const [pageTitle, setPageTitle] = useState(
    'Heated Cervical Traction Pillow for Neck Relief | Kova'
  );
  const [metaDescription, setMetaDescription] = useState(flagship.seoMetaDescription);
  const [focusKeyword, setFocusKeyword] = useState(flagship.seoFocusKeyword);
  const [urlSlug, setUrlSlug] = useState(flagship.slug);
  const [pdpHandlingDays, setPdpHandlingDays] = useState(1);
  const [gmcHandlingDays, setGmcHandlingDays] = useState(1);
  const [pdpTransitRange, setPdpTransitRange] = useState('3-5');
  const [gmcTransitRange, setGmcTransitRange] = useState('3-5');
  const [returnWindowDays, setReturnWindowDays] = useState(30);
  const [restockingFee, setRestockingFee] = useState(0);

  // Schema Inspector state
  const [schemaProductId, setSchemaProductId] = useState(products[0].id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedGuide = SEO_GUIDES.find((g) => g.id === selectedGuideId) ?? SEO_GUIDES[0];
  const guideProduct =
    products.find((p) => p.id === selectedGuide.featuredProductId) ?? products[0];

  const auditResult = auditSeoAndGmcParity({
    pageTitle,
    metaDescription,
    focusKeyword,
    urlSlug,
    hasProductJsonLd: true,
    hasFaqJsonLd: true,
    policyLinksCount: 6,
    pdpHandlingDays,
    gmcHandlingDays,
    pdpTransitRange,
    gmcTransitRange,
    returnWindowDays,
    restockingFeeDollars: restockingFee,
    hasMatchingContactInfo: true,
  });

  const schemaProduct = products.find((p) => p.id === schemaProductId) ?? products[0];
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://kovastudio.com';
  const productJsonLd = buildProductJsonLd({
    name: schemaProduct.hookTitle,
    description: schemaProduct.seoMetaDescription,
    sku: schemaProduct.sku,
    price: schemaProduct.price,
    rating: schemaProduct.rating,
    reviewCount: schemaProduct.reviewCount,
    handlingDays: pdpHandlingDays,
    transitMin: 3,
    transitMax: 5,
    url: `${origin}/products/${schemaProduct.slug}`,
  });
  const faqJsonLd = buildFaqJsonLd(STORE_FAQS);

  const handleCopy = (key: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const totalMonthlyVolume = SEO_GUIDES.reduce((sum, g) => sum + g.monthlySearchVolume, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Segmented Workspace Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
        <div>
          <p className="text-xs font-medium text-[#1D4ED8] mb-1">
            Organic Search Acquisition & Google Merchant Center
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#111315] tracking-tight">
            SEO Content Hub & Schema Engine
          </h1>
          <p className="text-sm text-[#525866] mt-1.5 max-w-2xl">
            Capture high-intent search buyers with long-tail editorial guides, valid Schema.org
            Product and FAQ JSON-LD, and strict Google Merchant Center policy parity.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="SEO hub sections"
          className="inline-flex items-center gap-1 p-1 bg-[#F8F9FA] border border-neutral-200 rounded-lg self-start"
        >
          {[
            { id: 'guides', label: 'Buying Guides' },
            { id: 'auditor', label: 'SEO & GMC Auditor' },
            { id: 'schema', label: 'JSON-LD Schema' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id as 'guides' | 'auditor' | 'schema')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-[#111315] shadow-sm'
                    : 'text-[#525866] hover:text-[#111315]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Organic KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Target Keyword Demand</p>
          <p className="font-mono-num text-2xl font-semibold text-[#111315] mt-1">
            {totalMonthlyVolume.toLocaleString()}/mo
          </p>
          <p className="text-xs text-[#525866] mt-0.5">Across 3 commercial clusters</p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">On-Page & GMC Score</p>
          <p className="font-mono-num text-2xl font-semibold text-[#111315] mt-1">
            {auditResult.score}/100
          </p>
          <p
            className={`text-xs font-medium mt-0.5 ${
              auditResult.gmcParityStatus === 'COMPLIANT' ? 'text-[#16A34A]' : 'text-[#D97706]'
            }`}
          >
            {auditResult.passedCount}/{auditResult.totalChecks} checks passing
          </p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">Active Structured Data</p>
          <p className="font-mono-num text-2xl font-semibold text-[#111315] mt-1">3 Schemas</p>
          <p className="text-xs text-[#525866] mt-0.5">Store · Product · FAQPage</p>
        </div>
        <div className="p-4 bg-[#F8F9FA] rounded-xl border border-neutral-200">
          <p className="text-xs text-[#525866]">GMC Feed Parity</p>
          <p className="font-mono-num text-2xl font-semibold text-[#111315] mt-1">
            {pdpHandlingDays}d / {pdpTransitRange}d
          </p>
          <p className="text-xs text-[#525866] mt-0.5">30-day returns · $0 restock</p>
        </div>
      </div>

      {/* TAB 1: Buying Guides & Keyword Intent Clusters */}
      {activeTab === 'guides' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Guide Selector Rail */}
            <div className="lg:col-span-4 space-y-3">
              <h2 className="font-display text-sm font-semibold text-[#111315]">
                Indexed Buying Guides ({SEO_GUIDES.length})
              </h2>
              {SEO_GUIDES.map((guide) => {
                const selected = guide.id === selectedGuide.id;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.03]'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <p className="text-xs text-[#525866]">
                      {guide.targetKeyword} ·{' '}
                      <span className="font-mono-num">
                        {guide.monthlySearchVolume.toLocaleString()}/mo
                      </span>
                    </p>
                    <p className="font-display text-sm font-semibold text-[#111315] mt-1 leading-snug">
                      {guide.title}
                    </p>
                    <p className="text-xs text-[#525866] mt-2">
                      {guide.readMinutes} min read · {guide.publishedDate}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Full SEO Article Content + Internal Conversion Card */}
            <article className="lg:col-span-8 bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 space-y-6">
              <div className="space-y-2 pb-5 border-b border-neutral-200">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#525866]">
                  <span className="font-medium text-[#1D4ED8]">
                    Keyword: {selectedGuide.targetKeyword}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">
                    {selectedGuide.monthlySearchVolume.toLocaleString()} monthly searches
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">
                    ${selectedGuide.cpcEquivalent.toFixed(2)} paid CPC equivalent
                  </span>
                </div>
                <h2 className="font-display text-2xl font-semibold text-[#111315] [text-wrap:balance]">
                  {selectedGuide.title}
                </h2>
                <p className="text-sm text-[#525866] leading-relaxed">{selectedGuide.summary}</p>
              </div>

              <div className="space-y-6">
                {selectedGuide.sections.map((sec) => (
                  <div key={sec.heading} className="space-y-2">
                    <h3 className="font-display text-lg font-semibold text-[#111315]">
                      {sec.heading}
                    </h3>
                    <p className="text-sm text-[#525866] leading-relaxed">{sec.body}</p>
                  </div>
                ))}
              </div>

              {/* Internal Contextual Product Conversion Block */}
              <div className="p-5 bg-[#F8F9FA] rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <img
                  src={guideProduct.imageUrl}
                  alt={guideProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-20 rounded-lg object-cover border border-neutral-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#525866]">
                    Featured in this guide · {guideProduct.rating.toFixed(1)} ★ (
                    {guideProduct.reviewCount} reviews)
                  </p>
                  <h4 className="font-display text-base font-semibold text-[#111315] mt-0.5">
                    {guideProduct.name} —{' '}
                    <span className="font-mono-num text-[#1D4ED8]">
                      ${guideProduct.price.toFixed(2)}
                    </span>
                  </h4>
                  <p className="text-xs text-[#525866] mt-1">{guideProduct.shortSubtitle}</p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onQuickAddProduct(guideProduct)}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Add to Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectProduct(guideProduct.id)}
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-[#111315] bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <span>View PDP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Structured FAQ Block */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <h3 className="font-display text-base font-semibold text-[#111315]">
                  Featured Snippet FAQ Targets
                </h3>
                {selectedGuide.faqs.map((faq) => (
                  <div key={faq.question} className="space-y-1">
                    <p className="text-sm font-semibold text-[#111315]">{faq.question}</p>
                    <p className="text-sm text-[#525866] leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* Keyword Intent Cluster Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="font-display text-base font-semibold text-[#111315]">
                Commercial SEO Keyword Clusters
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                    <th className="py-3 px-6">Primary Keyword</th>
                    <th className="py-3 px-6">URL Slug</th>
                    <th className="py-3 px-6 text-right">Monthly Searches</th>
                    <th className="py-3 px-6 text-right">Paid CPC Equiv.</th>
                    <th className="py-3 px-6 text-right">Est. Top-3 Traffic Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {SEO_GUIDES.map((g) => {
                    const estMonthlyClicks = Math.round(g.monthlySearchVolume * 0.14);
                    const trafficValue = Math.round(estMonthlyClicks * g.cpcEquivalent);
                    return (
                      <tr key={g.id} className="hover:bg-[#F8F9FA]/70">
                        <td className="py-3 px-6 font-medium text-[#111315]">{g.targetKeyword}</td>
                        <td className="py-3 px-6 font-mono-num text-xs text-[#525866]">
                          /guides/{g.slug}
                        </td>
                        <td className="py-3 px-6 font-mono-num text-right text-[#111315]">
                          {g.monthlySearchVolume.toLocaleString()}
                        </td>
                        <td className="py-3 px-6 font-mono-num text-right text-[#525866]">
                          ${g.cpcEquivalent.toFixed(2)}
                        </td>
                        <td className="py-3 px-6 font-mono-num text-right font-semibold text-[#16A34A]">
                          ${trafficValue.toLocaleString()}/mo
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

      {/* TAB 2: Live On-Page SEO & Google Merchant Center (GMC) Parity Auditor */}
      {activeTab === 'auditor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#111315]">
                Live Metadata & GMC Parity Controls
              </h2>
              <p className="text-xs text-[#525866] mt-0.5">
                Test title length, meta snippet bounds, and PDP-to-GMC shipping parity in real time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="seo-title" className="font-medium text-[#111315]">
                    Page Title Tag
                  </label>
                  <span className="font-mono-num text-[#525866]">
                    {pageTitle.trim().length} / 60 chars
                  </span>
                </div>
                <input
                  id="seo-title"
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="seo-meta" className="font-medium text-[#111315]">
                    Meta Description
                  </label>
                  <span className="font-mono-num text-[#525866]">
                    {metaDescription.trim().length} / 160 chars
                  </span>
                </div>
                <textarea
                  id="seo-meta"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="seo-kw" className="block text-xs font-medium text-[#111315] mb-1">
                    Focus Keyword
                  </label>
                  <input
                    id="seo-kw"
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label htmlFor="seo-slug" className="block text-xs font-medium text-[#111315] mb-1">
                    URL Slug
                  </label>
                  <input
                    id="seo-slug"
                    type="text"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="pdp-hand" className="block text-xs font-medium text-[#111315] mb-1">
                    PDP Handling (d)
                  </label>
                  <input
                    id="pdp-hand"
                    type="number"
                    min={0}
                    max={10}
                    value={pdpHandlingDays}
                    onChange={(e) => setPdpHandlingDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="gmc-hand" className="block text-xs font-medium text-[#111315] mb-1">
                    GMC Handling (d)
                  </label>
                  <input
                    id="gmc-hand"
                    type="number"
                    min={0}
                    max={10}
                    value={gmcHandlingDays}
                    onChange={(e) => setGmcHandlingDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="ret-days" className="block text-xs font-medium text-[#111315] mb-1">
                    Return Window (d)
                  </label>
                  <input
                    id="ret-days"
                    type="number"
                    min={0}
                    max={90}
                    value={returnWindowDays}
                    onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="pdp-transit" className="block text-xs font-medium text-[#111315] mb-1">
                    PDP Transit (d)
                  </label>
                  <input
                    id="pdp-transit"
                    type="text"
                    value={pdpTransitRange}
                    onChange={(e) => setPdpTransitRange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="gmc-transit" className="block text-xs font-medium text-[#111315] mb-1">
                    GMC Transit (d)
                  </label>
                  <input
                    id="gmc-transit"
                    type="text"
                    value={gmcTransitRange}
                    onChange={(e) => setGmcTransitRange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="restock-fee" className="block text-xs font-medium text-[#111315] mb-1">
                    Restocking Fee ($)
                  </label>
                  <input
                    id="restock-fee"
                    type="number"
                    min={0}
                    max={50}
                    value={restockingFee}
                    onChange={(e) => setRestockingFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num border border-neutral-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Live Google SERP Preview */}
            <div className="p-4 bg-[#F8F9FA] rounded-lg border border-neutral-200 space-y-1">
              <p className="text-xs text-[#525866]">Live Google Search Snippet Preview</p>
              <p className="text-xs text-[#16A34A] font-mono-num truncate">
                kovastudio.com › products › {urlSlug}
              </p>
              <p className="text-base font-medium text-[#1D4ED8] leading-snug">
                {pageTitle || 'Untitled Page'}
              </p>
              <p className="text-xs text-[#525866] leading-relaxed">
                {metaDescription || 'Add a meta description between 120 and 160 characters.'}
              </p>
              <p className="text-xs text-[#525866] pt-1 font-mono-num">
                ★★★★★ Rating: 4.9 · 1,428 reviews · $89.00 · In stock · Free {pdpTransitRange}d
                delivery
              </p>
            </div>
          </div>

          {/* Audit Checklist Results */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#111315]">
                  Verification Checklist
                </h2>
                <p className="text-xs text-[#525866]">
                  Prevents Google Merchant Center Misrepresentation suspensions
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-num text-xl font-semibold text-[#111315]">
                  {auditResult.score}%
                </p>
                <p
                  className={`text-xs font-semibold ${
                    auditResult.gmcParityStatus === 'COMPLIANT'
                      ? 'text-[#16A34A]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {auditResult.gmcParityStatus === 'COMPLIANT'
                    ? 'GMC Compliant'
                    : 'Action Required'}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-neutral-100">
              {auditResult.checks.map((chk) => (
                <li key={chk.id} className="px-6 py-3.5 flex items-start gap-3">
                  {chk.passed ? (
                    <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#111315]">{chk.label}</p>
                      <span className="text-xs text-[#525866] whitespace-nowrap">
                        {chk.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#525866] mt-0.5">{chk.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Live Schema.org JSON-LD Generator */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#111315]">
                  Product Offer & Shipping JSON-LD
                </h2>
                <p className="text-xs text-[#525866]">Rich price, rating, and delivery snippets</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select product for JSON-LD schema"
                  value={schemaProductId}
                  onChange={(e) => setSchemaProductId(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white text-[#111315]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleCopy('product-ld', productJsonLd)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-md cursor-pointer"
                >
                  {copiedKey === 'product-ld' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="p-5 text-xs font-mono-num text-[#111315] bg-[#F8F9FA] overflow-x-auto flex-1 leading-relaxed">
              {productJsonLd}
            </pre>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#111315]">
                  FAQPage Structured Data JSON-LD
                </h2>
                <p className="text-xs text-[#525866]">Captures expandable Google SERP accordion rows</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('faq-ld', faqJsonLd)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-md cursor-pointer"
              >
                {copiedKey === 'faq-ld' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono-num text-[#111315] bg-[#F8F9FA] overflow-x-auto flex-1 leading-relaxed">
              {faqJsonLd}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
