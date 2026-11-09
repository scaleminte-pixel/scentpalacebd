'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${reportType}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCsv = () => {
    window.location.href = `/api/admin/reports?type=${reportType}&format=csv`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Intelligence & Exportable Reports</h1>
          <p className="text-xs text-stone-500 mt-1">
            Financial reconciliation, sales logs, inventory valuation, and raw CSV exports.
          </p>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition shadow-xs"
        >
          <Download className="w-4 h-4" /> Download CSV Export
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setReportType('sales')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            reportType === 'sales'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Sales & Revenue Reconciliation
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
            reportType === 'inventory'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Warehouse Inventory Valuation
        </button>
      </div>

      {/* Summary Banner */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reportType === 'sales' ? (
            <>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Orders</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  {reportData.orderCount || 0}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Gross Order Volume</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  ৳{(reportData.totalGrossOrdersBDT || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold block">Delivered Revenue (Accepted)</span>
                <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                  ৳{(reportData.deliveredSalesBDT || 0).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Physical Units</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  {reportData.totalUnits || 0}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Cost Valuation (COGS)</span>
                <span className="text-2xl font-bold text-[#D45520] mt-1 block">
                  ৳{(reportData.totalValuationBDT || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Active Variants Count</span>
                <span className="text-2xl font-bold text-stone-900 mt-1 block">
                  {reportData.variants?.length || 0}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Data Preview Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm">
            {reportData?.reportName || 'Report Preview'}
          </h3>
          <span className="text-xs text-stone-400 font-mono">Showing first 50 records</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'sales' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Total (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reportData?.orders?.map((o: any) => (
                  <tr key={o.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-stone-900">{o.orderNumber}</td>
                    <td className="py-2.5 px-3 text-stone-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-stone-800">{o.customerName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700">
                        {o.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">{o.paymentMethod} ({o.paymentStatus})</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      ৳{o.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Physical Stock</th>
                  <th className="py-2.5 px-3">Reserved</th>
                  <th className="py-2.5 px-3">Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Total Valuation (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reportData?.variants?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-stone-900">{v.sku}</td>
                    <td className="py-2.5 px-3 text-stone-700">{v.size}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">{v.stock}</td>
                    <td className="py-2.5 px-3 text-amber-700">{v.reservedStock}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-600">৳{(v.purchaseCost || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                      ৳{((v.stock || 0) * (v.purchaseCost || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

