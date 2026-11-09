'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowRight,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  PhoneCall,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'all';

  const [orders, setOrders] = useState<any[]>([]);
  const [tabCounts, setTabCounts] = useState<{ all: number; incomplete: number; trashed: number }>({
    all: 0,
    incomplete: 0,
    trashed: 0,
  });
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [method, setMethod] = useState('ALL');

  // Manual Order Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    streetAddress: '',
    city: 'Dhaka',
    division: 'Dhaka',
    postalCode: '',
    deliveryMethod: 'inside_dhaka',
    paymentMethod: 'COD',
    shippingFee: 60,
    items: [{ variantId: '', quantity: 1, customPrice: '' }],
    internalNotes: '',
  });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        tab,
        status,
        paymentStatus,
        method,
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
        if (data.tabCounts) setTabCounts(data.tabCounts);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [tab, status, paymentStatus, method]);

  // Order Actions
  const handleMoveToTrash = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Move Order #${orderNumber} to Trash?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOrders(pagination.page);
      } else {
        alert(data.error || 'Failed to move order to trash');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrashed: false }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOrders(pagination.page);
      } else {
        alert(data.error || 'Failed to restore order');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handlePermanentDelete = async (orderId: string, orderNumber: string) => {
    if (!confirm(`DANGER: Permanently delete Order #${orderNumber}? This action CANNOT be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}?permanent=true`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOrders(pagination.page);
      } else {
        alert(data.error || 'Failed to purge order');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleResolveIncomplete = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isIncomplete: false, incompleteReason: null, fulfillmentStatus: 'PENDING' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOrders(pagination.page);
      } else {
        alert(data.error || 'Failed to resolve incomplete order');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  // Load products & variants when manual order modal opens
  const openManualOrderModal = async () => {
    try {
      const res = await fetch('/api/admin/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        const vList: any[] = [];
        data.products?.forEach((p: any) => {
          p.variants?.forEach((v: any) => {
            vList.push({
              variantId: v.id,
              name: `${p.name} (${v.size})`,
              sku: v.sku,
              price: v.sellingPrice,
              stock: v.availableStock,
            });
          });
        });
        setAllVariants(vList);
        if (vList.length > 0) {
          setManualForm((prev) => ({
            ...prev,
            items: [{ variantId: vList[0].variantId, quantity: 1, customPrice: String(vList[0].price) }],
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load variants for modal:', err);
    }
    setIsManualModalOpen(true);
  };

  const handleManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setIsManualModalOpen(false);
        fetchOrders(1);
      } else {
        alert(data.error || 'Failed to create manual order');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1 font-sans">
            <span>Admin</span>
            <span>/</span>
            <span className="text-neutral-800 font-semibold">Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage parcel lifecycles, bKash & COD verifications, and courier dispatches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openManualOrderModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Create Concierge Order</span>
          </button>
        </div>
      </div>

      {/* Main Category Tabs: All Orders | Incomplete Orders | Trashed Orders */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <Link
          href="/admin/orders"
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            tab === 'all'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>All Orders</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              tab === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
            }`}
          >
            {tabCounts.all}
          </span>
        </Link>

        <Link
          href="/admin/orders?tab=incomplete"
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            tab === 'incomplete'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Incomplete Orders</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              tab === 'incomplete' ? 'bg-white/25 text-white' : 'bg-amber-50 text-amber-700 font-bold'
            }`}
          >
            {tabCounts.incomplete}
          </span>
        </Link>

        <Link
          href="/admin/orders?tab=trashed"
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            tab === 'trashed'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Trashed Orders</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              tab === 'trashed' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-700 font-bold'
            }`}
          >
            {tabCounts.trashed}
          </span>
        </Link>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE4DC] p-4 shadow-xs space-y-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { label: 'All Statuses', key: 'ALL' },
            { label: 'Pending Action', key: 'PENDING' },
            { label: 'Confirmed', key: 'CONFIRMED' },
            { label: 'Processing & Packed', key: 'PACKED' },
            { label: 'In Transit (Shipped)', key: 'SHIPPED' },
            { label: 'Delivered', key: 'DELIVERED' },
            { label: 'Cancelled / Returned', key: 'CANCELLED' },
          ].map((statusTab) => (
            <button
              key={statusTab.key}
              onClick={() => setStatus(statusTab.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                status === statusTab.key
                  ? 'bg-[#141312] text-white shadow-2xs font-bold'
                  : 'text-neutral-600 hover:bg-[#FAF7F2] hover:text-neutral-900'
              }`}
            >
              {statusTab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filters: Search, Payment Status, Payment Method */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F4EFEB]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders(1);
            }}
            className="relative flex-1 max-w-sm"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by RDH-#, customer, phone, tracking..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-transparent focus:border-[#D45520] focus:bg-white text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
            />
          </form>

          <div className="flex items-center gap-3 text-xs">
            {/* Payment Status */}
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-[#FAF7F2] border border-[#EAE4DC] rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Payment: All</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Payment Method */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="bg-[#FAF7F2] border border-[#EAE4DC] rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Method: All</option>
              <option value="BKASH">bKash</option>
              <option value="COD">Cash on Delivery</option>
              <option value="CARD">Bank Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EAE4DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF7F2]/60 border-b border-[#EAE4DC] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Courier Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#D45520] border-t-transparent rounded-full animate-spin" />
                      <span>Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-[#D45520] hover:underline">
                        #{o.orderNumber}
                      </Link>
                      <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(o.createdAt))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900">{o.customer.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{o.customer.phone}</div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-xs">
                        {o.customer.shippingAddress?.address || o.customer.shippingAddress?.city || 'Dhaka'}
                      </div>
                      {o.isIncomplete && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          <span>{o.incompleteReason || 'Incomplete order'}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700 max-w-xs truncate" title={o.itemsSummary}>
                      <span className="font-medium">{o.itemsSummary}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-neutral-900 font-mono tabular-nums">
                      ৳{o.total.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          o.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {o.paymentMethod} • {o.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          o.fulfillmentStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : o.fulfillmentStatus === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800'
                            : o.fulfillmentStatus === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-800'
                            : o.fulfillmentStatus === 'CONFIRMED'
                            ? 'bg-purple-50 text-purple-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {o.fulfillmentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      {o.courierTrackingNumber ? (
                        <div className="flex items-center gap-1.5 text-neutral-800">
                          <Truck className="w-3.5 h-3.5 text-[#D45520]" />
                          <span>{o.courierTrackingNumber}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 font-sans italic">Not Dispatched</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {tab === 'trashed' ? (
                          <>
                            <button
                              onClick={() => handleRestoreOrder(o.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(o.id, o.orderNumber)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : tab === 'incomplete' ? (
                          <>
                            <button
                              onClick={() => handleResolveIncomplete(o.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Resolve
                            </button>
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] font-semibold text-neutral-800 text-[11px] transition-colors"
                            >
                              <span>Edit</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400" />
                            </Link>
                            <button
                              onClick={() => handleMoveToTrash(o.id, o.orderNumber)}
                              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Move to trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] font-semibold text-neutral-800 text-[11px] transition-colors"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400" />
                            </Link>
                            <button
                              onClick={() => handleMoveToTrash(o.id, o.orderNumber)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No orders found in {tab} view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#EAE4DC] flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing <strong>{orders.length}</strong> of <strong>{pagination.total}</strong> orders
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchOrders(pagination.page - 1)}
              className="p-2 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-neutral-800">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchOrders(pagination.page + 1)}
              className="p-2 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Concierge Order Creation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D45520]/10 text-[#D45520] flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Create Concierge Order</h3>
                  <p className="text-xs text-stone-500">Phone or WhatsApp customer booking</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualOrderSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerName}
                    onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                    placeholder="e.g. Mahabur Rahman"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Customer Phone (11 Digits) *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.customerPhone}
                    onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Detailed Street Address *</label>
                <textarea
                  rows={2}
                  required
                  value={manualForm.streetAddress}
                  onChange={(e) => setManualForm({ ...manualForm, streetAddress: e.target.value })}
                  placeholder="House #, Road #, Sector/Area, City (min 10 chars)"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={manualForm.city}
                    onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="BKASH">bKash</option>
                    <option value="CARD">Bank Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Shipping Fee (৳)</label>
                  <input
                    type="number"
                    value={manualForm.shippingFee}
                    onChange={(e) => setManualForm({ ...manualForm, shippingFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-stone-200 pt-4 space-y-3">
                <span className="font-bold text-stone-800 block text-xs">Selected Fragrance & Flacon</span>
                {manualForm.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <select
                      value={item.variantId}
                      onChange={(e) => {
                        const vId = e.target.value;
                        const v = allVariants.find((x) => x.variantId === vId);
                        const updated = [...manualForm.items];
                        updated[idx] = { ...updated[idx], variantId: vId, customPrice: v ? String(v.price) : '' };
                        setManualForm({ ...manualForm, items: updated });
                      }}
                      className="flex-1 p-2 bg-white border border-stone-200 rounded-xl text-xs"
                    >
                      {allVariants.map((v) => (
                        <option key={v.variantId} value={v.variantId}>
                          {v.name} — ৳{v.price} ({v.stock} in stock)
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...manualForm.items];
                        updated[idx].quantity = Number(e.target.value);
                        setManualForm({ ...manualForm, items: updated });
                      }}
                      className="w-16 p-2 bg-white border border-stone-200 rounded-xl text-center font-mono text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Create & Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
