import type { MetadataRoute } from 'next';
import { getAgentProducts, STATIC_PAGES } from '@/lib/agent-catalog';
import { absoluteUrl } from '@/lib/site';

// Built from the live catalog on each request, so new products appear automatically.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.filter((p) => p.path !== '/track-order').map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: p.path === '/' || p.path === '/shop' ? 'daily' : 'monthly',
    priority: p.path === '/' ? 1 : p.path === '/shop' ? 0.9 : 0.5,
  }));

  let products: MetadataRoute.Sitemap = [];
  try {
    products = (await getAgentProducts()).map((p) => ({
      url: p.url,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(p.image ? { images: [p.image] } : {}),
    }));
  } catch (e) {
    console.error('sitemap products failed', e);
  }

  return [...pages, ...products];
}
