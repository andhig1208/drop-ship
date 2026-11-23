import { useState } from 'react';
import { X } from 'lucide-react';

interface PolicyDoc {
  id: string;
  title: string;
  content: string;
}

const POLICIES: PolicyDoc[] = [
  {
    id: 'about',
    title: 'About Us',
    content:
      'Kova Studio LLC engineers compact ergonomic recovery and acoustic focus hardware shipped directly from vetted OEM production partners to customers across the US, UK, Canada, EU, and Australia.',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content:
      'Kova Studio LLC · 804 Congress Ave, Suite 420, Austin, TX 78701, USA · Phone: +1 (512) 555-0194 · Email: support@kovastudio.com · Support Hours: Monday–Friday, 9:00 AM – 6:00 PM CST (24-hour email response SLA).',
  },
  {
    id: 'shipping',
    title: 'Shipping Policy',
    content:
      'All orders are processed within 1 business day. Free standard US tracked shipping delivers in 3–5 business days ($0.00 shipping fee). International orders ship via YunExpress dedicated air in 5–8 business days with 17TRACK origin scan verification.',
  },
  {
    id: 'returns',
    title: 'Returns & Refund Policy',
    content:
      'We provide a 30-day money-back guarantee on every order with a $0 restocking fee. For damaged or defective arrivals, send a quick photo to support@kovastudio.com—keep the faulty unit and we dispatch a free replacement immediately. For intact returns within 30 days, we issue return authorization within 24 hours.',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    content:
      'Customer contact, order, and SMS opt-in data are encrypted in transit and never sold to third-party brokers. SMS communications strictly honor US TCPA consent and instant STOP opt-out commands.',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    content:
      'All transactions are billed securely under KOVASTUDIO.COM with 256-bit TLS encryption and 3D Secure verification. Prices are listed in USD inclusive of free standard US delivery.',
  },
];

export function StoreFooter() {
  const [openPolicy, setOpenPolicy] = useState<PolicyDoc | null>(null);

  return (
    <>
      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-2.5">
            <p className="font-display text-lg font-semibold text-[#111315]">Kova Studio LLC</p>
            <p className="text-xs text-[#525866] leading-relaxed">
              804 Congress Ave, Suite 420, Austin, TX 78701, United States
            </p>
            <p className="text-xs text-[#525866]">
              support@kovastudio.com · +1 (512) 555-0194 · Mon–Fri 9:00 AM–6:00 PM CST
            </p>
            <p className="text-xs text-[#525866]">
              1 business day handling · 3–5 business day free US shipping · 30-day $0 restock returns
            </p>
          </div>

          <div className="md:col-span-7 flex flex-col md:items-end justify-between gap-4">
            <nav aria-label="Store policies" className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#525866]">
              {POLICIES.map((pol) => (
                <button
                  key={pol.id}
                  type="button"
                  onClick={() => setOpenPolicy(pol)}
                  className="hover:text-[#111315] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {pol.title}
                </button>
              ))}
            </nav>
            <p className="text-xs text-neutral-400">
              © 2026 Kova Studio LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {openPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={openPolicy.title}
        >
          <div className="bg-white rounded-xl border border-neutral-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-[#111315]">
                {openPolicy.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpenPolicy(null)}
                aria-label="Close policy dialog"
                className="p-1.5 text-[#525866] hover:text-[#111315] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#525866] leading-relaxed">{openPolicy.content}</p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenPolicy(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#111315] hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
