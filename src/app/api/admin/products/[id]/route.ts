import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { revalidateStorefront } from '@/lib/revalidate';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        category: true,
        scentFamily: true,
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: 'asc' },
          include: {
            stockMovements: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    let rawImages: any[] = [];
    try { rawImages = JSON.parse(product.images); } catch { rawImages = [product.images]; }
    const images: string[] = (Array.isArray(rawImages) ? rawImages : [rawImages])
      .map((img: any) => (typeof img === 'string' ? img : img?.url || ''))
      .filter(Boolean);
    const imageObjects = (Array.isArray(rawImages) ? rawImages : [rawImages])
      .map((img: any) => (typeof img === 'string' ? { url: img, alt: product.name } : img))
      .filter((img: any) => Boolean(img?.url));
    let notesTop: string[] = [];
    let notesHeart: string[] = [];
    let notesBase: string[] = [];
    let ingredients: string[] = [];
    try { notesTop = JSON.parse(product.notesTop); } catch { notesTop = []; }
    try { notesHeart = JSON.parse(product.notesHeart); } catch { notesHeart = []; }
    try { notesBase = JSON.parse(product.notesBase); } catch { notesBase = []; }
    try { ingredients = JSON.parse(product.ingredients); } catch { ingredients = []; }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images,
        imageObjects,
        notesTop,
        notesHeart,
        notesBase,
        ingredients,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Resolve category & scent family IDs if provided
    let categoryId = product.categoryId;
    if (body.categoryName) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ name: body.categoryName }, { slug: body.categoryName.toLowerCase() }] },
      });
      if (cat) categoryId = cat.id;
    }

    let scentFamilyId = product.scentFamilyId;
    if (body.scentFamilyName) {
      const scent = await prisma.scentFamily.findFirst({
        where: { OR: [{ name: body.scentFamilyName }, { slug: body.scentFamilyName.toLowerCase() }] },
      });
      if (scent) scentFamilyId = scent.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : product.name,
          concentration: body.concentration !== undefined ? body.concentration : product.concentration,
          tagline: body.tagline !== undefined ? body.tagline : product.tagline,
          description: body.description !== undefined ? body.description : product.description,
          story: body.story !== undefined ? body.story : product.story,
          categoryId,
          scentFamilyId,
          images: body.images ? JSON.stringify(body.images) : product.images,
          notesTop: body.notesTop ? JSON.stringify(body.notesTop) : product.notesTop,
          notesHeart: body.notesHeart ? JSON.stringify(body.notesHeart) : product.notesHeart,
          notesBase: body.notesBase ? JSON.stringify(body.notesBase) : product.notesBase,
          longevity: body.longevity !== undefined ? body.longevity : product.longevity,
          sillage: body.sillage !== undefined ? body.sillage : product.sillage,
          bestSeason: body.bestSeason !== undefined ? body.bestSeason : product.bestSeason,
          ingredients: body.ingredients ? JSON.stringify(body.ingredients) : product.ingredients,
          isBestSeller: body.isBestSeller !== undefined ? Boolean(body.isBestSeller) : product.isBestSeller,
          isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : product.isNewArrival,
          isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : product.isFeatured,
          status: body.status || product.status,
          bundleType: body.bundleType || product.bundleType,
        },
      });

      // Update existing variants, create new ones, retire removed ones
      if (body.variants && Array.isArray(body.variants)) {
        const num = (x: any, d: number) => {
          const n = Number(x);
          return Number.isFinite(n) ? n : d;
        };
        const existing = await tx.productVariant.findMany({ where: { productId: id } });
        const keptIds = new Set<string>();

        for (const v of body.variants) {
          const current = v.id ? existing.find((e) => e.id === v.id) : undefined;
          if (current) {
            keptIds.add(current.id);
            const newStock = Math.max(0, Math.trunc(num(v.stock, current.stock)));
            await tx.productVariant.update({
              where: { id: current.id },
              data: {
                sku: v.sku,
                size: v.size,
                purchaseCost: num(v.purchaseCost, 0),
                sellingPrice: num(v.sellingPrice, current.sellingPrice),
                originalPrice: v.originalPrice ? num(v.originalPrice, 0) : null,
                stock: newStock,
                lowStockThreshold: Math.max(0, Math.trunc(num(v.lowStockThreshold, 5))),
                isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
              },
            });
            if (newStock !== current.stock) {
              await tx.stockMovement.create({
                data: {
                  variantId: current.id,
                  type: 'ADJUSTMENT',
                  quantity: newStock - current.stock,
                  beforeStock: current.stock,
                  afterStock: newStock,
                  reason: 'Edited from product form',
                  userId: session.id,
                  userName: session.name,
                },
              });
            }
          } else {
            const stock = Math.max(0, Math.trunc(num(v.stock, 0)));
            const created = await tx.productVariant.create({
              data: {
                productId: p.id,
                sku: v.sku,
                size: v.size,
                purchaseCost: num(v.purchaseCost, 0),
                sellingPrice: num(v.sellingPrice, 0),
                originalPrice: v.originalPrice ? num(v.originalPrice, 0) : null,
                stock,
                lowStockThreshold: Math.max(0, Math.trunc(num(v.lowStockThreshold, 5))),
              },
            });
            keptIds.add(created.id);
            if (stock > 0) {
              await tx.stockMovement.create({
                data: {
                  variantId: created.id,
                  type: 'OPENING',
                  quantity: stock,
                  beforeStock: 0,
                  afterStock: stock,
                  reason: 'New variant opening stock',
                  userId: session.id,
                  userName: session.name,
                },
              });
            }
          }
        }

        // Variants removed in the form: hide them (kept for past order history)
        const removed = existing.filter((e) => !keptIds.has(e.id)).map((e) => e.id);
        if (removed.length > 0) {
          await tx.productVariant.updateMany({ where: { id: { in: removed } }, data: { isActive: false } });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'UPDATE',
          entity: 'Product',
          entityId: p.id,
          details: JSON.stringify({ name: p.name, status: p.status }),
        },
      });

      return p;
    });

    revalidateStorefront();

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Product "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Safety check: if product has historical orders, ARCHIVE it to preserve customer order records!
    if (product.orderItems.length > 0) {
      const archived = await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'ARCHIVE',
          entity: 'Product',
          entityId: product.id,
          details: JSON.stringify({ reason: 'Has order items; safely archived to protect order records' }),
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Product "${product.name}" has historical order records and has been safely ARCHIVED.`,
      });
    }

    // Otherwise, clean delete
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'DELETE',
          entity: 'Product',
          entityId: id,
          details: JSON.stringify({ name: product.name }),
        },
      });
    });

    revalidateStorefront();

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" deleted.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

