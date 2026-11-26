import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * robots.txt — crawl policy, Content Signals (contentsignals.org) and sitemap pointer.
 * Private areas (admin, checkout, cart, APIs, order pages) are kept out of crawlers.
 */
export function GET() {
  const body = [
    '# Scent Palace BD — crawl policy',
    '# Content Signals: search = may index and show results; ai-input = may be used to answer',
    '# questions with a link back; ai-train = may NOT be used to train AI models.',
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=no',
    'Allow: /',
    'Allow: /api/markdown',
    'Allow: /api/mcp',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /checkout',
    'Disallow: /cart',
    'Disallow: /order-confirmation',
    'Disallow: /track-order?',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
    '# Summary for language models',
    `# ${SITE_URL}/llms.txt`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
