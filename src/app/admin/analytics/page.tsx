'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Eye,
  ShoppingBag,
  ArrowRight,
  Smartphone,
  Globe,
  Compass,
  Clock,
  Percent,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  if (loading || !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-[#D45520] rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, funnel, devices, sources, topPages } = analytics;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Visitor Telemetry & Conversion Funnel</h1>
          <p className="text-xs text-stone-500 mt-1">
            First-party anonymous session behavior, traffic attribution, and conversion drop-offs.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'All Season' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                range === r.id
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block">Total Sessions</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">
            {metrics.totalSessions.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block">{metrics.totalPageViews} Page Views</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-semibold block">Store Conversion</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {metrics.conversionRate}%
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Visit to Order Placed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold block">Avg Session Duration</span>
          <div className="text-2xl font-bold text-stone-900 mt-1">
            {metrics.avgSessionDuration}
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Bounce Rate: {metrics.bounceRate}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-[#D45520] font-semibold block">Cart to Checkout</span>
          <div className="text-2xl font-bold text-[#D45520] mt-1">
            {metrics.checkoutConversionRate}%
          </div>
          <span className="text-[11px] text-stone-500 mt-0.5 block">Add-to-cart conversion</span>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Atelier Purchase Conversion Funnel</h3>
            <p className="text-xs text-stone-500">Step-by-step visitor progression from storefront entry to paid order.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {funnel.map((step: any, idx: number) => (
            <div key={step.step} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-100 font-mono font-semibold text-stone-700 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-stone-900">{step.step}</span>
                </div>
                <div className="font-mono text-stone-700">
                  <strong className="text-stone-900">{step.count.toLocaleString()}</strong> ({step.percent}%)
                </div>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D45520] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(step.percent, 3)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Traffic Sources & Device Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Channels */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-stone-900 text-base">Attribution & Referral Sources</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Channel / Source</th>
                  <th className="py-2.5 px-3">Sessions</th>
                  <th className="py-2.5 px-3">Traffic Share</th>
                  <th className="py-2.5 px-3 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sources.map((src: any) => (
                  <tr key={src.channel} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-3 font-medium text-stone-900">{src.channel}</td>
                    <td className="py-3 px-3 font-mono text-stone-600">{src.sessions}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-800" style={{ width: `${src.share}%` }} />
                        </div>
                        <span className="text-[11px] font-mono text-stone-500">{src.share}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {src.conversion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-stone-900 text-base">Devices & Browsers</h3>
          <div className="space-y-4 pt-2">
            {devices.map((d: any) => (
              <div key={d.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-800">{d.name}</span>
                  <span className="font-mono font-semibold text-stone-900">{d.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C5A059] rounded-full"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 block">{d.visits.toLocaleString()} visits</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

