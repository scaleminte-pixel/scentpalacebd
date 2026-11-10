'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openQuickView } = useCart();
  const { formatPrice } = useCurrency();

  const [imgSrc, setImgSrc] = useState<string>(
    product.images?.[0] || '/images/products/rayhaan-azul.webp'
  );

  const lowestPrice = Math.min(...product.variants.map((v) => v.price));

  const handleBagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-[#EAE4DC] hover:border-neutral-400 p-2.5 sm:p-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-xl flex flex-col justify-between h-auto sm:h-[450px]">
      {/* 1:1 Aspect Ratio Studio Image Canvas */}
      <div className="relative aspect-square w-full rounded-xl bg-[#FAF7F2]/60 overflow-hidden flex items-center justify-center p-2 mb-2 sm:mb-3">
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full h-full flex items-center justify-center"
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            onError={() => setImgSrc('/images/products/rayhaan-azul.webp')}
            className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Quick Add To Bag Button (Burnt Orange) */}
        <button
          onClick={handleBagClick}
          className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 text-[#D45520] hover:bg-[#FDF3EE] border border-[#EAE4DC] flex items-center justify-center shadow-2xs hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={`Select size and add ${product.name} to bag`}
          title="Choose size & add to bag"
        >
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8]" />
        </button>

        {/* Concentration badge */}
        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-white/90 border border-[#EAE4DC] text-neutral-600 backdrop-blur-2xs">
          {product.concentration.replace('Extrait de Parfum', 'Extrait')}
        </span>
      </div>

      {/* Content Section: Name, Notes, Price */}
      <div className="flex flex-col justify-between flex-1">
        <div>
          <Link
            href={`/product/${product.slug}`}
            className="font-serif text-xs sm:text-base font-medium text-neutral-900 group-hover:text-[#D45520] transition-colors line-clamp-1 block leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>
          <p className="text-[10px] sm:text-xs text-neutral-400 truncate mt-0.5 font-sans">
            {product.notes.top.slice(0, 2).join(', ')}
          </p>
        </div>

        {/* Bottom Row: Price + Size Indicator */}
        <div className="flex items-baseline justify-between pt-2 sm:pt-3 mt-2 border-t border-[#F7F4EE]">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-neutral-400">
            From
          </span>
          <span className="text-xs sm:text-base font-bold text-neutral-900 tracking-tight font-sans tabular-nums">
            {formatPrice(lowestPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};
