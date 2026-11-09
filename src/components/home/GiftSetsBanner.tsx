'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BANNERS } from '@/data/banners';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';

export const GiftSetsBanner: React.FC = () => {
  const { getContent, getSection } = useContent();
  const defaultBanner = BANNERS.find((b) => b.placement === 'gift-sets') || BANNERS[2];

  const sec = getSection('gift_sets_banner');
  if (sec && !sec.isVisible) return null;

  const content = getContent('gift_sets_banner', {
    tagline: defaultBanner.tagline,
    title: defaultBanner.title,
    description: defaultBanner.description,
    ctaText: defaultBanner.ctaText,
    ctaLink: defaultBanner.ctaLink,
    imageUrl: defaultBanner.image,
    bgImage: defaultBanner.image,
  });

  const bannerImage = content.imageUrl || content.bgImage || defaultBanner.image;

  return (
    <section className="bg-[#FAF7F2] py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 text-white min-h-[340px] sm:min-h-[380px] flex items-center p-8 sm:p-12 lg:p-16 shadow-lg border border-[#EAE4DC]">
          {/* Background Image: soft scale settle inside rounded container */}
          <motion.div
            initial={{ scale: 1.04, opacity: 0.85 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.85, ease: LUXURY_EASE }}
            className="absolute inset-0 z-0"
          >
            <Image
              src={bannerImage}
              alt={content.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
          </motion.div>

          {/* Content: text and CTA introduced sequentially */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, delay: 0.22, ease: LUXURY_EASE }}
            className="relative z-10 max-w-lg"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-2 block font-semibold">
              {content.tagline}
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight">
              {content.title}
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
              {content.description}
            </p>

            <div className="mt-7">
              <Link
                href={content.ctaLink || '/shop?category=Gift+Sets'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{content.ctaText || 'Explore Gift Sets'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
