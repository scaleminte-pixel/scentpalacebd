import { PrismaClient, Prisma } from '@prisma/client';

export type StockOperationType =
  | 'OPENING'
  | 'PURCHASE_RECEIPT'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'DISPATCH'
  | 'CANCELLATION_RESTOCK'
  | 'RETURN_RESTOCK';

export interface StockReservationItem {
  variantId: string;
  quantity: number;
}

/**
 * Atomically reserve stock during checkout.
 * Checks available stock (physical - reserved) and locks the reservation.
 * Throws error if insufficient available stock.
 */
export async function reserveStockForOrder(
  prisma: PrismaClient | Prisma.TransactionClient,
  items: StockReservationItem[],
  orderId: string,
  user?: { id?: string; name?: string }
) {
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) {
      throw new Error(`Variant not found: ${item.variantId}`);
    }

    const availableStock = variant.stock - variant.reservedStock;
    if (availableStock < item.quantity) {
      throw new Error(
        `Insufficient stock for flacon ${variant.sku}. Requested: ${item.quantity}, Available: ${availableStock}`
      );
    }

    // Increment reserved stock
    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        reservedStock: { increment: item.quantity },
      },
    });

    // Log stock reservation movement
    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: 'RESERVATION',
        quantity: -item.quantity,
        beforeStock: variant.stock - variant.reservedStock,
        afterStock: updated.stock - updated.reservedStock,
        reason: `Reserved for checkout order #${orderId}`,
        orderId,
        userId: user?.id,
        userName: user?.name || 'Customer Checkout',
      },
    });
  }
}

/**
 * When order is dispatched/shipped, physical stock is permanently decremented
 * and reservation is cleared.
 */
export async function commitStockDispatch(
  prisma: PrismaClient | Prisma.TransactionClient,
  orderId: string,
  user?: { id?: string; name?: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error(`Order not found: ${orderId}`);

  for (const item of order.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) continue;

    // Decrement physical stock and clear reserved stock
    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: { decrement: item.quantity },
        reservedStock: { decrement: Math.min(variant.reservedStock, item.quantity) },
      },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: 'DISPATCH',
        quantity: -item.quantity,
        beforeStock: variant.stock,
        afterStock: updated.stock,
        reason: `Dispatched courier parcel for order ${order.orderNumber}`,
        orderId: order.id,
        userId: user?.id,
        userName: user?.name || 'Warehouse Staff',
      },
    });
  }
}

/**
 * Release reserved stock upon order cancellation or checkout timeout.
 */
export async function releaseStockReservation(
  prisma: PrismaClient | Prisma.TransactionClient,
  orderId: string,
  reason: string,
  user?: { id?: string; name?: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  for (const item of order.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) continue;

    const releaseQty = Math.min(variant.reservedStock, item.quantity);
    if (releaseQty <= 0) continue;

    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        reservedStock: { decrement: releaseQty },
      },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: 'CANCELLATION_RESTOCK',
        quantity: releaseQty,
        beforeStock: variant.stock - variant.reservedStock,
        afterStock: updated.stock - updated.reservedStock,
        reason: `Released reservation: ${reason}`,
        orderId: order.id,
        userId: user?.id,
        userName: user?.name || 'Order Management',
      },
    });
  }
}

/**
 * Restock returned items only after physical condition inspection.
 */
export async function restockReturnedGoods(
  prisma: PrismaClient | Prisma.TransactionClient,
  orderId: string,
  restockItems: Array<{ variantId: string; quantity: number }>,
  inspectionNotes: string,
  user: { id: string; name: string }
) {
  for (const item of restockItems) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) continue;

    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: { increment: item.quantity },
      },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: variant.id,
        type: 'RETURN_RESTOCK',
        quantity: item.quantity,
        beforeStock: variant.stock,
        afterStock: updated.stock,
        reason: `Restocked after inspection: ${inspectionNotes}`,
        orderId,
        userId: user.id,
        userName: user.name,
      },
    });
  }
}

