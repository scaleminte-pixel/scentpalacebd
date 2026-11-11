/**
 * Precise currency and financial calculations for Scent Palace BD.
 * Money is computed in exact integer Poisha (1 BDT = 100 Poisha) to eliminate
 * floating-point rounding errors across ledgers, invoices, and payouts.
 */

export function toPoisha(bdt: number): number {
  return Math.round(bdt * 100);
}

export function fromPoisha(poisha: number): number {
  return poisha / 100;
}

export function formatBDT(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatBDTWithPoisha(amount: number): string {
  return `৳${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface OrderFinancialSummary {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  totalPurchaseCost: number; // COGS snapshot
  grossProfit: number;
  grossMarginPercent: number;
}

export function calculateOrderFinancials(
  items: Array<{ unitPrice: number; purchaseCost: number; quantity: number }>,
  discountAmount: number = 0,
  shippingCost: number = 0
): OrderFinancialSummary {
  let subtotalPoisha = 0;
  let costPoisha = 0;

  for (const item of items) {
    const itemSubtotalPoisha = toPoisha(item.unitPrice) * item.quantity;
    const itemCostPoisha = toPoisha(item.purchaseCost || 0) * item.quantity;
    subtotalPoisha += itemSubtotalPoisha;
    costPoisha += itemCostPoisha;
  }

  const discountPoisha = toPoisha(discountAmount);
  const shippingPoisha = toPoisha(shippingCost);
  const totalPoisha = Math.max(0, subtotalPoisha - discountPoisha) + shippingPoisha;
  const netSalesPoisha = Math.max(0, subtotalPoisha - discountPoisha);
  const grossProfitPoisha = netSalesPoisha - costPoisha;
  const grossMarginPercent = netSalesPoisha > 0 ? (grossProfitPoisha / netSalesPoisha) * 100 : 0;

  return {
    subtotal: fromPoisha(subtotalPoisha),
    discount: fromPoisha(discountPoisha),
    shippingFee: fromPoisha(shippingPoisha),
    total: fromPoisha(totalPoisha),
    totalPurchaseCost: fromPoisha(costPoisha),
    grossProfit: fromPoisha(grossProfitPoisha),
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
  };
}

