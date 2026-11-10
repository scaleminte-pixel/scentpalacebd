import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const now = new Date();
    const deal = await prisma.dailyDeal.findFirst({
      where: {
        isEnabled: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        product: {
          include: {
            variants: true,
            category: true,
            scentFamily: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!deal) {
      return NextResponse.json({ success: true, deal: null });
    }

    let images: string[] = [];
    try { images = JSON.parse(deal.product.images); } catch { images = [deal.product.images]; }

    interface VariantLike {
      id: string;
      sku: string;
      size: string;
      sellingPrice: number;
      stock: number;
      reservedStock: number;
    }

    const targetVariant = deal.product.variants.find((v: VariantLike) => v.id === deal.variantId) || deal.product.variants[0];

    return NextResponse.json(
      {
        success: true,
        deal: {
          id: deal.id,
          productId: deal.productId,
          variantId: deal.variantId,
          title: deal.title,
          tagline: deal.tagline,
          dealPrice: deal.dealPrice,
          originalPrice: deal.originalPrice,
          endTime: deal.endTime.toISOString(),
          stockTotal: deal.stockTotal,
          stockRemaining: deal.stockRemaining,
          product: {
            id: deal.product.id,
            slug: deal.product.slug,
            name: deal.product.name,
            concentration: deal.product.concentration,
            images,
            rating: deal.product.rating,
            reviewsCount: deal.product.reviewsCount,
            variant: targetVariant ? {
              id: targetVariant.id,
              sku: targetVariant.sku,
              size: targetVariant.size,
              price: deal.dealPrice,
              originalPrice: targetVariant.sellingPrice,
              stock: targetVariant.stock - targetVariant.reservedStock,
            } : null,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

