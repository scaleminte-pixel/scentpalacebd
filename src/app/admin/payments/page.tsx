'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Phone,
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pendingCount, setPendingCount] = useState(0);

  // Verification modal state
  const [verifyModalTx, setVerifyModalTx] = useState<any>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyTrxId, setVerifyTrxId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ method: methodFilter, status: statusFilter });
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setPendingCount(data.pendingManualVerifications || 0);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, statusFilter]);

  const handleVerify = async (action: 'VERIFY' | 'REJECT') => {
    if (!verifyModalTx) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/payments/verify-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: verifyModalTx.id,
          orderId: verifyModalTx.orderId,
          trxId: verifyTrxId || verifyModalTx.trxId,
          amount: verifyModalTx.amount,
          notes: verifyNotes,
          action,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyModalTx(null);
        setVerifyNotes('');
        setVerifyTrxId('');
        fetchPayments();
      } else {
        alert(data.error || 'Verification action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Payment Transactions</h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time bKash tokenized gateway callbacks, manual TrxID verification, and COD reconciliations.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Manual bKash TrxID Pending Review</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'BKASH', 'COD', 'CARD'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                methodFilter === m
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {m === 'ALL' ? 'All Gateways' : m}
            </button>
          ))}
          <div className="h-4 w-px bg-stone-200 mx-1" />
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                statusFilter === s
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {s === 'ALL' ? 'All Statuses' : s}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Reference / TrxID</th>
                <th className="py-3 px-4">Amount (BDT)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                      <Link href={`/admin/orders/${tx.orderId}`} className="hover:text-[#D45520] flex items-center gap-1">
                        {tx.orderNumber}
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-stone-900">{tx.customerName}</div>
                      <div className="text-[11px] text-stone-400">{tx.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                        {tx.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-700 font-medium">
                      {tx.trxId || tx.gatewayRef || 'Cash on Delivery'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      ৳{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {tx.status === 'PENDING' && tx.isManual ? (
                        <button
                          onClick={() => {
                            setVerifyModalTx(tx);
                            setVerifyTrxId(tx.trxId || '');
                            setVerifyNotes('');
                          }}
                          className="px-2.5 py-1 bg-[#D45520] text-white rounded-lg text-[11px] font-semibold hover:bg-[#B34316] transition"
                        >
                          Verify TrxID
                        </button>
                      ) : tx.adminVerifiedBy ? (
                        <span className="text-[10px] text-stone-400">By {tx.adminVerifiedBy}</span>
                      ) : (
                        <span className="text-[10px] text-stone-300">Automated</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyModalTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Verify Manual Payment</h3>
                <p className="text-xs text-stone-500">Order: {verifyModalTx.orderNumber} • Amount: ৳{(verifyModalTx.amount || 0).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setVerifyModalTx(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Transaction ID (TrxID)</label>
                <input
                  type="text"
                  placeholder="e.g. BKASH98410291"
                  value={verifyTrxId}
                  onChange={(e) => setVerifyTrxId(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Verification Notes</label>
                <textarea
                  rows={2}
                  placeholder="Checked against bKash Merchant statement..."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => handleVerify('REJECT')}
                  disabled={isVerifying}
                  className="px-3.5 py-2 border border-rose-200 text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 font-medium"
                >
                  Reject TrxID
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModalTx(null)}
                    className="px-3 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify('VERIFY')}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Confirm & Credit Treasury'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

