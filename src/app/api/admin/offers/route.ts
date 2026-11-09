import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const deals = await prisma.dailyDeal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, slug: true, images: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minSpend: c.minSpend,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        isActive: c.isActive,
        description: c.description,
      })),
      deals: deals.map((d) => ({
        id: d.id,
        title: d.title,
        tagline: d.tagline,
        productName: d.product.name,
        productSlug: d.product.slug,
        dealPrice: d.dealPrice,
        originalPrice: d.originalPrice,
        discountPercent: Math.round(((d.originalPrice - d.dealPrice) / d.originalPrice) * 100),
        startTime: d.startTime.toISOString(),
        endTime: d.endTime.toISOString(),
        stockTotal: d.stockTotal,
        stockRemaining: d.stockRemaining,
        isEnabled: d.isEnabled,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create new Coupon
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { code, type, value, minSpend, maxDiscount, usageLimit, expiresAt, description } = await req.json();

    if (!code || !type || value === undefined) {
      return NextResponse.json({ success: false, error: 'code, type, and value are required.' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minSpend: parseFloat(minSpend) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'CREATE_COUPON',
        entity: 'Coupon',
        entityId: coupon.id,
        details: JSON.stringify({ code: coupon.code, value: coupon.value }),
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: `Coupon code "${coupon.code}" created successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update existing Coupon
export async function PUT(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, code, type, value, minSpend, maxDiscount, usageLimit, expiresAt, description, isActive } = await req.json();

    if (!id || !code || !type || value === undefined) {
      return NextResponse.json({ success: false, error: 'id, code, type, and value are required.' }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minSpend: parseFloat(minSpend) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
        isActive: Boolean(isActive),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'UPDATE_COUPON',
        entity: 'Coupon',
        entityId: updated.id,
        details: JSON.stringify({ code: updated.code, value: updated.value, isActive: updated.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      coupon: updated,
      message: `Coupon "${updated.code}" updated successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Delete Coupon
export async function DELETE(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Coupon ID is required.' }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Coupon not found.' }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'DELETE_COUPON',
        entity: 'Coupon',
        entityId: id,
        details: JSON.stringify({ code: existing.code }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Coupon "${existing.code}" deleted successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete coupon';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

