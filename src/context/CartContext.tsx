'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackEvent } from '@/lib/track';
import { CartItem, Product, ProductVariant, Coupon } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number, options?: { openDrawer?: boolean }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  appliedCoupon: Coupon | null;
  applyCoupon: (code: string, opts?: { keepIfNotEligible?: boolean }) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;

  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  total: number;
  totalCount: number;
}

const FREE_SHIPPING_THRESHOLD = 5000;
const STANDARD_SHIPPING_FEE = 60; // Inside Dhaka

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('rawdah_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCoupon = localStorage.getItem('rawdah_coupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (e) {
      console.error('Failed to parse cart storage', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('rawdah_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      if (appliedCoupon) {
        localStorage.setItem('rawdah_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('rawdah_coupon');
      }
    }
  }, [appliedCoupon, isInitialized]);

  const addItem = (
    product: Product,
    variant: ProductVariant,
    quantity: number = 1,
    options: { openDrawer?: boolean } = {}
  ) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === variant.id);
      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = Math.min(next[existingIndex].quantity + quantity, variant.stock);
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          price: variant.price,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          slug: product.slug,
          name: product.name,
          size: variant.size,
          price: variant.price,
          image: product.images[0] || '/images/products/rayhaan-azul.webp',
          quantity: Math.min(quantity, variant.stock),
          stock: variant.stock,
          scentFamily: product.scentFamily,
        },
      ];
    });
    trackEvent('AddToCart', {
      items: [{ id: product.slug, name: product.name, price: variant.price, quantity, variant: variant.size }],
    });
    if (options.openDrawer !== false) setIsDrawerOpen(true);
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.stock),
          };
        }
        return item;
      })
    );
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setIsDrawerOpen(false);
    localStorage.removeItem('rawdah_cart');
    localStorage.removeItem('rawdah_coupon');
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Coupons are validated by the server against the coupons managed in admin.
  const [pendingCouponCode, setPendingCouponCode] = useState<string | null>(null);

  const applyCoupon = async (
    code: string,
    opts: { keepIfNotEligible?: boolean } = {}
  ): Promise<{ success: boolean; message: string }> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return { success: false, message: 'Please enter a coupon code.' };
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.coupon) {
        const c = data.coupon;
        setAppliedCoupon({
          code: c.code,
          type: String(c.type).toUpperCase() === 'PERCENTAGE' ? 'percentage' : 'fixed',
          value: Number(c.value),
          minSpend: Number(c.minSpend) || 0,
          maxDiscount: c.maxDiscount ?? null,
          description: c.description || '',
        });
        setPendingCouponCode(null);
        return { success: true, message: `Coupon ${c.code} applied successfully!` };
      }
      if (opts.keepIfNotEligible && data.reason === 'MIN_SPEND') {
        // Remember it and apply automatically once the bag reaches the minimum
        setPendingCouponCode(trimmed);
        return { success: true, message: data.error || 'Code saved — it applies automatically when eligible.' };
      }
      return { success: false, message: data.error || 'Invalid promotional code. Please try again.' };
    } catch {
      return { success: false, message: 'Could not check the coupon. Please try again.' };
    }
  };

  // Apply a remembered code when the bag becomes eligible
  useEffect(() => {
    if (!pendingCouponCode || appliedCoupon || subtotal <= 0) return;
    applyCoupon(pendingCouponCode, { keepIfNotEligible: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, pendingCouponCode]);

  // Re-check a saved coupon once per page load (it may have been disabled in admin)
  const couponRechecked = React.useRef(false);
  useEffect(() => {
    if (couponRechecked.current || !appliedCoupon || subtotal <= 0) return;
    couponRechecked.current = true;
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: appliedCoupon.code, subtotal }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) setAppliedCoupon(null);
      })
      .catch(() => {});
  }, [appliedCoupon, subtotal]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Re-verify coupon minimum spend if subtotal drops
  useEffect(() => {
    if (appliedCoupon && subtotal < appliedCoupon.minSpend) {
      setAppliedCoupon(null);
    }
  }, [subtotal, appliedCoupon]);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        shippingFee,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountNeededForFreeShipping,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

