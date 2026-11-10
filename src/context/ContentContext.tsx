'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ContentContextType {
  sections: Record<string, any>;
  isLoading: boolean;
  getSection: (key: string, fallback?: any) => any;
  getContent: <T extends Record<string, any>>(key: string, defaultFields: T) => T;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

interface ContentProviderProps {
  children: React.ReactNode;
  initialSections?: Record<string, any>;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children, initialSections = {} }) => {
  const [sections, setSections] = useState<Record<string, any>>(initialSections);
  const [isLoading, setIsLoading] = useState(!initialSections || Object.keys(initialSections).length === 0);

  const fetchContent = useCallback(async () => {
    try {
      // Append timestamp & use cache: 'no-store' to guarantee 0s latency on content updates
      const res = await fetch(`/api/content?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.sections) {
          setSections(data.sections);
        }
      }
    } catch (err) {
      console.warn('ContentContext: using local defaults fallback', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Always fetch fresh content on client mount
    fetchContent();

    // 2. Auto-refresh when tab gains focus (e.g. user edits in admin and switches to storefront)
    const handleFocus = () => {
      fetchContent();
    };
    window.addEventListener('focus', handleFocus);

    // 3. Cross-tab instant notification when an admin saves content/banners
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rawdah_content_updated' || e.key === 'rawdah_cache_purge') {
        fetchContent();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Custom event for immediate same-page updates
    const handleCustomSync = () => {
      fetchContent();
    };
    window.addEventListener('rawdah:content-updated', handleCustomSync);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('rawdah:content-updated', handleCustomSync);
    };
  }, [fetchContent]);

  const getSection = useCallback(
    (key: string, fallback: any = null) => {
      return sections[key] || fallback;
    },
    [sections]
  );

  const getContent = useCallback(
    <T extends Record<string, any>>(key: string, defaultFields: T): T => {
      const sec = sections[key];
      if (!sec || !sec.content) return defaultFields;
      return { ...defaultFields, ...sec.content };
    },
    [sections]
  );

  return (
    <ContentContext.Provider
      value={{
        sections,
        isLoading,
        getSection,
        getContent,
        refreshContent: fetchContent,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
