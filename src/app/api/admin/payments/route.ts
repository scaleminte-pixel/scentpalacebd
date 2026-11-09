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
    const method = searchParams.get('method') || 'ALL';
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (method !== 'ALL') where.method = method;
    if (status !== 'ALL') where.status = status;

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const bkashPendingManual = await prisma.paymentTransaction.count({
      where: { method: 'BKASH', status: 'PENDING', isManual: true },
    });

    return NextResponse.json({
      success: true,
      pendingManualVerifications: bkashPendingManual,
      transactions: transactions.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        orderNumber: t.order?.orderNumber || 'N/A',
        customerName: t.order?.customerName || 'Direct Payment',
        customerPhone: t.order?.customerPhone || t.senderPhone || 'N/A',
        amount: t.amount,
        method: t.method,
        gatewayRef: t.gatewayRef,
        trxId: t.trxId,
        senderPhone: t.senderPhone,
        status: t.status,
        isManual: t.isManual,
        adminVerifiedBy: t.adminVerifiedBy,
        verificationNotes: t.verificationNotes,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

