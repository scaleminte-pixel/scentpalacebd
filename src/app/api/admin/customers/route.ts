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
    const q = searchParams.get('q');

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { city: { contains: q } },
            ],
          }
        : {},
      include: {
        orders: {
          select: { id: true, total: true, fulfillmentStatus: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { totalSpent: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        division: c.division,
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        internalNotes: c.internalNotes,
        firstOrderAt: c.firstOrderAt ? c.firstOrderAt.toISOString() : null,
        lastOrderAt: c.lastOrderAt ? c.lastOrderAt.toISOString() : null,
        recentOrders: c.orders.slice(0, 3).map((o) => ({
          id: o.id,
          total: o.total,
          status: o.fulfillmentStatus,
          date: o.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

