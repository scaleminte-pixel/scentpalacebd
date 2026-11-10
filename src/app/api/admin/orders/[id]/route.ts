import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { commitStockDispatch, releaseStockReservation } from '@/lib/inventory';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        customer: true,
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let shippingAddress = {};
    try { shippingAddress = JSON.parse(order.shippingAddress); } catch { shippingAddress = { address: order.shippingAddress }; }

    let itemsSnapshot = [];
    try { itemsSnapshot = JSON.parse(order.itemsSnapshot); } catch { itemsSnapshot = []; }

    const transformedItems = order.items.map((it: any) => {
      let productImages: string[] = [];
      if (it.product?.images) {
        if (Array.isArray(it.product.images)) {
          productImages = it.product.images;
        } else if (typeof it.product.images === 'string') {
          try {
            const parsed = JSON.parse(it.product.images);
            productImages = Array.isArray(parsed) ? parsed : [it.product.images];
          } catch {
            productImages = [it.product.images];
          }
        }
      }

      const primaryImg =
        productImages[0] ||
        it.product?.primaryImage ||
        '/images/products/lattafa-blue-oud.webp';

      return {
        ...it,
        productImage: primaryImg,
        product: it.product
          ? {
              ...it.product,
              images: productImages,
              primaryImage: primaryImg,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: transformedItems,
        shippingAddress,
        itemsSnapshot,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      fulfillmentStatus,
      paymentStatus,
      courierProvider,
      courierTrackingNumber,
      internalNotes,
      cancelReason,
      returnReason,
      isTrashed,
      isIncomplete,
      incompleteReason,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const prevFulfillment = order.fulfillmentStatus;
    const prevPayment = order.paymentStatus;

    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Handle stock transitions
      if (fulfillmentStatus && fulfillmentStatus !== prevFulfillment) {
        // When Shipped: commit physical stock deduction and clear reservation
        if (fulfillmentStatus === 'SHIPPED' && prevFulfillment !== 'SHIPPED' && prevFulfillment !== 'DELIVERED') {
          await commitStockDispatch(tx, order.id, { id: session.id, name: session.name });
        }
        // When Cancelled: release stock reservation
        else if (fulfillmentStatus === 'CANCELLED' && prevFulfillment !== 'CANCELLED') {
          await releaseStockReservation(tx, order.id, cancelReason || 'Order cancelled by staff', {
            id: session.id,
            name: session.name,
          });
        }
      }

      // 2. Handle Payment transition to PAID
      if (paymentStatus === 'PAID' && prevPayment !== 'PAID') {
        const targetAccount = await tx.financeAccount.findFirst({
          where: { type: order.paymentMethod === 'BKASH' ? 'BKASH' : order.paymentMethod === 'COD' ? 'COURIER_ESCROW' : 'BANK' },
        });

        if (targetAccount) {
          await tx.financeAccount.update({
            where: { id: targetAccount.id },
            data: { currentBalance: { increment: order.total } },
          });

          await tx.financeLedger.create({
            data: {
              accountId: targetAccount.id,
              type: 'SALE_INFLOW',
              amount: order.total,
              referenceType: 'ORDER',
              referenceId: order.id,
              category: `${order.paymentMethod}_SALES`,
              notes: `Order #${order.orderNumber} marked Paid by ${session.name}`,
              createdBy: session.name,
            },
          });
        }
      }

      // 3. Update Order record
      const updateData: any = {};
      if (fulfillmentStatus) {
        updateData.fulfillmentStatus = fulfillmentStatus;
        if (fulfillmentStatus === 'CONFIRMED' && !order.confirmedAt) updateData.confirmedAt = new Date();
        if (fulfillmentStatus === 'SHIPPED' && !order.shippedAt) updateData.shippedAt = new Date();
        if (fulfillmentStatus === 'DELIVERED') {
          updateData.deliveredAt = new Date();
          // Update customer lifetime value
          if (order.customerId) {
            await tx.customer.update({
              where: { id: order.customerId },
              data: {
                totalOrders: { increment: 1 },
                totalSpent: { increment: order.total },
                lastOrderAt: new Date(),
              },
            });
          }
        }
      }
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (courierProvider) updateData.courierProvider = courierProvider;
      if (courierTrackingNumber) updateData.courierTrackingNumber = courierTrackingNumber;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
      if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
      if (returnReason !== undefined) updateData.returnReason = returnReason;
      if (isTrashed !== undefined) updateData.isTrashed = isTrashed;
      if (isIncomplete !== undefined) updateData.isIncomplete = isIncomplete;
      if (incompleteReason !== undefined) updateData.incompleteReason = incompleteReason;

      const orderUpdated = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: isTrashed === false ? 'RESTORE_ORDER' : 'STATUS_CHANGE',
          entity: 'Order',
          entityId: order.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            fulfillment: `${prevFulfillment} -> ${fulfillmentStatus || prevFulfillment}`,
            payment: `${prevPayment} -> ${paymentStatus || prevPayment}`,
            isTrashed,
          }),
        },
      });

      return orderUpdated;
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order #${updated.orderNumber} updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (permanent) {
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.stockMovement.deleteMany({ where: { orderId: id } });
      await prisma.paymentTransaction.deleteMany({ where: { orderId: id } });
      await prisma.order.delete({ where: { id } });

      await prisma.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'PERMANENT_DELETE',
          entity: 'Order',
          entityId: id,
          details: JSON.stringify({ orderNumber: order.orderNumber }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order #${order.orderNumber} permanently purged from database.`,
      });
    }

    // Soft delete to Trash
    const updated = await prisma.order.update({
      where: { id },
      data: { isTrashed: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'MOVE_TO_TRASH',
        entity: 'Order',
        entityId: id,
        details: JSON.stringify({ orderNumber: order.orderNumber }),
      },
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Order #${order.orderNumber} moved to Trash.`,
    });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

