import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { reserveStockForOrder } from '@/lib/inventory';
import { createBkashPaymentSession } from '@/lib/bkash';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      division,
      postalCode,
      notes,
      items,
      deliveryMethod,
      paymentMethod,
      couponCode,
    } = body;

    // Validate inputs
    if (!name || !phone || !email || !address || !city) {
      return NextResponse.json(
        { success: false, error: 'Please provide full recipient name, mobile number, email, and shipping address.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Your shopping bag is empty.' },
        { status: 400 }
      );
    }

    // Server-side recalculation of items, stock check & prices
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantSku: string;
      size: string;
      unitPrice: number;
      purchaseCost: number;
      quantity: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          OR: [
            ...(item.variantId ? [{ id: item.variantId }] : []),
            ...(item.sku || item.variantSku ? [{ sku: item.sku || item.variantSku }] : []),
            ...(item.slug && item.size ? [{ AND: [{ product: { slug: item.slug } }, { size: item.size }] }] : []),
          ],
        },
        include: { product: true },
      });

      if (!variant || !variant.isActive || variant.product.status !== 'PUBLISHED') {
        return NextResponse.json(
          { success: false, error: `Product variant "${item.name}" is no longer available.` },
          { status: 400 }
        );
      }

      const available = variant.stock - variant.reservedStock;
      if (available < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${variant.product.name} (${variant.size})". Only ${available} flacons remaining.`,
          },
          { status: 400 }
        );
      }

      const lineTotal = variant.sellingPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: variant.product.id,
        variantId: variant.id,
        productName: variant.product.name,
        variantSku: variant.sku,
        size: variant.size,
        unitPrice: variant.sellingPrice,
        purchaseCost: variant.purchaseCost,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    // Coupon discount recalculation
    let discountAmount = 0;
    let validCouponCode = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (calculatedSubtotal >= coupon.minSpend) {
          validCouponCode = coupon.code;
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = Math.round((calculatedSubtotal * coupon.value) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.value, calculatedSubtotal);
          }
        }
      }
    }

    // Shipping calculation
    const isFreeShipping = calculatedSubtotal >= 5000;
    let shippingFee = 0;
    if (!isFreeShipping) {
      if (deliveryMethod === 'inside_dhaka') shippingFee = 60;
      else if (deliveryMethod === 'express_dhaka') shippingFee = 150;
      else shippingFee = 120;
    } else {
      if (deliveryMethod === 'express_dhaka') shippingFee = 50; // Discounted express
    }

    const totalDue = Math.max(0, calculatedSubtotal - discountAmount) + shippingFee;

    // Execute atomic transaction for order creation and stock reservation
    const result = await prisma.$transaction(async (tx: any) => {
      // Find or create customer
      let customer = await tx.customer.findFirst({
        where: {
          OR: [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }],
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            division: division || 'Dhaka',
            postalCode: postalCode || null,
          },
        });
      }

      // Generate order number (RDH-xxxxx)
      const orderNumber = `RDH-${Math.floor(10000 + Math.random() * 90000)}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim(),
          shippingAddress: JSON.stringify({
            address: address.trim(),
            city: city.trim(),
            division: division || 'Dhaka',
            postalCode: postalCode || null,
          }),
          deliveryMethod: deliveryMethod || 'inside_dhaka',
          subtotal: calculatedSubtotal,
          discount: discountAmount,
          couponCode: validCouponCode,
          shippingFee,
          total: totalDue,
          fulfillmentStatus: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: paymentMethod === 'bkash' ? 'BKASH' : paymentMethod === 'card' ? 'CARD' : 'COD',
          customerNotes: notes || null,
          itemsSnapshot: JSON.stringify(validatedItems),
        },
      });

      // Create Order Items
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantSku: item.variantSku,
            size: item.size,
            unitPrice: item.unitPrice,
            purchaseCost: item.purchaseCost,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          },
        });
      }

      // Reserve stock atomically
      await reserveStockForOrder(
        tx,
        validatedItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        newOrder.id,
        { id: customer.id, name: customer.name }
      );

      // Record Analytics Event for Order Placement
      await tx.analyticsEvent.create({
        data: {
          eventType: 'ORDER_PLACED',
          sessionId: req.cookies.get('rawdah_session_id')?.value || `sess-${Date.now()}`,
          anonymousId: customer.id,
          path: '/checkout',
          metadataJson: JSON.stringify({
            orderNumber,
            total: totalDue,
            itemsCount: validatedItems.length,
            paymentMethod,
          }),
        },
      });

      return newOrder;
    });

    // Handle bKash Session if requested
    let bkashSession = null;
    if (result.paymentMethod === 'BKASH') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      bkashSession = await createBkashPaymentSession(
        result.orderNumber,
        result.total,
        `${siteUrl}/api/payments/bkash/callback?orderId=${result.id}`
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
      total: result.total,
      paymentMethod: result.paymentMethod,
      bkashUrl: bkashSession?.bkashURL || null,
      message: 'Order created successfully and stock reserved.',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to place order.';
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
