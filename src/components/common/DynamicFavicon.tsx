'use client';

import { useEffect } from 'react';

export function DynamicFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      fetch('/api/branding')
        .then((res) => res.json())
        .then((data) => {
          if (data.faviconUrl) {
            const versionedUrl = `${data.faviconUrl}?v=${Date.now()}`;
            const mimeType = data.faviconUrl.endsWith('.png')
              ? 'image/png'
              : data.faviconUrl.endsWith('.ico')
              ? 'image/x-icon'
              : 'image/webp';

            // Remove existing icon links to force browser tab refresh
            document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']").forEach((el) => el.remove());

            // Create fresh primary icon link
            const newIcon = document.createElement('link');
            newIcon.rel = 'icon';
            newIcon.type = mimeType;
            newIcon.href = versionedUrl;
            document.head.appendChild(newIcon);

            // Create fresh shortcut icon link
            const newShortcut = document.createElement('link');
            newShortcut.rel = 'shortcut icon';
            newShortcut.type = mimeType;
            newShortcut.href = versionedUrl;
            document.head.appendChild(newShortcut);

            // Create/update apple-touch-icon
            const newApple = document.createElement('link');
            newApple.rel = 'apple-touch-icon';
            newApple.href = versionedUrl;
            document.head.appendChild(newApple);
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

