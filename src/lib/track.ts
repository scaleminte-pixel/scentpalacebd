'use client';

/**
 * Client-side e-commerce event tracking. Sends standard events to every
 * enabled platform (Meta Pixel, GA4 / GTM, TikTok) and to the store's own
 * analytics (admin → Analytics).
 */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    ttq?: { track: (...a: any[]) => void; page: () => void };
    __trackingTags?: { meta?: boolean; google?: boolean; tiktok?: boolean };
  }
}

export interface TrackItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export type StandardEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

interface EventData {
  items?: TrackItem[];
  value?: number;
  orderId?: string;
}

// Purchase is recorded server-side when the order is created (ORDER_PLACED).
const INTERNAL: Partial<Record<StandardEvent, string>> = {
  PageView: 'PAGE_VIEW',
  ViewContent: 'PRODUCT_VIEW',
  AddToCart: 'ADD_TO_CART',
  InitiateCheckout: 'CHECKOUT_START',
};

const GA4_NAME: Record<StandardEvent, string> = {
  PageView: 'page_view',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
};

const TIKTOK_NAME: Partial<Record<StandardEvent, string>> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'CompletePayment',
};

function deviceType() {
  const w = window.innerWidth;
  return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

function sendInternal(eventType: string, metadata?: Record<string, unknown>) {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer;
    const body = JSON.stringify({
      eventType,
      path: window.location.pathname,
      referrer: ref && !ref.startsWith(window.location.origin) ? ref : null,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      device: deviceType(),
      metadata,
    });
    // keepalive lets the request finish even if the user navigates away
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** True while an enabled tag's script has not initialised yet. */
function tagsStillLoading(): boolean {
  const t = window.__trackingTags;
  if (!t) return false;
  return Boolean(
    (t.meta && !window.fbq) || (t.google && !window.gtag && !window.dataLayer) || (t.tiktok && !window.ttq)
  );
}

function sendToPixels(event: StandardEvent, data: EventData, items: TrackItem[], value: number, attempt = 0) {
  // Tags load after the page is interactive; retry early events (max ~5s).
  if (tagsStillLoading() && attempt < 12) {
    setTimeout(() => sendToPixels(event, data, items, value, attempt + 1), 400);
    return;
  }
  const currency = 'BDT';

  try {
    if (window.fbq) {
      if (event === 'PageView') {
        window.fbq('track', 'PageView');
      } else {
        window.fbq(
          'track',
          event,
          {
            content_ids: items.map((i) => i.id),
            content_type: 'product',
            contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
            num_items: items.reduce((s, i) => s + i.quantity, 0),
            value,
            currency,
          },
          data.orderId ? { eventID: data.orderId } : undefined
        );
      }
    }
  } catch {}

  try {
    if (event !== 'PageView') {
      const ecommerce = {
        currency,
        value,
        transaction_id: data.orderId,
        items: items.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          item_variant: i.variant,
          price: i.price,
          quantity: i.quantity,
        })),
      };
      if (window.gtag) window.gtag('event', GA4_NAME[event], ecommerce);
      else if (window.dataLayer) window.dataLayer.push({ event: GA4_NAME[event], ecommerce });
    }
  } catch {}

  try {
    const tt = TIKTOK_NAME[event];
    if (window.ttq && tt) {
      window.ttq.track(tt, {
        contents: items.map((i) => ({ content_id: i.id, content_name: i.name, quantity: i.quantity, price: i.price })),
        content_type: 'product',
        value,
        currency,
      });
    }
  } catch {}
}

export function trackEvent(event: StandardEvent, data: EventData = {}, opts: { pixels?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  const items = data.items || [];
  const value = data.value ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (opts.pixels !== false) sendToPixels(event, data, items, value);

  const internal = INTERNAL[event];
  if (internal) {
    sendInternal(
      internal,
      event === 'PageView' ? undefined : { value, items: items.map((i) => ({ id: i.id, q: i.quantity })) }
    );
  }
}
