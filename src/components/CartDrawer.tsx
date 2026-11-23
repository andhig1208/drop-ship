import { useState, type FormEvent } from 'react';
import { CheckCircle2, Lock, Minus, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import type { FreeGiftItem } from '../data/storeData';

export interface CartLineItem {
  key: string;
  productId: string;
  name: string;
  variantLabel: string;
  imageUrl: string;
  unitPrice: number;
  compareAtPrice: number;
  quantity: number;
  bundleQty: 1 | 2 | 3;
  isToggleAddOn?: boolean;
  bundleNote: string;
  freeGifts: FreeGiftItem[];
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartLineItem[];
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onCompleteOrder: (payload: {
    customerName: string;
    customerEmail: string;
    address: string;
    city: string;
    postalCode: string;
    promoCode: string | null;
    items: CartLineItem[];
  }) => Promise<{ orderId: string; total: number; estimatedDelivery: string }>;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onCompleteOrder,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pct: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  // One-Page Checkout fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{
    orderId: string;
    total: number;
    customerName: string;
    estimatedDelivery: string;
  } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  const discountAmount = appliedPromo ? Number(((subtotal * appliedPromo.pct) / 100).toFixed(2)) : 0;
  const finalTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const bonusThreshold = 120;
  const remainingForBonus = Math.max(0, bonusThreshold - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / bonusThreshold) * 100));

  const uniqueFreeGifts: FreeGiftItem[] = [];
  const seenGiftIds = new Set<string>();
  for (const item of items) {
    for (const g of item.freeGifts) {
      if (!seenGiftIds.has(g.id)) {
        seenGiftIds.add(g.id);
        uniqueFreeGifts.push(g);
      }
    }
  }

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'KOVA10') {
      setAppliedPromo({ code: 'KOVA10', pct: 10 });
      setPromoMessage('10% welcome discount applied.');
    } else if (code === 'SAVE15') {
      setAppliedPromo({ code: 'SAVE15', pct: 15 });
      setPromoMessage('15% multi-item discount applied.');
    } else {
      setPromoMessage('Try KOVA10 (10% off) or SAVE15 (15% off).');
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerEmail.includes('@') ||
      !address.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setFormError('Please complete all contact and shipping fields with a valid email address.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const result = await onCompleteOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        promoCode: appliedPromo?.code ?? null,
        items,
      });
      setReceipt({
        orderId: result.orderId,
        total: result.total,
        customerName: customerName.trim(),
        estimatedDelivery: result.estimatedDelivery,
      });
      setStep('confirmed');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to complete order right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setReceipt(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag and one-page checkout"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-neutral-200 shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#111315]">
              {step === 'cart'
                ? `Your Bag (${totalUnits})`
                : step === 'checkout'
                  ? 'Express One-Page Checkout'
                  : 'Order Confirmed'}
            </h2>
            <p className="text-xs text-[#525866]">
              30-Day Money-Back Guarantee · Free 3–5 Day US Shipping
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close shopping bag"
            className="p-2 text-[#525866] hover:text-[#111315] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping & Priority Gift Progress Bar */}
        {step === 'cart' && items.length > 0 && (
          <div className="px-6 py-3 bg-[#F8F9FA] border-b border-neutral-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#111315]">
                {remainingForBonus === 0
                  ? 'Free Shipping + Priority 24h Processing Unlocked'
                  : `Add $${remainingForBonus.toFixed(2)} for Priority Express Upgrade`}
              </span>
              <span className="font-mono-num text-[#525866]">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D4ED8] transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'cart' && items.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-base font-semibold text-[#111315] mb-1">
                Your bag is currently empty
              </p>
              <p className="text-sm text-[#525866] mb-6">
                Every single-unit order unlocks free accessories and 3–5 day tracked US shipping.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
              >
                Explore Hardware
              </button>
            </div>
          )}

          {step === 'cart' && items.length > 0 && (
            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="flex gap-4 pb-5 border-b border-neutral-100 last:border-b-0"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover bg-[#F8F9FA] border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#111315] truncate">{item.name}</h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="text-neutral-400 hover:text-[#DC2626] p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#525866] mt-0.5">
                      {item.variantLabel} · {item.bundleNote}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-neutral-200 rounded-md">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="p-1.5 text-[#525866] hover:text-[#111315] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono-num font-medium text-[#111315]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="p-1.5 text-[#525866] hover:text-[#111315] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-num text-sm font-semibold text-[#111315]">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        {item.compareAtPrice > item.unitPrice && (
                          <span className="font-mono-num text-xs text-neutral-400 line-through ml-2">
                            ${(item.compareAtPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Unbundled Zero-COGS Free Gifts */}
              {uniqueFreeGifts.length > 0 && (
                <div className="pt-3 border-t border-neutral-200">
                  <p className="text-xs font-semibold text-[#111315] mb-2.5">
                    Included Free Gifts (Unlocked at Tier 1)
                  </p>
                  <div className="space-y-2">
                    {uniqueFreeGifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex items-center justify-between text-xs py-2 px-3 bg-[#F8F9FA] rounded-lg border border-neutral-200"
                      >
                        <div>
                          <p className="font-medium text-[#111315]">{gift.name}</p>
                          <p className="text-[#525866]">{gift.detail}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="font-mono-num text-neutral-400 line-through mr-1.5">
                            ${gift.retailValue.toFixed(0)}
                          </span>
                          <span className="font-mono-num font-semibold text-[#16A34A]">$0.00</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Code */}
              <div className="pt-3 border-t border-neutral-200">
                <label htmlFor="promo-code-input" className="block text-xs font-medium text-[#525866] mb-1.5">
                  Discount Code (Try KOVA10 or SAVE15)
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 text-sm font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className="text-xs text-[#525866] mt-1.5">{promoMessage}</p>
                )}
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <form id="one-page-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#525866]">
                <p className="font-semibold text-[#111315] mb-0.5">
                  Fast Express Checkout — OR Continue With Credit Card
                </p>
                <p>
                  Secure encrypted checkout — your payment details are protected. Statement appears
                  as KOVASTUDIO.COM.
                </p>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3 text-xs font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-lg"
                >
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="co-name" className="block text-xs font-medium text-[#111315] mb-1">
                  Full Name
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label htmlFor="co-email" className="block text-xs font-medium text-[#111315] mb-1">
                  Email for Order Tracking & Digital Guide
                </label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label htmlFor="co-address" className="block text-xs font-medium text-[#111315] mb-1">
                  Street Address
                </label>
                <input
                  id="co-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="742 Evergreen Terrace"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="co-city" className="block text-xs font-medium text-[#111315] mb-1">
                    City
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <div>
                  <label htmlFor="co-zip" className="block text-xs font-medium text-[#111315] mb-1">
                    Postal Code
                  </label>
                  <input
                    id="co-zip"
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="78701"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#525866]">
                  <span>Shipping (1-day handling + 3–5 day US transit)</span>
                  <span className="font-mono-num font-medium text-[#16A34A]">$0.00 FREE</span>
                </div>
                <div className="flex justify-between text-[#525866]">
                  <span>30-Day Money-Back Guarantee</span>
                  <span className="font-medium text-[#111315]">$0 Restock Fee</span>
                </div>
              </div>
            </form>
          )}

          {step === 'confirmed' && receipt && (
            <div className="py-6 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#111315]">
                    Order #{receipt.orderId} Confirmed
                  </h3>
                  <p className="text-sm text-[#525866] mt-1">
                    Thank you, {receipt.customerName}. Your confirmation email and tracking link
                    will arrive shortly.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#F8F9FA] border border-neutral-200 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#525866]">Total Paid</span>
                  <span className="font-mono-num font-semibold text-[#111315]">
                    ${receipt.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525866]">Estimated Delivery</span>
                  <span className="text-[#111315]">{receipt.estimatedDelivery}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525866]">Home Trial Coverage</span>
                  <span className="text-[#16A34A] font-medium">30-Day Money-Back Guarantee</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {step !== 'confirmed' && items.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-200 bg-white space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-[#525866]">
                <span>Subtotal</span>
                <span className="font-mono-num">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span className="font-mono-num">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#525866]">
                <span>Tracked US Shipping</span>
                <span className="font-mono-num font-medium text-[#16A34A]">FREE</span>
              </div>
              <div className="flex justify-between font-semibold text-base text-[#111315] pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span className="font-mono-num">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to One-Page Checkout</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-4 py-3 text-sm font-medium text-[#111315] bg-[#F8F9FA] hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="one-page-checkout-form"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {submitting ? 'Processing…' : `Complete Order · $${finalTotal.toFixed(2)}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
