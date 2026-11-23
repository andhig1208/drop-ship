import { useEffect, useState } from 'react';
import { INITIAL_PRODUCTS } from './data/storeData';
import { TopNav } from './components/TopNav';
import { StorefrontView, type PublicStoreProduct } from './components/StorefrontView';
import { CartDrawer, type CartLineItem } from './components/CartDrawer';
import { StoreFooter } from './components/StoreFooter';

const FALLBACK_PUBLIC_PRODUCTS: PublicStoreProduct[] = INITIAL_PRODUCTS.map(
  ({
    landedCogs: _landedCogs,
    adPainPoint: _adPainPoint,
    adVillain: _adVillain,
    adMechanism: _adMechanism,
    defaultAvatar: _defaultAvatar,
    seoFocusKeyword: _seoFocusKeyword,
    seoMetaDescription: _seoMetaDescription,
    ...rest
  }) => rest
);

export default function App() {
  const [products, setProducts] = useState<PublicStoreProduct[]>(FALLBACK_PUBLIC_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    FALLBACK_PUBLIC_PRODUCTS[0].id
  );
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Sync live catalog published from the private operations console
  useEffect(() => {
    let active = true;
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: PublicStoreProduct[] } | null) => {
        if (active && data?.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {
        // Fallback to bundled catalog if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const totalCartUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = ({
    product,
    variantLabel,
    bundleQty,
    includeToggleAddOn,
  }: {
    product: PublicStoreProduct;
    variantLabel: string;
    bundleQty: 1 | 2 | 3;
    includeToggleAddOn: boolean;
  }) => {
    const bundle = product.bundles.find((b) => b.qty === bundleQty) ?? product.bundles[0];
    const discountedUnit = Number((product.price * (1 - bundle.discountPct / 100)).toFixed(2));
    const itemKey = `${product.id}::${variantLabel}::${bundle.qty}`;

    setCartItems((prev) => {
      const next = [...prev];
      const existingIdx = next.findIndex((i) => i.key === itemKey);
      if (existingIdx >= 0) {
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + bundle.qty,
        };
      } else {
        next.push({
          key: itemKey,
          productId: product.id,
          name: product.name,
          variantLabel,
          imageUrl: product.imageUrl,
          unitPrice: discountedUnit,
          compareAtPrice: product.compareAtPrice,
          quantity: bundle.qty,
          bundleQty: bundle.qty,
          bundleNote: bundle.label,
          freeGifts: product.freeGifts,
        });
      }

      if (includeToggleAddOn) {
        const addOnKey = `${product.id}::addon::${product.toggleAddOn.id}`;
        const addOnIdx = next.findIndex((i) => i.key === addOnKey);
        if (addOnIdx >= 0) {
          next[addOnIdx] = { ...next[addOnIdx], quantity: next[addOnIdx].quantity + 1 };
        } else {
          next.push({
            key: addOnKey,
            productId: product.id,
            name: product.toggleAddOn.name,
            variantLabel: '50% Off Bundle Add-On',
            imageUrl: product.imageUrl,
            unitPrice: product.toggleAddOn.offerPrice,
            compareAtPrice: product.toggleAddOn.regularPrice,
            quantity: 1,
            bundleQty: 1,
            isToggleAddOn: true,
            bundleNote: 'Bundle Add-On',
            freeGifts: [],
          });
        }
      }
      return next;
    });

    setCartOpen(true);
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleCompleteOrder = async (payload: {
    customerName: string;
    customerEmail: string;
    address: string;
    city: string;
    postalCode: string;
    promoCode: string | null;
    items: CartLineItem[];
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        address: payload.address,
        city: payload.city,
        postalCode: payload.postalCode,
        promoCode: payload.promoCode ?? '',
        items: payload.items.map((item) => ({
          productId: item.productId,
          variantLabel: item.variantLabel,
          bundleQty: item.bundleQty,
          quantity: item.quantity,
          isToggleAddOn: Boolean(item.isToggleAddOn),
        })),
      }),
    });

    const data = (await res.json()) as {
      orderId?: string;
      total?: number;
      estimatedDelivery?: string;
      error?: string;
    };

    if (!res.ok || !data.orderId) {
      throw new Error(data.error || 'Could not process order. Please try again.');
    }

    setCartItems([]);
    return {
      orderId: data.orderId,
      total: data.total ?? 0,
      estimatedDelivery: data.estimatedDelivery ?? '3–5 business days (Free)',
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111315]">
      <TopNav cartCount={totalCartUnits} onOpenCart={() => setCartOpen(true)} />

      <main className="flex-1">
        <StorefrontView
          products={products}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          onAddToCart={handleAddToCart}
        />
      </main>

      <StoreFooter />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCompleteOrder={handleCompleteOrder}
      />
    </div>
  );
}
