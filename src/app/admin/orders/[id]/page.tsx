'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Truck,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  Package,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Save,
  Check,
} from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status editing state
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        setFulfillmentStatus(data.order.fulfillmentStatus);
        setPaymentStatus(data.order.paymentStatus);
        setInternalNotes(data.order.internalNotes || '');
      } else {
        setError(data.error || 'Failed to find order');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus,
          paymentStatus,
          internalNotes,
          cancelReason: fulfillmentStatus === 'CANCELLED' ? cancelReason : undefined,
          returnReason: fulfillmentStatus === 'RETURNED' ? returnReason : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Order fulfillment & payment status updated');
        fetchOrder();
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatchCourier = async (courier = 'STEADFAST') => {
    if (!confirm(`Dispatch this order and automatically book consignment with ${courier} Courier? This will generate live tracking and commit inventory decrement.`)) {
      return;
    }
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierProvider: courier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Consignment booked with ${courier}! Tracking: ${data.trackingCode || data.order?.courierTrackingNumber}`);
        fetchOrder();
      } else {
        showToast(data.error || 'Courier booking failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-[#D45520] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl text-stone-900">Order Not Found</h2>
        <p className="text-sm text-stone-500">{error || 'Could not retrieve order details.'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddress || {};
  const isPaid = order.paymentStatus === 'PAID';
  const isDispatched = order.fulfillmentStatus === 'SHIPPED' || order.fulfillmentStatus === 'DELIVERED';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner & Navigation */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{order.orderNumber}</h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  order.fulfillmentStatus === 'DELIVERED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.fulfillmentStatus === 'SHIPPED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : order.fulfillmentStatus === 'CONFIRMED'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : order.fulfillmentStatus === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {order.fulfillmentStatus}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Placed on {new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (Dhaka Time)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            Print Packing Slip
          </button>
          {!isDispatched && order.fulfillmentStatus !== 'CANCELLED' && (
            <div className="flex items-center gap-2">
              <select
                id="courier-select"
                defaultValue="STEADFAST"
                className="px-2.5 py-2 border border-stone-200 rounded-lg text-xs bg-stone-50 font-semibold text-stone-800 focus:outline-none"
              >
                <option value="STEADFAST">Steadfast Courier</option>
                <option value="PATHAO">Pathao Express</option>
                <option value="REDX">RedX Logistics</option>
              </select>
              <button
                onClick={() => {
                  const select = document.getElementById('courier-select') as HTMLSelectElement;
                  handleDispatchCourier(select?.value || 'STEADFAST');
                }}
                disabled={isDispatching}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D45520] text-white rounded-lg text-sm font-medium hover:bg-[#B34316] transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                {isDispatching ? 'Booking Consignment...' : 'Submit to Courier'}
              </button>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`no-print p-4 rounded-xl text-sm flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Royal Invoice View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Printable Invoice Container */}
          <div id="printable-invoice" className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-stone-200 pb-6">
              <div>
                <span className="text-xl tracking-wider text-stone-900 block font-bold">RĀWDAH</span>
                <span className="text-[10px] tracking-widest text-stone-400 uppercase">Haute Parfumerie Atelier</span>
                <p className="text-xs text-stone-500 mt-2">
                  Road 11, Block D, Gulshan-2, Dhaka 1212<br />
                  concierge@rawdahperfumes.com | +880 1711-000000
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold uppercase text-stone-400 block">OFFICIAL DISPATCH INVOICE</span>
                <span className="text-lg font-mono font-bold text-stone-900">{order.orderNumber}</span>
                <p className="text-xs text-stone-500 mt-1">
                  Issued: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Consignment / Courier Card */}
            {order.courierTrackingNumber && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D45520]/10 flex items-center justify-center text-[#D45520]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 uppercase tracking-wider block">Courier Consignment</span>
                    <span className="text-sm font-semibold text-stone-900">{order.courierProvider || 'STEADFAST'}</span>
                    <span className="text-xs font-mono text-stone-600 ml-2">({order.courierTrackingNumber})</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-white border border-stone-200 rounded-full font-medium text-stone-700">
                  {order.fulfillmentStatus === 'DELIVERED' ? 'Delivered' : 'In Transit'}
                </span>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Flacons & Compositions</h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {order.items?.map((item: any) => {
                  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                  const qty = Number(item.quantity ?? 1);
                  const totalPrice = Number(item.totalPrice ?? (unitPrice * qty));
                  let itemImg = '/images/products/lattafa-blue-oud.webp';
                  if (item.productImage && typeof item.productImage === 'string' && item.productImage.startsWith('/')) {
                    itemImg = item.productImage;
                  } else if (Array.isArray(item.product?.images) && item.product.images.length > 0) {
                    const first = item.product.images[0];
                    if (typeof first === 'string' && first.startsWith('/')) itemImg = first;
                  } else if (typeof item.product?.images === 'string') {
                    try {
                      const parsed = JSON.parse(item.product.images);
                      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string' && parsed[0].startsWith('/')) {
                        itemImg = parsed[0];
                      }
                    } catch {
                      if (item.product.images.startsWith('/')) itemImg = item.product.images;
                    }
                  } else if (item.product?.primaryImage && typeof item.product.primaryImage === 'string' && item.product.primaryImage.startsWith('/')) {
                    itemImg = item.product.primaryImage;
                  }

                  const itemSize = item.size || item.variantSize || item.variant?.size || 'Standard';
                  const itemSku = item.variantSku || item.sku || item.variant?.sku || 'RDH';

                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={itemImg}
                          alt={item.productName || 'Perfume Flacon'}
                          className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/products/lattafa-blue-oud.webp';
                          }}
                        />
                        <div>
                          <h4 className="text-sm font-medium text-stone-900">{item.productName}</h4>
                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            <span>Size: {itemSize}</span>
                            <span>•</span>
                            <span className="font-mono">{itemSku}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-stone-900">
                          ৳{unitPrice.toLocaleString()} × {qty}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 font-medium">
                          ৳{totalPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-stone-200 pt-4 space-y-2 text-sm max-w-xs ml-auto">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>৳{(Number(order.subtotal) || 0).toLocaleString()}</span>
              </div>
              {(Number(order.discount) || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>-৳{(Number(order.discount) || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Courier Express Delivery</span>
                <span>৳{(Number(order.shippingFee ?? order.deliveryFee ?? 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
                <span>Total Amount</span>
                <span>৳{(Number(order.total) || 0).toLocaleString()}</span>
              </div>
              <div className="text-xs text-stone-500 pt-1 text-right">
                Payment: <strong className="text-stone-800">{order.paymentMethod}</strong> ({order.paymentStatus})
              </div>
            </div>

            {/* Atelier Guarantee Footer */}
            <div className="border-t border-stone-100 pt-6 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Complimentary 2ml testing vial included with every flacon.</span>
              <span className="flex items-center gap-1 text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D45520]" />
                100% Authentic Extrait de Parfum
              </span>
            </div>
          </div>

          {/* Audit: Stock Movements & Ledger Impacts */}
          <div className="no-print bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-700">Inventory Movement & Audit</h3>
            {order.stockMovements && order.stockMovements.length > 0 ? (
              <div className="space-y-2">
                {order.stockMovements.map((sm: any) => (
                  <div key={sm.id} className="p-3 bg-stone-50 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-stone-800">{sm.type}</span>
                      <span className="text-stone-500 ml-2">{sm.reason}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-medium ${sm.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity} units
                      </span>
                      <span className="text-stone-400">
                        {new Date(sm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">No direct stock movement records logged yet.</p>
            )}
          </div>
        </div>

        {/* Right Col: Customer & Operational Controls */}
        <div className="no-print space-y-6">
          {/* Status Mutation Panel */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">Fulfillment Lifecycle</h3>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Fulfillment Status</label>
              <select
                value={fulfillmentStatus}
                onChange={(e) => setFulfillmentStatus(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              >
                <option value="PENDING">PENDING (Awaiting Review)</option>
                <option value="CONFIRMED">CONFIRMED (Call Verified)</option>
                <option value="PACKED">PACKED (Sealed in Atelier)</option>
                <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                <option value="DELIVERED">DELIVERED (Client Received)</option>
                <option value="CANCELLED">CANCELLED (Release Stock)</option>
                <option value="RETURNED">RETURNED (Courier Return)</option>
              </select>
            </div>

            {fulfillmentStatus === 'CANCELLED' && (
              <div>
                <label className="block text-xs font-medium text-rose-600 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  placeholder="e.g., Client requested cancellation before dispatch"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs border border-rose-200 bg-rose-50/50 rounded-lg p-2"
                />
              </div>
            )}

            {fulfillmentStatus === 'RETURNED' && (
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">Return Inspection Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Client unavailable, parcel unopened"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs border border-amber-200 bg-amber-50/50 rounded-lg p-2"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-lg p-2.5 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              >
                <option value="UNPAID">UNPAID (Pending Cash On Delivery)</option>
                <option value="PAID">PAID (Online Gateway or Cash Settled)</option>
                <option value="REFUNDED">REFUNDED (Returned to Source)</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Internal Atelier Notes</label>
              <textarea
                rows={3}
                placeholder="Private team notes (e.g., VIP client, requested evening delivery)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full text-xs border border-stone-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving...' : 'Save Order Changes'}
            </button>
          </div>

          {/* Customer Dossier Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-900">Client Dossier</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 mt-0.5">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-stone-900 block">{order.customerName}</span>
                  <span className="text-xs text-stone-500">
                    {order.customer?.totalOrders ? `${order.customer.totalOrders} total orders with Rāwdah` : 'First-time client'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-stone-600">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <a href={`tel:${order.customerPhone}`} className="hover:text-[#D45520] transition">
                  {order.customerPhone}
                </a>
              </div>

              {order.customerEmail && (
                <div className="flex items-center gap-2.5 text-stone-600 truncate">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <a href={`mailto:${order.customerEmail}`} className="hover:text-[#D45520] transition truncate">
                    {order.customerEmail}
                  </a>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-stone-600 pt-1">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-medium text-stone-800">{shipping.address || order.shippingAddress}</p>
                  <p>{shipping.city || 'Dhaka'}{shipping.postalCode ? ` - ${shipping.postalCode}` : ''}</p>
                  <p className="text-stone-400">{shipping.division || 'Dhaka Division'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

