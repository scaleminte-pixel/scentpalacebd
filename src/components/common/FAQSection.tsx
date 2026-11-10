'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useContent } from '@/context/ContentContext';

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: 'How long do Rāwdah perfumes last on skin and clothes?',
    a: 'Because our formulations are pure Extrait de Parfum (25% – 30% oil concentration), they easily last 14 to 18+ hours on skin and multiple days on clothing. You do not need to re-spray throughout the day.',
  },
  {
    q: 'How does the "Sample First" policy work?',
    a: 'Every full-size flacon arrives with a complimentary unsealed 2ml sample vial. Test the scent on your skin first. If it does not resonate with you, simply return the sealed master box for a full refund or exchange.',
  },
  {
    q: 'Are your ouds made from 100% genuine aged agarwood?',
    a: 'Yes, without exception. We source wild Cambodian agarwood from Pursat and wild Assam oud, aged in oak barrels for up to 20 years to achieve pure balsamic depth with zero synthetic sharpness.',
  },
  {
    q: 'How fast is delivery in Dhaka and across Bangladesh?',
    a: 'Inside Dhaka, parcels arrive within 24–48 hours via dedicated couriers. Nationwide across all 64 districts, delivery takes 2–4 business days. Orders over ৳5,000 enjoy free express delivery.',
  },
  {
    q: 'What payment options do you offer for online orders?',
    a: 'We accept Cash on Delivery (COD) across all districts of Bangladesh, as well as bKash, Nagad, Rocket, and all major Visa, Mastercard, and Amex credit/debit cards.',
  },
  {
    q: 'Can I test the fragrances before purchasing online?',
    a: 'Yes. You can order our 5-Piece Discovery Coffret to test at home, or visit our flagship sensory tasting salon in Road 11, Block D, Gulshan-2, Dhaka (Everyday 11 AM – 10 PM).',
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({
  title = 'Frequently asked questions',
  subtitle = 'Here are some common questions about our royal extraits, longevity, and nationwide shipping.',
  items = DEFAULT_FAQS,
}) => {
  const { getContent, getSection } = useContent();
  const [openIndices, setOpenIndices] = useState<number[]>([0]); // Open first item by default like reference

  const sec = getSection('faq');
  if (sec && !sec.isVisible) return null;

  const dynamicFaq = getContent('faq', {
    title: 'Frequently asked questions',
    subtitle: 'Here are some common questions about our royal extraits, longevity, and nationwide shipping.',
    items: DEFAULT_FAQS,
  });

  const displayTitle = title !== 'Frequently asked questions' ? title : dynamicFaq.title || title;
  const displaySubtitle = subtitle !== 'Here are some common questions about our royal extraits, longevity, and nationwide shipping.' ? subtitle : dynamicFaq.subtitle || subtitle;
  const displayItems = items !== DEFAULT_FAQS ? items : (dynamicFaq.items && dynamicFaq.items.length > 0 ? dynamicFaq.items : DEFAULT_FAQS);

  // Track open state for each FAQ card by index

  const toggleItem = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Split items into 2 balanced columns (matching reference 2-column layout)
  const midpoint = Math.ceil(displayItems.length / 2);
  const leftCol = displayItems.slice(0, midpoint);
  const rightCol = displayItems.slice(midpoint);

  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-6xl mx-auto">
        {/* =====================================================================
            TOP BADGE & TITLE: DIRECTLY MATCHING USER'S REFERENCE IMAGE
           ===================================================================== */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          {/* Red/Orange Dot Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs font-semibold text-neutral-800 shadow-2xs mb-4">
            <span className="w-2 h-2 rounded-full bg-[#D45520]" />
            <span>FAQs</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight leading-tight">
            {displayTitle}
          </h2>

          {displaySubtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-3 font-sans leading-relaxed">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* =====================================================================
            2-COLUMN GRID OF DISTINCT ROUNDED CARDS (MATCHING REFERENCE)
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-4">
            {leftCol.map((faq, i) => {
              const actualIdx = i;
              const isOpen = openIndices.includes(actualIdx);
              return (
                <div
                  key={actualIdx}
                  className="bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-2xs transition-all hover:border-neutral-300"
                >
                  <div
                    onClick={() => toggleItem(actualIdx)}
                    className="flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                      {faq.q}
                    </h3>

                    {/* Circular Dark Button with Plus / Minus (Matching Reference) */}
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                      className="w-8 h-8 rounded-full bg-[#141312] hover:bg-neutral-800 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95"
                    >
                      {isOpen ? (
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Answer */}
                  {isOpen && (
                    <div className="pt-3 mt-3 border-t border-[#F4EFEB] text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {rightCol.map((faq, i) => {
              const actualIdx = midpoint + i;
              const isOpen = openIndices.includes(actualIdx);
              return (
                <div
                  key={actualIdx}
                  className="bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-2xs transition-all hover:border-neutral-300"
                >
                  <div
                    onClick={() => toggleItem(actualIdx)}
                    className="flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                      {faq.q}
                    </h3>

                    {/* Circular Dark Button with Plus / Minus (Matching Reference) */}
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                      className="w-8 h-8 rounded-full bg-[#141312] hover:bg-neutral-800 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95"
                    >
                      {isOpen ? (
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>

                  {/* Expandable Answer */}
                  {isOpen && (
                    <div className="pt-3 mt-3 border-t border-[#F4EFEB] text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

