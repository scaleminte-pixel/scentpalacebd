'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
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

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = await applyCoupon(couponCode);
    setCouponMsg({ text: res.message, isError: !res.success });
    if (res.success) setCouponCode('');
  };

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="bg-[#F7F2E6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 border-b border-[#E8DFCB]">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="pb-8 border-b border-[#E8DFCB] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#B88556]">
              Maison Bag
            </span>
            <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight mt-1">
              Your Curated Selection ({totalCount})
            </h1>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bag</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-[#E8DFCB] p-12 sm:p-20 text-center my-10 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#F7F2E6] border border-[#E8DFCB] flex items-center justify-center mx-auto mb-6 text-[#033528]">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-3xl font-normal text-neutral-900 mb-3">
              Your Fragrance Bag is Empty
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-8 font-sans leading-relaxed">
              Explore our celebrated extraits de parfum, signature aged Cambodian ouds, or sample miniature discovery sets.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#033528] hover:bg-[#022A20] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Items Table (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free shipping progress bar */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8DFCB] shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-2">
                  {amountNeededForFreeShipping === 0 ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Congratulations! You qualify for complimentary express delivery across Bangladesh.
                    </span>
                  ) : (
                    <span>
                      Add <strong className="text-[#033528]">{formatPrice(amountNeededForFreeShipping)}</strong> more to receive free express shipping.
                    </span>
                  )}
                  <span className="text-neutral-500 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#033528] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-[#E8DFCB] overflow-hidden shadow-xs divide-y divide-[#E8DFCB]">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-26 bg-[#F7F2E6] rounded-xl p-2 border border-[#E8DFCB] shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                          sizes="80px"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#B88556]">
                          {item.scentFamily}
                        </span>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-serif text-lg sm:text-xl font-medium text-neutral-900 hover:text-[#033528] transition-colors block mt-0.5"
                        >
                          {item.name}
                        </Link>
                        <div className="text-xs text-neutral-500 mt-1">
                          Flacon Size: <strong className="text-neutral-800">{item.size}</strong>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          Unit Price: {formatPrice(item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFE7D5]">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-[#D6CBB2] rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 font-bold"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-xs font-semibold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <div className="text-right min-w-24">
                        <span className="font-serif text-lg font-semibold text-neutral-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="text-xs font-semibold uppercase tracking-wider text-[#B88556] hover:underline inline-flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Continue Browsing Catalog</span>
                </Link>
              </div>
            </div>

            {/* Right Order Summary Box (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E8DFCB] p-6 shadow-sm space-y-6 sticky top-24">
              <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#E8DFCB]">
                Order Summary
              </h2>

              {/* Promo Coupon Form */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Promotional Voucher
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF1ED] border border-[#033528]/20 text-xs">
                    <div className="flex items-center gap-2 text-neutral-800">
                      <Tag className="w-4 h-4 text-[#033528]" />
                      <span className="font-bold">{appliedCoupon.code}</span>
                      <span className="text-[11px] text-neutral-500">
                        ({appliedCoupon.description})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-neutral-400 hover:text-rose-600 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponMsg(null);
                      }}
                      placeholder="Enter discount code"
                      className="flex-1 px-3 py-2 text-xs border border-[#D6CBB2] rounded-lg uppercase tracking-wider focus:outline-none focus:border-[#033528]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#022A20] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponMsg && (
                  <p
                    className={`text-[11px] mt-1.5 ${
                      couponMsg.isError ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2.5 text-xs text-neutral-600 pt-4 border-t border-[#E8DFCB]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#033528]">
                    <span>Coupon Discount</span>
                    <span>−{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
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
                <div className="flex justify-between text-lg font-bold text-neutral-900 pt-3 border-t border-[#E8DFCB]">
                  <span>Total Amount</span>
                  <span className="text-[#033528]">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-4 px-6 rounded-xl bg-[#033528] hover:bg-[#022A20] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Proceed to Guest Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Security guarantee */}
              <div className="pt-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted & Authentic Guarantee</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

