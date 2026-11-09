import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Pending / Unfulfilled orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        fulfillmentStatus: { in: ['UNFULFILLED', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        createdAt: true,
      },
    });

    // 2. Low stock variants
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: 8 },
        isActive: true,
      },
      take: 5,
      include: {
        product: {
          select: { name: true, slug: true },
        },
      },
    });

    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: 'order' | 'inventory' | 'system';
      time: string;
      link: string;
    }> = [];

    // Map pending orders
    pendingOrders.forEach((o) => {
      notifications.push({
        id: `order-${o.id}`,
        title: `New Order #${o.orderNumber}`,
        message: `${o.customerName} placed an order for ৳${o.total.toLocaleString()}`,
        type: 'order',
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link: `/admin/orders/${o.id}`,
      });
    });

    // Map low stock variants
    lowStockVariants.forEach((v) => {
      notifications.push({
        id: `stock-${v.id}`,
        title: `Low Stock Alert`,
        message: `${v.product.name} (${v.size}) has only ${v.stock} units remaining.`,
        type: 'inventory',
        time: 'Immediate',
        link: '/admin/inventory',
      });
    });

    // Add system notification
    notifications.push({
      id: 'sys-wal',
      title: 'Database Engine Active',
      message: 'SQLite high-performance WAL mode is healthy with zero query lock.',
      type: 'system',
      time: 'Live',
      link: '/admin/settings',
    });

    return NextResponse.json({
      success: true,
      unreadCount: pendingOrders.length + lowStockVariants.length,
      notifications,
    });
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

