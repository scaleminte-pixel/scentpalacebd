'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BANNERS } from '@/data/banners';
import { LUXURY_EASE } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';

export const Hero: React.FC = () => {
  const { getContent } = useContent();
  const heroContent = getContent<any>('hero', {
    headlineLine1: 'A Signature Scent,',
    headlineLine2: 'Crafted with Soul',
    subtitle: 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
    watermarkText: 'A SCENT THAT LINGERS',
    badgeText: 'LONG LASTING',
    buttonText: 'Discover Fragrance',
    buttonLink: '/shop',
    imageUrl: '/images/banner-oud-collection.webp',
  });

  const heroImage = heroContent.imageUrl || heroContent.bgImage || '/images/banner-oud-collection.webp';
  const ctaButtonText = heroContent.buttonText || heroContent.ctaText || 'Discover Fragrance';
  const ctaButtonLink = heroContent.buttonLink || heroContent.ctaLink || '/shop';
  const heroSubtitle = heroContent.subtitle || heroContent.description || 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.';

  return (
    <section className="relative w-full h-[calc(100vh-102px)] min-h-[540px] max-h-[850px] flex items-end justify-between overflow-hidden bg-[#0F141C]">
      {/* Background Campaign 4K Image with scale settle from 1.035 to 1 over ~900ms */}
      <motion.div
        initial={{ scale: 1.035, opacity: 0.95 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: LUXURY_EASE }}
        className="absolute inset-0 z-0"
      >
        <Image
          src={heroImage}
          alt="Scent Palace BD Campaign Model"
          fill
          priority
          className="object-cover object-center md:object-[center_22%] select-none scale-100"
          sizes="100vw"
        />
        {/* Subtle cinematic gradient overlays for luxury contrast and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
      </motion.div>

      {/* Oversized Translucent Italic Serif Typography Layer with subtle horizontal movement */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.25, x: 0 }}
        transition={{ duration: 0.95, delay: 0.1, ease: LUXURY_EASE }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none"
      >
        <h1
          className="font-serif italic font-light text-[12vw] md:text-[11vw] lg:text-[10vw] tracking-wider text-white uppercase text-center whitespace-nowrap leading-none drop-shadow-sm px-4"
          style={{ letterSpacing: '0.08em' }}
        >
          {heroContent.watermarkText || 'A SCENT THAT LINGERS'}
        </h1>
      </motion.div>

      {/* Floating Circular Badge: "LONG LASTING" single restrained fade-and-scale entrance after main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.95, ease: LUXURY_EASE }}
        className="absolute top-20 right-4 sm:top-24 sm:right-8 md:top-28 md:right-16 z-20 pointer-events-auto"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full bg-[#83E1DF]/90 backdrop-blur-md shadow-xl flex flex-col items-center justify-center p-2 text-center border border-white/40 transform hover:scale-105 transition-transform duration-300">
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-[#143B39] mb-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="9" width="12" height="13" rx="2" />
            <path d="M10 2h4" />
            <path d="M12 2v7" />
            <circle cx="12" cy="15" r="2" />
          </svg>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tight text-[#143B39] leading-tight font-sans">
            {heroContent.badgeText ? (
              heroContent.badgeText.includes(' ') ? (
                heroContent.badgeText.split(' ').map((w: string, i: number) => (
                  <React.Fragment key={i}>
                    {w}
                    {i === 0 && <br />}
                  </React.Fragment>
                ))
              ) : (
                heroContent.badgeText
              )
            ) : (
              <>
                LONG<br />LASTING
              </>
            )}
          </span>
        </div>
      </motion.div>

      {/* Lower Content Grid: Headline line by line, then supporting copy, then CTA */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-end">
          {/* Lower Left Headline line by line */}
          <div className="lg:col-span-7 overflow-hidden">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-[1.14] drop-shadow-md">
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: LUXURY_EASE }}
                className="block"
              >
                {heroContent.headlineLine1 || 'A Signature Scent,'}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: LUXURY_EASE }}
                className="block"
              >
                {heroContent.headlineLine2 || 'Crafted with Soul'}
              </motion.span>
            </h2>
          </div>

          {/* Lower Right Supporting Copy & CTA */}
          <div className="lg:col-span-5 flex flex-col items-start lg:items-end text-left lg:text-right">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.65, ease: LUXURY_EASE }}
              className="text-white/85 text-xs sm:text-sm leading-relaxed max-w-md drop-shadow-sm font-sans mb-3 sm:mb-4"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.82, ease: LUXURY_EASE }}
            >
              <Link
                href={ctaButtonLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D45520] hover:bg-[#BD4616] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{ctaButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
