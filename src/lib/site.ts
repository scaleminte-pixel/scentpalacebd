/**
 * Public site address used for canonical links, sitemap, robots.txt, JSON-LD and llms.txt.
 * Falls back to the production domain when NEXT_PUBLIC_SITE_URL is missing or points to localhost,
 * so canonical URLs never leak a dev address.
 */
const PRODUCTION_URL = 'https://scentpalacebd.com';

export const SITE_URL = (() => {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (!env || /localhost|127\.0\.0\.1/.test(env)) return PRODUCTION_URL;
  return env;
})();

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
