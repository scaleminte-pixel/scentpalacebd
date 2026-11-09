'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PRODUCTS } from '@/data/products';
import { useCurrency } from '@/context/CurrencyContext';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';

      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => {
          if (data.products && Array.isArray(data.products) && data.products.length > 0) {
            setProductsList(data.products);
          }
        })
        .catch(() => {});
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase().trim();
    const matches = productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.scentFamily.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.notes?.top?.some((n) => n.toLowerCase().includes(q)) ||
        p.notes?.heart?.some((n) => n.toLowerCase().includes(q)) ||
        p.notes?.base?.some((n) => n.toLowerCase().includes(q))
    );
    setResults(matches);
  }, [query, productsList]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      onClose();
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-xl shadow-2xl border border-[#E5DFD7] overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-6 py-4 border-b border-[#E5DFD7] bg-white transition-all duration-200 focus-within:ring-2 focus-within:ring-[#D45520]/20 focus-within:border-[#D45520]">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search perfumes by name, notes (Oud, Rose, Amber) or family..."
            className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-neutral-400 hover:text-neutral-800 transition-colors rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popular searches suggestions if query is empty */}
        {!query && (
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D45520]" />
              Popular Fragrance Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {['Bleu Oud', 'Oud Ambre', 'Taif Rose', 'Cambodian Oud', 'Amber & Spicy', 'Discovery Set'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-full bg-[#F2ECE1] text-xs text-neutral-700 hover:bg-[#D45520] hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Results List */}
        {query && (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#EAE4DC] p-2">
            {results.length > 0 ? (
              <>
                <div className="p-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Found {results.length} royal fragrance{results.length > 1 ? 's' : ''}
                </div>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F2ECE1]/60 transition-colors group"
                  >
                    <div className="relative w-14 h-16 bg-white rounded-md p-1 border border-neutral-200 shrink-0 overflow-hidden">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-contain p-1 group-hover:scale-105 transition-transform"
                        sizes="60px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-medium text-neutral-900 truncate">
                          {product.name}
                        </h4>
                        <span className="text-sm font-semibold text-[#D45520]">
                          {formatPrice(product.variants[0].price)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {product.concentration} • {product.scentFamily}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Notes: {product.notes.top.join(', ')}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#D45520] transition-colors shrink-0" />
                  </Link>
                ))}
                <div className="p-3 text-center border-t border-[#EAE4DC] mt-2">
                  <Link
                    href={`/shop?q=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D45520] hover:underline uppercase tracking-wider"
                  >
                    View all matching results in Shop Catalog <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-neutral-500 text-sm">
                  No bespoke fragrances found for &quot;<span className="text-neutral-900 font-medium">{query}</span>&quot;
                </p>
                <p className="text-neutral-400 text-xs mt-1">
                  Try searching for &quot;Oud&quot;, &quot;Amber&quot;, &quot;Rose&quot;, or browse our collections.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

