'use client';

import React, { useState } from 'react';
import { REVIEWS } from '@/data/reviews';
import { Star, ArrowLeft, ArrowRight, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

export const ReviewsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Total slides count (showing 2 cards per view on large screens, or 1 on mobile)
  const maxIndex = REVIEWS.length - 2;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const progressPercent = Math.round(((currentIndex + 1) / (maxIndex + 1)) * 100);

  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* TOP CENTER HEADER: Reveal heading first, then rating strip */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: LUXURY_EASE }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight leading-tight"
          >
            Read reviews,
            <br />
            <span className="italic text-neutral-800">wear with sovereign confidence.</span>
          </motion.h2>

          {/* Rating Strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, delay: 0.18, ease: LUXURY_EASE }}
            className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-neutral-600 font-sans"
          >
            <span className="font-bold text-neutral-900">4.9/5</span>
            <div className="flex text-emerald-600">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              ))}
            </div>
            <span className="font-semibold text-neutral-900">Verified Connoisseurs</span>
            <span className="text-neutral-400">• Based on 1,450+ reviews across Bangladesh</span>
          </motion.div>
        </div>

        {/* ASYMMETRICAL SLIDER LAYOUT: LEFT CONTROLS + RIGHT CAROUSEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Big Quote Icon + Heading + Slider Controls */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, delay: 0.25, ease: LUXURY_EASE }}
            className="lg:col-span-4 flex flex-col justify-between pr-4"
          >
            <div>
              {/* Decorative Big Quotation Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#F4EFEB] border border-[#EAE4DC] flex items-center justify-center text-neutral-400 mb-6">
                <Quote className="w-7 h-7 rotate-180 text-neutral-500 fill-neutral-300" />
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-900 leading-snug">
                What our connoisseurs are saying
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans leading-relaxed">
                Authentic testimonials from patrons across Dhaka, Chittagong, Sylhet, and beyond.
              </p>
            </div>

            {/* Slider Controls (Arrow Left, Progress Line, Arrow Right) */}
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-11 h-11 rounded-full border border-neutral-300 bg-white hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:scale-105 active:scale-95"
                aria-label="Previous review"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Progress Line */}
              <div className="w-24 sm:w-32 h-1 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className="w-11 h-11 rounded-full border border-neutral-300 bg-white hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs hover:scale-105 active:scale-95"
                aria-label="Next review"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Sliding Testimonial Cards with stable card heights */}
          <div className="lg:col-span-8 overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                transform: `translateX(-${currentIndex * 52}%)`,
              }}
            >
              {REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="w-full md:w-[calc(50%-12px)] shrink-0 h-[260px] sm:h-[280px] bg-white rounded-3xl p-7 border border-[#EAE4DC] shadow-xs flex flex-col justify-between relative group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="overflow-hidden">
                    {/* Review Comment Text */}
                    <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-sans mb-4 line-clamp-4">
                      &ldquo;{review.comment}&rdquo;
                    </p>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-1 text-emerald-600 mb-2">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                      ))}
                    </div>
                  </div>

                  {/* Reviewer Profile */}
                  <div className="pt-4 border-t border-[#F4EFEB] flex items-center gap-3">
                    {/* Avatar Initials Circle */}
                    <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-xs font-bold text-neutral-800 shrink-0">
                      {review.author
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm font-medium text-neutral-900 truncate">
                        {review.author}
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-sans truncate">
                        {review.date} • {review.city}
                      </p>
                    </div>

                    <span className="text-[10px] px-2 py-1 rounded-full bg-[#FDF3EE] text-[#D45520] font-semibold shrink-0">
                      {review.productName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
