'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { TrackingConfig } from '@/lib/tracking-config';
import { trackEvent } from '@/lib/track';

const META_PIXEL = (id: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;

const GTM = (id: string) =>
  `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;

const GA4 = (id: string) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}');`;

const TIKTOK = (id: string) =>
  `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id}');ttq.page();}(window,document,'ttq');`;

/**
 * Loads enabled tracking tags on the storefront only (never in /admin), after
 * the page is interactive so they don't delay first paint, and records a page
 * view on every client-side navigation.
 */
export function TrackingScripts({ config }: { config: TrackingConfig }) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const isAdmin = pathname.startsWith('/admin');
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (isAdmin) return;
    const full = `${pathname}?${searchParams?.toString() || ''}`;
    if (lastPath.current === full) return;
    const isFirst = lastPath.current === null;
    lastPath.current = full;

    if (isFirst) {
      // The pixel/GA base code already sends the first page view; only record it internally.
      trackEvent('PageView', {}, { pixels: false });
      return;
    }
    trackEvent('PageView');
    if (window.gtag && config.ga4Id) {
      window.gtag('event', 'page_view', { page_location: window.location.href, page_path: pathname });
    }
    if (window.ttq) window.ttq.page();
  }, [pathname, searchParams, isAdmin, config.ga4Id]);

  if (isAdmin) return null;

  // Tell trackEvent() which tags are coming so early events wait for them.
  if (typeof window !== 'undefined') {
    (window as any).__trackingTags = {
      meta: Boolean(config.metaPixelId),
      google: Boolean(config.ga4Id || config.gtmId),
      tiktok: Boolean(config.tiktokPixelId),
    };
  }

  return (
    <>
      {config.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {META_PIXEL(config.metaPixelId)}
        </Script>
      )}
      {config.gtmId && (
        <Script id="gtm" strategy="afterInteractive">
          {GTM(config.gtmId)}
        </Script>
      )}
      {config.ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${config.ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {GA4(config.ga4Id)}
          </Script>
        </>
      )}
      {config.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {TIKTOK(config.tiktokPixelId)}
        </Script>
      )}
    </>
  );
}
