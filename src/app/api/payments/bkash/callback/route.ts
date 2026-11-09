import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { executeBkashPayment } from '@/lib/bkash';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!orderId) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=Missing+order+id`);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=Order+not+found`);
    }

    if (status === 'cancel' || status === 'failure') {
      return NextResponse.redirect(`${siteUrl}/checkout?error=bKash+payment+was+${status}`);
    }

    if (!paymentID) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=Missing+payment+ID`);
    }

    // Execute server-side verification
    const result = await executeBkashPayment(paymentID, order.total);

    if (!result.success) {
      return NextResponse.redirect(`${siteUrl}/checkout?error=${encodeURIComponent(result.message)}`);
    }

    // Update order and record transaction atomically
    await prisma.$transaction(async (tx) => {
      // Find bKash finance account
      const bkashAccount = await tx.financeAccount.findFirst({
        where: { type: 'BKASH' },
      });

      // Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentReference: result.trxID,
          paymentDetails: JSON.stringify(result.details),
          confirmedAt: new Date(),
          fulfillmentStatus: order.fulfillmentStatus === 'PENDING' ? 'CONFIRMED' : order.fulfillmentStatus,
        },
      });

      // Record Payment Transaction
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          amount: order.total,
          method: 'BKASH',
          gatewayRef: paymentID,
          trxId: result.trxID,
          status: 'SUCCESS',
          rawResponse: JSON.stringify(result.details),
        },
      });

      // Financial Ledger inflow
      if (bkashAccount) {
        await tx.financeAccount.update({
          where: { id: bkashAccount.id },
          data: { currentBalance: { increment: order.total } },
        });

        await tx.financeLedger.create({
          data: {
            accountId: bkashAccount.id,
            type: 'SALE_INFLOW',
            amount: order.total,
            referenceType: 'ORDER',
            referenceId: order.id,
            category: 'BKASH_ONLINE_SALES',
            notes: `bKash payment confirmed for Order #${order.orderNumber} (TrxID: ${result.trxID})`,
            createdBy: 'bKash Gateway Callback',
          },
        });
      }

      // Record Analytics Event
      await tx.analyticsEvent.create({
        data: {
          eventType: 'PAYMENT_CONFIRMED',
          sessionId: req.cookies.get('rawdah_session_id')?.value || `sess-${Date.now()}`,
          anonymousId: order.customerId || 'anon',
          path: '/checkout',
          metadataJson: JSON.stringify({
            orderNumber: order.orderNumber,
            total: order.total,
            method: 'BKASH',
            trxId: result.trxID,
          }),
        },
      });
    });

    return NextResponse.redirect(`${siteUrl}/order-confirmation?orderId=${order.id}&paid=true`);
  } catch (error: any) {
    console.error('bKash callback processing failed:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/checkout?error=Verification+exception`);
  }
}

