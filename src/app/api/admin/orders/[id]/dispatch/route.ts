import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { bookCourierParcel } from '@/lib/courier';
import { commitStockDispatch } from '@/lib/inventory';

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
    const body = await req.json().catch(() => ({}));
    const provider = body.courierProvider || 'STEADFAST';

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let addr: any = {};
    try { addr = JSON.parse(order.shippingAddress); } catch { addr = { address: order.shippingAddress }; }

    if (order.isIncomplete || !addr.address || !String(addr.address).trim()) {
      return NextResponse.json(
        { success: false, error: 'This order has no confirmed name/address yet. Confirm it with the customer first (Incomplete Orders).' },
        { status: 400 }
      );
    }
    if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.fulfillmentStatus)) {
      return NextResponse.json({ success: false, error: `Order is already ${order.fulfillmentStatus}.` }, { status: 400 });
    }

    // COD amount is full total if UNPAID, or 0 if already PAID online
    const codAmount = order.paymentStatus === 'PAID' ? 0 : order.total;

    // Book with Courier
    const booking = await bookCourierParcel({
      orderNumber: order.orderNumber,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientAddress: [addr.address, addr.city, addr.division].filter(Boolean).join(', '),
      codAmount,
      note: 'Scent Palace BD Luxury Fragrance',
    });

    if (!booking.success) {
      // Do not mark shipped or touch stock when the courier booking failed
      return NextResponse.json({ success: false, error: booking.message }, { status: 502 });
    }

    // Commit stock dispatch & update order status to SHIPPED
    const updated = await prisma.$transaction(async (tx) => {
      // If order was not already shipped, commit physical stock decrement
      if (order.fulfillmentStatus !== 'SHIPPED' && order.fulfillmentStatus !== 'DELIVERED') {
        await commitStockDispatch(tx, order.id, { id: session.id, name: session.name });
      }

      const o = await tx.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: 'SHIPPED',
          courierProvider: provider,
          courierTrackingNumber: booking.trackingCode,
          courierStatus: booking.status,
          shippedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'DISPATCH_COURIER',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            courier: provider,
            trackingCode: booking.trackingCode,
            codAmount,
          }),
        },
      });

      return o;
    });

    return NextResponse.json({
      success: true,
      order: updated,
      trackingCode: booking.trackingCode,
      isSandbox: booking.isMock,
      message: booking.isMock
        ? `SANDBOX test booking (${booking.trackingCode}) — no real parcel created. Switch Steadfast to production mode in Integrations to book real parcels.`
        : `Parcel booked with ${provider} (${booking.trackingCode}). Order marked SHIPPED.`,
    });
  } catch (error: any) {
    console.error('Dispatch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

