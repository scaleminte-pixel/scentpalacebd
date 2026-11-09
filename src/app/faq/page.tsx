'use client';

import React from 'react';
import Link from 'next/link';
import { FAQSection } from '@/components/common/FAQSection';

export default function FAQPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <FAQSection />

      {/* Bespoke Inquiry Banner */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
        <div className="max-w-4xl mx-auto text-center bg-white rounded-3xl p-10 border border-[#EAE4DC] shadow-xs">
          <h3 className="font-serif text-2xl font-normal text-neutral-900 mb-2">
            Have a Bespoke Fragrance Inquiry?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6 font-sans">
            Our atelier concierges are available everyday to assist with bridal scents, private tastings, and corporate gifting.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
          >
            Contact Private Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
