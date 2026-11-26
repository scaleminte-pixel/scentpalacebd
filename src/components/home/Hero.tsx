'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LUXURY_EASE } from '@/utils/motion';
import { useContent } from '@/context/ContentContext';
import { getHeroSlides, type HeroSlide } from '@/lib/hero-slides';

/**
 * Homepage hero — managed in Admin → Website Content → Hero (multiple banners).
 *  • Phones: rounded banner card carousel (swipe + auto-slide + dots).
 *  • Tablet / desktop: full-width cinematic banner with cross-fading slides.
 */
export const Hero: React.FC = () => {
  const { getContent, getSection } = useContent();
  const heroSection = getSection('hero');
  const heroContent = getContent<any>('hero', {});
  const slides = getHeroSlides(heroContent);
  const intervalMs = Math.min(Math.max(Number(heroContent.autoplaySeconds) || 5, 3), 15) * 1000;

  if (heroSection && !heroSection.isVisible) return null;
  if (slides.length === 0) return null;

  return (
    <>
      <MobileHeroCarousel slides={slides} intervalMs={intervalMs} />
      <DesktopHero slides={slides} intervalMs={intervalMs} watermark={heroContent.watermarkText} badge={heroContent.badgeText} />
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
          <div
            key={i}
            className="relative w-full shrink-0 snap-center flex min-h-[210px] min-[400px]:min-h-[225px] overflow-hidden bg-[#033528]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            <Image
              src={s.mobileImageUrl || s.imageUrl}
              alt={s.headlineLine1 || 'Scent Palace banner'}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
              sizes="(max-width: 767px) 100vw, 1px"
              className="object-cover object-[70%_center] select-none"
            />
            {/* Emerald wash on the left so the copy stays readable on any photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#033528]/92 via-[#033528]/55 to-transparent" />

            <div className="relative z-10 min-h-full w-[70%] flex flex-col justify-center pl-5 pr-2 py-5">
              {s.eyebrow && (
                <span className="self-start mb-2 px-2.5 py-1 rounded-full bg-[#F7F2E6] text-[#033528] text-[9px] font-bold uppercase tracking-[0.14em] shadow-xs">
                  {s.eyebrow}
                </span>
              )}
              <h2 className="font-serif text-[19px] min-[380px]:text-[21px] min-[420px]:text-[23px] leading-[1.12] text-[#F7F2E6] drop-shadow-sm">
                {s.headlineLine1}
                {s.headlineLine2 && (
                  <>
                    <br />
                    <span className="text-[#E8CE5F]">{s.headlineLine2}</span>
                  </>
                )}
              </h2>
              {s.subtitle && (
                <p className="mt-1.5 text-[11px] leading-snug text-[#F7F2E6]/85 line-clamp-2">{s.subtitle}</p>
              )}
              {s.buttonText && (
                <Link
                  href={s.buttonLink || '/shop'}
                  className="self-start mt-3 inline-flex items-center gap-2 pl-3.5 pr-1 py-1 rounded-full bg-[#F7F2E6] text-[#033528] text-[11px] font-semibold shadow-md active:scale-95 transition-transform"
                >
                  <span>{s.buttonText}</span>
                  <span className="w-5 h-5 rounded-full bg-[#E8CE5F] flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              )}
            </div>
          </div>
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
  watermark,
  badge,
}: {
  slides: HeroSlide[];
  intervalMs: number;
  watermark?: string;
  badge?: string;
}) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const many = slides.length > 1;
  const s = slides[Math.min(active, slides.length - 1)];

  useEffect(() => {
    if (!many || hovered) return;
    const t = setInterval(() => {
      if (!document.hidden) setActive((a) => (a + 1) % slides.length);
    }, intervalMs + 1500);
    return () => clearInterval(t);
  }, [many, hovered, slides.length, intervalMs]);

  const go = (d: number) => setActive((a) => (a + d + slides.length) % slides.length);
  const badgeText = badge || 'LONG LASTING';

  return (
    <section
      className="hidden md:flex relative w-full h-[calc(100vh-102px)] min-h-[540px] max-h-[850px] items-end justify-between overflow-hidden bg-[#033528]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* Oversized translucent watermark */}
      {watermark !== '' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.25, x: 0 }}
          transition={{ duration: 0.95, delay: 0.1, ease: LUXURY_EASE }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden select-none"
        >
          <span
            className="font-serif italic font-light text-[11vw] lg:text-[10vw] tracking-wider text-white uppercase text-center whitespace-nowrap leading-none drop-shadow-sm px-4"
            style={{ letterSpacing: '0.08em' }}
          >
            {watermark || 'A SCENT THAT LINGERS'}
          </span>
        </motion.div>
      )}

      {/* Floating circular badge */}
      {badge !== '' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.95, ease: LUXURY_EASE }}
          className="absolute top-24 right-8 md:top-28 md:right-16 z-20"
        >
          <div className="w-20 h-20 md:w-22 md:h-22 rounded-full bg-[#E8CE5F]/90 backdrop-blur-md shadow-xl flex flex-col items-center justify-center p-2 text-center border border-white/40">
            <svg className="w-5 h-5 text-[#033528] mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="9" width="12" height="13" rx="2" />
              <path d="M10 2h4" />
              <path d="M12 2v7" />
              <circle cx="12" cy="15" r="2" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-tight text-[#033528] leading-tight font-sans">
              {badgeText.split(' ').map((w, i) => (
                <React.Fragment key={i}>
                  {w}
                  {i === 0 && badgeText.includes(' ') && <br />}{' '}
                </React.Fragment>
              ))}
            </span>
          </div>
        </motion.div>
      )}

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
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous banner"
              className="w-9 h-9 rounded-full border border-white/40 text-white hover:bg-[#E8CE5F] hover:text-[#033528] hover:border-[#E8CE5F] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
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
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next banner"
              className="w-9 h-9 rounded-full border border-white/40 text-white hover:bg-[#E8CE5F] hover:text-[#033528] hover:border-[#E8CE5F] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
