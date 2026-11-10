'use client';

import { useEffect } from 'react';

export function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      fetch('/api/branding')
        .then((res) => res.json())
        .then((data) => {
          if (data.faviconUrl) {
            let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;

            // Also update apple-touch-icon if present
            const appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
            if (appleLink) {
              appleLink.href = data.faviconUrl;
            }
          }
        })
        .catch(() => {});
    };

    updateFavicon();
    window.addEventListener('branding_updated', updateFavicon);
    window.addEventListener('storage', updateFavicon);

    return () => {
      window.removeEventListener('branding_updated', updateFavicon);
      window.removeEventListener('storage', updateFavicon);
    };
  }, []);

  return null;
}

