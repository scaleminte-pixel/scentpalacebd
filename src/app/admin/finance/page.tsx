'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  CreditCard,
  Receipt,
  X,
  PieChart,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminFinancePage() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Record Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'MARKETING',
    amount: '',
    accountId: '',
    vendor: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/finance');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFinanceData(data);
          if (data.summary?.accounts?.length > 0 && !expenseForm.accountId) {
            setExpenseForm((prev) => ({ ...prev, accountId: data.summary.accounts[0].id }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.accountId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsExpenseModalOpen(false);
        setExpenseForm({
          title: '',
          category: 'MARKETING',
          amount: '',
          accountId: financeData?.summary?.accounts?.[0]?.id || '',
          vendor: '',
          notes: '',
        });
        fetchFinance();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-[#D45520] rounded-full animate-spin" />
      </div>
    );
  }

  const pnl = financeData?.pnl || {};
  const summary = financeData?.summary || {};
  const accounts = summary.accounts || [];
  const ledgers = financeData?.ledgers || [];
  const expenseCategories = financeData?.expenses?.byCategory || [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Financial Treasury & P&L</h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time liquid bank balances, COGS accounting, operating margins, and ledger cash flow.
          </p>
        </div>
        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D45520] text-white rounded-xl text-xs font-semibold hover:bg-[#B34316] transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Record Business Expense
        </button>
      </div>

      {/* Top 4 KPI Metric Cards (FinSet Reference Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Liquid Balances */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-wider">
            <span>Liquid Treasury</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            ৳{(summary.totalLiquidBalance || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across 4 Active Liquidity Channels</span>
          </div>
        </div>

        {/* Net Delivered Sales */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-wider">
            <span>Delivered Sales (Rev)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            ৳{(pnl.netDeliveredSales || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500">
            Gross: ৳{(pnl.grossDeliveredSales || 0).toLocaleString()} (Discounts: -৳{(pnl.orderDiscounts || 0).toLocaleString()})
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-wider">
            <span>COGS (Artisanal Oils)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            ৳{(pnl.deliveredCogs || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-800 font-medium">
            Gross Margin: <strong className="font-mono">{pnl.grossMarginPercent || 0}%</strong>
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 uppercase tracking-wider">
            <span>Net Operating Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#D45520]/10 text-[#D45520] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#D45520]">
            ৳{(pnl.netOperatingProfit || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-600 font-medium">
            Net Margin: <strong className="font-mono text-stone-900">{pnl.operatingMarginPercent || 0}%</strong>
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Operating Accounts & Wallets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc: any) => (
            <div key={acc.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-stone-300 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                  {acc.type}
                </span>
                <span className="font-mono text-xs text-stone-400">{acc.accountNumber || 'Primary'}</span>
              </div>
              <h3 className="font-bold text-stone-900 text-base">{acc.name}</h3>
              <div className="text-xl font-bold font-mono text-stone-900 mt-2">
                ৳{acc.balance.toLocaleString()}
              </div>
              <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">{acc.notes || 'Operating liquidity'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* P&L Statement & Expense Categories Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Income Statement */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-bold text-stone-900 text-base">Atelier Income Statement (P&L)</h3>
              <p className="text-xs text-stone-500">Accrual-based revenue recognized from verified delivered parcels.</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              Profitable
            </span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            <div className="py-2.5 flex justify-between items-center text-stone-700">
              <span className="font-medium">1. Gross Fragrance Sales (Delivered)</span>
              <span className="font-mono text-stone-900 font-semibold">৳{(pnl.grossDeliveredSales || 0).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-stone-600">
              <span className="pl-4 text-stone-500">Less: Promotional Discounts & Vouchers</span>
              <span className="font-mono text-rose-600">-৳{(pnl.orderDiscounts || 0).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center bg-stone-50/70 px-3 rounded-lg font-semibold text-stone-900">
              <span>Net Fragrance Revenue</span>
              <span className="font-mono">৳{(pnl.netDeliveredSales || 0).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-stone-600">
              <span className="pl-4 text-stone-500">Less: Cost of Goods Sold (Raw Oils, Crystals, Pumps)</span>
              <span className="font-mono text-amber-800">-৳{(pnl.deliveredCogs || 0).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center bg-amber-50/60 px-3 rounded-lg font-bold text-stone-900">
              <span className="text-amber-900">Gross Operating Profit ({pnl.grossMarginPercent}%)</span>
              <span className="font-mono text-amber-900">৳{(pnl.grossProfit || 0).toLocaleString()}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center text-stone-600">
              <span className="pl-4 text-stone-500">Less: Operating Expenses (Rent, Packing, Marketing, Team)</span>
              <span className="font-mono text-rose-600">-৳{(pnl.totalExpenses || 0).toLocaleString()}</span>
            </div>
            <div className="py-3 flex justify-between items-center bg-stone-900 text-white px-4 rounded-xl text-sm font-bold">
              <span>Net Operating Profit ({pnl.operatingMarginPercent}%)</span>
              <span className="font-mono text-emerald-400">৳{(pnl.netOperatingProfit || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Operating Expenses by Category */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-stone-900 text-base">Operating Cost Breakdown</h3>
          <p className="text-xs text-stone-500">Distribution of overhead expenses for the current period.</p>

          <div className="space-y-3 pt-2">
            {expenseCategories.map((ec: any) => {
              const totalExp = pnl.totalExpenses || 1;
              const pct = Math.round((ec.amount / totalExp) * 100);
              return (
                <div key={ec.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-stone-700">{ec.category}</span>
                    <span className="font-mono text-stone-900">৳{ec.amount.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D45520] rounded-full"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Financial Ledger Transactions */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Treasury Transaction Ledger</h3>
            <p className="text-xs text-stone-500">Recent cash inflows and expense disbursements.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Particulars & Notes</th>
                <th className="py-2.5 px-3 text-right">Amount (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ledgers.map((l: any) => (
                <tr key={l.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 font-medium text-stone-900">{l.accountName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
                      {l.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        l.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {l.type === 'CREDIT' ? (
                        <>
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Inflow
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" /> Disbursement
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-600 max-w-xs truncate">{l.notes || '—'}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={l.type === 'CREDIT' ? 'text-emerald-700' : 'text-stone-900'}>
                      {l.type === 'CREDIT' ? '+' : '-'}৳{l.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Business Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Record Business Expense</h3>
                <p className="text-xs text-stone-500">Record cash outflow or supplier payment voucher.</p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Expense Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g., Gold filigree bottle caps (500 units)"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  required
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50"
                  >
                    <option value="MARKETING">MARKETING (Campaigns & Ads)</option>
                    <option value="PACKAGING">PACKAGING (Boxes, Ribbons, Vials)</option>
                    <option value="RAW_MATERIALS">RAW MATERIALS (Agarwood, Saffron)</option>
                    <option value="COURIER">COURIER (Steadfast Logistics)</option>
                    <option value="RENT">RENT (Atelier Gulshan-2)</option>
                    <option value="SALARIES">SALARIES (Staff & Perfumers)</option>
                    <option value="UTILITIES">UTILITIES & SOFTWARE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">Disbursed From Account</label>
                  <select
                    value={expenseForm.accountId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50"
                  >
                    {accounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (৳{acc.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g., Grasse Flacons Ltd."
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Internal Notes & Voucher No.</label>
                <textarea
                  rows={2}
                  placeholder="Invoice # or voucher particulars..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D45520] text-white rounded-lg hover:bg-[#B34316] font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Disburse & Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

