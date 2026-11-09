import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const source = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!source) {
      return NextResponse.json({ success: false, error: 'Source product not found' }, { status: 404 });
    }

    const newSlug = `${source.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;
    const newName = `${source.name} (Copy)`;

    const duplicated = await prisma.$transaction(async (tx) => {
      const copy = await tx.product.create({
        data: {
          name: newName,
          slug: newSlug,
          concentration: source.concentration,
          tagline: source.tagline,
          description: source.description,
          story: source.story,
          categoryId: source.categoryId,
          scentFamilyId: source.scentFamilyId,
          images: source.images,
          rating: 5.0,
          reviewsCount: 0,
          notesTop: source.notesTop,
          notesHeart: source.notesHeart,
          notesBase: source.notesBase,
          longevity: source.longevity,
          sillage: source.sillage,
          bestSeason: source.bestSeason,
          ingredients: source.ingredients,
          isBestSeller: false,
          isNewArrival: true,
          isFeatured: false,
          status: 'DRAFT', // Duplicate starts as draft
          bundleType: source.bundleType,
        },
      });

      for (const v of source.variants) {
        await tx.productVariant.create({
          data: {
            productId: copy.id,
            sku: `${v.sku}-COPY`,
            size: v.size,
            purchaseCost: v.purchaseCost,
            sellingPrice: v.sellingPrice,
            originalPrice: v.originalPrice,
            stock: 0, // Starts with 0 stock until receipted
            lowStockThreshold: v.lowStockThreshold,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'DUPLICATE',
          entity: 'Product',
          entityId: copy.id,
          details: JSON.stringify({ sourceSlug: source.slug, newSlug }),
        },
      });

      return copy;
    });

    return NextResponse.json({
      success: true,
      product: duplicated,
      message: `Duplicated into "${duplicated.name}" in DRAFT status.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

