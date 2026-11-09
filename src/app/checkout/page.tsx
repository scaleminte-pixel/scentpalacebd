'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  division: string;
  postalCode: string;
  notes: string;
  deliveryMethod: 'inside_dhaka' | 'outside_dhaka';
  paymentMethod: string;
}

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
}

interface DeliveryConfig {
  insideDhaka: number;
  outsideDhaka: number;
  freeThreshold: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [form, setForm] = useState<CheckoutForm>({
    name: 'Mohammad Al-Amin',
    phone: '01711234567',
    email: 'alamin@example.com',
    address: 'House 14, Road 7, Block C, Gulshan-1',
    city: 'Dhaka',
    division: 'Dhaka',
    postalCode: '1212',
    notes: 'Please ring the bell upon arrival.',
    deliveryMethod: 'inside_dhaka',
    paymentMethod: 'cod',
  });

  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    insideDhaka: 60,
    outsideDhaka: 120,
    freeThreshold: 5000,
  });

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([
    {
      id: 'cod',
      name: 'Cash on Delivery (COD)',
      description: 'Pay with cash directly to the courier agent upon receiving your luxury parcel.',
    },
  ]);

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isNavigatingToConfirmation, setIsNavigatingToConfirmation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Fetch dynamic payment methods and delivery settings from backend
  useEffect(() => {
    async function loadGatewaySettings() {
      try {
        const res = await fetch('/api/payment-methods');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.deliveryFees) {
              setDeliveryConfig({
                insideDhaka: Number(data.deliveryFees.insideDhaka) || 60,
                outsideDhaka: Number(data.deliveryFees.outsideDhaka) || 120,
                freeThreshold: Number(data.deliveryFees.freeThreshold) || 5000,
              });
            }
            if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
              setPaymentOptions(data.paymentMethods);
              // Ensure selected payment method is valid among the enabled ones
              setForm((prev) => {
                const isValid = data.paymentMethods.some((m: PaymentOption) => m.id === prev.paymentMethod);
                return isValid ? prev : { ...prev, paymentMethod: data.paymentMethods[0].id };
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      }
    }
    loadGatewaySettings();
  }, []);

  // Shipping Fee calculation (Free if subtotal >= freeThreshold)
  const isFreeEligible = subtotal >= deliveryConfig.freeThreshold;
  const shippingCost = isFreeEligible
    ? 0
    : form.deliveryMethod === 'outside_dhaka'
    ? deliveryConfig.outsideDhaka
    : deliveryConfig.insideDhaka;

  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  // If order was successfully completed, show instant confirmation transition
  if (isOrderPlaced || isNavigatingToConfirmation) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#EAE4DC] p-10 max-w-md text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-serif italic text-2xl text-neutral-900 font-normal">
            Order Confirmed!
          </h2>
          <p className="text-xs text-neutral-500 font-sans">
            Finalizing your invoice and navigating directly to order confirmation...
          </p>
          <div className="w-6 h-6 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  // If cart is empty and not in submission or completed, show prompt
  if (items.length === 0 && !isSubmitting && !isOrderPlaced && !isNavigatingToConfirmation) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-[#EAE4DC] p-10 max-w-md text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-[#D45520] mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-normal text-neutral-900 mb-2">
            Your Bag is Empty
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Please select your desired luxury perfumes before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-[#D45520] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:bg-[#BD4616] transition-all"
          >
            Explore Perfumes
          </Link>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CheckoutForm, string>> = {};

    if (!form.name.trim()) errs.name = 'Full name is required for delivery';
    if (!form.phone.trim()) {
      errs.phone = 'Mobile phone number is required';
    } else if (!/^(\+?88)?01[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX)';
    }

    if (!form.email.trim()) {
      errs.email = 'Email address is required for order invoice';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!form.address.trim()) errs.address = 'Street address and apartment/house details are required';
    if (!form.city.trim()) errs.city = 'City is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        division: form.division || 'Dhaka',
        postalCode: form.postalCode || '',
        notes: form.notes || '',
        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        items: items.map((i: any) => ({
          variantId: i.variantId,
          sku: i.sku || i.variantSku || '',
          slug: i.slug,
          size: i.size,
          quantity: i.quantity,
          name: i.name,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const orderRef = data.orderNumber || data.orderId;
        const snapshotOrder = {
          orderId: orderRef,
          orderNumber: orderRef,
          trackingNumber: data.trackingNumber || `STEAD-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: new Date().toISOString(),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            division: form.division,
            postalCode: form.postalCode,
            notes: form.notes,
          },
          items,
          subtotal,
          discount: discountAmount,
          couponCode: appliedCoupon?.code,
          shipping: shippingCost,
          total: data.total || finalTotal,
          deliveryMethod: form.deliveryMethod,
          paymentMethod: form.paymentMethod,
          status: 'confirmed',
          estimatedDelivery: form.deliveryMethod === 'inside_dhaka' ? '24–48 Hours' : '2–4 Business Days',
        };

        // Cache order in local storage for instantaneous display on confirmation screen
        try {
          localStorage.setItem(`order_${data.orderNumber}`, JSON.stringify(snapshotOrder));
          localStorage.setItem(`order_${data.orderId}`, JSON.stringify(snapshotOrder));
          localStorage.setItem('latest_order', JSON.stringify(snapshotOrder));
        } catch (storageErr) {
          console.warn('LocalStorage save error:', storageErr);
        }

        setIsNavigatingToConfirmation(true);
        setIsOrderPlaced(true);
        clearCart();

        // Redirect directly to confirmation or payment gateway
        if (form.paymentMethod === 'bkash' && data.bkashUrl) {
          window.location.href = data.bkashUrl;
        } else {
          router.replace(`/order-confirmation?orderNumber=${data.orderNumber}&orderId=${data.orderId}`);
        }
        return;
      } else {
        setSubmissionError(data.error || 'Failed to complete order. Please verify your details.');
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Network error occurred while connecting to Rāwdah Atelier.');
    } finally {
      if (!isOrderPlaced) {
        setIsSubmitting(false);
      }
    }
  };

  const renderPaymentIcon = (id: string) => {
    switch (id) {
      case 'cod':
        return <Banknote className="w-4 h-4 text-[#D45520]" />;
      case 'bkash':
      case 'nagad':
        return <Smartphone className="w-4 h-4 text-[#D45520]" />;
      case 'card':
      case 'sslcommerz':
        return <CreditCard className="w-4 h-4 text-[#D45520]" />;
      default:
        return <CreditCard className="w-4 h-4 text-[#D45520]" />;
    }
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-8 border-b border-[#EAE4DC] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
              Secure Guest Checkout
            </span>
            <h1 className="font-serif italic text-3xl sm:text-4xl text-neutral-900 font-normal mt-0.5">
              Finalize Your Order
            </h1>
          </div>

          <Link
            href="/cart"
            className="text-xs text-neutral-500 hover:text-[#D45520] font-medium"
          >
            ← Back to Bag
          </Link>
        </div>

        {/* Checkout Form & Summary Grid */}
        <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Contact Information */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE4DC] shadow-xs">
              <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#EAE4DC] mb-5">
                1. Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-neutral-900 bg-white focus:outline-none ${
                      errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D4CFCE] focus:border-[#D45520]'
                    }`}
                    placeholder="e.g. Tanvir Ahmed Chowdhury"
                  />
                  {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-neutral-900 bg-white focus:outline-none ${
                      errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D4CFCE] focus:border-[#D45520]'
                    }`}
                    placeholder="017XXXXXXXX"
                  />
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-neutral-900 bg-white focus:outline-none ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D4CFCE] focus:border-[#D45520]'
                    }`}
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE4DC] shadow-xs">
              <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#EAE4DC] mb-5">
                2. Shipping Address
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Street Address & Apartment / Suite *
                  </label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border text-sm text-neutral-900 bg-white focus:outline-none ${
                      errors.address ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#D4CFCE] focus:border-[#D45520]'
                    }`}
                    placeholder="House/Apartment #, Road #, Area (e.g. Gulshan-2, Dhanmondi, Banani)"
                  />
                  {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                      placeholder="e.g. Dhaka"
                    />
                    {errors.city && <p className="text-[11px] text-rose-600 mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Division
                    </label>
                    <select
                      value={form.division}
                      onChange={(e) => setForm({ ...form, division: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                      placeholder="e.g. 1212"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Order Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#D4CFCE] text-xs text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                    placeholder="e.g. Leave with security, call before arrival, gift packaging"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delivery Method (Inside Dhaka vs. Outside Dhaka) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE4DC] shadow-xs">
              <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#EAE4DC] mb-5">
                3. Courier Speed & Service
              </h2>

              <div className="space-y-3">
                {/* Inside Dhaka */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    form.deliveryMethod === 'inside_dhaka'
                      ? 'border-[#D45520] bg-[#FDF3EE] shadow-xs'
                      : 'border-[#EAE4DC] bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={form.deliveryMethod === 'inside_dhaka'}
                      onChange={() => setForm({ ...form, deliveryMethod: 'inside_dhaka' })}
                      className="accent-[#D45520] w-4 h-4"
                    />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        Inside Dhaka Delivery
                      </div>
                      <div className="text-xs text-neutral-500">
                        Estimated 24–48 hours by dedicated concierge
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">
                    {isFreeEligible ? (
                      <span className="text-emerald-700 font-semibold uppercase text-xs">
                        Free (Over ৳5,000)
                      </span>
                    ) : (
                      formatPrice(deliveryConfig.insideDhaka)
                    )}
                  </span>
                </label>

                {/* Outside Dhaka */}
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                    form.deliveryMethod === 'outside_dhaka'
                      ? 'border-[#D45520] bg-[#FDF3EE] shadow-xs'
                      : 'border-[#EAE4DC] bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={form.deliveryMethod === 'outside_dhaka'}
                      onChange={() => setForm({ ...form, deliveryMethod: 'outside_dhaka' })}
                      className="accent-[#D45520] w-4 h-4"
                    />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        Outside Dhaka Delivery
                      </div>
                      <div className="text-xs text-neutral-500">
                        Chittagong, Sylhet, Rajshahi & all 64 districts nationwide (2–4 days)
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">
                    {isFreeEligible ? (
                      <span className="text-emerald-700 font-semibold uppercase text-xs">
                        Free (Over ৳5,000)
                      </span>
                    ) : (
                      formatPrice(deliveryConfig.outsideDhaka)
                    )}
                  </span>
                </label>
              </div>
            </div>

            {/* 4. Payment Method (Dynamically managed from Backend) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAE4DC] shadow-xs">
              <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#EAE4DC] mb-5">
                4. Payment Method
              </h2>

              <div className="space-y-3">
                {paymentOptions.map((method) => {
                  const isSelected = form.paymentMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#D45520] bg-[#FDF3EE]'
                          : 'border-[#EAE4DC] bg-white hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={isSelected}
                        onChange={() => setForm({ ...form, paymentMethod: method.id })}
                        className="accent-[#D45520] w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                          {renderPaymentIcon(method.id)}
                          <span>{method.name}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {method.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Summary Box (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE4DC] p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
            <h2 className="font-serif text-xl font-normal text-neutral-900 pb-4 border-b border-[#EAE4DC]">
              Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </h2>

            {/* Compact items list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-[#F4EFEB] pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="py-3 flex items-center gap-3">
                  <div className="relative w-12 h-14 bg-[#FAF7F2] rounded-lg p-1 border border-[#EAE4DC] shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-serif font-medium text-neutral-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-neutral-500">
                      {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-neutral-600 pt-4 border-t border-[#EAE4DC]">
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
                <span>Shipping Fee</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                      Complimentary
                    </span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-[#EAE4DC]">
                <span>Total Due</span>
                <span className="text-[#D45520]">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Error Notification */}
            {submissionError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Confirming Royal Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Place Order • {formatPrice(finalTotal)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Complimentary 2ml extrait sample & 100% genuine seal</span>
            </div>

            <p className="text-[11px] text-center text-neutral-400 font-sans">
              By placing this order, you agree to Rāwdah Haute Parfumerie&apos;s Terms of Service and Sample First Policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
