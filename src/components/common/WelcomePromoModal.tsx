'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Sparkles, Check, Copy, Tag, ArrowRight } from 'lucide-react';
import { WELCOME_PROMO } from '@/data/promotions';
import { useCart } from '@/context/CartContext';
import { useContent } from '@/context/ContentContext';

export const WelcomePromoModal: React.FC = () => {
  const { getContent, getSection } = useContent();
  const sec = getSection('welcome_promo');

  const promo = getContent('welcome_promo', {
    enabled: WELCOME_PROMO.enabled,
    discountPercentage: WELCOME_PROMO.discountPercentage,
    couponCode: WELCOME_PROMO.couponCode,
    tagline: WELCOME_PROMO.tagline,
    title: WELCOME_PROMO.title,
    subtitle: WELCOME_PROMO.subtitle,
    perks: WELCOME_PROMO.perks,
    minSpendBDT: WELCOME_PROMO.minSpendBDT,
    buttonText: WELCOME_PROMO.buttonText,
    floatingPillText: WELCOME_PROMO.floatingPillText,
    image: WELCOME_PROMO.image,
  });

  const isPromoActive = (sec ? sec.isVisible : true) && ((promo as any).enabled !== false);
  const promoImage = (promo as any).imageUrl || promo.image || WELCOME_PROMO.image;

  const { applyCoupon, appliedCoupon } = useCart();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isPromoActive) return;

    // Check if user has already seen or dismissed popup in this session
    const seenSession = sessionStorage.getItem('rawdah_seen_welcome_promo');
    
    if (!seenSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('rawdah_seen_welcome_promo', 'true');
      }, 1400);

      return () => clearTimeout(timer);
    } else {
      setHasInteracted(true);
    }
  }, [isPromoActive]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(promo.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimOffer = () => {
    // Automatically apply coupon code in CartContext
    const res = applyCoupon(promo.couponCode);
    setCopied(true);
    setAppliedToast(true);
    setHasInteracted(true);

    setTimeout(() => {
      setAppliedToast(false);
      setIsOpen(false);
    }, 1200);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setHasInteracted(true);
  };

  if (!isPromoActive) return null;

  return (
    <>
      {/* =========================================================================
          PERSISTENT FLOATING DISCOUNT BADGE (STAYS ACROSS ALL SCROLLS)
          Guarantees the user always sees the exact same discount anytime they scroll!
         ========================================================================= */}
      <div className="no-print hidden md:block fixed bottom-6 left-6 z-40 transition-transform duration-300">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#141312] text-white border border-neutral-700/80 shadow-2xl hover:border-[#D45520] hover:bg-neutral-900 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs font-medium"
          title="View Exclusive Discount Privilege"
        >
          <span className="w-6 h-6 rounded-full bg-[#D45520] flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
            <Tag className="w-3.5 h-3.5" />
          </span>
          <span className="font-serif tracking-wide text-amber-200 font-medium">
            {appliedCoupon?.code === promo.couponCode ? (
              <span className="text-emerald-400 font-sans flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {promo.discountPercentage}% Off Applied
              </span>
            ) : (
              <span>{promo.discountPercentage}% Privilege • {promo.couponCode}</span>
            )}
          </span>
        </button>
      </div>

      {/* =========================================================================
          MODAL OVERLAY & CELEBRATION POP-UP
         ========================================================================= */}
      {isOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE4DC] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Top Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Banner Image with Celebratory Badge */}
            <div className="relative h-44 sm:h-52 w-full bg-neutral-950 overflow-hidden flex items-end p-6">
              <Image
                src={promoImage}
                alt="Luxury Perfume Welcome Privilege"
                fill
                className="object-cover object-center opacity-70 scale-105"
                sizes="(max-width: 640px) 100vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-black/40 to-black/20" />

              {/* Sparkle Badge */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] sm:text-xs font-semibold tracking-widest uppercase backdrop-blur-md mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{promo.tagline}</span>
                </div>
                <h3 className="font-serif italic text-2xl sm:text-3xl text-white font-normal drop-shadow-md">
                  {promo.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 pt-4">
              {/* Giant Discount Number Highlight */}
              <div className="text-center mb-6">
                <div className="inline-block">
                  <span className="font-serif text-5xl sm:text-6xl font-normal text-[#141312] tracking-tight">
                    {promo.discountPercentage}%
                  </span>
                  <span className="font-serif italic text-3xl sm:text-4xl text-[#D45520] ml-2">
                    OFF
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 mt-2 font-sans max-w-md mx-auto leading-relaxed">
                  {promo.subtitle}
                </p>
              </div>

              {/* 3 Luxury Perks */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE4DC] shadow-xs mb-6 space-y-2.5">
                {promo.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-neutral-800 font-sans">
                    <span className="w-5 h-5 rounded-full bg-[#D45520]/10 text-[#D45520] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Pill */}
              <div className="flex items-center justify-between gap-3 p-3 bg-neutral-100 rounded-xl border border-dashed border-neutral-300 mb-6">
                <div className="flex items-center gap-2 pl-2">
                  <Tag className="w-4 h-4 text-[#D45520]" />
                  <span className="text-xs text-neutral-500 font-sans">Exclusive Code:</span>
                  <span className="font-mono font-bold text-sm text-neutral-900 tracking-wider">
                    {promo.couponCode}
                  </span>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 border border-neutral-300 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleClaimOffer}
                  className="w-full py-4 px-6 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {appliedToast ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Privilege Applied to Your Bag!</span>
                    </>
                  ) : (
                    <>
                      <span>{promo.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full py-2 text-center text-xs text-neutral-500 hover:text-neutral-800 transition-colors font-sans"
                >
                  I will explore at standard price
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

