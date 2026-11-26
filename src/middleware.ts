import { NextRequest, NextResponse } from 'next/server';

/**
 * 1. Passes the request path to server components (x-pathname) so the root layout can
 *    emit a correct <link rel="canonical"> for every page.
 * 2. Content negotiation for AI agents: a request that prefers text/markdown over HTML
 *    gets a Markdown version of the page (served by /api/markdown).
 */
const MARKDOWN_PAGES = /^\/($|shop\/?$|product\/[^/]+\/?$|our-story\/?$|about\/?$|contact\/?$|faq\/?$|shipping-returns\/?$|privacy-policy\/?$)/;

function wantsMarkdown(accept: string): boolean {
  if (!accept.includes('text/markdown')) return false;
  // Browsers send text/html first; only switch when markdown is preferred or html is absent.
  const parts = accept.split(',').map((p) => p.trim().split(';')[0]);
  const md = parts.indexOf('text/markdown');
  const html = parts.indexOf('text/html');
  return html === -1 || md < html;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accept = req.headers.get('accept') || '';

  if (req.method === 'GET' && MARKDOWN_PAGES.test(pathname) && wantsMarkdown(accept)) {
    const url = req.nextUrl.clone();
    url.pathname = '/api/markdown';
    url.search = `?path=${encodeURIComponent(pathname)}`;
    return NextResponse.rewrite(url);
  }

  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  const res = NextResponse.next({ request: { headers } });
  // Caches must keep HTML and Markdown variants apart
  if (MARKDOWN_PAGES.test(pathname)) res.headers.set('Vary', 'Accept');
  return res;
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension (images, robots.txt, …)
  matcher: ['/((?!api|_next/static|_next/image|admin|.*\\.[a-zA-Z0-9]+$).*)'],
};
