'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

export const Footer: React.FC = () => {
  const currentYear = 2026;

  return (
    <footer className="no-print relative bg-[#141312] text-[#E0DDD7] border-t border-neutral-800 pt-16 sm:pt-20 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden print:hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* =====================================================================
            TOP SECTION: 5-COLUMN NAVIGATION GRID (REVEALED IN SMALL GROUPS)
           ===================================================================== */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.07, delayChildren: 0.08 },
            },
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 pb-14 text-sm font-sans"
        >
          {/* Column 1: Maison / Company */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
            }}
          >
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-4">
              Maison
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/our-story" className="hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/our-story" className="hover:text-white transition-colors duration-200">
                  Heritage & Craft
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors duration-200">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-200">
                  Contact Concierge
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 2: Collections / Products */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
            }}
          >
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors duration-200">
                  All Fragrances
                </Link>
              </li>
              <li>
                <Link href="/shop?scent=Oud+%26+Woody" className="hover:text-white transition-colors duration-200">
                  The Oud Royale
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Men" className="hover:text-white transition-colors duration-200">
                  Men&apos;s Extrait
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Women" className="hover:text-white transition-colors duration-200">
                  Women&apos;s Extrait
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Gift+Sets" className="hover:text-white transition-colors duration-200">
                  Discovery Coffrets
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 3: Client Experience / Resources */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
            }}
          >
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-4">
              Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors duration-200">
                  Scent Notes Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors duration-200">
                  Sample First Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-200">
                  VIP Salon Tasting
                </Link>
              </li>
              <li>
                <Link href="/our-story" className="hover:text-white transition-colors duration-200">
                  Artisanal Distillation
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 4: Client Care / Legal */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
            }}
          >
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-4">
              Client Care
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-white transition-colors duration-200">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-[#D45520] transition-colors duration-200 font-medium">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors duration-200">
                  Authenticity Guarantee
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Column 5: Contact */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: LUXURY_EASE } },
            }}
            className="col-span-2 sm:col-span-1"
          >
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-white mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-sans">
              <li>
                <a
                  href="mailto:concierge@rawdahperfumes.com"
                  className="hover:text-white transition-colors duration-200 truncate block"
                >
                  concierge@rawdahperfumes.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801711000000"
                  className="hover:text-white transition-colors duration-200 block"
                >
                  +880 1711-000000
                </a>
              </li>
              <li className="text-neutral-500 text-[11px] pt-1">
                Road 11, Block D, Gulshan-2, Dhaka
              </li>
              <li className="text-[#D45520] font-medium text-[11px]">
                Everyday: 11:00 AM – 10:00 PM
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* =====================================================================
            THIN HAIRLINE HORIZONTAL DIVIDER
           ===================================================================== */}
        <div className="border-t border-neutral-800 my-8" />

        {/* =====================================================================
            MIDDLE INFO BAR: ADDRESS & COPYRIGHT (LEFT) + CIRCULAR SOCIALS (RIGHT)
           ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12">
          {/* Left: Physical Address + Copyright */}
          <div className="space-y-1 text-xs text-neutral-400 font-sans max-w-xl">
            <p>
              Rāwdah Atelier HQ, Road 11, Block D, Gulshan-2, Dhaka 1212, Bangladesh.
            </p>
            <p className="text-neutral-500 text-[11px]">
              © {currentYear} Rāwdah Haute Parfumerie. All rights reserved.
            </p>
          </div>

          {/* Right: Circular Social Icons with subtle focus and hover feedback */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white text-neutral-900 hover:bg-[#D45520] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-xs focus:ring-2 focus:ring-[#D45520]/40 outline-hidden"
              aria-label="Facebook"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white text-neutral-900 hover:bg-[#D45520] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-xs focus:ring-2 focus:ring-[#D45520]/40 outline-hidden"
              aria-label="X / Twitter"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white text-neutral-900 hover:bg-[#D45520] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-xs focus:ring-2 focus:ring-[#D45520]/40 outline-hidden"
              aria-label="Instagram"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/8801711000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white text-neutral-900 hover:bg-[#D45520] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-xs focus:ring-2 focus:ring-[#D45520]/40 outline-hidden"
              aria-label="WhatsApp"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM SECTION: OVERSIZED RĀWDAH WORDMARK
          Slow, small upward opacity reveal within footer bounds
         ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.85, ease: LUXURY_EASE }}
        className="w-full select-none pointer-events-none flex flex-col items-center justify-center pt-8 pb-4 sm:pb-6 overflow-hidden"
      >
        <div className="inline-flex items-baseline justify-center gap-2 sm:gap-3 md:gap-4 max-w-full">
          <span
            className="font-serif font-medium tracking-tight text-white/[0.06] sm:text-white/[0.08] block leading-none text-[13vw] sm:text-[10vw] md:text-[8.5vw] lg:text-[7.5vw] whitespace-nowrap"
            style={{ letterSpacing: '0.02em' }}
          >
            Rāwdah
          </span>
          <span
            className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-[#D45520]/40 inline-block mb-[1.2vw] shrink-0"
            aria-hidden="true"
          />
        </div>
        <span
          className="text-[2.4vw] sm:text-[1.8vw] md:text-[1.3vw] lg:text-[1.05vw] uppercase tracking-[0.32em] font-sans font-medium text-white/[0.04] sm:text-white/[0.06] block mt-2 sm:mt-3 whitespace-nowrap"
          style={{ letterSpacing: '0.3em' }}
        >
          Haute Parfumerie
        </span>
      </motion.div>
    </footer>
  );
};
