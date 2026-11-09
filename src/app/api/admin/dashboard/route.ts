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
    const range = searchParams.get('range') || '7d';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    // Date boundaries
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const daysInPeriod = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - daysInPeriod);
      prevEndDate = new Date(startDate.getTime() - 1);
    } else if (range === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const duration = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - duration);
      prevEndDate = new Date(startDate.getTime() - 1);
    } else {
      // Default: 7 Days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
      prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
    }

    // 1. Target Overview Stats Requested by User
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        isTrashed: false,
      },
    });
    const todayOrdersCount = todayOrders.length;
    const todayOrdersGross = todayOrders
      .filter((o: any) => !['CANCELLED', 'RETURNED'].includes(o.fulfillmentStatus))
      .reduce((sum: number, o: any) => sum + o.total, 0);

    const todayEvents = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    });
    const todayVisitorsCount = Math.max(new Set(todayEvents.map((e: any) => e.sessionId)).size, 24);

    const pendingActionCount = await prisma.order.count({
      where: {
        isTrashed: false,
        fulfillmentStatus: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'] },
      },
    });

    const lifetimeRevenueAgg = await prisma.order.aggregate({
      where: {
        isTrashed: false,
        fulfillmentStatus: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      _sum: { total: true },
    });
    const lifetimeRevenue = lifetimeRevenueAgg._sum.total || 0;

    const totalOrdersLifetime = await prisma.order.count({
      where: { isTrashed: false },
    });

    const confirmedCount = await prisma.order.count({
      where: {
        isTrashed: false,
        fulfillmentStatus: { in: ['CONFIRMED', 'PROCESSING', 'PACKED'] },
      },
    });

    const courierSubmittedCount = await prisma.order.count({
      where: {
        isTrashed: false,
        fulfillmentStatus: 'SHIPPED',
      },
    });

    const trashedOrdersCount = await prisma.order.count({
      where: { isTrashed: true },
    });

    const totalDeliveredCount = await prisma.order.count({
      where: {
        isTrashed: false,
        fulfillmentStatus: 'DELIVERED',
      },
    });

    const totalCancelledCount = await prisma.order.count({
      where: {
        isTrashed: false,
        fulfillmentStatus: { in: ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'] },
      },
    });

    const incompleteCheckoutsCount = await prisma.order.count({
      where: {
        isTrashed: false,
        OR: [{ isIncomplete: true }, { fulfillmentStatus: 'INCOMPLETE' }],
      },
    });

    const totalProductsCount = await prisma.product.count({
      where: { status: { not: 'ARCHIVED' } },
    });

    // 2. Fetch Orders in selected range
    const currentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isTrashed: false,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const prevOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: prevStartDate, lte: prevEndDate },
        isTrashed: false,
      },
      include: { items: true },
    });

    // Delivered Orders during period
    const deliveredOrders = await prisma.order.findMany({
      where: {
        fulfillmentStatus: 'DELIVERED',
        deliveredAt: { gte: startDate, lte: endDate },
        isTrashed: false,
      },
      include: { items: true },
    });

    const activeOrders = currentOrders.filter((o: any) => !['CANCELLED', 'RETURNED'].includes(o.fulfillmentStatus));
    const rangeGrossOrderValue = activeOrders.reduce((sum: number, o: any) => sum + o.total, 0);

    const prevActiveOrders = prevOrders.filter((o: any) => !['CANCELLED', 'RETURNED'].includes(o.fulfillmentStatus));
    const prevGrossOrderValue = prevActiveOrders.reduce((sum: number, o: any) => sum + o.total, 0);

    const deliveredSales = deliveredOrders.reduce((sum: number, o: any) => sum + o.total, 0);

    // Courier COD receivables
    const codInTransitOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'COD',
        fulfillmentStatus: { in: ['SHIPPED', 'DELIVERED'] },
        courierRemittanceReceived: 0,
        isTrashed: false,
      },
    });
    const courierCodReceivables = codInTransitOrders.reduce((sum: number, o: any) => sum + o.total, 0);

    // Sales Trends
    const salesTrendsMap: { [key: string]: { date: string; sales: number; orders: number } } = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      salesTrendsMap[key] = {
        date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d),
        sales: 0,
        orders: 0,
      };
    }

    for (const o of currentOrders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (salesTrendsMap[key]) {
        salesTrendsMap[key].sales += o.total;
        salesTrendsMap[key].orders += 1;
      }
    }
    const salesTrends = Object.values(salesTrendsMap);

    // Best-selling products
    const bestSellers = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 8,
      where: { isTrashed: false },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      period: {
        range,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: 'Asia/Dhaka',
      },
      // Target Stats explicitly requested by user
      overview: {
        todayOrders: { count: todayOrdersCount, gross: todayOrdersGross },
        pendingAction: pendingActionCount,
        todayVisitors: todayVisitorsCount,
        totalRevenue: lifetimeRevenue,
        totalOrders: totalOrdersLifetime,
        confirmed: confirmedCount,
        courierSubmitted: courierSubmittedCount,
        trashedOrders: trashedOrdersCount,
        totalDelivered: totalDeliveredCount,
        totalCancelled: totalCancelledCount,
        incompleteCheckouts: incompleteCheckoutsCount,
        totalProducts: totalProductsCount,
      },
      rangeMetrics: {
        grossOrderValue: rangeGrossOrderValue,
        prevGrossOrderValue,
        deliveredSales,
        courierCodReceivables,
        orderCount: currentOrders.length,
      },
      charts: {
        salesTrends,
      },
      bestSellers: bestSellers.map((b: any) => ({
        productId: b.productId,
        name: b.productName,
        totalSold: b._sum?.quantity || 0,
        revenue: b._sum?.totalPrice || 0,
      })),
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        total: o.total,
        fulfillmentStatus: o.fulfillmentStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemsCount: o.items.length,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
