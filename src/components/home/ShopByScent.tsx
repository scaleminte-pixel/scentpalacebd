'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

const SCENT_TILES = [
  {
    id: 'Oud & Woody',
    name: 'Oud & Woody',
    image: '/images/scent-oud.webp',
  },
  {
    id: 'Fresh & Citrus',
    name: 'Fresh & Citrus',
    image: '/images/scent-citrus.webp',
  },
  {
    id: 'Floral',
    name: 'Floral',
    image: '/images/scent-floral.webp',
  },
  {
    id: 'Amber & Spicy',
    name: 'Amber & Spicy',
    image: '/images/scent-amber.webp',
  },
];

export const ShopByScent: React.FC = () => {
  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Minimalist Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, ease: LUXURY_EASE }}
          className="flex items-baseline justify-between mb-10"
        >
          <h2 className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-neutral-900 tracking-tight font-normal">
            Shop by Scent
          </h2>

          <Link
            href="/shop"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-[#D45520] transition-colors flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* 4 Minimalist Image-Led Scent Tiles with scale 0.98 to 1 entrance */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.08 },
            },
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {SCENT_TILES.map((scent) => (
            <motion.div
              key={scent.id}
              variants={{
                hidden: { opacity: 0, scale: 0.98 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: LUXURY_EASE } },
              }}
            >
              <Link
                href={`/shop?scent=${encodeURIComponent(scent.id)}`}
                className="group relative rounded-2xl overflow-hidden bg-white border border-[#EAE4DC] shadow-xs hover:shadow-xl transition-all duration-300 h-72 sm:h-88 flex flex-col justify-end p-5 block"
              >
                {/* Background Image with contained hover zoom */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <Image
                    src={scent.image}
                    alt={scent.name}
                    fill
                    className="object-cover group-hover:scale-[1.035] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300" />
                </div>

                {/* Minimalist Label with 2px lift on hover */}
                <div className="relative z-10 text-white transform group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <h3 className="font-serif text-lg sm:text-xl font-normal tracking-tight group-hover:text-amber-200 transition-colors flex items-center justify-between">
                    <span>{scent.name}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-[#D45520]" />
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
