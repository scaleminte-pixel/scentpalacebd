'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CreditCard,
  Target,
  Code2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit3,
  X,
  Save,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';

type TabKey = 'couriers' | 'payments' | 'pixels' | 'tagManager';

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('couriers');
  const [testResult, setTestResult] = useState<{ service: string; message: string; success: boolean } | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);

  // Edit Modal State
  const [editingService, setEditingService] = useState<{
    id: string;
    title: string;
    category: TabKey;
    config: Record<string, any>;
  } | null>(null);
  const [modalForm, setModalForm] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || {});
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (service: string) => {
    setTestingService(service);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection', service }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ service, message: data.message, success: true });
      } else {
        setTestResult({ service, message: data.error || 'Connection check failed', success: false });
      }
    } catch (err: any) {
      setTestResult({ service, message: err.message, success: false });
    } finally {
      setTestingService(null);
    }
  };

  const openEditModal = (serviceId: string, title: string, category: TabKey, config: Record<string, any>) => {
    setEditingService({ id: serviceId, title, category, config });
    setModalForm({ ...config });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: editingService.id,
          config: modalForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(data.message || `${editingService.title} updated successfully!`);
        setTimeout(() => setSuccessToast(null), 3500);
        setEditingService(null);
        fetchIntegrations();
      } else {
        alert(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !integrations) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-[#D45520] rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Loading integration providers...</p>
        </div>
      </div>
    );
  }

  const { couriers = {}, payments = {}, pixels = {}, tagManager = {} } = integrations;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-stone-700 font-medium">Integrations</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
            Third-Party Gateway & Logistics Integrations
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
            Configure automated courier dispatch (Steadfast, Pathao, RedX), Bangladeshi digital payment gateways
            (bKash, Nagad, SSLCommerz), Meta & TikTok Pixels, and Google Tag Manager.
          </p>
        </div>

        <button
          onClick={fetchIntegrations}
          className="p-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition flex items-center gap-1.5 text-xs font-medium self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
          <span>Sync Status</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-[11px] underline font-medium hover:text-stone-900 ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'couriers', label: 'Courier Logistics (Bangladesh)', icon: Truck, count: 5 },
          { id: 'payments', label: 'Payment Gateways', icon: CreditCard, count: 5 },
          { id: 'pixels', label: 'Pixel Setup (Meta & TikTok)', icon: Target, count: 3 },
          { id: 'tagManager', label: 'Tag Manager & SEO', icon: Code2, count: 4 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabKey)}
              className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#D45520] text-white shadow-xs font-semibold'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: COURIER LOGISTICS (BANGLADESH)
         ========================================================================= */}
      {activeTab === 'couriers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steadfast Courier */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#D45520] font-bold text-sm">
                    ST
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Steadfast Courier Logistics</h3>
                    <span className="text-[11px] text-stone-400">Automated Consignment & COD Escrow</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    couriers.steadfast?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {couriers.steadfast?.enabled ? `Connected (${couriers.steadfast.mode})` : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Automates parcel booking for fragile luxury perfume coffrets across all 64 districts of Bangladesh
                with automatic tracking number issuance and COD settlement calculation.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">API Key:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.steadfast?.apiKey ? '●●●●' + couriers.steadfast.apiKey.slice(-4) : 'Not configured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Auto Consignment on Confirm:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.steadfast?.autoBookingOnConfirmed ? 'Enabled (Instant)' : 'Manual Dispatch'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">COD Fee / Return Charge:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.steadfast?.codFeePercent}% / ৳{couriers.steadfast?.returnFeeBDT}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('steadfast', 'Steadfast Courier Settings', 'couriers', {
                    enabled: couriers.steadfast?.enabled ?? true,
                    mode: couriers.steadfast?.mode || 'sandbox',
                    apiKey: couriers.steadfast?.apiKey || '',
                    secretKey: couriers.steadfast?.secretKey || '',
                    baseUrl: couriers.steadfast?.baseUrl || 'https://portal.steadfast.com.bd/api/v1',
                    autoBooking: couriers.steadfast?.autoBookingOnConfirmed ?? true,
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure / Edit API</span>
              </button>

              <button
                onClick={() => handleTestConnection('steadfast')}
                disabled={testingService === 'steadfast'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'steadfast' ? 'animate-spin' : ''}`} />
                <span>Test Logistics API</span>
              </button>
            </div>
          </div>

          {/* Pathao Courier */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                    PT
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Pathao Courier Service</h3>
                    <span className="text-[11px] text-stone-400">Express Dhaka & Nationwide Hermes API</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    couriers.pathao?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {couriers.pathao?.enabled ? `Connected (${couriers.pathao.mode})` : 'Standby / Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Secondary express courier integration for same-day delivery within Dhaka metropolitan areas
                (Gulshan, Banani, Dhanmondi, Uttara) and nationwide courier coverage.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Store ID:</span>
                  <span className="text-stone-700 font-medium">{couriers.pathao?.storeId || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Client ID:</span>
                  <span className="text-stone-700 font-medium truncate max-w-[200px]">
                    {couriers.pathao?.clientId || 'Not configured'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('pathao', 'Pathao Courier Settings', 'couriers', {
                    enabled: couriers.pathao?.enabled ?? false,
                    mode: couriers.pathao?.mode || 'sandbox',
                    clientId: couriers.pathao?.clientId || '',
                    clientSecret: couriers.pathao?.clientSecret || '',
                    username: couriers.pathao?.username || '',
                    password: couriers.pathao?.password || '',
                    storeId: couriers.pathao?.storeId || '',
                    baseUrl: couriers.pathao?.baseUrl || 'https://api-hermes.pathao.com',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure / Edit API</span>
              </button>

              <button
                onClick={() => handleTestConnection('pathao')}
                disabled={testingService === 'pathao'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'pathao' ? 'animate-spin' : ''}`} />
                <span>Test API Ping</span>
              </button>
            </div>
          </div>

          {/* RedX Courier */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">
                    RX
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">RedX Logistics</h3>
                    <span className="text-[11px] text-stone-400">Door-to-door delivery & tracking</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    couriers.redx?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {couriers.redx?.enabled ? `Connected` : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Connect RedX open API using your partner token for automatic pickup requests and parcel tracking.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Access Token:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.redx?.accessToken ? '●●●●' + couriers.redx.accessToken.slice(-4) : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Store ID:</span>
                  <span className="text-stone-700 font-medium">{couriers.redx?.storeId || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('redx', 'RedX Logistics Settings', 'couriers', {
                    enabled: couriers.redx?.enabled ?? false,
                    mode: couriers.redx?.mode || 'sandbox',
                    accessToken: couriers.redx?.accessToken || '',
                    storeId: couriers.redx?.storeId || '',
                    baseUrl: couriers.redx?.baseUrl || 'https://openapi.redx.com.bd',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure API</span>
              </button>

              <button
                onClick={() => handleTestConnection('redx')}
                disabled={testingService === 'redx'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'redx' ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {/* Paperfly & eCourier Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    PF
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Paperfly & eCourier</h3>
                    <span className="text-[11px] text-stone-400">Wing delivery & smart logistics backup</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                  Ready for setup
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Configure credentials for Paperfly Smart-Logistics API and eCourier enterprise merchant account.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Paperfly:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.paperfly?.apiKey ? 'Configured' : 'Standby'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">eCourier:</span>
                  <span className="text-stone-700 font-medium">
                    {couriers.ecourier?.apiKey ? 'Configured' : 'Standby'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('paperfly', 'Paperfly Logistics Settings', 'couriers', {
                    enabled: couriers.paperfly?.enabled ?? false,
                    apiKey: couriers.paperfly?.apiKey || '',
                    username: couriers.paperfly?.username || '',
                    password: couriers.paperfly?.password || '',
                    warehouseId: couriers.paperfly?.warehouseId || '',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure Paperfly</span>
              </button>

              <button
                onClick={() =>
                  openEditModal('ecourier', 'eCourier API Settings', 'couriers', {
                    enabled: couriers.ecourier?.enabled ?? false,
                    apiKey: couriers.ecourier?.apiKey || '',
                    apiSecret: couriers.ecourier?.apiSecret || '',
                    userId: couriers.ecourier?.userId || '',
                  })
                }
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                <span>Configure eCourier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PAYMENT GATEWAYS (BANGLADESH)
         ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* bKash Tokenized */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                    bK
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">bKash Tokenized Gateway</h3>
                    <span className="text-[11px] text-stone-400">Direct Checkout & Webhook Callback</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    payments.bkash?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {payments.bkash?.enabled ? `Connected (${payments.bkash.mode})` : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Provides tokenized 1-click payments with OTP simulation, automated server-to-server webhook
                verification, and instant treasury credit.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Merchant Number:</span>
                  <span className="text-stone-700 font-medium">{payments.bkash?.merchantNumber || '01711000000'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">App Key Token:</span>
                  <span className="text-stone-700 font-medium">
                    {payments.bkash?.appKey ? '●●●●' + payments.bkash.appKey.slice(-4) : 'Configured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Webhook Handler:</span>
                  <span className="text-stone-700 font-medium">{payments.bkash?.webhookUrl || '/api/payments/bkash/callback'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('bkash', 'bKash Tokenized Gateway Credentials', 'payments', {
                    enabled: payments.bkash?.enabled ?? true,
                    mode: payments.bkash?.mode || 'sandbox',
                    appKey: payments.bkash?.appKey || '',
                    appSecret: payments.bkash?.appSecret || '',
                    username: payments.bkash?.username || '',
                    password: payments.bkash?.password || '',
                    merchantNumber: payments.bkash?.merchantNumber || '01711000000',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Credentials</span>
              </button>

              <button
                onClick={() => handleTestConnection('bkash')}
                disabled={testingService === 'bkash'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'bkash' ? 'animate-spin' : ''}`} />
                <span>Test API Ping</span>
              </button>
            </div>
          </div>

          {/* Nagad Payment Gateway */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                    NG
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Nagad Payment Gateway</h3>
                    <span className="text-[11px] text-stone-400">Postal Financial Service DFS API</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    payments.nagad?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {payments.nagad?.enabled ? `Connected (${payments.nagad.mode})` : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Integrates Nagad online payment API using public/private key cryptographic signing for secure checkout.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Merchant ID:</span>
                  <span className="text-stone-700 font-medium">{payments.nagad?.merchantId || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Keys Configured:</span>
                  <span className="text-stone-700 font-medium">
                    {payments.nagad?.publicKey ? 'Public & Private Keys Set' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('nagad', 'Nagad DFS Gateway Settings', 'payments', {
                    enabled: payments.nagad?.enabled ?? false,
                    mode: payments.nagad?.mode || 'sandbox',
                    merchantId: payments.nagad?.merchantId || '',
                    publicKey: payments.nagad?.publicKey || '',
                    privateKey: payments.nagad?.privateKey || '',
                    baseUrl: payments.nagad?.baseUrl || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Credentials</span>
              </button>

              <button
                onClick={() => handleTestConnection('nagad')}
                disabled={testingService === 'nagad'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'nagad' ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {/* SSLCommerz Gateway */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    SSL
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">SSLCommerz Payment Gateway</h3>
                    <span className="text-[11px] text-stone-400">Cards (Visa/Mastercard/Amex) & Mobile Banking</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    payments.sslcommerz?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {payments.sslcommerz?.enabled ? `Connected (${payments.sslcommerz.mode})` : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Multi-channel Bangladeshi aggregator for Visa, Mastercard, American Express, City Bank, and internet banking.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Store ID:</span>
                  <span className="text-stone-700 font-medium">{payments.sslcommerz?.storeId || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Store Password:</span>
                  <span className="text-stone-700 font-medium">
                    {payments.sslcommerz?.storePassword ? '●●●●' + payments.sslcommerz.storePassword.slice(-4) : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('sslcommerz', 'SSLCommerz Gateway Settings', 'payments', {
                    enabled: payments.sslcommerz?.enabled ?? false,
                    mode: payments.sslcommerz?.mode || 'sandbox',
                    storeId: payments.sslcommerz?.storeId || '',
                    storePassword: payments.sslcommerz?.storePassword || '',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Credentials</span>
              </button>

              <button
                onClick={() => handleTestConnection('sslcommerz')}
                disabled={testingService === 'sslcommerz'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'sslcommerz' ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>
          </div>

          {/* Cash on Delivery (COD) Rules */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                    COD
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Cash on Delivery (COD) Controls</h3>
                    <span className="text-[11px] text-stone-400">Nationwide courier delivery & escrow</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Delivery charges, advance courier fee requirements, and threshold restrictions for cash delivery.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Inside Dhaka Delivery Fee:</span>
                  <span className="text-stone-700 font-medium">৳{payments.cod?.insideDhakaDeliveryFee || 60}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Outside Dhaka Delivery Fee:</span>
                  <span className="text-stone-700 font-medium">৳{payments.cod?.outsideDhakaDeliveryFee || 120}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Max COD Order Limit:</span>
                  <span className="text-stone-700 font-medium">৳{Number(payments.cod?.maxOrderAmount || 50000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('cod', 'Cash on Delivery (COD) Rules', 'payments', {
                    enabled: payments.cod?.enabled ?? true,
                    insideDhakaFee: payments.cod?.insideDhakaDeliveryFee ?? 60,
                    outsideDhakaFee: payments.cod?.outsideDhakaDeliveryFee ?? 120,
                    requireAdvance: payments.cod?.requireAdvanceDeliveryFee ?? false,
                    maxOrder: payments.cod?.maxOrderAmount ?? 50000,
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure COD Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PIXEL TRACKING (PIXEL SETUP)
         ========================================================================= */}
      {activeTab === 'pixels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Meta (Facebook) Pixel */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    META
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Meta (Facebook) Pixel & CAPI</h3>
                    <span className="text-[11px] text-stone-400">Browser & Server-side Conversions API</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    pixels.metaPixel?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {pixels.metaPixel?.enabled ? 'Active Tracking' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Fires ViewContent, AddToCart, InitiateCheckout, and Purchase telemetry to Meta Ads Manager for ROAS tracking.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Pixel ID:</span>
                  <span className="text-stone-700 font-medium">{pixels.metaPixel?.pixelId || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Conversions API (CAPI):</span>
                  <span className="text-stone-700 font-medium">
                    {pixels.metaPixel?.conversionsApiToken ? 'Token Configured' : 'Browser Only'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('metaPixel', 'Meta Pixel & Conversions API Settings', 'pixels', {
                    enabled: pixels.metaPixel?.enabled ?? true,
                    pixelId: pixels.metaPixel?.pixelId || '',
                    conversionsApiToken: pixels.metaPixel?.conversionsApiToken || '',
                    testEventCode: pixels.metaPixel?.testEventCode || '',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure Meta Pixel</span>
              </button>

              <button
                onClick={() => handleTestConnection('meta_pixel')}
                disabled={testingService === 'meta_pixel'}
                className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingService === 'meta_pixel' ? 'animate-spin' : ''}`} />
                <span>Test Pixel Ping</span>
              </button>
            </div>
          </div>

          {/* TikTok Pixel */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-bold text-sm">
                    TT
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">TikTok Pixel</h3>
                    <span className="text-[11px] text-stone-400">TikTok For Business event tracker</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    pixels.tiktokPixel?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {pixels.tiktokPixel?.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Tracks user journey events on short-form video advertising campaigns to optimize TikTok conversions.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">TikTok Pixel ID:</span>
                  <span className="text-stone-700 font-medium">{pixels.tiktokPixel?.pixelId || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('tiktokPixel', 'TikTok Pixel Configuration', 'pixels', {
                    enabled: pixels.tiktokPixel?.enabled ?? false,
                    pixelId: pixels.tiktokPixel?.pixelId || '',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure TikTok Pixel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TAG MANAGER & SEO (META TAG MANAGER)
         ========================================================================= */}
      {activeTab === 'tagManager' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Tag Manager */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    GTM
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Google Tag Manager (GTM)</h3>
                    <span className="text-[11px] text-stone-400">Container ID & Script Injection</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    tagManager.gtm?.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  {tagManager.gtm?.enabled ? 'Injected' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Centralized container for deployment of Google Ads tags, custom conversion triggers, and third-party scripts.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">Container ID:</span>
                  <span className="text-stone-700 font-medium">{tagManager.gtm?.containerId || 'GTM-RDH9901'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('gtm', 'Google Tag Manager Settings', 'tagManager', {
                    enabled: tagManager.gtm?.enabled ?? true,
                    containerId: tagManager.gtm?.containerId || 'GTM-RDH9901',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Container ID</span>
              </button>
            </div>
          </div>

          {/* Google Analytics GA4 & Search Console */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                    GA4
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Google Analytics 4 & Search Console</h3>
                    <span className="text-[11px] text-stone-400">Measurement ID & Domain Verification</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Connects Google Analytics GA4 Measurement ID and Google Search Console HTML meta verification tag.
              </p>

              <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-400">GA4 Measurement ID:</span>
                  <span className="text-stone-700 font-medium">{tagManager.ga4?.measurementId || 'G-RDH2026BD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Search Console Meta:</span>
                  <span className="text-stone-700 font-medium truncate max-w-[180px]">
                    {tagManager.searchConsole?.verificationMeta || 'Configured'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  openEditModal('ga4', 'Google Analytics 4 & Search Console', 'tagManager', {
                    enabled: tagManager.ga4?.enabled ?? true,
                    measurementId: tagManager.ga4?.measurementId || 'G-RDH2026BD',
                    verificationMeta: tagManager.searchConsole?.verificationMeta || '',
                  })
                }
                className="px-3.5 py-2 bg-stone-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit GA4 & SEO Meta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          UNIVERSAL CONFIGURATION MODAL
         ========================================================================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D45520]/10 text-[#D45520] flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900">{editingService.title}</h3>
                  <p className="text-[11px] text-stone-500">Service Identifier: {editingService.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="w-8 h-8 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 sm:p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {Object.entries(modalForm).map(([key, value]) => {
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .replace(/^\w/, (c) => c.toUpperCase());

                // Boolean Toggle
                if (typeof value === 'boolean') {
                  return (
                    <div key={key} className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                      <div>
                        <span className="font-semibold text-stone-800 block text-xs">{label}</span>
                        <span className="text-[11px] text-stone-500">Enable or disable this integration service</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalForm({ ...modalForm, [key]: !value })}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer ${
                          value
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {value ? 'Active / Enabled' : 'Disabled'}
                      </button>
                    </div>
                  );
                }

                // Environment Mode Dropdown
                if (key === 'mode') {
                  return (
                    <div key={key}>
                      <label className="block text-stone-700 font-semibold mb-1">Environment Mode</label>
                      <select
                        value={String(value)}
                        onChange={(e) => setModalForm({ ...modalForm, [key]: e.target.value })}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                      >
                        <option value="sandbox">Sandbox / Testing (Simulation)</option>
                        <option value="production">Production (Live Bangladesh Banking/Logistics)</option>
                      </select>
                    </div>
                  );
                }

                // Default Text / Password Input
                const isSensitive =
                  key.toLowerCase().includes('secret') ||
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('token');

                return (
                  <div key={key}>
                    <label className="block text-stone-700 font-semibold mb-1">{label}</label>
                    <input
                      type={isSensitive ? 'password' : typeof value === 'number' ? 'number' : 'text'}
                      value={value ?? ''}
                      onChange={(e) =>
                        setModalForm({
                          ...modalForm,
                          [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      placeholder={`Enter ${label}...`}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                    />
                  </div>
                );
              })}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 transition font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#D45520] hover:bg-[#B34316] text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Sync</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
