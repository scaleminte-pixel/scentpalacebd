'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/data/categories';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';

interface EditorialIntroProps {
  initialCategories?: any[];
}

export const EditorialIntro: React.FC<EditorialIntroProps> = ({ initialCategories }) => {
  const { getContent, getSection } = useContent();
  const sec = getSection('editorial');
  const [categories, setCategories] = useState<any[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        })
        .catch((err) => console.error('Failed to load categories', err));
    }
  }, [initialCategories]);

  const content = getContent('editorial', {
    headingLine1: 'Luxury,',
    headingLine2: 'No Compromise.',
    signatureTitle: 'Our Signature Scents (18)',
    signatureSubtitle: 'Explore our collection of refined fragrances, inspired by tradition and crafted for modern elegance.',
  });

  const showcaseTiles = [
    { name: 'OUD AMBRE', image: '/images/products/oud-ambre.webp', link: '/product/oud-ambre' },
    { name: 'OUD ESSENCE', image: '/images/products/bleu-oud.webp', link: '/product/bleu-oud' },
    { name: 'ROYAL SAFFRON', image: '/images/products/royal-saffron.webp', link: '/product/royal-saffron' },
  ];

  if (sec && !sec.isVisible) return null;

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Top Asymmetrical Editorial Statement matching Reference Image */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pb-10 sm:pb-14 border-b border-[#EAE4DC]"
        >
          {/* Left Column: Editorial Statement + 3 Fragrance Showcase Tiles */}
          <div className="lg:col-span-6 relative">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-[#C5A059] text-base select-none">✦</span>
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-[#C5A059] font-sans">
                Haute Parfumerie Atelier
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-neutral-900 leading-[1.1] font-normal tracking-tight overflow-hidden">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, ease: LUXURY_EASE }}
                className="block"
              >
                {content.headingLine1 || 'Luxury,'}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: 0.15, ease: LUXURY_EASE }}
                className="italic font-light text-neutral-800 block"
              >
                {content.headingLine2 || 'No Compromise.'}
              </motion.span>
            </h2>

            {/* 3 Fragrance Showcase Tiles fading in sequentially */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.25 },
                },
              }}
              className="mt-6 sm:mt-8 flex items-center gap-2.5 sm:gap-3"
            >
              {showcaseTiles.map((tile) => (
                <motion.div
                  key={tile.name}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
                  }}
                  className="flex-1 max-w-[110px]"
                >
                  <Link
                    href={tile.link}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#EAE4DC] shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between p-2 block text-center"
                  >
                    <div className="relative w-full flex-1">
                      <Image
                        src={tile.image}
                        alt={tile.name}
                        fill
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        sizes="110px"
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-neutral-800 block truncate w-full font-serif mt-1">
                      {tile.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Ingredients & Accompanying text fading in sequentially */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.65, delay: 0.35, ease: LUXURY_EASE }}
            className="lg:col-span-6"
          >
            <div className="p-4 sm:p-6 rounded-2xl bg-white/70 border border-[#EAE4DC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.5, delay: 0.4, ease: LUXURY_EASE }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-xs border border-[#EAE4DC] bg-white shrink-0"
                >
                  <Image
                    src="/images/ingredient-amber.webp"
                    alt="Raw Baltic Amber"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.5, delay: 0.48, ease: LUXURY_EASE }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-xs border border-[#EAE4DC] bg-white shrink-0"
                >
                  <Image
                    src="/images/ingredient-saffron.webp"
                    alt="Kashmiri Saffron"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.55, delay: 0.52, ease: LUXURY_EASE }}
                className="border-t sm:border-t-0 sm:border-l border-[#EAE4DC] pt-3 sm:pt-0 sm:pl-5 flex-1"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[#C5A059] text-xs select-none">✦</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A059]">
                    Pure Formulation
                  </span>
                </div>
                <h3 className="font-serif text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">
                  {content.signatureTitle || 'Our Signature Scents (18)'}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mt-1 font-sans">
                  {content.signatureSubtitle || 'Explore our collection of refined fragrances, inspired by tradition and crafted for modern elegance.'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Category Tiles Grid: Heading first, then Men, Women, Unisex, Gift Sets with 60ms stagger */}
        <div className="pt-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: LUXURY_EASE }}
            className="flex items-baseline justify-between mb-8"
          >
            <h3 className="font-serif italic text-2xl sm:text-3xl font-normal text-neutral-900">
              Shop by Category
            </h3>
            <Link
              href="/shop"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-[#D45520] transition-colors flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>

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
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.id || cat.name}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: LUXURY_EASE } },
                }}
              >
                <Link
                  href={`/shop?category=${encodeURIComponent(cat.name || cat.id)}`}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#EAE4DC] shadow-xs hover:shadow-xl transition-all duration-300 h-72 sm:h-84 flex flex-col justify-end p-5 block"
                >
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image
                      src={cat.image || '/images/products/oud-ambre.webp'}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-[1.035] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent group-hover:from-black/85 transition-colors duration-300" />
                  </div>

                  {/* On hover lift the label by 2px (-translate-y-0.5) */}
                  <div className="relative z-10 text-white transform group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    <h4 className="font-serif text-lg sm:text-xl font-normal tracking-tight group-hover:text-amber-200 transition-colors flex items-center justify-between">
                      <span>{cat.name}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-[#D45520]" />
                    </h4>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
