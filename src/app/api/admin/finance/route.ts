import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Finance Accounts & Recorded Balances
    const accounts = await prisma.financeAccount.findMany({
      where: { isActive: true },
      include: {
        ledgers: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const totalLiquidBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    // 2. Expenses breakdown by category
    const expenses = await prisma.expense.findMany({
      include: { account: true },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // 3. Delivered Sales & Historical COGS (Accrual basis)
    const deliveredOrders = await prisma.order.findMany({
      where: { fulfillmentStatus: 'DELIVERED' },
      include: { items: true },
    });

    const grossDeliveredSales = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const orderDiscounts = deliveredOrders.reduce((sum, o) => sum + o.discount, 0);
    const shippingRevenue = deliveredOrders.reduce((sum, o) => sum + o.shippingFee, 0);
    const netDeliveredSales = grossDeliveredSales - orderDiscounts;

    let deliveredCogs = 0;
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        deliveredCogs += (item.purchaseCost || 0) * item.quantity;
      }
    }

    const grossProfit = netDeliveredSales - deliveredCogs;
    const grossMarginPercent = netDeliveredSales > 0 ? (grossProfit / netDeliveredSales) * 100 : 0;
    const netOperatingProfit = grossProfit - totalExpenses;
    const operatingMarginPercent = netDeliveredSales > 0 ? (netOperatingProfit / netDeliveredSales) * 100 : 0;

    // 4. Recent Transactions Ledger
    const recentLedgers = await prisma.financeLedger.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { account: true },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalLiquidBalance,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          accountNumber: a.accountNumber,
          balance: a.currentBalance,
          openingBalance: a.openingBalance,
          notes: a.notes,
        })),
      },
      pnl: {
        grossDeliveredSales,
        orderDiscounts,
        netDeliveredSales,
        shippingRevenue,
        deliveredCogs,
        grossProfit,
        grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
        totalExpenses,
        netOperatingProfit,
        operatingMarginPercent: Math.round(operatingMarginPercent * 10) / 10,
        definitions: {
          sales: 'Recognized revenue strictly from delivered parcels accepted by customers.',
          cogs: 'Actual purchase cost of fragrance oils, crystal bottles, and packaging snapshotted at time of sale.',
          expenses: 'Cash outflows for operating costs, marketing, salaries, and atelier rent.',
        },
      },
      expenses: {
        byCategory: expensesByCategory.map((c) => ({
          category: c.category,
          amount: c._sum.amount || 0,
        })),
        recent: expenses.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          amount: e.amount,
          accountName: e.account.name,
          vendor: e.vendor,
          date: e.date.toISOString(),
          notes: e.notes,
          recordedBy: e.recordedBy,
        })),
      },
      ledgers: recentLedgers.map((l) => ({
        id: l.id,
        accountName: l.account.name,
        accountType: l.account.type,
        type: l.type,
        amount: l.amount,
        referenceType: l.referenceType,
        category: l.category,
        notes: l.notes,
        createdBy: l.createdBy,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Finance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Record new Business Expense
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, category, amount, accountId, vendor, date, notes, receiptUrl } = await req.json();

    if (!title || !category || !amount || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Title, category, amount, and payment account are required.' },
        { status: 400 }
      );
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than zero.' }, { status: 400 });
    }

    const account = await prisma.financeAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ success: false, error: 'Payment account not found.' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Expense
      const exp = await tx.expense.create({
        data: {
          title: title.trim(),
          category,
          amount: expenseAmount,
          accountId: account.id,
          vendor: vendor ? vendor.trim() : null,
          date: date ? new Date(date) : new Date(),
          notes: notes ? notes.trim() : null,
          receiptUrl: receiptUrl || null,
          recordedBy: session.name,
        },
      });

      // Deduct from Account Balance
      await tx.financeAccount.update({
        where: { id: account.id },
        data: { currentBalance: { decrement: expenseAmount } },
      });

      // Financial Ledger Outflow
      await tx.financeLedger.create({
        data: {
          accountId: account.id,
          type: 'EXPENSE_OUTFLOW',
          amount: expenseAmount,
          referenceType: 'EXPENSE',
          referenceId: exp.id,
          category,
          notes: `${title} (${vendor || 'General'})`,
          receiptUrl: receiptUrl || null,
          createdBy: session.name,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: 'CREATE_EXPENSE',
          entity: 'Expense',
          entityId: exp.id,
          details: JSON.stringify({ title, amount: expenseAmount, account: account.name }),
        },
      });

      return exp;
    });

    return NextResponse.json({
      success: true,
      expense: result,
      message: `Expense of ৳${expenseAmount.toLocaleString()} recorded and deducted from ${account.name}.`,
    });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

