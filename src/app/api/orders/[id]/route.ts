import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const maskPhone = (p: string) => (p && p.length >= 7 ? `${p.slice(0, 3)}${'•'.repeat(p.length - 7)}${p.slice(-4)}` : '');
const maskEmail = (e: string) => {
  if (!e || !e.includes('@')) return '';
  const [u, d] = e.split('@');
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(1, u.length - 2))}@${d}`;
};

/**
 * PUBLIC order lookup (order confirmation + track order pages).
 * Returns only customer-safe fields — no cost prices, staff notes, payment
 * records, full address or unmasked contact details.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id.trim().toUpperCase() }], isTrashed: false },
      include: { items: { include: { product: { select: { images: true, slug: true } } } } },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let addr: any = {};
    try {
      addr = JSON.parse(order.shippingAddress);
    } catch {
      addr = {};
    }

    const items = order.items.map((it) => {
      let images: string[] = [];
      try {
        const parsed = JSON.parse(it.product?.images || '[]');
        images = Array.isArray(parsed) ? parsed : [];
      } catch {}
      return {
        productName: it.productName,
        size: it.size,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        totalPrice: it.totalPrice,
        productImage: images[0] || '/images/products/lattafa-blue-oud.webp',
        productSlug: it.product?.slug || null,
      };
    });

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: maskPhone(order.customerPhone),
        customerEmail: maskEmail(order.customerEmail),
        shippingAddress: { city: addr.city || '', division: addr.division || '' },
        deliveryMethod: order.deliveryMethod,
        items,
        subtotal: order.subtotal,
        discount: order.discount,
        couponCode: order.couponCode,
        shippingFee: order.shippingFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        isIncomplete: order.isIncomplete,
        courierProvider: order.courierProvider,
        courierTrackingNumber: order.courierTrackingNumber,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: 'Failed to load order' }, { status: 500 });
  }
}
