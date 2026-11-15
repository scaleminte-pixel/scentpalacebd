'use client';

import { useEffect } from 'react';

/**
 * The favicon is rendered server-side in <head> via layout metadata, so it is
 * correct on first load. This component only swaps it live after the admin
 * changes branding. It NEVER removes <link> tags (React owns them — removing
 * them crashes client-side navigation); it only updates their href, or adds
 * its own tag marked data-dynamic-favicon.
 */
export function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      fetch('/api/branding', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (!data?.faviconUrl) return;
          const href = `${data.faviconUrl}?v=${Date.now()}`;
          const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
          if (links.length > 0) {
            links.forEach((el) => {
              el.href = href;
              el.removeAttribute('type');
            });
          } else {
            let own = document.querySelector<HTMLLinkElement>('link[data-dynamic-favicon]');
            if (!own) {
              own = document.createElement('link');
              own.rel = 'icon';
              own.setAttribute('data-dynamic-favicon', '');
              document.head.appendChild(own);
            }
            own.href = href;
          }
        })
        .catch(() => {});
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'rawdah_branding_updated') updateFavicon();
    };
    window.addEventListener('branding_updated', updateFavicon);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('branding_updated', updateFavicon);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return null;
}
