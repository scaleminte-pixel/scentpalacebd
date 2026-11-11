'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'light' | 'dark' | 'header';
  className?: string;
  showSubtitle?: boolean;
}

export const RawdahLogo: React.FC<LogoProps> = ({
  variant = 'dark',
  className = '',
  showSubtitle = true,
}) => {
  const isLight = variant === 'light';
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('Scent Palace BD');

  useEffect(() => {
    const fetchLogo = () => {
      fetch('/api/branding')
        .then((r) => r.json())
        .then((data) => {
          if (data.storeName) setStoreName(data.storeName);
          if (isLight && data.storefrontLogoUrl) {
            setLogoUrl(data.storefrontLogoUrl);
          } else if (!isLight && data.storefrontLogoDarkUrl) {
            setLogoUrl(data.storefrontLogoDarkUrl);
          } else if (data.storefrontLogoUrl) {
            setLogoUrl(data.storefrontLogoUrl);
          } else {
            setLogoUrl('');
          }
        })
        .catch(() => {});
    };

    fetchLogo();
    window.addEventListener('branding_updated', fetchLogo);
    window.addEventListener('storage', fetchLogo);
    return () => {
      window.removeEventListener('branding_updated', fetchLogo);
      window.removeEventListener('storage', fetchLogo);
    };
  }, [isLight]);

  // If a custom logo image is set, render it
  if (logoUrl) {
    return (
      <Link
        href="/"
        className={`inline-flex items-center select-none group transition-opacity hover:opacity-90 ${className}`}
        aria-label="Home"
      >
        <img
          src={logoUrl}
          alt="Logo"
          className="h-8 md:h-10 w-auto object-contain"
        />
      </Link>
    );
  }

  // Default text logo fallback
  return (
    <Link
      href="/"
      className={`inline-flex flex-col items-start select-none group transition-opacity hover:opacity-90 ${className}`}
      aria-label="Home"
    >
      <div className="flex items-center gap-2">
        <span
          className={`font-serif text-2xl md:text-3xl tracking-tight font-medium ${
            isLight ? 'text-white' : 'text-neutral-900'
          }`}
          style={{ letterSpacing: '0.02em' }}
        >
          {storeName
            ? storeName.toLowerCase().includes('scent palace')
              ? 'Scent Palace'
              : storeName.split(' ')[0]
            : 'Scent Palace'}
        </span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLight ? 'bg-amber-400' : 'bg-[#D45520]'
          }`}
        />
      </div>
      {showSubtitle && (
        <span
          className={`text-[9px] uppercase tracking-[0.28em] font-medium transition-colors -mt-0.5 ${
            isLight ? 'text-neutral-300' : 'text-neutral-500'
          }`}
        >
          {storeName && storeName.toLowerCase().includes('scent palace')
            ? 'Haute Parfumerie • BD'
            : storeName && storeName.split(' ').length > 1
            ? storeName.split(' ').slice(1).join(' ')
            : 'Haute Parfumerie'}
        </span>
      )}
    </Link>
  );
};
