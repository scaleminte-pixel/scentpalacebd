import prisma from '@/lib/db';
import { transformDbProduct } from '@/lib/server-catalog';

/**
 * Daily Deal — single source of truth is the "daily_deal" section in
 * Admin → Website Content. Its content stores:
 *   { productSlug, variantId, dealPrice, endsAt, tagline }
 * Used by the storefront (/api/deals) AND by order creation, so the deal price
 * shown to customers is the price actually charged.
 */
export interface ActiveDailyDeal {
  title: string;
  tagline: string;
  productSlug: string;
  variantId: string;
  dealPrice: number;
  originalPrice: number;
  endsAt: string;
  product: ReturnType<typeof transformDbProduct>;
}

export async function getActiveDailyDeal(): Promise<ActiveDailyDeal | null> {
  try {
    const section = await prisma.websiteSection.findUnique({ where: { sectionKey: 'daily_deal' } });
    if (!section || !section.isVisible) return null;

    let c: any = {};
    try {
      c = JSON.parse(section.contentJson || '{}');
    } catch {
      c = {};
    }
    const productSlug = String(c.productSlug || '').trim();
    const dealPrice = Number(c.dealPrice);
    const endsAt = c.endsAt ? new Date(c.endsAt) : null;
    if (!productSlug || !Number.isFinite(dealPrice) || dealPrice <= 0) return null;
    if (!endsAt || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) return null;

    const dbProduct = await prisma.product.findUnique({
      where: { slug: productSlug },
      include: {
        category: true,
        scentFamily: true,
        variants: { where: { isActive: true }, orderBy: { sellingPrice: 'asc' } },
      },
    });
    if (!dbProduct || dbProduct.status !== 'PUBLISHED' || dbProduct.variants.length === 0) return null;

    const variant = dbProduct.variants.find((v) => v.id === c.variantId) || dbProduct.variants[0];
    if (dealPrice >= variant.sellingPrice) return null; // not a discount — ignore

    return {
      title: section.title || 'Deal of the Day',
      tagline: String(c.tagline || section.subtitle || ''),
      productSlug,
      variantId: variant.id,
      dealPrice: Math.round(dealPrice),
      originalPrice: variant.sellingPrice,
      endsAt: endsAt.toISOString(),
      product: transformDbProduct(dbProduct),
    };
  } catch (e) {
    console.error('getActiveDailyDeal error:', e);
    return null;
  }
}
