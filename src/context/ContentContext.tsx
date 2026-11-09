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
      const res = await fetch('/api/content');
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
    // Only trigger initial client-side fetch if server didn't pre-hydrate the sections
    if (!initialSections || Object.keys(initialSections).length === 0) {
      fetchContent();
    }
  }, [fetchContent, initialSections]);

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
