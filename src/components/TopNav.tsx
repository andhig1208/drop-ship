import { useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';

interface TopNavProps {
  cartCount: number;
  onOpenCart: () => void;
}

const STORE_NAV_LINKS: { href: string; label: string }[] = [
  { href: '#shop', label: 'Shop' },
  { href: '#benefits', label: 'Engineering' },
  { href: '#collection', label: 'Collection' },
  { href: '#reviews-section', label: 'Reviews' },
  { href: '#faq-section', label: 'FAQ' },
];

export function TopNav({ cartCount, onOpenCart }: TopNavProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="sticky top-0 z-40 bg-white">
      {!bannerDismissed && (
        <div className="bg-[#111315] text-white text-xs h-9 px-4 flex items-center justify-center relative">
          <p className="truncate pr-8 tracking-wide">
            Save 20% on 2-packs · Free 3–5 business day US shipping · 30-day money-back guarantee
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss promotional banner"
            className="absolute right-3 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#shop"
            className="font-display text-xl font-semibold tracking-tight text-[#111315] whitespace-nowrap shrink-0"
          >
            Kova Studio
          </a>

          {/* Zone 2: Customer-facing storefront anchor navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium"
          >
            {STORE_NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative py-1 whitespace-nowrap shrink-0 text-[#525866] hover:text-[#111315] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open shopping bag, ${cartCount} items`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Mobile compact scrollable storefront links */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-neutral-100 px-4 py-2 flex items-center gap-5 overflow-x-auto text-xs font-medium"
        >
          {STORE_NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap shrink-0 pb-0.5 text-[#525866] hover:text-[#111315] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
