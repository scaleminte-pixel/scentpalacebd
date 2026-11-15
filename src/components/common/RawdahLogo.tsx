'use client';

import React from 'react';
import Link from 'next/link';
import { useBranding } from '@/context/BrandingContext';

interface LogoProps {
  variant?: 'light' | 'dark' | 'header';
  className?: string;
  showSubtitle?: boolean;
  /** Set false when the logo is already inside a link (avoids nested <a>). */
  asLink?: boolean;
}

export const RawdahLogo: React.FC<LogoProps> = ({
  variant = 'dark',
  className = '',
  showSubtitle = true,
  asLink = true,
}) => {
  const isLight = variant === 'light';
  const branding = useBranding();
  const storeName = branding?.storeName || 'Scent Palace BD';

  // "light" variant sits on dark backgrounds (header bar, footer) → main logo.
  // "dark" variant sits on light backgrounds (mobile menu) → dark logo, else main.
  const logoUrl = isLight
    ? branding?.storefrontLogoUrl || branding?.storefrontLogoDarkUrl || ''
    : branding?.storefrontLogoDarkUrl || branding?.storefrontLogoUrl || '';

  const Wrapper: React.FC<{ className: string; children: React.ReactNode }> = ({ className: c, children }) =>
    asLink ? (
      <Link href="/" className={c} aria-label="Home">
        {children}
      </Link>
    ) : (
      <span className={c}>{children}</span>
    );

  if (logoUrl) {
    return (
      <Wrapper className={`inline-flex items-center select-none group transition-opacity hover:opacity-90 ${className}`}>
        <img src={logoUrl} alt={storeName} className="h-8 md:h-10 w-auto object-contain" />
      </Wrapper>
    );
  }

  const words = storeName.split(' ');
  const main = storeName.toLowerCase().includes('scent palace') ? 'Scent Palace' : words[0];
  const sub = storeName.toLowerCase().includes('scent palace')
    ? 'Haute Parfumerie • BD'
    : words.length > 1
    ? words.slice(1).join(' ')
    : 'Haute Parfumerie';

  return (
    <Wrapper className={`inline-flex flex-col items-start select-none group transition-opacity hover:opacity-90 ${className}`}>
      <span className="flex items-center gap-2">
        <span
          className={`font-serif text-2xl md:text-3xl tracking-tight font-medium ${isLight ? 'text-white' : 'text-neutral-900'}`}
          style={{ letterSpacing: '0.02em' }}
        >
          {main}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-amber-400' : 'bg-[#D45520]'}`} />
      </span>
      {showSubtitle && (
        <span
          className={`text-[9px] uppercase tracking-[0.28em] font-medium transition-colors -mt-0.5 ${
            isLight ? 'text-neutral-300' : 'text-neutral-500'
          }`}
        >
          {sub}
        </span>
      )}
    </Wrapper>
  );
};
