'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'BDT' | 'USD';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amountInBDT: number) => string;
  symbol: string;
}

const BDT_TO_USD_RATE = 1 / 115; // 1 USD ≈ 115 BDT

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('BDT');

  useEffect(() => {
    const saved = localStorage.getItem('rawdah_currency') as CurrencyCode | null;
    if (saved && (saved === 'BDT' || saved === 'USD')) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('rawdah_currency', c);
  };

  const formatPrice = (amountInBDT: number): string => {
    if (currency === 'USD') {
      const usdAmount = amountInBDT * BDT_TO_USD_RATE;
      return `$${usdAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `৳${amountInBDT.toLocaleString('en-BD')}`;
  };

  const symbol = currency === 'BDT' ? '৳' : '$';

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

