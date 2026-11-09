import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { reserveStockForOrder } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const q = searchParams.get('q');
    const tab = searchParams.get('tab') || 'all';
    const fulfillmentStatus = searchParams.get('status') || 'ALL';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const paymentMethod = searchParams.get('method') || 'ALL';
    const courier = searchParams.get('courier') || 'ALL';

    const where: any = {};

    if (tab === 'trashed') {
      where.isTrashed = true;
    } else if (tab === 'incomplete') {
      where.isTrashed = false;
      where.OR = [
        { isIncomplete: true },
        { fulfillmentStatus: 'INCOMPLETE' },
        { incompleteReason: { not: null } },
      ];
    } else {
      // Default: all active non-trashed orders
      where.isTrashed = false;
    }

    if (fulfillmentStatus !== 'ALL') {
      where.fulfillmentStatus = fulfillmentStatus;
    }

    if (paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus;
    }

    if (paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (courier !== 'ALL') {
      where.courierProvider = courier;
    }

    if (q) {
      const searchConditions = [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
        { customerEmail: { contains: q } },
        { courierTrackingNumber: { contains: q } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const totalCount = await prisma.order.count({ where });

    // Tab counts
    const allCount = await prisma.order.count({ where: { isTrashed: false } });
    const incompleteCount = await prisma.order.count({
      where: {
        isTrashed: false,
        OR: [
          { isIncomplete: true },
          { fulfillmentStatus: 'INCOMPLETE' },
          { incompleteReason: { not: null } },
        ],
      },
    });
    const trashedCount = await prisma.order.count({ where: { isTrashed: true } });

    const orders = await prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: true,
      },
    });

    const transformed = orders.map((o: any) => {
      let shippingAddress: any = {};
      try { shippingAddress = JSON.parse(o.shippingAddress); } catch { shippingAddress = { address: o.shippingAddress }; }

      const phone = (o.customerPhone || '').replace(/\D/g, '');
      const isInvalidPhone = phone.length !== 11;
      const addrStr = typeof shippingAddress === 'object' ? Object.values(shippingAddress).join(' ').trim() : String(shippingAddress);
      const isShortAddress = addrStr.length < 10;
      const computedIncomplete = o.isIncomplete || isInvalidPhone || isShortAddress;
      const computedReason = o.incompleteReason || (isInvalidPhone ? 'Phone number is not 11 digits' : isShortAddress ? 'Shipping address is too short (< 10 chars)' : null);

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customer: {
          id: o.customer?.id,
          name: o.customerName,
          email: o.customerEmail,
          phone: o.customerPhone,
          shippingAddress,
        },
        deliveryMethod: o.deliveryMethod,
        subtotal: o.subtotal,
        discount: o.discount,
        couponCode: o.couponCode,
        shippingFee: o.shippingFee,
        total: o.total,
        fulfillmentStatus: o.fulfillmentStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        paymentReference: o.paymentReference,
        courierProvider: o.courierProvider,
        courierTrackingNumber: o.courierTrackingNumber,
        courierStatus: o.courierStatus,
        isTrashed: o.isTrashed,
        isIncomplete: computedIncomplete,
        incompleteReason: computedReason,
        itemsCount: o.items.length,
        itemsSummary: o.items.map((i: any) => `${i.productName} (${i.size}) x${i.quantity}`).join(', '),
        createdAt: o.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      tabCounts: {
        all: allCount,
        incomplete: incompleteCount,
        trashed: trashedCount,
      },
      orders: transformed,
    });
  } catch (error: any) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Manual Order Creation (Phone / WhatsApp Concierge Order)
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      streetAddress,
      city,
      division,
      postalCode,
      deliveryMethod,
      paymentMethod,
      shippingFee,
      items, // array of { variantId, quantity, customPrice }
      internalNotes,
    } = body;

    if (!customerName || !customerPhone || !streetAddress || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient name, phone, address, and at least one item are required.' },
        { status: 400 }
      );
    }

    // Process line items & check stock
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        return NextResponse.json({ success: false, error: `Flacon variant not found.` }, { status: 400 });
      }

      const unitPrice = item.customPrice !== undefined ? parseFloat(item.customPrice) : variant.sellingPrice;
      const qty = parseInt(item.quantity, 10) || 1;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      validatedItems.push({
        productId: variant.product.id,
        variantId: variant.id,
        productName: variant.product.name,
        variantSku: variant.sku,
        size: variant.size,
        unitPrice,
        purchaseCost: variant.purchaseCost,
        quantity: qty,
        totalPrice: lineTotal,
      });
    }

    const finalShipping = parseFloat(shippingFee) || (subtotal >= 5000 ? 0 : 60);
    const total = subtotal + finalShipping;

    const newOrder = await prisma.$transaction(async (tx: any) => {
      // Find or create customer
      let customer = await tx.customer.findFirst({
        where: { OR: [{ phone: customerPhone.trim() }, { email: (customerEmail || '').trim() }] },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName.trim(),
            email: customerEmail ? customerEmail.trim().toLowerCase() : `${customerPhone.trim()}@guest.rawdah.com`,
            phone: customerPhone.trim(),
            address: streetAddress.trim(),
            city: city ? city.trim() : 'Dhaka',
            division: division || 'Dhaka',
            postalCode: postalCode || null,
          },
        });
      }

      const orderNumber = `RDH-${Math.floor(10000 + Math.random() * 90000)}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: customerName.trim(),
          customerEmail: customer.email,
          customerPhone: customerPhone.trim(),
          shippingAddress: JSON.stringify({
            address: streetAddress.trim(),
            city: city || 'Dhaka',
            division: division || 'Dhaka',
            postalCode: postalCode || null,
          }),
          deliveryMethod: deliveryMethod || 'inside_dhaka',
          subtotal,
          discount: 0,
          shippingFee: finalShipping,
          total,
          fulfillmentStatus: 'CONFIRMED', // Manual orders are directly confirmed by staff
          paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
          paymentMethod: paymentMethod || 'COD',
          internalNotes: `Manual Phone/WhatsApp order entered by ${session.name}. ${internalNotes || ''}`,
          itemsSnapshot: JSON.stringify(validatedItems),
          confirmedAt: new Date(),
        },
      });

      // Create Order Items
      for (const vi of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: vi.productId,
            variantId: vi.variantId,
            productName: vi.productName,
            variantSku: vi.variantSku,
            size: vi.size,
            unitPrice: vi.unitPrice,
            purchaseCost: vi.purchaseCost,
            quantity: vi.quantity,
            totalPrice: vi.totalPrice,
          },
        });
      }

      // Reserve stock
      await reserveStockForOrder(
        tx,
        validatedItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        order.id,
        { id: session.id, name: session.name }
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'CREATE_MANUAL_ORDER',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({ orderNumber, total, itemsCount: validatedItems.length }),
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: `Manual Order #${newOrder.orderNumber} placed and confirmed.`,
    });
  } catch (error: any) {
    console.error('Manual order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

