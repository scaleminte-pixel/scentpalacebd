'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useContent } from '@/context/ContentContext';
import { Sparkles } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const { getContent, getSection } = useContent();

  const sec = getSection('announcement');
  if (sec && !sec.isVisible) return null;

  const content = getContent('announcement', {
    text: 'Complimentary 2ml extrait sample & free express delivery on orders over ৳5,000',
    highlightCode: 'ROYAL15',
    linkUrl: '/shop',
  });

  const MessageInner = (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs leading-tight font-medium tracking-wide text-neutral-200">
      <Sparkles className="w-3 h-3 text-[#D45520] shrink-0" />
      <span className="text-center">{content.text}</span>
      {content.highlightCode && (
        <span className="font-mono text-[9px] sm:text-[10px] bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded text-amber-300 font-semibold shrink-0 inline-flex items-center">
          Use code: <strong className="ml-1 text-amber-200 font-bold">{content.highlightCode}</strong>
        </span>
      )}
    </div>
  );

  return (
    <aside
      aria-label="Announcement"
      className="no-print announcement-bar bg-[#141312] text-[#ECE7DF] py-1.5 sm:py-2 px-3 sm:px-4 border-b border-neutral-800 transition-colors print:hidden relative z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left balance spacer on desktop */}
        <div className="hidden md:block w-24 shrink-0" />

        {/* Center announcement message with clean responsive wrapping */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1">
          {content.linkUrl ? (
            <Link
              href={content.linkUrl}
              className="hover:text-white transition-colors flex items-center justify-center"
            >
              {MessageInner}
            </Link>
          ) : (
            MessageInner
          )}
        </div>

        {/* Right currency toggle - DESKTOP ONLY to prevent mobile overlap (mobile already has currency in navbar) */}
        <div className="hidden md:flex items-center justify-end w-24 shrink-0">
          <button
            type="button"
            onClick={() => setCurrency(currency === 'BDT' ? 'USD' : 'BDT')}
            className="text-neutral-400 hover:text-white transition-colors text-[11px] font-medium tracking-wider flex items-center gap-1 cursor-pointer"
            title="Switch currency"
          >
            <span>{currency}</span>
            <span className="text-[10px] text-neutral-500">({currency === 'BDT' ? '৳' : '$'})</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
