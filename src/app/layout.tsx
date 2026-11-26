import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CartProvider } from '@/context/CartContext';
import { ContentProvider } from '@/context/ContentContext';
import { StorefrontShell } from '@/components/common/StorefrontShell';
import { DynamicFavicon } from '@/components/common/DynamicFavicon';
import { getServerSections } from '@/lib/server-catalog';
import { getBranding } from '@/lib/branding';
import { BrandingProvider } from '@/context/BrandingContext';
import { Suspense } from 'react';
import { TrackingScripts } from '@/components/common/TrackingScripts';
import { getTrackingConfig } from '@/lib/tracking-config';

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Mobile browser bar in Deep Emerald (brand primary)
export const viewport: Viewport = {
  themeColor: '#033528',
};

export async function generateMetadata(): Promise<Metadata> {
  const [branding, tracking] = await Promise.all([getBranding(), getTrackingConfig()]);
  const favicon = branding.faviconUrl || '/favicon.ico';
  const storeName = branding.storeName;
  const faviconType = favicon.endsWith('.png')
    ? 'image/png'
    : favicon.endsWith('.svg')
    ? 'image/svg+xml'
    : favicon.endsWith('.webp')
    ? 'image/webp'
    : 'image/x-icon';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: `${storeName} | Artisanal Luxury Fragrances & Royal Ouds`,
    description:
      `Experience the sovereign world of ${storeName}. Blended with rare Cambodian oud, Baltic amber, and Taif roses. Complimentary shipping across Bangladesh.`,
    keywords: [
      'luxury perfume',
      'oud',
      'attar',
      'scent palace bd',
      'perfume bangladesh',
      'bleu oud',
      'oud ambre',
      'extrait de parfum',
      'dhaka luxury fragrance',
    ],
    icons: {
      icon: [{ url: favicon, type: faviconType }],
      shortcut: favicon,
      apple: branding.faviconUrl || '/brand/apple-touch-icon.png',
    },
    verification: {
      ...(tracking.googleVerification ? { google: tracking.googleVerification } : {}),
      ...(tracking.facebookDomainVerification
        ? { other: { 'facebook-domain-verification': tracking.facebookDomainVerification } }
        : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialSections, branding, tracking] = await Promise.all([
    getServerSections(),
    getBranding(),
    getTrackingConfig(),
  ]);

  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${plusJakartaSans.variable} ${inter.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-[#F7F2E6] text-[#1C1C1C] selection:bg-[#033528] selection:text-white font-sans">
        {/* Tells trackEvent() which tags will load, so early events wait for them */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__trackingTags=${JSON.stringify({
              meta: Boolean(tracking.metaPixelId),
              google: Boolean(tracking.ga4Id || tracking.gtmId),
              tiktok: Boolean(tracking.tiktokPixelId),
            })};`,
          }}
        />
        <DynamicFavicon />
        <Suspense fallback={null}>
          <TrackingScripts config={tracking} />
        </Suspense>
        <BrandingProvider initialBranding={branding}>
          <CurrencyProvider>
            <CartProvider>
              <ContentProvider initialSections={initialSections}>
                <StorefrontShell>{children}</StorefrontShell>
              </ContentProvider>
            </CartProvider>
          </CurrencyProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
