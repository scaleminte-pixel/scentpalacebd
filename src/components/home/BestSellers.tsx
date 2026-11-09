'use client';

import React from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/data/products';
import { Product } from '@/types';
import { ProductCard } from '@/components/common/ProductCard';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

interface BestSellersProps {
  initialProducts?: Product[];
}

export const BestSellers: React.FC<BestSellersProps> = ({ initialProducts }) => {
  const bestSellers =
    initialProducts && initialProducts.length > 0
      ? initialProducts.slice(0, 6)
      : PRODUCTS.filter((p) => p.isBestSeller).slice(0, 6);

  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header: Introduce heading and View All link together */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, ease: LUXURY_EASE }}
          className="flex items-baseline justify-between mb-10"
        >
          <h2 className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-neutral-900 tracking-wider font-normal">
            BEST SELLING PRODUCT.
          </h2>

          <Link
            href="/shop?filter=best-seller"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 hover:text-[#D45520] transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>

        {/* 6 Cards: Reveal by visible row with shared stagger */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        >
          {bestSellers.map((product) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: LUXURY_EASE } },
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
