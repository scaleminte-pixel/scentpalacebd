'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Clock,
  Sparkles,
  Calendar,
  Percent,
  CheckCircle,
  X,
  Flame,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

export default function AdminOffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Coupon Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 15,
    minSpend: 5000,
    maxDiscount: 2000,
    usageLimit: 100,
    expiresAt: '',
    description: '',
  });

  // Edit Coupon Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    code: '',
    type: 'PERCENTAGE',
    value: 15,
    minSpend: 5000,
    maxDiscount: 2000,
    usageLimit: 100,
    expiresAt: '',
    description: '',
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/offers');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase(),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setForm({
          code: '',
          type: 'PERCENTAGE',
          value: 15,
          minSpend: 5000,
          maxDiscount: 2000,
          usageLimit: 100,
          expiresAt: '',
          description: '',
        });
        fetchOffers();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (coupon: any) => {
    setEditForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSpend: coupon.minSpend || 0,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      description: coupon.description || '',
      isActive: Boolean(coupon.isActive),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.code.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          code: editForm.code.trim().toUpperCase(),
          expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditModalOpen(false);
        fetchOffers();
      } else {
        alert(data.error || 'Failed to update coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchOffers();
      } else {
        alert(data.error || 'Failed to delete coupon');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Promotions, Coupons & Flash Deals
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            VVIP privilege discount codes, min spend restrictions, and Daily Sillage promotions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D45520] text-white rounded-xl text-xs font-semibold hover:bg-[#bd4616] transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create New Coupon
          </button>
        </div>
      </div>

      {/* Daily Flash Sillage Deals */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Active Daily Sillage Deals
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-8 text-center text-stone-400 text-xs">
              Loading active campaigns...
            </div>
          ) : deals.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
              No daily deals configured.
            </div>
          ) : (
            deals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      -{deal.discountPercent}% OFF
                    </span>
                    <span className="text-xs text-stone-500 font-medium">{deal.title}</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base mt-1">{deal.productName}</h3>
                  <div className="flex items-baseline gap-2 mt-2 font-mono">
                    <span className="text-sm font-bold text-stone-900">
                      ৳{deal.dealPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-400 line-through">
                      ৳{deal.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Allocation: {deal.stockRemaining} of {deal.stockTotal} bottles left
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      deal.isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {deal.isEnabled ? 'Active on Home' : 'Paused'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-stone-500" /> Promotional Privilege Coupons
        </h2>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Type & Value</th>
                  <th className="py-3 px-4">Min. Spend</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
                      Loading coupons...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      No coupon codes registered.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-stone-900 tracking-wider text-sm">{c.code}</div>
                        <div className="text-[11px] text-stone-400">{c.description || 'Privilege discount'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        {c.type === 'PERCENTAGE' ? `${c.value}% Discount` : `৳${c.value} Fixed Off`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-700">
                        {c.minSpend ? `৳${c.minSpend.toLocaleString()}` : 'No minimum'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {c.usageCount} / {c.usageLimit || '∞'} redeemed
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never expires'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            disabled={isDeletingId === c.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-40"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Create Privilege Coupon</h3>
                <p className="text-xs text-stone-500">Generate a new promotional code for checkout.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ROYAL15, VIPEID"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Cash (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Min Spend (৳)</label>
                  <input
                    type="number"
                    value={form.minSpend}
                    onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Max Discount (৳)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                    placeholder="Optional"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    placeholder="e.g. 100"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Expires On</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Internal Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Summer special VIP invitation code"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D45520] text-white rounded-xl font-semibold hover:bg-[#bd4616] transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Edit Coupon: {editForm.code}</h3>
                <p className="text-xs text-stone-500">Update parameters, limits, or status.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Cash (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Min Spend (৳)</label>
                  <input
                    type="number"
                    value={editForm.minSpend}
                    onChange={(e) => setEditForm({ ...editForm, minSpend: Number(e.target.value) })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Max Discount (৳)</label>
                  <input
                    type="number"
                    value={editForm.maxDiscount}
                    onChange={(e) => setEditForm({ ...editForm, maxDiscount: Number(e.target.value) })}
                    placeholder="Optional"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={editForm.usageLimit}
                    onChange={(e) => setEditForm({ ...editForm, usageLimit: Number(e.target.value) })}
                    placeholder="e.g. 100"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Expires On</label>
                  <input
                    type="date"
                    value={editForm.expiresAt}
                    onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Coupon Status</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                  >
                    <option value="true">Active & Usable</option>
                    <option value="false">Paused / Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Internal Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
