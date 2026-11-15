export interface Branding {
  storefrontLogoUrl: string;
  storefrontLogoDarkUrl: string;
  faviconUrl: string;
  adminLogoUrl: string;
  adminBrandTitle: string;
  adminBrandSubtitle: string;
  adminHideText: boolean;
  storeName: string;
  storeAddress: string;
  storeEmail: string;
  storePhone: string;
  footerWatermarkText: string;
  footerWatermarkSubtitle: string;
}

export const DEFAULT_STORE_NAME = 'Scent Palace BD';

export const DEFAULT_BRANDING: Branding = {
  storefrontLogoUrl: '',
  storefrontLogoDarkUrl: '',
  faviconUrl: '',
  adminLogoUrl: '',
  adminBrandTitle: DEFAULT_STORE_NAME,
  adminBrandSubtitle: 'Admin Console',
  adminHideText: false,
  storeName: DEFAULT_STORE_NAME,
  storeAddress: 'Road 11, Block D, Banani / Gulshan-2, Dhaka 1213, Bangladesh',
  storeEmail: 'concierge@scentpalacebd.com',
  storePhone: '+880 1711-000000',
  footerWatermarkText: '',
  footerWatermarkSubtitle: '',
};
