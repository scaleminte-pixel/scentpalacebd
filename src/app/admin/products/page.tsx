'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  X,
  ExternalLink,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Tags,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedScent, setSelectedScent] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedStock, setSelectedStock] = useState('all');
  const [priceMax, setPriceMax] = useState(30000);

  // Selection & Drawer Inspection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [inspectProduct, setInspectProduct] = useState<any | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch products
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: viewMode === 'grid' ? '8' : '12',
        status: selectedStatus,
        category: selectedCategory,
        scent: selectedScent,
        stock: selectedStock,
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory, selectedScent, selectedStatus, selectedStock, viewMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleDuplicate = async (id: string) => {
    if (!confirm('Duplicate this fragrance into a new DRAFT creation?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        fetchProducts(pagination.page);
      }
    } catch (err) {
      alert('Failed to duplicate product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or archive "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchProducts(pagination.page);
      }
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} selected fragrance(s)?`)) return;
    try {
      await Promise.all(
        selectedProductIds.map((id) => fetch(`/api/admin/products/${id}`, { method: 'DELETE' }))
      );
      setSelectedProductIds([]);
      fetchProducts(pagination.page);
    } catch (err) {
      alert('Failed to delete selected products');
    }
  };

  const activeFiltersCount =
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedScent !== 'ALL' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedStock !== 'all' ? 1 : 0);

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((x) => x !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full mx-auto px-1 sm:px-2">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1 font-sans">
            <span>Admin</span>
            <span>/</span>
            <span className="text-neutral-800 font-semibold">Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Fragrance Masterworks
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage formulations, flacon sizes, inventory stock, and retail pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
          >
            <Tags className="w-4 h-4 text-[#D45520]" />
            <span>Manage Categories</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fragrance</span>
          </Link>
        </div>
      </div>

      {/* Main Layout: Left Filter Panel (Shoplytic ref) + Main Toolbar & Content (Shodai ref) */}
      <div className={`grid grid-cols-1 ${filterOpen ? 'lg:grid-cols-12' : 'grid-cols-1'} gap-4 xl:gap-5 items-start`}>
        {/* Left Filter Panel (Collapsible on PC & Mobile) */}
        {filterOpen && (
          <aside className="lg:col-span-3 xl:col-span-2 bg-white rounded-2xl border border-[#EAE4DC] p-4 sm:p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D45520]" />
                <span>Filter Catalog</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#D45520] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedScent('ALL');
                    setSelectedStatus('ALL');
                    setSelectedStock('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-[#D45520] hover:underline font-semibold"
                >
                  Reset
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  title="Close Filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
              Category
            </label>
            <div className="space-y-1 text-xs">
              {['ALL', 'Men', 'Women', 'Unisex', 'Gift Sets'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-[#FDF3EE] text-[#D45520] font-bold'
                      : 'text-neutral-600 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'All Collections' : cat}</span>
                  {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#D45520]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Scent Family */}
          <div className="pt-4 border-t border-[#EAE4DC]">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
              Scent Family
            </label>
            <div className="space-y-1 text-xs">
              {['ALL', 'Oud & Woody', 'Fresh & Citrus', 'Floral', 'Amber & Spicy'].map((scent) => (
                <button
                  key={scent}
                  onClick={() => setSelectedScent(scent)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    selectedScent === scent
                      ? 'bg-[#FDF3EE] text-[#D45520] font-bold'
                      : 'text-neutral-600 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>{scent === 'ALL' ? 'All Olfactive Families' : scent}</span>
                  {selectedScent === scent && <span className="w-1.5 h-1.5 rounded-full bg-[#D45520]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-[#EAE4DC]">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
              Publication Status
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`py-1.5 px-1 rounded-md border text-center transition-all font-semibold capitalize ${
                    selectedStatus === st
                      ? 'border-[#D45520] bg-[#FDF3EE] text-[#D45520]'
                      : 'border-[#EAE4DC] text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Level */}
          <div className="pt-4 border-t border-[#EAE4DC]">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">
              Inventory State
            </label>
            <div className="space-y-1 text-xs">
              {[
                { label: 'All Inventory', val: 'all' },
                { label: 'In Stock (> 8 flacons)', val: 'in_stock' },
                { label: 'Low Stock (≤ 8 flacons)', val: 'low_stock' },
                { label: 'Out of Stock (0 units)', val: 'out_of_stock' },
              ].map((stk) => (
                <button
                  key={stk.val}
                  onClick={() => setSelectedStock(stk.val)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    selectedStock === stk.val
                      ? 'bg-[#FDF3EE] text-[#D45520] font-bold'
                      : 'text-neutral-600 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>{stk.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
        )}

        {/* Right Section: Toolbar + Table or Grid (Matching Shodai ref) */}
        <div className={`${filterOpen ? 'lg:col-span-9 xl:col-span-10' : 'col-span-12'} space-y-5 min-w-0`}>
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-[#EAE4DC] p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-[260px]">
              {/* Unified Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  filterOpen || activeFiltersCount > 0
                    ? 'bg-[#FDF3EE] text-[#D45520] border-[#D45520]'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                }`}
                title={filterOpen ? 'Hide filter sidebar' : 'Open filter sidebar'}
              >
                <Filter className="w-3.5 h-3.5 text-[#D45520]" />
                <span>{filterOpen ? 'Hide Filters' : 'Filters'}</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#D45520] text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* View Mode Toggle (Table / Grid) */}
              <div className="flex items-center p-1 bg-[#FAF7F2] border border-[#EAE4DC] rounded-xl text-neutral-500">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'hover:text-neutral-900'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-2xs font-bold' : 'hover:text-neutral-900'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fragrances, SKU..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-transparent focus:border-[#D45520] focus:bg-white text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
                />
              </form>
            </div>

            {/* Quick Action Buttons (Add & Categories) ALWAYS VISIBLE */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <span className="hidden sm:inline text-xs text-neutral-500 font-mono">
                Showing <strong className="text-neutral-900">{products.length}</strong> of {pagination.total}
              </span>

              <Link
                href="/admin/categories"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-2xs transition-all"
                title="Manage Fragrance Categories"
              >
                <Tags className="w-3.5 h-3.5 text-[#D45520]" />
                <span>Categories</span>
              </Link>

              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all shrink-0 active:scale-95"
                title="Add New Fragrance Formulation"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>

          {/* Top subtle loading indicator if refreshing existing data */}
          {loading && products.length > 0 && (
            <div className="w-full bg-[#FAF7F2] rounded-full h-1 overflow-hidden">
              <div className="bg-[#D45520] h-full w-1/3 animate-pulse" />
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#EAE4DC] p-16 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#D45520] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-neutral-500">Loading catalog...</span>
              </div>
            </div>
          ) : (
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
              {viewMode === 'table' ? (
                /* =========================================================================
                    TABLE VIEW (MATCHING SHODAI REFERENCE)
                   ========================================================================= */
                <div className="bg-white rounded-2xl border border-[#EAE4DC] shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs table-auto">
                      <thead>
                        <tr className="bg-[#FAF7F2]/60 border-b border-[#EAE4DC] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          <th className="py-2.5 px-2.5 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.length === products.length && products.length > 0}
                              onChange={toggleSelectAll}
                              className="accent-[#D45520] rounded"
                            />
                          </th>
                          <th className="py-2.5 px-2">Fragrance</th>
                          <th className="py-2.5 px-2 hidden md:table-cell">Category</th>
                          <th className="py-2.5 px-2 hidden 2xl:table-cell">Purchase Cost</th>
                          <th className="py-2.5 px-2">Retail Price</th>
                          <th className="py-2.5 px-2">Available Stock</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4EFEB]">
                        {products.length > 0 ? (
                          products.map((p) => {
                            const isSelected = selectedProductIds.includes(p.id);
                            return (
                              <tr key={p.id} className={`hover:bg-[#FAF7F2]/60 transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}>
                                <td className="py-2.5 px-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectOne(p.id)}
                                    className="accent-[#D45520] rounded"
                                  />
                                </td>
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className="relative w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#EAE4DC] p-0.5 shrink-0 overflow-hidden">
                                      <Image
                                        src={p.coverImage}
                                        alt={p.name}
                                        fill
                                        className="object-contain"
                                        sizes="36px"
                                      />
                                    </div>
                                    <div className="min-w-0 max-w-[120px] sm:max-w-[160px] xl:max-w-[220px]">
                                      <button
                                        onClick={() => setInspectProduct(p)}
                                        className="font-bold text-neutral-900 hover:text-[#D45520] text-left truncate block transition-colors leading-tight text-xs"
                                      >
                                        {p.name}
                                      </button>
                                      <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                                        {p.variants[0]?.sku || p.slug} • {p.variantsCount} sizes
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-neutral-600 font-medium whitespace-nowrap hidden md:table-cell text-xs">
                                  {p.category}
                                </td>
                                <td className="py-2.5 px-2 font-mono text-neutral-500 tabular-nums hidden 2xl:table-cell whitespace-nowrap text-xs">
                                  ৳{(p.pricing?.averageCost || 0).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-2 font-bold text-neutral-900 tabular-nums font-mono whitespace-nowrap text-xs">
                                  ৳{(p.pricing?.lowest || 0).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        p.stock.isOutOfStock
                                          ? 'bg-rose-600'
                                          : p.stock.isLowStock
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-600'
                                      }`}
                                    />
                                    <span className="font-bold text-neutral-900 tabular-nums font-mono">
                                      {p.stock.available}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 hidden xl:inline">units</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      p.status === 'PUBLISHED'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : p.status === 'DRAFT'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => setInspectProduct(p)}
                                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                      title="Quick Inspection Drawer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDuplicate(p.id)}
                                      className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                      title="Duplicate Creation"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                                    </button>
                                    <Link
                                      href={`/admin/products/${p.id}/edit`}
                                      className="w-7 h-7 rounded-lg bg-[#FDF3EE] hover:bg-[#D45520] text-[#D45520] hover:text-white border border-[#D45520]/30 flex items-center justify-center transition-all shadow-2xs"
                                      title="Edit Fragrance"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(p.id, p.name)}
                                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                      title="Delete or Archive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-neutral-400">
                              No fragrances match your filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

              {/* Pagination (Matching Shodai Reference) */}
              <div className="p-4 border-t border-[#EAE4DC] flex items-center justify-between text-xs text-neutral-500">
                <div>
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchProducts(pagination.page - 1)}
                    className="p-2 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(pagination.totalPages || 1)].map((_, i) => {
                    const pNum = i + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => fetchProducts(pNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                          pagination.page === pNum
                            ? 'bg-[#141312] text-white font-bold'
                            : 'border border-[#EAE4DC] text-neutral-700 hover:bg-[#FAF7F2]'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchProducts(pagination.page + 1)}
                    className="p-2 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
                GRID VIEW (MATCHING SHOPLYTIC REFERENCE)
               ========================================================================= */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-[#EAE4DC] p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group overflow-hidden"
                  >
                    <div>
                      <div className="relative aspect-square w-full rounded-xl bg-[#FAF7F2] border border-[#EAE4DC] p-4 mb-3 overflow-hidden">
                        <Image
                          src={p.coverImage}
                          alt={p.name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="200px"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/90 border border-[#EAE4DC] text-neutral-700">
                          {p.category}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-[#D45520] uppercase tracking-wider mb-1">
                        {p.concentration}
                      </div>
                      <h4 className="font-bold text-sm text-neutral-900 group-hover:text-[#D45520] transition-colors truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.tagline}
                      </p>
                    </div>

                    {/* Row 1: Price and Stock */}
                    <div className="pt-3 mt-4 border-t border-[#F4EFEB] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">From</span>
                        <span className="font-bold text-neutral-900 text-sm font-mono tabular-nums">
                          ৳{(p.pricing?.lowest || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-right">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.stock.isOutOfStock
                              ? 'bg-rose-600'
                              : p.stock.isLowStock
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span className="text-xs font-bold text-neutral-800 font-mono tabular-nums">
                          {p.stock.available}
                        </span>
                        <span className="text-[10px] text-neutral-400">units</span>
                      </div>
                    </div>

                    {/* Row 2: Actions Row - perfectly contained inside card with fixed shrink-0 buttons */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#F4EFEB]/60 w-full">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#FDF3EE] hover:bg-[#D45520] text-[#D45520] hover:text-white border border-[#D45520]/30 text-xs font-bold transition-all shadow-2xs truncate"
                        title="Edit Fragrance"
                      >
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Edit</span>
                      </Link>
                      <button
                        onClick={() => setInspectProduct(p)}
                        className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer"
                        title="Inspect Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(p.id)}
                        className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer"
                        title="Duplicate Creation"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer"
                        title="Delete / Archive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Pagination */}
              <div className="p-4 bg-white rounded-2xl border border-[#EAE4DC] flex items-center justify-between text-xs text-neutral-500">
                <div>Page {pagination.page} of {pagination.totalPages}</div>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchProducts(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchProducts(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#EAE4DC] hover:bg-[#FAF7F2] disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>

      {/* =========================================================================
          QUICK INSPECTION SIDE DRAWER
         ========================================================================= */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setInspectProduct(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#EAE4DC] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D45520]" />
                <h3 className="text-base font-bold text-neutral-900">
                  Flacon Specification Drawer
                </h3>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6 flex-1">
              {/* Product Hero Snapshot */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE4DC]">
                <div className="relative w-20 h-20 rounded-xl bg-white border border-[#EAE4DC] p-2 shrink-0">
                  <Image
                    src={inspectProduct.coverImage}
                    alt={inspectProduct.name}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D45520]">
                    {inspectProduct.concentration}
                  </span>
                  <h4 className="text-lg font-bold text-neutral-900">{inspectProduct.name}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{inspectProduct.tagline}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800">
                      {inspectProduct.status}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">/{inspectProduct.slug}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Olfactory Narrative
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans bg-white p-3 rounded-xl border border-[#EAE4DC]">
                  {inspectProduct.description}
                </p>
              </div>

              {/* Flacon Variants & Stock Ledger */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Flacon Variants & Stock Ledger
                </h5>
                <div className="space-y-2">
                  {inspectProduct.variants.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl border border-[#EAE4DC] bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900">{v.size} Flacon</div>
                        <div className="text-[10px] text-neutral-400 font-mono">SKU: {v.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-neutral-900 font-mono">৳{(v.sellingPrice || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {v.availableStock} available ({v.stock} physical)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Storefront Link */}
              <div className="pt-4 border-t border-[#EAE4DC]">
                <Link
                  href={`/product/${inspectProduct.slug}`}
                  target="_blank"
                  className="w-full py-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-xs font-bold text-neutral-800 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Open on Storefront</span>
                  <ExternalLink className="w-4 h-4 text-neutral-400" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE4DC] flex gap-3">
              <Link
                href={`/admin/products/${inspectProduct.id}/edit`}
                className="flex-1 py-3 text-center rounded-xl bg-[#141312] hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Edit Complete Fragrance
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Floating Bulk Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#141312] text-white px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D45520] animate-pulse" />
            <span className="text-xs font-bold font-mono">
              {selectedProductIds.length} item{selectedProductIds.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
          <button
            onClick={() => setSelectedProductIds([])}
            className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      )}
    </div>
  );
}

