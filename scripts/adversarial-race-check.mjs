import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testRace() {
  const bkashAcc = await prisma.financeAccount.findFirst({ where: { type: 'BKASH' } });
  const initialTx = await prisma.paymentTransaction.count();
  const initialLedger = await prisma.financeLedger.count();
  const initialBkash = bkashAcc ? bkashAcc.currentBalance : 0;

  // Create an unpaid order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'RDH-RACE-' + Date.now(),
      customerName: 'Race Tester',
      customerEmail: 'race@tester.com',
      customerPhone: '01711111111',
      shippingAddress: 'Race Street, Dhaka',
      total: 1000,
      subtotal: 1000,
      shippingFee: 0,
      paymentMethod: 'BKASH',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      itemsSnapshot: '[]',
    }
  });

  console.log('Created pending order:', order.orderNumber, 'ID:', order.id);

  // Fire 5 concurrent success callbacks simultaneously!
  const reqs = Array.from({ length: 5 }, (_, i) => {
    return fetch('http://localhost:3005/api/payments/bkash/callback?paymentID=BK_RACE_' + i + '&orderId=' + order.id + '&status=success', { redirect: 'manual' })
      .then(r => ({ i, status: r.status, loc: r.headers.get('location') }));
  });

  const results = await Promise.all(reqs);
  console.log('Callback HTTP responses:');
  results.forEach(r => console.log(`  Req #${r.i}: HTTP ${r.status} -> ${r.loc}`));

  const postTx = await prisma.paymentTransaction.count();
  const postLedger = await prisma.financeLedger.count();
  const bkashAccPost = await prisma.financeAccount.findFirst({ where: { type: 'BKASH' } });
  const postBkash = bkashAccPost ? bkashAccPost.currentBalance : 0;

  const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
  console.log('\nOrder paymentStatus after:', orderAfter.paymentStatus);
  console.log('New PaymentTransactions created:', postTx - initialTx);
  console.log('New FinanceLedgers created:', postLedger - initialLedger);
  console.log('bKash balance delta:', postBkash - initialBkash);

  // Cleanup
  await prisma.paymentTransaction.deleteMany({ where: { orderId: order.id } });
  await prisma.financeLedger.deleteMany({ where: { referenceId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  if (bkashAcc) {
    await prisma.financeAccount.update({
      where: { id: bkashAcc.id },
      data: { currentBalance: initialBkash }
    });
  }
  console.log('Cleaned up race test artifacts.');
}

testRace()
  .catch(err => console.error('Race test error:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
