'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, Check } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    subtotal,
    discountAmount,
    shippingFee,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    total,
    totalCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={closeDrawer} />

      <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 border-l border-[#E5DFD7]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAE4DC] bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#D45520]" />
            <h2 className="font-serif text-lg font-medium text-neutral-900 tracking-tight">
              Your Fragrance Bag
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FDF3EE] text-[#D45520] font-semibold">
              {totalCount}
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="bg-[#F4EFEB] px-6 py-3 border-b border-[#EAE4DC]">
          <div className="flex items-center justify-between text-xs text-neutral-700 font-medium mb-1.5">
            {amountNeededForFreeShipping === 0 ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> You have qualified for complimentary express shipping!
              </span>
            ) : (
              <span>
                Add <strong className="text-[#D45520]">{formatPrice(amountNeededForFreeShipping)}</strong> more for free express delivery
              </span>
            )}
            <span className="text-neutral-500 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D45520] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-[#F4EFEB] flex items-center justify-center text-neutral-400 mb-4">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl font-normal text-neutral-800 mb-2">
                Your bag is empty
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mb-6">
                Discover our curated extraits de parfum, aged ouds, and signature artisanal fragrances.
              </p>
              <button
                onClick={() => {
                  closeDrawer();
                  router.push('/shop');
                }}
                className="py-3 px-6 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4 p-3.5 bg-white rounded-xl border border-[#EAE4DC] shadow-sm relative group"
              >
                <div className="relative w-18 h-22 bg-[#FAF7F2] rounded-lg p-2 border border-neutral-100 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="70px"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeDrawer}
                        className="font-serif text-base font-medium text-neutral-900 hover:text-[#D45520] transition-colors truncate"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Size: <span className="font-medium text-neutral-700">{item.size}</span> • {item.scentFamily}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#D4CFCE] rounded-md bg-white">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        −
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-semibold text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100"
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Area */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-[#EAE4DC] space-y-4">
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-[#FDF3EE] border border-[#D45520]/20 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D45520]" />
                    <span className="font-semibold text-neutral-800">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-neutral-500">
                      ({appliedCoupon.description})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-400 hover:text-rose-600 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError('');
                    }}
                    placeholder="Discount code (try: LUXURY10)"
                    className="flex-1 px-3 py-2 text-xs border border-[#D4CFCE] rounded-lg uppercase tracking-wider focus:outline-none focus:border-[#D45520]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#181615] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 mt-1">{couponSuccess}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-neutral-600 pt-2 border-t border-[#EAE4DC]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#D45520]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping (Standard Dhaka)</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                      Complimentary
                    </span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-900 pt-2 border-t border-[#EAE4DC]">
                <span>Total</span>
                <span className="text-[#D45520]">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  closeDrawer();
                  router.push('/checkout');
                }}
                className="w-full py-3.5 px-4 bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors py-1"
              >
                View Detailed Cart Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

