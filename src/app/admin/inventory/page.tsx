'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  History,
  TrendingDown,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

  // Adjustment Modal State
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustType, setAdjustType] = useState('RESTOCK');
  const [quantityDelta, setQuantityDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Drawer State
  const [historyVariant, setHistoryVariant] = useState<any>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter: activeFilter });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || !adjustReason.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantityDelta,
          type: adjustType,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedVariant(null);
        setAdjustReason('');
        setQuantityDelta(10);
        fetchInventory();
      } else {
        alert(data.error || 'Failed to adjust stock');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time physical, reserved, and available stock across all artisanal perfume flacons.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">Physical Units</span>
            <div className="text-2xl text-stone-900 mt-1 font-bold">{summary.totalPhysicalStock}</div>
            <span className="text-[11px] text-stone-400 mt-0.5 block">Stored in Atelier Vault</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-amber-700 font-medium block">Reserved Orders</span>
            <div className="text-2xl text-amber-700 mt-1 font-bold">{summary.totalReservedStock}</div>
            <span className="text-[11px] text-stone-400 mt-0.5 block">Pending Courier Dispatch</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-medium block">Available to Sell</span>
            <div className="text-2xl text-emerald-700 mt-1 font-bold">{summary.totalAvailableStock}</div>
            <span className="text-[11px] text-stone-400 mt-0.5 block">Active for Online Purchase</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block">Warehouse Valuation</span>
            <div className="text-2xl text-[#D45520] mt-1 font-bold">
              ৳{(summary.totalValuationCost || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Retail: ৳{(summary.totalValuationRetail || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                activeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Variants
            </button>
            <button
              onClick={() => setActiveFilter('low_stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                activeFilter === 'low_stock' ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600 hover:text-amber-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Low Stock Warnings ({summary?.lowStockCount || 0})
            </button>
            <button
              onClick={() => setActiveFilter('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                activeFilter === 'out_of_stock' ? 'bg-white text-rose-700 shadow-xs' : 'text-stone-600 hover:text-rose-700'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              Depleted ({summary?.outOfStockCount || 0})
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by SKU, fragrance name, size..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#D45520]"
            />
          </form>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Fragrance & Flacon</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Physical</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Cost / Retail</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
                    Loading stock records...
                  </td>
                </tr>
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No perfume variants match the selected filter.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.coverImage}
                          alt={v.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-stone-900">{v.productName}</div>
                          <div className="text-[11px] text-stone-500">
                            Size: <span className="font-medium text-stone-700">{v.size}</span> • {v.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600 font-medium">{v.sku}</td>
                    <td className="py-3 px-4 font-semibold text-stone-900">{v.stock.physical}</td>
                    <td className="py-3 px-4 text-amber-700 font-medium">
                      {v.stock.reserved > 0 ? `${v.stock.reserved} locked` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          v.stock.available <= 0
                            ? 'text-rose-600'
                            : v.stock.isLowStock
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {v.stock.available}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-stone-900 font-medium">৳{v.sellingPrice?.toLocaleString()}</div>
                      <div className="text-[10px] text-stone-400">Cost: ৳{v.purchaseCost?.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      {v.stock.isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Depleted
                        </span>
                      ) : v.stock.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low ({v.stock.available} left)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setHistoryVariant(v)}
                          title="View Stock Movements"
                          className="p-1.5 border border-stone-200 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVariant(v);
                            setAdjustType('RESTOCK');
                            setQuantityDelta(10);
                            setAdjustReason('Atelier batch production intake');
                          }}
                          className="px-2.5 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 text-[11px] font-medium transition"
                        >
                          Adjust Stock
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

      {/* Adjust Stock Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Stock Adjustment</h3>
                <p className="text-xs text-stone-500">
                  {selectedVariant.productName} ({selectedVariant.size}) • {selectedVariant.sku}
                </p>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl flex items-center justify-between text-stone-700">
                <span>Current Physical Stock:</span>
                <span className="font-bold text-stone-900 font-mono text-sm">{selectedVariant.stock.physical} units</span>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                >
                  <option value="RESTOCK">RESTOCK (+ Atelier Intake / Restock)</option>
                  <option value="CORRECTION">CORRECTION (Physical Stock Count Audit)</option>
                  <option value="DAMAGE">DAMAGE (- Flacon Damaged / Leaked)</option>
                  <option value="THEFT">DISCREPANCY (- Missing / Unaccounted)</option>
                  <option value="PROMOTION">PROMOTION (- Press / VIP Testing Gift)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Quantity Change (Delta)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quantityDelta}
                    onChange={(e) => setQuantityDelta(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                  />
                  <div className="text-stone-500 text-[11px] whitespace-nowrap">
                    New Stock: <strong>{Math.max(0, selectedVariant.stock.physical + quantityDelta)}</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Audit Log Reason (Required)</label>
                <input
                  type="text"
                  placeholder="e.g., Received 50 flacons from Grasse laboratory..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || quantityDelta === 0}
                  className="px-4 py-2 bg-[#D45520] text-white rounded-lg hover:bg-[#B34316] font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Ledger...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Drawer */}
      {historyVariant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Stock Ledger History</h3>
                <p className="text-xs text-stone-500">
                  {historyVariant.productName} ({historyVariant.size}) • {historyVariant.sku}
                </p>
              </div>
              <button
                onClick={() => setHistoryVariant(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {historyVariant.movements?.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No previous stock movements recorded.</p>
              ) : (
                historyVariant.movements?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-800">{m.type}</span>
                      <span className={`font-mono ${m.quantityDelta > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} units
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">{m.reason}</p>
                    <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1 border-t border-stone-200/50">
                      <span>Stock after: {m.afterStock}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

