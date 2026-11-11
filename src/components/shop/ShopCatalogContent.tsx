'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { SCENT_FAMILIES } from '@/data/scents';
import { ProductCard } from '@/components/common/ProductCard';
import { useCurrency } from '@/context/CurrencyContext';
import {
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { ProductCategory, ScentFamily, Product } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { LUXURY_EASE } from '@/utils/motion';

interface ShopCatalogContentProps {
  initialProducts?: Product[];
  initialCategories?: any[];
}

export const ShopCatalogContent: React.FC<ShopCatalogContentProps> = ({
  initialProducts,
  initialCategories,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // URL parameters
  const initialCategory = searchParams.get('category') as ProductCategory | null;
  const initialScent = searchParams.get('scent') as ScentFamily | null;
  const initialFilter = searchParams.get('filter'); // e.g. 'best-seller'
  const initialSort = searchParams.get('sort') || 'featured';
  const initialSearch = searchParams.get('q') || '';

  // Local Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedScent, setSelectedScent] = useState<string>(initialScent || 'all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(8000); // Max price in BDT
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : PRODUCTS
  );
  const [categories, setCategories] = useState<any[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setCatalogProducts(initialProducts);
    } else {
      fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            setCatalogProducts(data.products);
          }
        })
        .catch(() => {});
    }

    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      fetch(`/api/categories?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        })
        .catch(() => {});
    }
  }, [initialProducts, initialCategories]);

  // Sync state if URL changes
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialScent) setSelectedScent(initialScent);
    if (initialSearch) setSearchQuery(initialSearch);
    if (initialSort) setSortBy(initialSort);
    if (initialFilter === 'best-seller') setSortBy('best-seller');
    if (initialFilter === 'collections') setSelectedCategory('all');
  }, [initialCategory, initialScent, initialSearch, initialSort, initialFilter]);

  // Update URL query parameters when key filters change
  const updateUrlParams = (cat: string, scent: string, sort: string, q: string) => {
    const params = new URLSearchParams();
    if (cat !== 'all') params.set('category', cat);
    if (scent !== 'all') params.set('scent', scent);
    if (sort !== 'featured') params.set('sort', sort);
    if (q.trim()) params.set('q', q.trim());

    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateUrlParams(cat, selectedScent, sortBy, searchQuery);
  };

  const handleScentChange = (scent: string) => {
    setSelectedScent(scent);
    updateUrlParams(selectedCategory, scent, sortBy, searchQuery);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrlParams(selectedCategory, selectedScent, sort, searchQuery);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    updateUrlParams(selectedCategory, selectedScent, sortBy, q);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedScent('all');
    setSelectedSize('all');
    setPriceRange(8000);
    setSortBy('featured');
    setSearchQuery('');
    router.replace('/shop', { scroll: false });
  };

  const getCategoryCount = (catName: string, fallbackCount: number = 0) => {
    const matchCount = catalogProducts.filter(
      (p) => (p.category || '').toLowerCase().trim() === catName.toLowerCase().trim()
    ).length;
    return matchCount > 0 ? matchCount : (fallbackCount || 0);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((product) => {
      // Category filter (case-insensitive & whitespace trimmed)
      if (selectedCategory !== 'all') {
        const prodCat = (product.category || '').toLowerCase().trim();
        const selCat = selectedCategory.toLowerCase().trim();
        if (prodCat !== selCat) {
          return false;
        }
      }

      // Scent family filter
      if (selectedScent !== 'all' && product.scentFamily !== selectedScent) {
        return false;
      }

      // Size filter
      if (selectedSize !== 'all') {
        const hasSize = product.variants.some((v) =>
          v.size.toLowerCase().includes(selectedSize.toLowerCase())
        );
        if (!hasSize) return false;
      }

      // Price filter
      const minProductPrice = Math.min(...product.variants.map((v) => v.price));
      if (minProductPrice > priceRange) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          product.name.toLowerCase().includes(q) ||
          product.tagline.toLowerCase().includes(q) ||
          product.scentFamily.toLowerCase().includes(q) ||
          product.notes.top.some((n) => n.toLowerCase().includes(q)) ||
          product.notes.heart.some((n) => n.toLowerCase().includes(q)) ||
          product.notes.base.some((n) => n.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = Math.min(...a.variants.map((v) => v.price));
      const priceB = Math.min(...b.variants.map((v) => v.price));

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'best-seller') return (b.rating * b.reviewsCount) - (a.rating * a.reviewsCount);
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // featured default
    });
  }, [selectedCategory, selectedScent, selectedSize, priceRange, searchQuery, sortBy, catalogProducts]);

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedScent !== 'all' ? 1 : 0) +
    (selectedSize !== 'all' ? 1 : 0) +
    (priceRange < 30000 ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto">
        {/* Catalog Banner / Header: Sequential Reveal */}
        <div className="pb-10 mb-8 border-b border-[#EAE4DC]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: LUXURY_EASE }}
                className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520] block"
              >
                Scent Palace BD Catalog
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15, ease: LUXURY_EASE }}
                className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-neutral-900 tracking-tight font-normal mt-1"
              >
                The Masterwork Fragrance Collection
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: LUXURY_EASE }}
                className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans max-w-2xl"
              >
                Explore our full spectrum of rare extraits de parfum, aged Cambodian ouds, and limited edition presentation sets.
              </motion.p>
            </div>

            {/* Quick Search in catalog introduced alongside this group */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: LUXURY_EASE }}
              className="relative w-full md:w-72"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search catalog by notes..."
                className="w-full bg-white border border-[#D4CFCE] rounded-lg py-2.5 pl-9 pr-8 text-xs text-neutral-900 focus:outline-none focus:border-[#D45520] transition-colors"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Active filter pills */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-[#F4EFEB]">
              <span className="text-xs text-neutral-500 font-medium mr-1">Active Filters:</span>

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs text-neutral-800 shadow-2xs">
                  Category: <strong>{selectedCategory}</strong>
                  <button onClick={() => handleCategoryChange('all')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedScent !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs text-neutral-800 shadow-2xs">
                  Scent: <strong>{selectedScent}</strong>
                  <button onClick={() => handleScentChange('all')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSize !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs text-neutral-800 shadow-2xs">
                  Size: <strong>{selectedSize}</strong>
                  <button onClick={() => setSelectedSize('all')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange < 30000 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs text-neutral-800 shadow-2xs">
                  Under: <strong>{formatPrice(priceRange)}</strong>
                  <button onClick={() => setPriceRange(30000)} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs text-neutral-800 shadow-2xs">
                  Query: <strong>&quot;{searchQuery}&quot;</strong>
                  <button onClick={() => handleSearchChange('')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs text-[#D45520] hover:underline font-semibold ml-2 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Toolbar: Fade in result count and sorting control together */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: LUXURY_EASE }}
          className="flex items-center justify-between pb-6"
        >
          <div className="text-xs text-neutral-600 font-medium">
            Showing <strong className="text-neutral-900">{filteredProducts.length}</strong> of{' '}
            {catalogProducts.length} fragrances
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#D4CFCE] text-xs font-semibold text-neutral-800 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D45520]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#D45520] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden sm:inline text-neutral-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-white border border-[#D4CFCE] rounded-lg py-2 px-3 text-xs text-neutral-900 focus:outline-none focus:border-[#D45520] transition-colors"
              >
                <option value="featured">Featured Curations</option>
                <option value="best-seller">Best Selling First</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Main Catalog Layout: Sidebar + 3-Col Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Left Filter Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.35, ease: LUXURY_EASE }}
            className="hidden lg:block bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-sm sticky top-24 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
              <h3 className="font-serif text-lg font-medium text-neutral-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D45520]" />
                Filter Catalog
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-[#D45520] hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                Category
              </label>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full text-left px-3 py-1.5 rounded-md transition-colors duration-[180ms] flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#FDF3EE] text-[#D45520] font-semibold'
                      : 'text-neutral-600 hover:bg-[#F2ECE1]'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[11px] text-neutral-400">{catalogProducts.length}</span>
                </button>
                {categories.map((cat) => {
                  const count = getCategoryCount(cat.name, cat.itemCount);
                  const isSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim();
                  return (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-full text-left px-3 py-1.5 rounded-md transition-colors duration-[180ms] flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FDF3EE] text-[#D45520] font-semibold'
                          : 'text-neutral-600 hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[11px] text-neutral-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scent Family Filter */}
            <div className="pt-4 border-t border-[#EAE4DC]">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                Scent Family
              </label>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => handleScentChange('all')}
                  className={`w-full text-left px-3 py-1.5 rounded-md transition-colors duration-[180ms] flex items-center justify-between ${
                    selectedScent === 'all'
                      ? 'bg-[#FDF3EE] text-[#D45520] font-semibold'
                      : 'text-neutral-600 hover:bg-[#F2ECE1]'
                  }`}
                >
                  <span>All Families</span>
                </button>
                {SCENT_FAMILIES.map((scent) => (
                  <button
                    key={scent.id}
                    onClick={() => handleScentChange(scent.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md transition-colors duration-[180ms] flex items-center justify-between ${
                      selectedScent === scent.id
                        ? 'bg-[#FDF3EE] text-[#D45520] font-semibold'
                        : 'text-neutral-600 hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <span>{scent.name}</span>
                    <span className="text-[11px] text-neutral-400">{scent.itemCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="pt-4 border-t border-[#EAE4DC]">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                Bottle Size
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {['all', '50ml', '100ml', '200ml'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-1.5 px-2 rounded-md border text-center transition-all duration-200 font-medium capitalize ${
                      selectedSize === size
                        ? 'border-[#D45520] bg-[#FDF3EE] text-[#D45520]'
                        : 'border-[#D4CFCE] bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {size === 'all' ? 'All' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="pt-4 border-t border-[#EAE4DC]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Max Price
                </label>
                <span className="text-xs font-semibold text-[#D45520] tabular-nums">
                  {formatPrice(priceRange)}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="8000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#D45520] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1 tabular-nums">
                <span>{formatPrice(1500)}</span>
                <span>{formatPrice(8000)}</span>
              </div>
            </div>
          </motion.aside>

          {/* Right Product Grid (3 per row desktop, 2 per row mobile) */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <motion.div
                layout
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: LUXURY_EASE },
                      },
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#EAE4DC] p-12 text-center my-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center mx-auto mb-4 text-[#D45520]">
                  <RotateCcw className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-neutral-900 mb-2">
                  No Fragrances Found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
                  No artisanal perfumes match your current combination of filters. Try clearing your filters or exploring another scent family.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-Out Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.32, ease: LUXURY_EASE }}
              className="relative w-4/5 max-w-sm bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 p-6 border-l border-[#EAE4DC] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE4DC]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#D45520]" />
                  <h3 className="font-serif text-lg font-medium text-neutral-900">
                    Filter Catalog
                  </h3>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-6 flex-1">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Category
                  </label>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-[180ms] ${
                        selectedCategory === 'all'
                          ? 'bg-[#D45520] text-white font-semibold'
                          : 'bg-white text-neutral-700'
                      }`}
                    >
                      All Categories ({catalogProducts.length})
                    </button>
                    {categories.map((cat) => {
                      const count = getCategoryCount(cat.name, cat.itemCount);
                      const isSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim();
                      return (
                        <button
                          key={cat.id || cat.name}
                          onClick={() => {
                            handleCategoryChange(cat.name);
                            setIsMobileFiltersOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-[180ms] ${
                            isSelected
                              ? 'bg-[#D45520] text-white font-semibold'
                              : 'bg-white text-neutral-700'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scent Family */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Scent Family
                  </label>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => handleScentChange('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-[180ms] ${
                        selectedScent === 'all'
                          ? 'bg-[#D45520] text-white font-semibold'
                          : 'bg-white text-neutral-700'
                      }`}
                    >
                      All Families
                    </button>
                    {SCENT_FAMILIES.map((scent) => (
                      <button
                        key={scent.id}
                        onClick={() => handleScentChange(scent.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-[180ms] ${
                          selectedScent === scent.id
                            ? 'bg-[#D45520] text-white font-semibold'
                            : 'bg-white text-neutral-700'
                        }`}
                      >
                        {scent.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    <span>Max Price</span>
                    <span className="text-[#D45520] tabular-nums">{formatPrice(priceRange)}</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="8000"
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-[#D45520]"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 tabular-nums">
                    <span>{formatPrice(1500)}</span>
                    <span>{formatPrice(8000)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE4DC] flex gap-2">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-3 text-xs font-semibold text-neutral-700 bg-white border border-[#D4CFCE] rounded-lg active:scale-95 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-3 text-xs font-semibold text-white bg-[#D45520] rounded-lg shadow-md active:scale-95 transition-all"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

