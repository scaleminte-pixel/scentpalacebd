import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'low_stock', 'out_of_stock'
    const q = searchParams.get('q');

    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { sku: { contains: q } },
                { product: { name: { contains: q } } },
                { size: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        product: {
          include: { category: true, scentFamily: true },
        },
        stockMovements: {
          take: 8,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { stock: 'asc' },
    });

    const transformed = variants
      .map((v) => {
        const available = v.stock - v.reservedStock;
        const isLow = available <= v.lowStockThreshold && available > 0;
        const isOut = available <= 0;

        let images: string[] = [];
        try { images = JSON.parse(v.product.images); } catch { images = [v.product.images]; }

        return {
          id: v.id,
          productId: v.productId,
          productName: v.product.name,
          productSlug: v.product.slug,
          category: v.product.category?.name || 'Uncategorized',
          coverImage: images[0] || '/images/products/lattafa-blue-oud.webp',
          sku: v.sku,
          size: v.size,
          purchaseCost: v.purchaseCost,
          sellingPrice: v.sellingPrice,
          stock: {
            physical: v.stock,
            reserved: v.reservedStock,
            available,
            lowStockThreshold: v.lowStockThreshold,
            isLowStock: isLow,
            isOutOfStock: isOut,
          },
          inventoryValuation: {
            costValue: v.stock * v.purchaseCost,
            retailValue: v.stock * v.sellingPrice,
          },
          movements: v.stockMovements.map((m) => ({
            id: m.id,
            type: m.type,
            quantity: m.quantity,
            before: m.beforeStock,
            after: m.afterStock,
            reason: m.reason,
            userName: m.userName,
            createdAt: m.createdAt.toISOString(),
          })),
        };
      })
      .filter((v) => {
        if (filter === 'low_stock') return v.stock.isLowStock;
        if (filter === 'out_of_stock') return v.stock.isOutOfStock;
        return true;
      });

    // Summary KPIs
    const totalPhysical = transformed.reduce((s, v) => s + v.stock.physical, 0);
    const totalReserved = transformed.reduce((s, v) => s + v.stock.reserved, 0);
    const totalAvailable = totalPhysical - totalReserved;
    const totalCostValuation = transformed.reduce((s, v) => s + v.inventoryValuation.costValue, 0);
    const totalRetailValuation = transformed.reduce((s, v) => s + v.inventoryValuation.retailValue, 0);
    const lowStockAlertsCount = transformed.filter((v) => v.stock.isLowStock).length;
    const outOfStockCount = transformed.filter((v) => v.stock.isOutOfStock).length;

    return NextResponse.json({
      success: true,
      summary: {
        totalSkus: transformed.length,
        totalPhysicalUnits: totalPhysical,
        totalReservedUnits: totalReserved,
        totalAvailableUnits: totalAvailable,
        totalCostValuation,
        totalRetailValuation,
        lowStockAlertsCount,
        outOfStockCount,
      },
      inventory: transformed,
    });
  } catch (error: any) {
    console.error('Inventory error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

