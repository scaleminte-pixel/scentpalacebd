'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LUXURY_EASE } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';
import { getHeroSlides, type HeroSlide } from '@/lib/hero-slides';

/**
 * Homepage hero — managed in Admin → Website Content → Hero (multiple banners).
 *  • Phones: image-only rounded banner card carousel (swipe + auto-slide + dots, no text).
 *  • Tablet / desktop: full-width cinematic banner with cross-fading slides.
 */
export const Hero: React.FC = () => {
  const { getContent, getSection } = useContent();
  const heroSection = getSection('hero');
  const heroContent = getContent<any>('hero', {});
  const slides = getHeroSlides(heroContent);
  const intervalMs = Math.min(Math.max(Number(heroContent.autoplaySeconds) || 3, 2), 15) * 1000;

  if (heroSection && !heroSection.isVisible) return null;
  if (slides.length === 0) return null;

  return (
    <>
      <MobileHeroCarousel slides={slides} intervalMs={intervalMs} />
      <DesktopHero slides={slides} intervalMs={intervalMs} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Phones: rounded banner card carousel                                */
/* ------------------------------------------------------------------ */
function MobileHeroCarousel({ slides, intervalMs }: { slides: HeroSlide[]; intervalMs: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);
  const many = slides.length > 1;

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  // Track which slide is in view (works for swipe and programmatic scroll)
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  // Auto-slide; pauses for a while after the user touches the banner
  useEffect(() => {
    if (!many) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current || document.hidden) return;
      goTo((active + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, many, slides.length, intervalMs, goTo]);

  const pause = () => {
    pausedUntil.current = Date.now() + intervalMs * 2;
  };

  return (
    <section className="md:hidden px-4 pt-4 pb-1" aria-roledescription="carousel" aria-label="Featured banners">
      <div
        ref={trackRef}
        onScroll={onScroll}
        onTouchStart={pause}
        onPointerDown={pause}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-[22px] shadow-[0_10px_30px_-12px_rgba(3,53,40,0.35)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <Link
            key={i}
            href={s.buttonLink || '/shop'}
            className="relative block w-full shrink-0 snap-center aspect-[16/9] overflow-hidden bg-[#033528]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${s.headlineLine1 || 'Banner'} (${i + 1} of ${slides.length})`}
            draggable={false}
          >
            <Image
              src={s.mobileImageUrl || s.imageUrl}
              alt={s.headlineLine1 || 'Scent Palace banner'}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
              sizes="(max-width: 767px) 100vw, 1px"
              className="object-cover object-center select-none"
              draggable={false}
            />
          </Link>
        ))}
      </div>

      {many && (
        <div className="flex items-center justify-center gap-1.5 pt-3" role="tablist" aria-label="Choose banner">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show banner ${i + 1}`}
              onClick={() => {
                pause();
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-5 bg-[#033528]' : 'w-1.5 bg-[#B88556]/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tablet / desktop: full-width cinematic hero with cross-fade         */
/* ------------------------------------------------------------------ */
function DesktopHero({
  slides,
  intervalMs,
}: {
  slides: HeroSlide[];
  intervalMs: number;
}) {
  const [active, setActive] = useState(0);
  const many = slides.length > 1;
  const s = slides[Math.min(active, slides.length - 1)];

  useEffect(() => {
    if (!many) return;
    const t = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [many, slides.length, intervalMs]);


  return (
    <section
      className="hidden md:flex relative w-full h-[calc(100vh-102px)] min-h-[540px] max-h-[850px] items-end justify-between overflow-hidden bg-[#033528]"
      aria-roledescription="carousel"
      aria-label="Featured banners"
    >
      {/* Background images (cross-fade) */}
      {slides.map((sl, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.035 }}
          transition={{ duration: 0.9, ease: LUXURY_EASE }}
          className="absolute inset-0 z-0"
          aria-hidden={i !== active}
        >
          <Image
            src={sl.imageUrl}
            alt={sl.headlineLine1 || 'Scent Palace campaign'}
            fill
            priority={i === 0}
            loading={i === 0 ? undefined : 'lazy'}
            className="object-cover object-[center_22%] select-none"
            sizes="(min-width: 768px) 100vw, 1px"
          />
        </motion.div>
      ))}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />

      {/* Copy for the active slide */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-10 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.55, ease: LUXURY_EASE }}
            className="grid grid-cols-12 gap-8 items-end"
          >
            <div className="col-span-7">
              {s.eyebrow && (
                <span className="inline-block mb-3 px-3 py-1 rounded-full bg-[#F7F2E6]/95 text-[#033528] text-[10px] font-bold uppercase tracking-[0.18em]">
                  {s.eyebrow}
                </span>
              )}
              <h1 className="font-serif text-4xl lg:text-5xl font-normal text-white leading-[1.14] drop-shadow-md">
                <span className="block">{s.headlineLine1}</span>
                {s.headlineLine2 && <span className="block">{s.headlineLine2}</span>}
              </h1>
            </div>
            <div className="col-span-5 flex flex-col items-end text-right">
              {s.subtitle && (
                <p className="text-white/85 text-sm leading-relaxed max-w-md drop-shadow-sm font-sans mb-4">{s.subtitle}</p>
              )}
              {s.buttonText && (
                <Link
                  href={s.buttonLink || '/shop'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#E8CE5F] hover:bg-[#F2DC7A] text-[#033528] text-sm font-semibold uppercase tracking-wider transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <span>{s.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {many && (
          <div className="mt-6 flex items-center gap-4">
<div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show banner ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-7 bg-[#E8CE5F]' : 'w-1.5 bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
