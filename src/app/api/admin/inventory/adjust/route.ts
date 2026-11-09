import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId, quantityDelta, type, reason } = await req.json();

    if (!variantId || quantityDelta === undefined || !reason) {
      return NextResponse.json(
        { success: false, error: 'variantId, quantity delta, and audit reason are required.' },
        { status: 400 }
      );
    }

    const delta = parseInt(quantityDelta, 10);
    if (isNaN(delta) || delta === 0) {
      return NextResponse.json({ success: false, error: 'Valid non-zero quantity required.' }, { status: 400 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ success: false, error: 'Variant not found' }, { status: 404 });
    }

    const beforeStock = variant.stock;
    const afterStock = beforeStock + delta;

    if (afterStock < 0) {
      return NextResponse.json(
        { success: false, error: `Cannot reduce stock below zero. Current stock: ${beforeStock}` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: afterStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          variantId: variant.id,
          type: type || (delta > 0 ? 'PURCHASE_RECEIPT' : 'ADJUSTMENT'),
          quantity: delta,
          beforeStock,
          afterStock,
          reason: reason.trim(),
          userId: session.id,
          userName: session.name,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'ADJUST_STOCK',
          entity: 'ProductVariant',
          entityId: variant.id,
          details: JSON.stringify({
            sku: variant.sku,
            product: variant.product.name,
            delta,
            beforeStock,
            afterStock,
            reason,
          }),
        },
      });

      return { updatedVariant, movement };
    });

    return NextResponse.json({
      success: true,
      message: `Stock for ${variant.sku} adjusted by ${delta > 0 ? '+' : ''}${delta}. New physical stock: ${afterStock}`,
      movement: result.movement,
    });
  } catch (error: any) {
    console.error('Inventory adjustment error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

