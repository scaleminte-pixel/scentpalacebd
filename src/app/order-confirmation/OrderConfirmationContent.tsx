'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import {
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  Printer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Clock,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';

export const OrderConfirmationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get('orderNumber') || searchParams.get('orderId') || 'RDH-84291';
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function loadOrder() {
      // 1. First try live database order by reference
      try {
        const res = await fetch(`/api/orders/${orderRef}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            const o = data.order;
            const deliveryMethod = o.deliveryMethod || 'inside_dhaka';
            const isOutside = deliveryMethod === 'outside_dhaka';

            setOrder({
              orderId: o.orderNumber || o.id,
              trackingNumber: o.courierTrackingNumber || `STEAD-${Math.floor(100000 + Math.random() * 900000)}`,
              createdAt: o.createdAt,
              deliveryMethod,
              deliveryLabel: isOutside ? 'Outside Dhaka Delivery' : 'Inside Dhaka Delivery',
              estimatedDelivery: isOutside ? '2–4 Business Days (Nationwide)' : '24–48 Hours (Inside Dhaka)',
              customer: {
                name: o.customerName,
                email: o.customerEmail,
                phone: o.customerPhone,
                address: o.shippingAddress?.address || (typeof o.shippingAddress === 'string' ? o.shippingAddress : ''),
                city: o.shippingAddress?.city || 'Dhaka',
                division: o.shippingAddress?.division || 'Dhaka',
                postalCode: o.shippingAddress?.postalCode || '',
                notes: o.customerNotes || o.shippingAddress?.notes || '',
              },
              items: o.items.map((it: any) => {
                let img = '/images/products/lattafa-blue-oud.webp';
                if (it.productImage && typeof it.productImage === 'string' && it.productImage.startsWith('/')) {
                  img = it.productImage;
                } else if (Array.isArray(it.product?.images) && it.product.images.length > 0) {
                  img = it.product.images[0];
                } else if (typeof it.product?.images === 'string') {
                  try {
                    const parsed = JSON.parse(it.product.images);
                    if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0];
                  } catch {
                    if (it.product.images.startsWith('/')) img = it.product.images;
                  }
                } else if (it.product?.primaryImage && typeof it.product.primaryImage === 'string') {
                  img = it.product.primaryImage;
                }

                return {
                  productId: it.productId,
                  variantId: it.variantId,
                  name: it.productName || it.product?.name || 'Luxury Extrait',
                  size: it.size || '100ml',
                  price: it.unitPrice,
                  quantity: it.quantity,
                  image: img,
                };
              }),
              subtotal: o.subtotal,
              discount: o.discount || 0,
              couponCode: o.couponCode,
              shipping: o.shippingFee,
              total: o.total,
              paymentMethod: (o.paymentMethod || 'COD').toLowerCase(),
              paymentStatus: o.paymentStatus || 'UNPAID',
              fulfillmentStatus: (o.fulfillmentStatus || 'CONFIRMED').toLowerCase(),
            });
            return;
          }
        }
      } catch (err) {
        console.warn('API lookup failed, checking localStorage:', err);
      }

      // 2. Fallback to localStorage
      try {
        const stored =
          localStorage.getItem(`order_${orderRef}`) ||
          localStorage.getItem(`order_${searchParams.get('orderNumber')}`) ||
          localStorage.getItem(`order_${searchParams.get('orderId')}`) ||
          localStorage.getItem('latest_order');

        if (stored) {
          const parsed = JSON.parse(stored);
          const isOutside = parsed.deliveryMethod === 'outside_dhaka';
          setOrder({
            ...parsed,
            deliveryLabel: isOutside ? 'Outside Dhaka Delivery' : 'Inside Dhaka Delivery',
            estimatedDelivery: isOutside ? '2–4 Business Days (Nationwide)' : '24–48 Hours (Inside Dhaka)',
          });
          return;
        }
      } catch (e) {
        console.error('LocalStorage parse error:', e);
      }

      // 3. Fallback demo order if direct URL hit without params
      setOrder({
        orderId: orderRef,
        trackingNumber: 'STEAD-789421',
        createdAt: new Date().toISOString(),
        deliveryMethod: 'inside_dhaka',
        deliveryLabel: 'Inside Dhaka Delivery',
        estimatedDelivery: '24–48 Hours (Inside Dhaka)',
        customer: {
          name: 'Tanvir Ahmed Chowdhury',
          email: 'tanvir@luxury.com',
          phone: '01711234567',
          address: 'House 14, Road 7, Block C, Gulshan-1',
          city: 'Dhaka',
          division: 'Dhaka',
          postalCode: '1212',
          notes: 'Please ring the bell upon arrival.',
        },
        items: [
          {
            productId: 'prod-bleu-oud',
            variantId: 'var-bo-100',
            name: 'Bleu Oud',
            size: '100ml',
            price: 16500,
            image: '/images/products/lattafa-blue-oud.webp',
            quantity: 1,
          },
        ],
        subtotal: 16500,
        discount: 0,
        shipping: 0,
        total: 16500,
        paymentMethod: 'cod',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'confirmed',
      });
    }

    loadOrder();
  }, [orderRef, searchParams]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const trackingSteps = [
    { title: 'Order Confirmed', time: 'Just now', completed: true },
    { title: 'Handcrafted Packaging & QC', time: 'Estimated within 4 hours', completed: true },
    { title: 'Dispatched with Courier', time: 'Pending pickup', completed: false },
    { title: 'Out for Delivery', time: order.estimatedDelivery, completed: false },
  ];

  const getPaymentDisplay = () => {
    switch (order.paymentMethod) {
      case 'cod':
        return {
          title: 'Cash on Delivery (COD)',
          desc: 'Please pay the exact amount in cash directly to the courier agent upon parcel delivery.',
          badge: 'Pay on Arrival',
        };
      case 'bkash':
      case 'nagad':
        return {
          title: 'bKash / Nagad Mobile Banking',
          desc: 'Payment completed via mobile banking transaction.',
          badge: 'Paid Online',
        };
      case 'card':
      case 'sslcommerz':
        return {
          title: 'Visa / Mastercard / Amex',
          desc: '256-bit encrypted card checkout via SSLCOMMERZ gateway.',
          badge: 'Paid Online',
        };
      default:
        return {
          title: 'Cash on Delivery (COD)',
          desc: 'Please pay with cash upon receiving your parcel.',
          badge: 'Pay on Arrival',
        };
    }
  };

  const paymentInfo = getPaymentDisplay();

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      {/* =========================================================================
          SCREEN-ONLY CONFIRMATION PAGE (HIDDEN WHEN PRINTING)
          ========================================================================= */}
      <div className="no-print order-confirmation-screen-view print:hidden bg-[#FAF7F2] min-h-screen py-12 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Celebration Header Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAE4DC] text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D45520] via-[#C5A059] to-[#D45520]" />

            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Order Successfully Placed</span>
            </div>

            <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900">
              Congratulations! Your Order is Placed
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto mt-3 font-sans leading-relaxed">
              Thank you for your patronage. Your royal order reference is{' '}
              <strong className="text-neutral-900 font-serif text-base">{order.orderId}</strong>. We have dispatched a confirmation SMS and email with live courier updates.
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-8 pt-6 border-t border-[#EAE4DC] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE4DC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Order Reference
                </span>
                <span className="text-sm font-serif font-bold text-neutral-900 block mt-0.5 truncate">
                  {order.orderId}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE4DC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Delivery Zone
                </span>
                <span className="text-xs font-semibold text-neutral-900 block mt-1">
                  {order.deliveryLabel}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE4DC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Total Amount Due
                </span>
                <span className="text-sm font-bold text-[#D45520] block mt-0.5">
                  {formatPrice(order.total)}
                </span>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE4DC]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Payment Type
                </span>
                <span className="text-xs font-semibold text-neutral-900 block mt-1">
                  {paymentInfo.badge}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D4CFCE] bg-white text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 shadow-2xs transition-colors"
              >
                <Printer className="w-4 h-4 text-neutral-600" />
                <span>Print Official Invoice</span>
              </button>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-all"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE4DC] shadow-sm">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#EAE4DC] mb-6 gap-2">
              <div>
                <h2 className="font-serif text-xl font-normal text-neutral-900">
                  Fulfillment & Courier Timeline
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Steadfast Consignment Tracking: <strong className="text-neutral-800">{order.trackingNumber}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider border border-emerald-200">
                  {order.fulfillmentStatus || 'Confirmed'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {trackingSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 shadow-2xs ${
                      step.completed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#F2ECE1] text-neutral-400 border border-[#D4CFCE]'
                    }`}
                  >
                    {step.completed ? '✓' : idx + 1}
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900">{step.title}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{step.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details & Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Purchased Items */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE4DC] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
                <h3 className="font-serif text-lg font-normal text-neutral-900">
                  Purchased Perfumes ({order.items?.length || 0})
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {formattedDate}
                </span>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-[#FAF7F2] last:border-b-0">
                    <div className="relative w-14 h-16 bg-[#FAF7F2] rounded-lg p-1 border border-[#EAE4DC] shrink-0">
                      <Image
                        src={item.image || '/images/products/lattafa-blue-oud.webp'}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-serif font-medium text-sm text-neutral-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-neutral-500 mt-0.5">
                        Bottle Size: <strong className="text-neutral-700">{item.size}</strong> • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-xs text-neutral-900 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-4 border-t border-[#EAE4DC] space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(order.subtotal)}</span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-[#D45520]">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping ({order.deliveryLabel})</span>
                  <span>
                    {order.shipping === 0 ? (
                      <span className="text-emerald-700 font-semibold uppercase text-[10px]">
                        Complimentary (Free Over ৳5,000)
                      </span>
                    ) : (
                      formatPrice(order.shipping)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-[#EAE4DC]">
                  <span>Total Amount</span>
                  <span className="text-[#D45520]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE4DC] shadow-sm space-y-6">
              {/* Delivery Recipient */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-[#EAE4DC] mb-3">
                  <MapPin className="w-4 h-4 text-[#D45520]" />
                  <h3 className="font-serif text-lg font-normal text-neutral-900">
                    Delivery Destination
                  </h3>
                </div>
                <div className="text-xs text-neutral-600 space-y-1.5 font-sans">
                  <p className="font-semibold text-neutral-900 text-sm">{order.customer.name}</p>
                  <p className="flex items-center gap-2 text-neutral-700">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{order.customer.phone}</span>
                  </p>
                  <p className="flex items-center gap-2 text-neutral-700">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{order.customer.email}</span>
                  </p>
                  <p className="pt-1 text-neutral-800 leading-relaxed">
                    {order.customer.address}, {order.customer.city}
                    {order.customer.division ? `, ${order.customer.division}` : ''}
                    {order.customer.postalCode ? ` - ${order.customer.postalCode}` : ''}
                  </p>
                  {order.customer.notes && (
                    <div className="mt-2 p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EAE4DC] text-[11px] text-neutral-600 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#D45520] shrink-0 mt-0.5" />
                      <span><strong>Note:</strong> {order.customer.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-[#EAE4DC]">
                <div className="flex items-center gap-2 pb-3 border-b border-[#EAE4DC] mb-3">
                  <CreditCard className="w-4 h-4 text-[#D45520]" />
                  <h3 className="font-serif text-lg font-normal text-neutral-900">
                    Payment Method
                  </h3>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-sm">
                      {paymentInfo.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Verified'}
                    </span>
                  </div>
                  <p className="text-neutral-500 pt-1 leading-relaxed">
                    {paymentInfo.desc}
                  </p>
                </div>
              </div>

              {/* Sample First Guarantee Badge */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE4DC] text-xs text-neutral-600 space-y-2">
                <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>Scent Palace BD Sample First Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  Every shipment includes two complimentary 2ml sample extraits. Test them on your skin before unsealing your primary flacon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          OFFICIAL SINGLE-PAGE A4 INVOICE SHEET (VISIBLE ONLY WHEN PRINTING)
          Strictly formatted to fit 1 single A4 portrait sheet
          ========================================================================= */}
      <div className="order-confirmation-print-view print-invoice-sheet bg-white text-black p-4 font-sans">
        {/* Invoice Top Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-neutral-900">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-neutral-900">
              SCENT PALACE BD
            </h1>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Atelier: Road 11, Block D, Gulshan-2, Dhaka 1212, Bangladesh
            </p>
            <p className="text-[11px] text-neutral-600">
              Concierge: +880 1711-000000 | concierge@scentpalacebd.com
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-neutral-900 text-white text-[11px] font-bold tracking-widest uppercase rounded">
              OFFICIAL INVOICE
            </span>
            <div className="mt-2 text-xs space-y-0.5">
              <p>Invoice Ref: <strong className="font-mono text-sm">{order.orderId}</strong></p>
              <p className="text-neutral-600">Date: {formattedDate}</p>
              <p className="text-neutral-600">Tracking: <strong className="font-mono text-[11px]">{order.trackingNumber}</strong></p>
            </div>
          </div>
        </div>

        {/* Client & Dispatch Information */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-neutral-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Billed &amp; Shipped To (Client)
            </span>
            <p className="font-bold text-sm text-neutral-900">{order.customer.name}</p>
            <p className="text-neutral-700 mt-0.5">{order.customer.phone}</p>
            <p className="text-neutral-700">{order.customer.email}</p>
            <p className="text-neutral-800 mt-1 leading-snug">
              {order.customer.address}, {order.customer.city}
              {order.customer.division ? `, ${order.customer.division}` : ''}
              {order.customer.postalCode ? ` - ${order.customer.postalCode}` : ''}
            </p>
            {order.customer.notes && (
              <p className="text-[11px] text-neutral-500 mt-1 italic">
                Note: {order.customer.notes}
              </p>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Fulfillment &amp; Payment Details
            </span>
            <div className="space-y-1 text-neutral-800">
              <p>Service Zone: <strong className="text-neutral-900">{order.deliveryLabel}</strong></p>
              <p>Estimated Window: <span className="text-neutral-700">{order.estimatedDelivery}</span></p>
              <p>Payment Method: <strong className="text-neutral-900">{paymentInfo.title}</strong></p>
              <p>Payment Status:{' '}
                <strong className={order.paymentMethod === 'cod' ? 'text-amber-700' : 'text-emerald-700'}>
                  {order.paymentMethod === 'cod' ? 'Cash Due upon Parcel Handover' : 'Paid Online in Full'}
                </strong>
              </p>
              <p className="text-[10px] text-neutral-500 pt-1">
                Security: Authentic Hologram &amp; QC Passed
              </p>
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="py-4">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-50">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Fragrance Composition / Flacon</th>
                <th className="py-2 px-2 w-24">Bottle Size</th>
                <th className="py-2 px-2 text-right w-24">Unit Price</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items.map((it: any, idx: number) => (
                <tr key={idx} className="border-b border-neutral-100">
                  <td className="py-2.5 px-2 text-center text-neutral-500">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <strong className="text-neutral-900 font-medium block">{it.name}</strong>
                    <span className="text-[10px] text-neutral-500">Scent Palace BD Extrait de Parfum</span>
                  </td>
                  <td className="py-2.5 px-2 font-medium text-neutral-700">{it.size}</td>
                  <td className="py-2.5 px-2 text-right text-neutral-800">{formatPrice(it.price)}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-neutral-900">{it.quantity}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-neutral-900">
                    {formatPrice(it.price * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Breakdown */}
        <div className="flex justify-end pt-2 pb-4">
          <div className="w-64 space-y-1.5 text-xs text-neutral-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-neutral-900">{formatPrice(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-[#D45520]">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                <span>−{formatPrice(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Fee ({order.deliveryLabel}):</span>
              <span className="font-semibold text-neutral-900">
                {order.shipping === 0 ? 'Complimentary (Free)' : formatPrice(order.shipping)}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t-2 border-neutral-800">
              <span>Total Amount Due:</span>
              <span className="text-[#D45520]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Sample First Notice */}
        <div className="pt-4 border-t border-neutral-300 text-[10px] text-neutral-500 space-y-1 mt-auto">
          <div className="flex items-center justify-between">
            <p><strong>Sample First Policy:</strong> Test the matching 2ml extraits included before unsealing master flacon.</p>
            <p className="font-mono text-[9px]">DOC-REF: {order.orderId}</p>
          </div>
          <p className="text-center pt-2 text-neutral-400">
            Thank you for patronizing Scent Palace BD • Computer Generated Tax Invoice • Gulshan-2, Dhaka
          </p>
        </div>
      </div>
    </>
  );
};
