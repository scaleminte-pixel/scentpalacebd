import { prisma } from '@/lib/db';
import { DEFAULT_BRANDING, DEFAULT_STORE_NAME, type Branding } from '@/lib/branding-defaults';

export { DEFAULT_BRANDING, DEFAULT_STORE_NAME };
export type { Branding };

export async function getBranding(): Promise<Branding> {
  try {
    const settings = await prisma.storeSetting.findMany();
    const m: Record<string, any> = {};
    for (const s of settings) {
      try {
        m[s.key] = JSON.parse(s.valueJson);
      } catch {
        m[s.key] = s.valueJson;
      }
    }
    const storeName = m.storeName || DEFAULT_STORE_NAME;
    return {
      storefrontLogoUrl: m.storefrontLogoUrl || DEFAULT_BRANDING.storefrontLogoUrl,
      storefrontLogoDarkUrl: m.storefrontLogoDarkUrl || DEFAULT_BRANDING.storefrontLogoDarkUrl,
      faviconUrl: m.faviconUrl || '',
      adminLogoUrl: m.adminLogoUrl || DEFAULT_BRANDING.adminLogoUrl,
      adminBrandTitle: m.adminBrandTitle || storeName,
      adminBrandSubtitle: m.adminBrandSubtitle || 'Admin Console',
      adminHideText: m.adminHideText === true || m.adminHideText === 'true',
      storeName,
      storeAddress: m.storeAddress || DEFAULT_BRANDING.storeAddress,
      storeEmail: m.storeEmail || DEFAULT_BRANDING.storeEmail,
      storePhone: m.storePhone || DEFAULT_BRANDING.storePhone,
      footerWatermarkText: m.footerWatermarkText || '',
      footerWatermarkSubtitle: m.footerWatermarkSubtitle || '',
      facebookUrl: typeof m.facebookUrl === 'string' ? m.facebookUrl.trim() : '',
      instagramUrl: typeof m.instagramUrl === 'string' ? m.instagramUrl.trim() : '',
      tiktokUrl: typeof m.tiktokUrl === 'string' ? m.tiktokUrl.trim() : '',
      youtubeUrl: typeof m.youtubeUrl === 'string' ? m.youtubeUrl.trim() : '',
      xUrl: typeof m.xUrl === 'string' ? m.xUrl.trim() : '',
      whatsappNumber: typeof m.whatsappNumber === 'string' ? m.whatsappNumber.trim() : '',
    };
  } catch (error) {
    console.error('getBranding error:', error);
    return DEFAULT_BRANDING;
  }
}
