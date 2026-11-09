'use client';

import React from 'react';
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
  });

  return (
    <aside
      aria-label="Announcement"
      className="no-print announcement-bar bg-[#141312] text-[#ECE7DF] text-xs py-2 px-4 border-b border-neutral-800 transition-colors print:hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left spacer on desktop */}
        <div className="hidden md:block w-24" />

        {/* Center message */}
        <div className="flex-1 text-center font-medium tracking-wide flex items-center justify-center gap-2 text-neutral-200 text-[11px] sm:text-xs">
          <Sparkles className="w-3 h-3 text-[#D45520]" />
          <span>{content.text}</span>
          {content.highlightCode && (
            <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-amber-300 ml-1">
              Use code: {content.highlightCode}
            </span>
          )}
        </div>

        {/* Right currency toggle */}
        <div className="flex items-center justify-end w-auto md:w-24">
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
