import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, orderId, trxId, amount, notes, action } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'orderId and action are required.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (action === 'REJECT') {
      await prisma.$transaction(async (tx) => {
        if (transactionId) {
          await tx.paymentTransaction.update({
            where: { id: transactionId },
            data: {
              status: 'FAILED',
              adminVerifiedBy: session.name,
              verificationNotes: notes || 'Rejected by administrator',
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: session.id,
            userName: session.name,
            action: 'REJECT_PAYMENT',
            entity: 'PaymentTransaction',
            entityId: transactionId || order.id,
            details: JSON.stringify({ orderNumber: order.orderNumber, reason: notes }),
          },
        });
      });

      return NextResponse.json({ success: true, message: 'Payment marked as rejected.' });
    }

    // Action: APPROVE
    const verifiedAmount = parseFloat(amount) || order.total;

    const result = await prisma.$transaction(async (tx) => {
      // Find bKash finance account
      const bkashAccount = await tx.financeAccount.findFirst({
        where: { type: 'BKASH' },
      });

      // Update Order
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentReference: trxId,
          confirmedAt: order.confirmedAt || new Date(),
          fulfillmentStatus: order.fulfillmentStatus === 'PENDING' ? 'CONFIRMED' : order.fulfillmentStatus,
        },
      });

      // Update or create payment transaction
      let paymentTrx;
      if (transactionId) {
        paymentTrx = await tx.paymentTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'VERIFIED_MANUAL',
            trxId,
            amount: verifiedAmount,
            adminVerifiedBy: session.name,
            verificationNotes: notes || 'Verified manually against bKash statement',
          },
        });
      } else {
        paymentTrx = await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            amount: verifiedAmount,
            method: 'BKASH',
            trxId,
            status: 'VERIFIED_MANUAL',
            isManual: true,
            adminVerifiedBy: session.name,
            verificationNotes: notes || 'Manual verification by staff',
          },
        });
      }

      // Record in bKash account ledger
      if (bkashAccount) {
        await tx.financeAccount.update({
          where: { id: bkashAccount.id },
          data: { currentBalance: { increment: verifiedAmount } },
        });

        await tx.financeLedger.create({
          data: {
            accountId: bkashAccount.id,
            type: 'SALE_INFLOW',
            amount: verifiedAmount,
            referenceType: 'ORDER',
            referenceId: order.id,
            category: 'BKASH_MANUAL_SALES',
            notes: `Manual bKash payment verified for Order #${order.orderNumber} (TrxID: ${trxId})`,
            createdBy: session.name,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'VERIFY_PAYMENT',
          entity: 'PaymentTransaction',
          entityId: paymentTrx.id,
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            trxId,
            verifiedAmount,
          }),
        },
      });

      return { updatedOrder, paymentTrx };
    });

    return NextResponse.json({
      success: true,
      message: `bKash payment for Order #${order.orderNumber} verified and marked PAID.`,
      result,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

