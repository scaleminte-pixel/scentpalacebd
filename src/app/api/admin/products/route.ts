import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { revalidateStorefront } from '@/lib/revalidate';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const scent = searchParams.get('scent');
    const status = searchParams.get('status') || 'ALL';
    const stockStatus = searchParams.get('stock'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '100000');

    const where: any = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.category = { slug: category };
    }

    if (scent && scent !== 'ALL') {
      where.scentFamily = { slug: scent };
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { tagline: { contains: q } },
        { variants: { some: { sku: { contains: q } } } },
      ];
    }

    const totalCount = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        scentFamily: true,
        variants: {
          orderBy: { sellingPrice: 'asc' },
        },
      },
    });

    const transformed = products.map((p) => {
      let rawImages: any[] = [];
      try { rawImages = JSON.parse(p.images); } catch { rawImages = [p.images]; }
      const images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages])
        .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
        .filter(Boolean);

      const totalPhysicalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      const totalReservedStock = p.variants.reduce((s, v) => s + v.reservedStock, 0);
      const totalAvailableStock = totalPhysicalStock - totalReservedStock;

      const lowestPrice = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.sellingPrice)) : 0;
      const highestPrice = p.variants.length > 0 ? Math.max(...p.variants.map((v) => v.sellingPrice)) : 0;
      const averageCost = p.variants.length > 0
        ? p.variants.reduce((s, v) => s + v.purchaseCost, 0) / p.variants.length
        : 0;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        concentration: p.concentration,
        tagline: p.tagline,
        description: p.description,
        category: p.category?.name || 'Uncategorized',
        categorySlug: p.category?.slug,
        scentFamily: p.scentFamily?.name || 'Oud & Woody',
        scentFamilySlug: p.scentFamily?.slug,
        images,
        coverImage: images[0] || '/images/products/lattafa-blue-oud.webp',
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        status: p.status,
        bundleType: p.bundleType,
        variantsCount: p.variants.length,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          purchaseCost: v.purchaseCost,
          sellingPrice: v.sellingPrice,
          originalPrice: v.originalPrice,
          stock: v.stock,
          reservedStock: v.reservedStock,
          availableStock: v.stock - v.reservedStock,
          lowStockThreshold: v.lowStockThreshold,
          isActive: v.isActive,
        })),
        pricing: {
          lowest: lowestPrice,
          highest: highestPrice,
          averageCost: Math.round(averageCost),
        },
        stock: {
          physical: totalPhysicalStock,
          reserved: totalReservedStock,
          available: totalAvailableStock,
          isLowStock: totalAvailableStock <= 8 && totalAvailableStock > 0,
          isOutOfStock: totalAvailableStock <= 0,
        },
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      products: transformed,
    });
  } catch (error: any) {
    console.error('Error in admin products list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      concentration,
      tagline,
      description,
      story,
      categoryName,
      scentFamilyName,
      images,
      notesTop,
      notesHeart,
      notesBase,
      longevity,
      sillage,
      bestSeason,
      ingredients,
      isBestSeller,
      isNewArrival,
      isFeatured,
      status,
      bundleType,
      variants,
    } = body;

    if (!name || !variants || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product name and at least one flacon variant are required.' },
        { status: 400 }
      );
    }

    // Auto-generate slug if missing
    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A fragrance with slug "${generatedSlug}" already exists.` },
        { status: 400 }
      );
    }

    // Find category & scent family
    let category = null;
    if (categoryName) {
      category = await prisma.category.findFirst({
        where: { OR: [{ name: categoryName }, { slug: categoryName.toLowerCase() }] },
      });
    }

    let scentFamily = null;
    if (scentFamilyName) {
      scentFamily = await prisma.scentFamily.findFirst({
        where: { OR: [{ name: scentFamilyName }, { slug: scentFamilyName.toLowerCase() }] },
      });
    }

    // Create Product with variants inside transaction
    const newProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name,
          slug: generatedSlug,
          concentration: concentration || 'Extrait de Parfum',
          tagline: tagline || '',
          description: description || '',
          story: story || '',
          categoryId: category?.id || null,
          scentFamilyId: scentFamily?.id || null,
          images: JSON.stringify(images && images.length ? images : ['/images/products/lattafa-blue-oud.webp']),
          rating: 5.0,
          reviewsCount: 0,
          notesTop: JSON.stringify(notesTop || []),
          notesHeart: JSON.stringify(notesHeart || []),
          notesBase: JSON.stringify(notesBase || []),
          longevity: longevity || '14-18 Hours',
          sillage: sillage || 'Regal & Enveloping',
          bestSeason: bestSeason || 'All Seasons',
          ingredients: JSON.stringify(ingredients || []),
          isBestSeller: Boolean(isBestSeller),
          isNewArrival: Boolean(isNewArrival),
          isFeatured: Boolean(isFeatured),
          status: status || 'PUBLISHED',
          bundleType: bundleType || 'SINGLE',
        },
      });

      // Create Variants & register initial stock
      for (const v of variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: prod.id,
            sku: v.sku || `RDH-${generatedSlug.toUpperCase().slice(0, 3)}-${v.size}`,
            size: v.size || '50ml',
            purchaseCost: parseFloat(v.purchaseCost) || 0,
            sellingPrice: parseFloat(v.sellingPrice) || 12000,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            stock: parseInt(v.stock, 10) || 0,
            lowStockThreshold: parseInt(v.lowStockThreshold, 10) || 5,
          },
        });

        // Record opening stock movement
        if (variant.stock > 0) {
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              type: 'OPENING',
              quantity: variant.stock,
              beforeStock: 0,
              afterStock: variant.stock,
              reason: 'Initial creation opening stock',
              userId: session.id,
              userName: session.name,
            },
          });
        }
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'CREATE',
          entity: 'Product',
          entityId: prod.id,
          details: JSON.stringify({ name: prod.name, slug: prod.slug, variantsCount: variants.length }),
        },
      });

      return prod;
    });

    revalidateStorefront();

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: `Fragrance "${newProduct.name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

