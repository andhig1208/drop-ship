import { useState } from 'react';
import {
  Check,
  ChevronDown,
  Gift,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import {
  PRODUCT_REVIEWS,
  STORE_FAQS,
  type StoreProduct,
} from '../data/storeData';

export type PublicStoreProduct = Omit<
  StoreProduct,
  | 'landedCogs'
  | 'adPainPoint'
  | 'adVillain'
  | 'adMechanism'
  | 'defaultAvatar'
  | 'seoFocusKeyword'
  | 'seoMetaDescription'
>;

interface StorefrontViewProps {
  products: PublicStoreProduct[];
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  onAddToCart: (params: {
    product: PublicStoreProduct;
    variantLabel: string;
    bundleQty: 1 | 2 | 3;
    includeToggleAddOn: boolean;
  }) => void;
}

export function StorefrontView({
  products,
  selectedProductId,
  onSelectProduct,
  onAddToCart,
}: StorefrontViewProps) {
  const activeProduct = products.find((p) => p.id === selectedProductId) ?? products[0];

  const [selectedVariantId, setSelectedVariantId] = useState(activeProduct.variants[0]?.id ?? '');
  const [selectedBundleQty, setSelectedBundleQty] = useState<1 | 2 | 3>(2);
  const [toggleAddOnEnabled, setToggleAddOnEnabled] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>('how-to-use');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Keep variant synced when switching product
  const currentVariant =
    activeProduct.variants.find((v) => v.id === selectedVariantId) ?? activeProduct.variants[0];

  const currentBundle =
    activeProduct.bundles.find((b) => b.qty === selectedBundleQty) ?? activeProduct.bundles[0];

  const unitDiscountedPrice = Number(
    (activeProduct.price * (1 - currentBundle.discountPct / 100)).toFixed(2)
  );
  const bundleTotal = Number((unitDiscountedPrice * currentBundle.qty).toFixed(2));
  const addOnTotal = toggleAddOnEnabled ? activeProduct.toggleAddOn.offerPrice : 0;
  const ctaTotal = Number((bundleTotal + addOnTotal).toFixed(2));
  const savingsPct = Math.round(
    ((activeProduct.compareAtPrice - activeProduct.price) / activeProduct.compareAtPrice) * 100
  );

  const reviews = PRODUCT_REVIEWS[activeProduct.id] ?? PRODUCT_REVIEWS['kova-pulse-pro'];

  const handleProductSwitch = (product: PublicStoreProduct) => {
    onSelectProduct(product.id);
    setSelectedVariantId(product.variants[0]?.id ?? '');
    setSelectedBundleQty(2);
    setToggleAddOnEnabled(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-white">
      {/* SECTION 1: Contiguous Flagship Product Detail Page (PDP) */}
      <section
        id="shop"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:pt-10 lg:pb-20 scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Sticky Gallery Column */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 space-y-4">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F8F9FA] border border-neutral-200 relative">
              {!imgErrors[activeProduct.id] ? (
                <img
                  src={activeProduct.imageUrl}
                  alt={`${activeProduct.name} studio hardware view`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrors((prev) => ({ ...prev, [activeProduct.id]: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FA]">
                  <p className="font-display text-lg font-semibold text-[#111315]">
                    {activeProduct.name}
                  </p>
                  <p className="text-sm text-[#525866] mt-1">{activeProduct.category}</p>
                </div>
              )}
            </div>

            {/* Product Quick Switcher Bar */}
            <div className="grid grid-cols-4 gap-3">
              {products.slice(0, 4).map((prod) => {
                const isSelected = prod.id === activeProduct.id;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleProductSwitch(prod)}
                    aria-label={`Inspect ${prod.name}`}
                    className={`group text-left rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-[#F8F9FA] overflow-hidden">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-2.5 py-2 bg-white">
                      <p className="text-xs font-medium text-[#111315] truncate">{prod.name}</p>
                      <p className="font-mono-num text-[11px] text-[#525866]">
                        ${prod.price.toFixed(0)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-5 space-y-4">
            {/* Clickable Social Proof Bar */}
            <div className="flex items-center justify-between gap-4 text-xs text-[#525866]">
              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1.5 hover:text-[#111315] transition-colors"
              >
                <span className="inline-flex text-amber-500" aria-hidden="true">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                </span>
                <span className="font-mono-num font-semibold text-[#111315]">
                  {activeProduct.rating.toFixed(1)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {activeProduct.reviewCount.toLocaleString()} verified reviews
                </span>
              </a>
              <span className="font-mono-num text-[#525866]">{activeProduct.sku}</span>
            </div>

            {/* Hook Title & Subtitle */}
            <div>
              <h1 className="font-display text-2xl sm:text-[1.7rem] leading-tight font-semibold tracking-tight text-[#111315] [text-wrap:balance]">
                {activeProduct.hookTitle}
              </h1>
              <p className="text-sm text-[#525866] mt-1.5 leading-relaxed">
                {activeProduct.shortSubtitle}
              </p>
            </div>

            {/* Price Stack & BNPL */}
            <div className="flex items-baseline flex-wrap gap-3 pb-3.5 border-b border-neutral-200">
              <span className="font-mono-num text-3xl font-semibold text-[#1D4ED8]">
                ${activeProduct.price.toFixed(2)}
              </span>
              <span className="font-mono-num text-base text-neutral-400 line-through">
                ${activeProduct.compareAtPrice.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-[#16A34A]">
                Save {savingsPct}% today
              </span>
              <span className="w-full text-xs text-[#525866]">
                or 4 interest-free payments of{' '}
                <span className="font-mono-num font-medium text-[#111315]">
                  ${(activeProduct.price / 4).toFixed(2)}
                </span>{' '}
                with Shop Pay or Klarna
              </span>
            </div>

            {/* 4 Above-the-Fold Benefit Bullets */}
            <ul className="space-y-1.5 text-sm text-[#111315]">
              {activeProduct.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Visual Color Variant Swatches */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-[#111315]">Finish: {currentVariant?.label}</span>
                <span className="text-[#16A34A] font-medium">In Stock · Ships in 24h</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeProduct.variants.map((variant) => {
                  const isActive = variant.id === currentVariant?.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      aria-label={`Select ${variant.label} finish`}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/5 text-[#111315]'
                          : 'border-neutral-200 text-[#525866] hover:border-neutral-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: variant.swatchHex }}
                      />
                      <span className="whitespace-nowrap">{variant.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Tier Quantity Breaks (Kaching Bundle Offer Engineering) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111315]">Select Bundle Tier</span>
                <span className="text-[#525866]">Tier 1+ unlocks 2 free gifts</span>
              </div>
              <div className="space-y-1.5">
                {activeProduct.bundles.map((bundle) => {
                  const isSelected = bundle.qty === selectedBundleQty;
                  const tierUnit = activeProduct.price * (1 - bundle.discountPct / 100);
                  const tierTotal = tierUnit * bundle.qty;
                  const tierCompare = activeProduct.compareAtPrice * bundle.qty;
                  return (
                    <button
                      key={bundle.qty}
                      type="button"
                      onClick={() => setSelectedBundleQty(bundle.qty)}
                      aria-pressed={isSelected}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04] ring-1 ring-[#1D4ED8]'
                          : 'border-neutral-200 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#1D4ED8]' : 'border-neutral-300'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111315]">{bundle.label}</p>
                          <p className="text-xs text-[#525866]">{bundle.note}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono-num text-sm font-semibold text-[#111315]">
                          ${tierTotal.toFixed(2)}
                        </p>
                        <p className="font-mono-num text-xs text-neutral-400 line-through">
                          ${tierCompare.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zero-COGS Free Gift Unbundling Summary */}
            <div className="px-4 py-3 bg-[#F8F9FA] rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#111315] mb-1.5">
                <Gift className="w-4 h-4 text-[#1D4ED8]" />
                <span>2 Free Gifts Automatically Added to Cart</span>
              </div>
              <div className="space-y-1 text-xs text-[#525866]">
                {activeProduct.freeGifts.map((gift) => (
                  <div key={gift.id} className="flex items-center justify-between">
                    <span>{gift.name}</span>
                    <span className="font-mono-num text-[#16A34A] font-medium">
                      Free (${gift.retailValue} value)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CheckBoost Full-Row Clickable iOS-Style Toggle Switch Upsell */}
            <button
              type="button"
              role="switch"
              aria-checked={toggleAddOnEnabled}
              onClick={() => setToggleAddOnEnabled((v) => !v)}
              className={`w-full px-4 py-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                toggleAddOnEnabled
                  ? 'border-[#1D4ED8] bg-[#1D4ED8]/[0.04]'
                  : 'border-neutral-200 bg-white hover:border-neutral-400'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111315]">
                  Add {activeProduct.toggleAddOn.name}
                </p>
                <p className="text-xs text-[#525866] mt-0.5">
                  {activeProduct.toggleAddOn.description}
                </p>
                <p className="font-mono-num text-xs mt-1">
                  <span className="font-semibold text-[#1D4ED8]">
                    +${activeProduct.toggleAddOn.offerPrice.toFixed(2)}
                  </span>{' '}
                  <span className="text-neutral-400 line-through">
                    ${activeProduct.toggleAddOn.regularPrice.toFixed(2)}
                  </span>
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 flex items-center ${
                  toggleAddOnEnabled ? 'bg-[#1D4ED8] justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
              </span>
            </button>

            {/* Primary Add to Cart CTA */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  onAddToCart({
                    product: activeProduct,
                    variantLabel: currentVariant?.label ?? 'Standard',
                    bundleQty: selectedBundleQty,
                    includeToggleAddOn: toggleAddOnEnabled,
                  })
                }
                className="w-full py-3.5 px-6 text-base font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer tabular-nums"
              >
                Add to Cart — ${ctaTotal.toFixed(2)}
              </button>
              <p className="text-xs text-center text-[#525866]">
                Batch #14 in stock · Processes in 1 business day · Free 3–5 business day US delivery
              </p>
            </div>

            {/* 3 Horizontal Trust Items */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200 text-xs text-[#525866]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#111315] shrink-0" />
                <span>3–5 Day Free US</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#111315] shrink-0" />
                <span>30-Day Returns</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#111315] shrink-0" />
                <span>$0 Restock Fee</span>
              </div>
            </div>

            {/* Collapsible Product Accordions */}
            <div className="border-t border-neutral-200 divide-y divide-neutral-200">
              {[
                { id: 'how-to-use', title: 'How to Use (3 Steps)', content: activeProduct.howToUse },
                { id: 'specs', title: 'Materials & Specifications', content: activeProduct.specs },
                {
                  id: 'shipping',
                  title: 'Shipping & Delivery Times',
                  content:
                    '1 business day order handling, followed by 3–5 business days free tracked US shipping (5–8 business days UK, CA, EU, AU via YunExpress dedicated air).',
                },
                {
                  id: 'returns',
                  title: '30-Day Money-Back Guarantee',
                  content:
                    'Full 30-day home trial with $0 restocking fees. Email support@kovastudio.com for a return label within 24 hours.',
                },
              ].map((acc) => {
                const isOpen = openAccordion === acc.id;
                return (
                  <div key={acc.id}>
                    <button
                      type="button"
                      onClick={() => setOpenAccordion(isOpen ? '' : acc.id)}
                      aria-expanded={isOpen}
                      className="w-full py-3.5 flex items-center justify-between text-left text-sm font-medium text-[#111315] cursor-pointer"
                    >
                      <span>{acc.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#525866] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-4 text-sm text-[#525866] leading-relaxed">{acc.content}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Day 1 vs Day 30 Proof, 3-Ring Clinical Survey Gauges & Comparison */}
      <section id="benefits" className="bg-[#F8F9FA] border-y border-neutral-200 py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Two-Column Mechanism + Day 1 vs Day 30 Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-[#1D4ED8] mb-2">
                  Engineering & Ergonomics
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111315] [text-wrap:balance]">
                  {activeProduct.mechanismHeadline}
                </h2>
                <p className="text-sm sm:text-base text-[#525866] mt-3 leading-relaxed">
                  {activeProduct.mechanismBody}
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="font-display text-lg font-semibold text-[#111315]">
                  {activeProduct.routineHeadline}
                </h3>
                <p className="text-sm text-[#525866] mt-2 leading-relaxed">
                  {activeProduct.routineBody}
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <p className="font-mono-num text-xs font-semibold text-[#1D4ED8]">Day 1</p>
                <h3 className="font-display text-base font-semibold text-[#111315] mt-1">
                  First-Session Release
                </h3>
                <p className="text-sm text-[#525866] mt-2 leading-relaxed">
                  {activeProduct.day1Outcome}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <p className="font-mono-num text-xs font-semibold text-[#16A34A]">Day 30</p>
                <h3 className="font-display text-base font-semibold text-[#111315] mt-1">
                  Sustained Recovery
                </h3>
                <p className="text-sm text-[#525866] mt-2 leading-relaxed">
                  {activeProduct.day30Outcome}
                </p>
              </div>

              {/* 3-Ring Circular SVG Customer Survey Gauges */}
              <div className="sm:col-span-2 bg-white p-6 rounded-xl border border-neutral-200">
                <p className="text-xs font-semibold text-[#111315] mb-4">
                  30-Day Verified Buyer Survey (n = 412 customers)
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {activeProduct.surveyStats.map((stat) => {
                    const radius = 26;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (stat.pct / 100) * circumference;
                    return (
                      <div key={stat.label} className="flex flex-col items-center text-center">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                            <circle
                              cx="32"
                              cy="32"
                              r={radius}
                              stroke="#E5E7EB"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r={radius}
                              stroke="#1D4ED8"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute font-mono-num text-xs font-semibold text-[#111315]">
                            {stat.pct}%
                          </span>
                        </div>
                        <p className="text-xs text-[#525866] mt-2 leading-snug">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Kova Studio vs Cheaper Alternatives Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#111315]">
                Kova Studio vs. Generic Marketplace Alternatives
              </h3>
              <span className="text-xs text-[#525866]">Factory QC & Direct Shipping Parity</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-[#F8F9FA] text-xs font-semibold text-[#525866]">
                    <th className="py-3 px-6">Standard</th>
                    <th className="py-3 px-6 text-[#1D4ED8]">Kova Studio Direct</th>
                    <th className="py-3 px-6">Generic Listings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="py-3 px-6 font-medium text-[#111315]">US Delivery Speed</td>
                    <td className="py-3 px-6 text-[#111315] font-medium">
                      Free 3–5 business days (1-day dispatch)
                    </td>
                    <td className="py-3 px-6 text-[#525866]">18–35 days untracked sea freight</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium text-[#111315]">Included Accessories</td>
                    <td className="py-3 px-6 text-[#111315] font-medium">
                      2 free gifts unlocked on every single unit
                    </td>
                    <td className="py-3 px-6 text-[#525866]">Sold separately or omitted</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-6 font-medium text-[#111315]">Factory QC & Warranty</td>
                    <td className="py-3 px-6 text-[#111315] font-medium">
                      &lt;1% defect inspection · 30-day $0 restock returns
                    </td>
                    <td className="py-3 px-6 text-[#525866]">
                      No pre-ship inspection · 20% return fees
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Curated Ergonomic Niche Catalog */}
      <section
        id="collection"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-24"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-[#525866] mb-1">
              Ergonomic & Recovery Collection
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#111315]">
              Complete Your Daily Recovery Setup
            </h2>
          </div>
          <p className="text-xs text-[#525866]">
            Free 3–5 business day US shipping · 30-day home trial on every item
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <article
              key={product.id}
              className="group bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => handleProductSwitch(product)}
                className="aspect-[4/3] w-full bg-[#F8F9FA] overflow-hidden block cursor-pointer"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-[#525866]">{product.category}</p>
                <h3 className="font-display text-base font-semibold text-[#111315] mt-0.5">
                  <button
                    type="button"
                    onClick={() => handleProductSwitch(product)}
                    className="text-left hover:text-[#1D4ED8] transition-colors cursor-pointer"
                  >
                    {product.name}
                  </button>
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#525866] mt-1">
                  <span className="font-mono-num font-medium text-[#111315]">
                    {product.rating.toFixed(1)} ★
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{product.reviewCount} reviews</span>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono-num text-base font-semibold text-[#111315]">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="font-mono-num text-xs text-neutral-400 line-through ml-1.5">
                      ${product.compareAtPrice.toFixed(0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onAddToCart({
                        product,
                        variantLabel: product.variants[0]?.label ?? 'Standard',
                        bundleQty: 1,
                        includeToggleAddOn: false,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-medium text-[#111315] bg-[#F8F9FA] hover:bg-[#1D4ED8] hover:text-white border border-neutral-200 hover:border-[#1D4ED8] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 4: Verified Customer Reviews & FAQ */}
      <section
        id="reviews-section"
        className="border-t border-neutral-200 bg-[#F8F9FA] py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Reviews */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <p className="text-xs font-medium text-[#525866]">
                Verified Customer Reviews · {activeProduct.rating.toFixed(1)} / 5.0 Average
              </p>
              <h2 className="font-display text-2xl font-semibold text-[#111315] mt-1">
                What Customers Say After 30 Days
              </h2>
            </div>

            <div className="space-y-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="bg-white p-5 rounded-xl border border-neutral-200 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-[#525866]">
                    <span className="font-mono-num font-semibold text-amber-600">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)} {rev.rating}.0
                    </span>
                    <span>{rev.date}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#111315]">
                    {rev.headline}
                  </h3>
                  <p className="text-sm text-[#525866] leading-relaxed">{rev.body}</p>
                  <div className="pt-2 border-t border-neutral-100 text-xs text-[#525866] flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-[#111315]">{rev.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rev.role}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rev.verifiedVariant}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Bottom FAQ Accordion */}
          <div id="faq-section" className="lg:col-span-5 space-y-6 scroll-mt-24">
            <div>
              <p className="text-xs font-medium text-[#525866]">Common Questions</p>
              <h2 className="font-display text-2xl font-semibold text-[#111315] mt-1 mb-4">
                Shipping, Trial & Guarantee
              </h2>
              <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
                {STORE_FAQS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={faq.question} className="px-5">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="w-full py-4 flex items-center justify-between gap-3 text-left text-sm font-medium text-[#111315] cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#525866] shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pb-4 text-sm text-[#525866] leading-relaxed">{faq.answer}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
