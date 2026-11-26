/**
 * Read-only public catalog data for search engines and AI agents
 * (JSON-LD, sitemap, llms.txt, Markdown pages and the MCP endpoint).
 * Only data that is already public on the storefront is exposed here.
 */
import prisma from '@/lib/db';
import { getBranding, DEFAULT_BRANDING, type Branding } from '@/lib/branding';
import { absoluteUrl, SITE_URL } from '@/lib/site';

export interface AgentVariant {
  size: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  inStock: boolean;
}

export interface AgentProduct {
  name: string;
  slug: string;
  url: string;
  description: string;
  category: string;
  scentFamily: string;
  concentration: string;
  image: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  variants: AgentVariant[];
  updatedAt: Date;
}

const parse = (s: string | null | undefined, fallback: any) => {
  try {
    return JSON.parse(s || '');
  } catch {
    return fallback;
  }
};

function firstImage(images: string | null): string {
  const arr = parse(images, []);
  const first = Array.isArray(arr) ? arr[0] : null;
  const url = typeof first === 'string' ? first : first?.url;
  return url ? absoluteUrl(url) : '';
}

const clean = (t: string) => t.replace(/\s+/g, ' ').trim();

export async function getAgentProducts(opts?: { q?: string; take?: number }): Promise<AgentProduct[]> {
  const q = opts?.q?.trim();
  const rows = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { slug: { contains: q.toLowerCase().replace(/\s+/g, '-') } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    take: opts?.take,
    include: {
      category: true,
      scentFamily: true,
      variants: { where: { isActive: true }, orderBy: { sellingPrice: 'asc' } },
    },
  });

  return rows
    .filter((p) => p.variants.length > 0)
    .map((p: any) => {
      const variants: AgentVariant[] = p.variants.map((v: any) => ({
        size: v.size,
        sku: v.sku,
        price: v.sellingPrice,
        originalPrice: v.originalPrice && v.originalPrice > v.sellingPrice ? v.originalPrice : null,
        inStock: v.stock - (v.reservedStock || 0) > 0,
      }));
      const prices = variants.map((v) => v.price);
      return {
        name: p.name,
        slug: p.slug,
        url: absoluteUrl(`/product/${p.slug}`),
        description: clean(String(p.description || p.tagline || '')).slice(0, 500),
        category: p.category?.name || '',
        scentFamily: p.scentFamily?.name || '',
        concentration: p.concentration || '',
        image: firstImage(p.images),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        inStock: variants.some((v) => v.inStock),
        variants,
        updatedAt: p.updatedAt,
      };
    });
}

export async function getAgentProduct(slug: string): Promise<AgentProduct | null> {
  const all = await getAgentProducts();
  return all.find((p) => p.slug === slug) || null;
}

/** Public social / directory profiles set in Admin → Settings (used for sameAs). */
export function socialProfiles(b: Branding): string[] {
  const urls = [b.facebookUrl, b.instagramUrl, b.tiktokUrl, b.youtubeUrl, b.xUrl]
    .map((u) => (u || '').trim())
    .filter((u) => /^https?:\/\/[^/]+\.[^/]+\/.+/.test(u)); // must point to a real profile, not just the site root
  return Array.from(new Set(urls));
}

export const STATIC_PAGES: { path: string; title: string; about: string }[] = [
  { path: '/', title: 'Home', about: 'Featured perfumes, best sellers, new arrivals and current offers.' },
  { path: '/shop', title: 'Shop all perfumes', about: 'Full catalog with prices, filters by category, scent family and size.' },
  { path: '/our-story', title: 'About us (Our Story)', about: 'Who Scent Palace BD is and how products are sourced.' },
  { path: '/contact', title: 'Contact', about: 'Phone, email, address and a contact form.' },
  { path: '/faq', title: 'FAQ', about: 'Authenticity, delivery, payment and returns questions.' },
  { path: '/shipping-returns', title: 'Shipping & returns', about: 'Delivery areas, fees, timelines and the return policy.' },
  { path: '/privacy-policy', title: 'Privacy policy', about: 'How customer data is collected and used.' },
  { path: '/track-order', title: 'Track an order', about: 'Look up an order status with the order number.' },
];

export async function getStoreInfo() {
  const branding = await getBranding();
  return {
    name: branding.storeName,
    url: SITE_URL,
    description:
      'Online perfume shop in Bangladesh selling 100% original niche, designer and Arabian perfumes, with delivery across Bangladesh and cash on delivery.',
    // Placeholder contact details (never set in Admin → Settings) are not published
    email: branding.storeEmail && branding.storeEmail !== DEFAULT_BRANDING.storeEmail ? branding.storeEmail : '',
    phone: branding.storePhone && !/1711-?000000/.test(branding.storePhone) ? branding.storePhone : '',
    address: branding.storeAddress && branding.storeAddress !== DEFAULT_BRANDING.storeAddress ? branding.storeAddress : '',
    currency: 'BDT',
    logo: absoluteUrl(branding.storefrontLogoDarkUrl || '/brand/logo-emerald.png'),
    sameAs: socialProfiles(branding),
  };
}

export const money = (n: number) => `৳${Math.round(n).toLocaleString('en-US')}`;
