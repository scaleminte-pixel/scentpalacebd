import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Sidebar badge counts: new (pending) orders and open incomplete orders. */
export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const incompleteWhere = {
    isTrashed: false,
    fulfillmentStatus: { notIn: ['CANCELLED'] },
    OR: [{ isIncomplete: true }, { fulfillmentStatus: 'INCOMPLETE' }],
  };

  const [newOrders, incomplete] = await Promise.all([
    prisma.order.count({
      where: { isTrashed: false, isIncomplete: false, fulfillmentStatus: 'PENDING' },
    }),
    prisma.order.count({ where: incompleteWhere }),
  ]);

  return NextResponse.json(
    { success: true, newOrders, incomplete },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
