/**
 * Launch reset — wipes all test/demo transactional data so the store can
 * start taking real orders. KEEPS: products, variants, categories, scent
 * families, website content, settings/branding, coupons, deals, reviews,
 * admin users.
 *
 * Usage:
 *   node scripts/launch-reset.js            # dry run (shows what would change)
 *   node scripts/launch-reset.js --yes      # actually do it
 *   node scripts/launch-reset.js --yes --stock=50
 *
 * Also syncs each product's review count/rating with its real reviews.
 *
 * Take a backup of the database file before running with --yes.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient(require('./data-dir').prismaOptions());
const CONFIRM = process.argv.includes('--yes');
const stockArg = process.argv.find((a) => a.startsWith('--stock='));
const STOCK = stockArg ? parseInt(stockArg.split('=')[1], 10) : 50;

async function main() {
  const counts = {
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    paymentTransactions: await prisma.paymentTransaction.count(),
    stockMovements: await prisma.stockMovement.count(),
    customers: await prisma.customer.count(),
    financeLedger: await prisma.financeLedger.count(),
    expenses: await prisma.expense.count(),
    analyticsEvents: await prisma.analyticsEvent.count(),
    auditLogs: await prisma.auditLog.count(),
    variants: await prisma.productVariant.count(),
  };
  console.log('Current data:', counts);
  console.log(`Plan: delete all orders/customers/payments/ledger/expenses/analytics/audit logs,`);
  console.log(`      reset finance account balances to 0, set every variant stock to ${STOCK} (reserved 0).`);

  if (!CONFIRM) {
    console.log('\nDry run only. Re-run with --yes to apply.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({});
    await tx.paymentTransaction.deleteMany({});
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});
    await tx.customer.deleteMany({});
    await tx.financeLedger.deleteMany({});
    await tx.expense.deleteMany({});
    await tx.financeAccount.updateMany({ data: { currentBalance: 0 } });
    await tx.analyticsEvent.deleteMany({});
    await tx.auditLog.deleteMany({});

    // Sync product review counts with real reviews (demo seed had invented counts)
    const products = await tx.product.findMany({ select: { id: true } });
    for (const pr of products) {
      const real = await tx.review.findMany({ where: { productId: pr.id }, select: { rating: true } });
      const avg = real.length ? real.reduce((a, r) => a + r.rating, 0) / real.length : 5;
      await tx.product.update({
        where: { id: pr.id },
        data: { reviewsCount: real.length, rating: Math.round(avg * 10) / 10 },
      });
    }

    await tx.productVariant.updateMany({ data: { stock: STOCK, reservedStock: 0 } });
    const variants = await tx.productVariant.findMany({ select: { id: true } });
    for (const v of variants) {
      await tx.stockMovement.create({
        data: {
          variantId: v.id,
          type: 'OPENING',
          quantity: STOCK,
          beforeStock: 0,
          afterStock: STOCK,
          reason: 'Launch opening stock',
          userName: 'System',
        },
      });
    }
  });

  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    await prisma.$queryRawUnsafe('VACUUM;');
  } catch (_) {}

  console.log('\nDone. After:', {
    orders: await prisma.order.count(),
    customers: await prisma.customer.count(),
    variantsAt: `${await prisma.productVariant.count({ where: { stock: STOCK } })} variants @ ${STOCK} units`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
