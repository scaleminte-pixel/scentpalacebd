import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        scentFamily: true,
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: 'asc' },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    let images: string[] = [];
    try { images = JSON.parse(product.images); } catch { images = [product.images]; }

    let top: string[] = [];
    let heart: string[] = [];
    let base: string[] = [];
    let ingredients: string[] = [];

    try { top = JSON.parse(product.notesTop); } catch { top = []; }
    try { heart = JSON.parse(product.notesHeart); } catch { heart = []; }
    try { base = JSON.parse(product.notesBase); } catch { base = []; }
    try { ingredients = JSON.parse(product.ingredients); } catch { ingredients = []; }

    const transformed = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      concentration: product.concentration,
      tagline: product.tagline,
      description: product.description,
      story: product.story || '',
      category: product.category?.name || 'Unisex',
      scentFamily: product.scentFamily?.name || 'Oud & Woody',
      images,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      notes: { top, heart, base },
      longevity: product.longevity,
      sillage: product.sillage,
      bestSeason: product.bestSeason,
      ingredients,
      variants: product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        price: v.sellingPrice,
        originalPrice: v.originalPrice || undefined,
        stock: v.stock - v.reservedStock,
      })),
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      isFeatured: product.isFeatured,
      reviews: product.reviews,
    };

    // Find complementary products
    const related = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: 'PUBLISHED',
      },
      take: 3,
      include: {
        category: true,
        scentFamily: true,
        variants: { where: { isActive: true } },
      },
    });

    const transformedRelated = related.map((p) => {
      let rImgs: string[] = [];
      try { rImgs = JSON.parse(p.images); } catch { rImgs = [p.images]; }
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        concentration: p.concentration,
        tagline: p.tagline,
        description: p.description,
        story: p.story || '',
        category: p.category?.name || 'Unisex',
        scentFamily: p.scentFamily?.name || 'Oud & Woody',
        images: rImgs,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        notes: { top: [], heart: [], base: [] },
        longevity: p.longevity,
        sillage: p.sillage,
        bestSeason: p.bestSeason,
        ingredients: [],
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          price: v.sellingPrice,
          originalPrice: v.originalPrice || undefined,
          stock: v.stock - v.reservedStock,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      product: transformed,
      relatedProducts: transformedRelated,
    });
  } catch (error: any) {
    console.error('Error fetching product slug:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

