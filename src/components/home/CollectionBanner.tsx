'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BANNERS } from '@/data/banners';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';

export const CollectionBanner: React.FC = () => {
  const { getContent, getSection } = useContent();
  const defaultBanner = BANNERS.find((b) => b.placement === 'collection') || BANNERS[1];

  const sec = getSection('collection_banner');
  if (sec && !sec.isVisible) return null;

  const content = getContent('collection_banner', {
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
    <section className="relative w-full h-[400px] sm:h-[440px] md:h-[480px] overflow-hidden bg-neutral-950 text-white flex items-center justify-center">
      {/* Background Image with soft scale settle */}
      <motion.div
        initial={{ scale: 1.04, opacity: 0.85 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.9, ease: LUXURY_EASE }}
        className="absolute inset-0 z-0"
      >
        <Image
          src={bannerImage}
          alt={content.title}
          fill
          className="object-cover object-center select-none"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      {/* Content sequential reveal: label, heading, paragraph, button */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: 0.15, ease: LUXURY_EASE }}
          className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-3 block font-semibold"
        >
          {content.tagline}
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.28, ease: LUXURY_EASE }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight tracking-tight drop-shadow-md"
        >
          {content.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, delay: 0.42, ease: LUXURY_EASE }}
          className="mt-4 text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-xl mx-auto font-sans"
        >
          {content.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: 0.55, ease: LUXURY_EASE }}
          className="mt-8 flex justify-center"
        >
          <Link
            href={content.ctaLink || '/shop'}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{content.ctaText || 'Explore Collection'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
