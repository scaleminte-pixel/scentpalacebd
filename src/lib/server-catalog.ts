import prisma from '@/lib/db';
import type { Category } from '@prisma/client';
import { Product } from '@/types';

export function transformDbProduct(p: any): Product {
  let rawImages: any[] = [];
  try {
    rawImages = JSON.parse(p.images);
  } catch {
    rawImages = [p.images];
  }
  let images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
    .filter(Boolean);

  if (images.length === 0) {
    images = ['/images/products/rayhaan-azul.webp'];
  }

  let top: string[] = [];
  let heart: string[] = [];
  let base: string[] = [];
  let ingredients: string[] = [];

  try { top = JSON.parse(p.notesTop); } catch { top = []; }
  try { heart = JSON.parse(p.notesHeart); } catch { heart = []; }
  try { base = JSON.parse(p.notesBase); } catch { base = []; }
  try { ingredients = JSON.parse(p.ingredients); } catch { ingredients = []; }

  const variants =
    p.variants && p.variants.length > 0
      ? p.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          price: v.sellingPrice,
          originalPrice: v.originalPrice || undefined,
          stock: Math.max(0, v.stock - (v.reservedStock || 0)),
        }))
      : [
          {
            id: `v-${p.id}-50`,
            sku: `${p.slug}-50`,
            size: '50ml',
            price: 10500,
            stock: 15,
          },
        ];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    concentration: p.concentration || 'Extrait de Parfum',
    tagline: p.tagline || 'Artisanal Extrait de Parfum',
    description: p.description || '',
    story: p.story || '',
    category: (p.category?.name || 'Unisex') as any,
    scentFamily: (p.scentFamily?.name || 'Oud & Woody') as any,
    images,
    rating: p.rating || 4.9,
    reviewsCount: p.reviewsCount || 12,
    notes: { top, heart, base },
    longevity: p.longevity || '12-16 Hours',
    sillage: p.sillage || 'Enveloping & Royal',
    bestSeason: p.bestSeason || 'Autumn / Winter',
    ingredients,
    variants,
    isBestSeller: !!p.isBestSeller,
    isNewArrival: !!p.isNewArrival,
    isFeatured: !!p.isFeatured,
  };
}

export async function getServerCategories() {
  try {
    const categories: Category[] = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((c: Category) => ({
      id: c.name,
      name: c.name,
      tagline: c.description || '',
      image: c.image || '/images/products/rayhaan-azul.webp',
      itemCount: c.itemCount || 0,
      slug: c.slug || c.name,
      sortOrder: c.sortOrder || 0,
    }));
  } catch (error) {
    console.error('Failed to get server categories:', error);
    return [];
  }
}

export async function getServerProducts(params?: {
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  take?: number;
}) {
  try {
    const where: any = { status: 'PUBLISHED' };
    if (params?.isBestSeller) where.isBestSeller = true;
    if (params?.isNewArrival) where.isNewArrival = true;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.take,
      include: {
        category: true,
        scentFamily: true,
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: 'asc' },
        },
      },
    });

    return products.map(transformDbProduct);
  } catch (error) {
    console.error('Failed to get server products:', error);
    return [];
  }
}

export async function getServerSections() {
  try {
    const sections = await prisma.websiteSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });

    const contentMap: Record<string, any> = {};
    for (const section of sections) {
      let parsed = {};
      try {
        parsed = JSON.parse(section.contentJson);
      } catch {
        parsed = {};
      }
      contentMap[section.sectionKey] = {
        id: section.id,
        sectionKey: section.sectionKey,
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        animationPreset: section.animationPreset || 'LUXURY_EASE',
        isVisible: section.isVisible,
        content: parsed,
      };
    }
    return contentMap;
  } catch (error) {
    console.error('Failed to get server sections:', error);
    return {};
  }
}
