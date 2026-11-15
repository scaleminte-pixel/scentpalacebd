'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Branding } from '@/lib/branding-defaults';

const BrandingContext = createContext<Branding | null>(null);

export const BrandingProvider: React.FC<{ initialBranding: Branding; children: React.ReactNode }> = ({
  initialBranding,
  children,
}) => {
  const [branding, setBranding] = useState<Branding>(initialBranding);

  useEffect(() => {
    // Only refetch when the admin signals a branding change — the initial
    // values are rendered on the server, so there is no flash on page load.
    const reload = (e?: Event) => {
      if (e instanceof StorageEvent && e.key !== 'rawdah_branding_updated') return;
      fetch('/api/branding', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          if (!data) return;
          // Preload the new logo first so the old logo/name never flashes.
          const url = data.storefrontLogoUrl || data.storefrontLogoDarkUrl;
          const apply = () => setBranding((prev) => ({ ...prev, ...data }));
          if (!url) return apply();
          const img = new window.Image();
          img.onload = apply;
          img.onerror = apply;
          img.src = url;
        })
        .catch(() => {});
    };
    window.addEventListener('branding_updated', reload);
    window.addEventListener('storage', reload);
    return () => {
      window.removeEventListener('branding_updated', reload);
      window.removeEventListener('storage', reload);
    };
  }, []);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
};

export function useBranding(): Branding | null {
  return useContext(BrandingContext);
}
