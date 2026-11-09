'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  Truck,
  Trash2,
  PackageCheck,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Calendar,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [range, setRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/dashboard?range=${range}`;
      if (range === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const overview = data?.overview || {};
  const rangeMetrics = data?.rangeMetrics || {};
  const recentOrders = data?.recentOrders || [];
  const bestSellers = data?.bestSellers || [];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D45520] block">
            Executive Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Atelier Commerce Overview
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Reporting timezone: <strong>Asia/Dhaka (GMT+6)</strong> • Figures in BDT (৳)
          </p>
        </div>

        {/* Quick Range Selector */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 bg-white border border-[#EAE4DC] rounded-xl shadow-2xs text-xs font-semibold">
            {[
              { label: 'Today', key: 'today' },
              { label: 'Last 7 Days', key: '7d' },
              { label: 'This Month', key: 'this_month' },
              { label: 'Custom', key: 'custom' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRange(tab.key)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === tab.key
                    ? 'bg-[#141312] text-white shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-[#FAF7F2]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            className="p-2 border border-stone-200 bg-white rounded-xl text-stone-600 hover:bg-stone-50 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {range === 'custom' && (
        <div className="p-4 bg-white border border-stone-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 border border-stone-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 border border-stone-200 rounded-lg text-xs"
            />
          </div>
          <button
            onClick={fetchDashboard}
            disabled={!startDate || !endDate}
            className="px-3.5 py-1.5 bg-[#D45520] hover:bg-[#B34316] text-white font-semibold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
          >
            Apply Range Filter
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#D45520] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-500 font-medium">Aggregating real-time transactions...</span>
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================================
              TOP 4 PRIMARY KPI HIGHLIGHT CARDS
             ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Today's Orders */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Today&apos;s Orders
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#D45520]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  {overview.todayOrders?.count ?? 0}
                </span>
                <span className="text-xs font-semibold text-stone-400">orders today</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-[#D45520] flex items-center gap-1">
                <span>Value: ৳{(overview.todayOrders?.gross ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* 2. Pending Action */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Pending Action
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  {overview.pendingAction ?? 0}
                </span>
                <span className="text-xs font-semibold text-stone-400">awaiting fulfillment</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-700 font-medium">
                Needs packing or courier dispatch
              </div>
            </div>

            {/* 3. Today's Visitors */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Today&apos;s Visitors
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  {overview.todayVisitors ?? 0}
                </span>
                <span className="text-xs font-semibold text-stone-400">unique sessions</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Live visitor telemetry</span>
              </div>
            </div>

            {/* 4. Total Revenue (Lifetime) */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  ৳{Number(overview.totalRevenue ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-stone-400 font-medium">
                Lifetime confirmed order volume
              </div>
            </div>
          </div>

          {/* =========================================================================
              CATALOG & ORDER STATUS BREAKDOWN (8-METRIC GRID)
              Matching Bangladeshi commerce dashboard structure
             ========================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-800 tracking-tight">
                Order Pipeline & Catalog Breakdown
              </h2>
              <span className="text-[11px] text-stone-400">Instant database status totals</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Card 1: Total Orders */}
              <Link
                href="/admin/orders"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-[#D45520] hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Total Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-orange-50 group-hover:text-[#D45520] transition">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-stone-900">
                  {overview.totalOrders ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">All lifetime orders</span>
              </Link>

              {/* Card 2: Confirmed Orders */}
              <Link
                href="/admin/orders?status=CONFIRMED"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Confirmed</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {overview.confirmed ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Approved orders</span>
              </Link>

              {/* Card 3: Courier Submitted */}
              <Link
                href="/admin/orders?status=SHIPPED"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-blue-500 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Courier Submitted</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700">
                  {overview.courierSubmitted ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Handed over to courier</span>
              </Link>

              {/* Card 4: Trashed Orders */}
              <Link
                href="/admin/orders?tab=trashed"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-rose-400 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Trashed Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-rose-700">
                  {overview.trashedOrders ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Deleted orders bin</span>
              </Link>

              {/* Card 5: Total Delivered */}
              <Link
                href="/admin/orders?status=DELIVERED"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Total Delivered</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition">
                    <PackageCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                  {overview.totalDelivered ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Successfully completed</span>
              </Link>

              {/* Card 6: Total Cancel */}
              <Link
                href="/admin/orders?status=CANCELLED"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-rose-500 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Total Cancel</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-rose-700">
                  {overview.totalCancelled ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Cancelled / Returned</span>
              </Link>

              {/* Card 7: Incomplete Checkout */}
              <Link
                href="/admin/orders?tab=incomplete"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-amber-500 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Incomplete Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-700">
                  {overview.incompleteCheckouts ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Invalid phone or address</span>
              </Link>

              {/* Card 8: Total Products */}
              <Link
                href="/admin/products"
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-stone-900 hover:shadow-xs transition block group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-500">Total Products</span>
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-stone-900">
                  {overview.totalProducts ?? 0}
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Active flacons & coffrets</span>
              </Link>
            </div>
          </div>

          {/* =========================================================================
              RANGE ANALYTICS SUMMARY
             ========================================================================= */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-7 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D45520]">
                  Period Performance Filter ({range.replace('_', ' ').toUpperCase()})
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  Transactional Ledger Summary
                </h3>
              </div>

              <div className="text-xs text-stone-300">
                <span>Orders in Period: </span>
                <span className="font-bold text-white text-sm ml-1">{rangeMetrics.orderCount ?? 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Gross Order Value
                </span>
                <div className="text-2xl font-extrabold text-white">
                  ৳{Number(rangeMetrics.grossOrderValue ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400">Total volume ordered in window</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Delivered Net Sales
                </span>
                <div className="text-2xl font-extrabold text-emerald-400">
                  ৳{Number(rangeMetrics.deliveredSales ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400">Customer accepted & completed</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                  Courier COD Receivables
                </span>
                <div className="text-2xl font-extrabold text-amber-400">
                  ৳{Number(rangeMetrics.courierCodReceivables ?? 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-stone-400">With Steadfast pending settlement</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BEST SELLERS & RECENT ORDERS
             ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Selling Products */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Top Selling Fragrances</h3>
                    <p className="text-[11px] text-stone-400">Best performing flacons by units sold</p>
                  </div>
                  <Link
                    href="/admin/products"
                    className="text-xs font-semibold text-[#D45520] hover:underline flex items-center gap-1"
                  >
                    <span>Catalog</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-stone-100 pt-2">
                  {bestSellers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-stone-400">No product sales yet</p>
                  ) : (
                    bestSellers.map((item: any, idx: number) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 truncate max-w-[65%]">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-stone-800 truncate">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-stone-900 block">{item.totalSold} sold</span>
                          <span className="text-[10px] text-stone-400">
                            ৳{Number(item.revenue).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/admin/products"
                className="mt-4 w-full py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl text-center transition block"
              >
                View Full Product Catalog
              </Link>
            </div>

            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Recent Customer Orders</h3>
                    <p className="text-[11px] text-stone-400">Live order queue ready for dispatch</p>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="text-xs font-semibold text-[#D45520] hover:underline flex items-center gap-1"
                  >
                    <span>All Orders</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left mt-2">
                    <thead>
                      <tr className="text-[10px] text-stone-400 uppercase border-b border-stone-100">
                        <th className="py-2.5 font-bold">Order</th>
                        <th className="py-2.5 font-bold">Customer</th>
                        <th className="py-2.5 font-bold">Total</th>
                        <th className="py-2.5 font-bold">Status</th>
                        <th className="py-2.5 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-stone-400 text-xs">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        recentOrders.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-stone-50/70 transition">
                            <td className="py-3 font-mono font-bold text-stone-900">
                              <Link href={`/admin/orders/${ord.id}`} className="hover:text-[#D45520]">
                                #{ord.orderNumber}
                              </Link>
                            </td>
                            <td className="py-3">
                              <span className="font-semibold text-stone-800 block truncate max-w-[120px]">
                                {ord.customerName}
                              </span>
                              <span className="text-[10px] text-stone-400">{ord.customerPhone}</span>
                            </td>
                            <td className="py-3 font-bold text-stone-900">
                              ৳{Number(ord.total).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ord.fulfillmentStatus === 'DELIVERED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : ord.fulfillmentStatus === 'SHIPPED'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : ord.fulfillmentStatus === 'CANCELLED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {ord.fulfillmentStatus}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                href={`/admin/orders/${ord.id}`}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-lg text-[11px] font-semibold transition inline-block"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Showing latest 8 orders</span>
                <Link
                  href="/admin/orders"
                  className="font-semibold text-[#D45520] hover:text-[#B34316] flex items-center gap-1"
                >
                  <span>Go to Orders Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
