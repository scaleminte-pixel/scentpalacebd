'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { X, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { ProductVariant } from '@/types';

export const SizePickerModal: React.FC = () => {
  const { quickViewProduct, closeQuickView, addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Initialize selected variant when product opens
  React.useEffect(() => {
    if (quickViewProduct && quickViewProduct.variants.length > 0) {
      setSelectedVariant(quickViewProduct.variants[0]);
      setQuantity(1);
      setAdded(false);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const activeVariant = selectedVariant || quickViewProduct.variants[0];
  const isOutOfStock = activeVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(quickViewProduct, activeVariant, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      closeQuickView();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={closeQuickView} />

      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE4DC] overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-neutral-900 transition-colors bg-white/80 rounded-full"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto">
          {/* Header & Product Presentation: Seamless */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#EAE4DC]">
            <div className="relative w-32 h-44 shrink-0 flex items-center justify-center">
              <Image
                src={quickViewProduct.images[0]}
                alt={quickViewProduct.name}
                fill
                className="object-contain p-1 drop-shadow-md"
                sizes="140px"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D45520]">
                {quickViewProduct.concentration}
              </span>
              <h3 className="font-serif text-2xl font-normal text-neutral-900 mt-1 tracking-tight">
                {quickViewProduct.name}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {quickViewProduct.scentFamily}
              </p>

              <div className="mt-3 flex items-baseline gap-2.5 justify-center sm:justify-start">
                <span className="font-serif text-2xl font-normal text-neutral-900">
                  {formatPrice(activeVariant.price)}
                </span>
                {activeVariant.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through font-sans">
                    {formatPrice(activeVariant.originalPrice)}
                  </span>
                )}
              </div>

              {/* Discreet Stock Indicator */}
              <div className="mt-2 text-xs flex items-center justify-center sm:justify-start gap-1.5 text-neutral-600 font-sans">
                {activeVariant.stock > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>In Stock</span>
                    <span className="text-neutral-400">• Ready to ship</span>
                  </>
                ) : (
                  <span className="text-rose-600 font-medium">Sold Out</span>
                )}
              </div>
            </div>
          </div>

          {/* Size Variant Picker: Luxury Pills */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-neutral-800">
                Select Flacon Size
              </span>
              <span className="text-neutral-400">SKU: {activeVariant.sku}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickViewProduct.variants.map((variant) => {
                const isSelected = activeVariant.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#141312] text-white shadow-sm ring-1 ring-neutral-900'
                        : 'bg-white border border-[#EAE4DC] text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <span className="font-semibold">{variant.size}</span>
                    <span className={`text-[11px] ${isSelected ? 'text-amber-200' : 'text-neutral-400'}`}>
                      {formatPrice(variant.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector + Add to Bag */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center justify-between border border-[#EAE4DC] rounded-full bg-white px-3 py-2 w-26 shrink-0 shadow-2xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm font-semibold"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="text-xs font-semibold text-neutral-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(activeVariant.stock, q + 1))}
                className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm font-semibold"
                disabled={quantity >= activeVariant.stock}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-full font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md ${
                isOutOfStock
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#D45520] hover:bg-[#BD4616] text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" /> Added to Bag
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add • {formatPrice(activeVariant.price * quantity)}
                </>
              )}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#EAE4DC] text-center">
            <Link
              href={`/product/${quickViewProduct.slug}`}
              onClick={closeQuickView}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1"
            >
              <span>Explore full olfactory composition & notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
