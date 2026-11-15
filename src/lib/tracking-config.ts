import { prisma } from '@/lib/db';

export interface TrackingConfig {
  metaPixelId: string;
  ga4Id: string;
  gtmId: string;
  tiktokPixelId: string;
  googleVerification: string;
  facebookDomainVerification: string;
}

export const EMPTY_TRACKING: TrackingConfig = {
  metaPixelId: '',
  ga4Id: '',
  gtmId: '',
  tiktokPixelId: '',
  googleVerification: '',
  facebookDomainVerification: '',
};

const on = (v: unknown) => v === true || v === 'true';

/** Accepts either the bare token or a full pasted <meta ... content="..."> tag. */
function metaContent(v: string): string {
  const m = v.match(/content=["']([^"']+)["']/i);
  return (m ? m[1] : v).replace(/^google-site-verification=/i, '').trim();
}

/** Tracking IDs from admin → Integrations. Only enabled AND well-formed IDs are used. */
export async function getTrackingConfig(): Promise<TrackingConfig> {
  try {
    const rows = await prisma.storeSetting.findMany({
      where: {
        OR: ['metaPixel_', 'ga4_', 'gtm_', 'tiktokPixel_', 'searchConsole_', 'fbDomain_'].map((p) => ({
          key: { startsWith: p },
        })),
      },
    });
    const m: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        m[r.key] = JSON.parse(r.valueJson);
      } catch {
        m[r.key] = r.valueJson;
      }
    }
    const str = (k: string) => String(m[k] ?? '').trim();

    const pixel = str('metaPixel_pixelId');
    const ga4 = str('ga4_measurementId').toUpperCase();
    const gtm = str('gtm_containerId').toUpperCase();
    const tiktok = str('tiktokPixel_pixelId').toUpperCase();
    const gVerify = metaContent(str('ga4_verificationMeta') || str('searchConsole_verificationMeta'));
    const fbVerify = metaContent(str('fbDomain_domainToken'));

    return {
      metaPixelId: on(m.metaPixel_enabled) && /^\d{10,20}$/.test(pixel) ? pixel : '',
      ga4Id: on(m.ga4_enabled) && /^G-[A-Z0-9]{4,16}$/.test(ga4) ? ga4 : '',
      gtmId: on(m.gtm_enabled) && /^GTM-[A-Z0-9]{4,12}$/.test(gtm) ? gtm : '',
      tiktokPixelId: on(m.tiktokPixel_enabled) && /^[A-Z0-9]{10,30}$/.test(tiktok) ? tiktok : '',
      googleVerification: /^[\w-]{10,100}$/.test(gVerify) ? gVerify : '',
      facebookDomainVerification: /^[a-z0-9]{10,60}$/i.test(fbVerify) ? fbVerify : '',
    };
  } catch {
    return EMPTY_TRACKING;
  }
}
