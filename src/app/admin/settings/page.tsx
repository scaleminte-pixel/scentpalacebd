'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Truck,
  Store,
  Bell,
  Shield,
  CreditCard,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<any>({
    storeName: 'Rāwdah Haute Parfumerie',
    storeEmail: 'concierge@rawdahperfumes.com',
    storePhone: '+880 1711-000000',
    storeAddress: 'Road 11, Block D, Banani / Gulshan-2, Dhaka 1213, Bangladesh',
    shippingFeeDhaka: 80,
    shippingFeeOutside: 150,
    freeShippingThreshold: 5000,
    orderNotificationEmail: 'orders@rawdahperfumes.com',
    lowStockThresholdDefault: 10,
    bkashMerchantNumber: '01711000000',
    allowGuestCheckout: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setForm((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-[#D45520] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Store Configuration & Logistics Policies</h1>
          <p className="text-xs text-stone-500 mt-1">
            Shipping rates, minimum thresholds, brand particulars, and operational alerts.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Atelier settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Atelier Identity */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Store className="w-4 h-4 text-[#D45520]" />
            <h3>Atelier Brand Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Maison Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Official Concierge Email</label>
              <input
                type="email"
                value={form.storeEmail}
                onChange={(e) => setForm({ ...form, storeEmail: e.target.value })}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">VIP Concierge Helpline</label>
              <input
                type="text"
                value={form.storePhone}
                onChange={(e) => setForm({ ...form, storePhone: e.target.value })}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Atelier Address</label>
              <input
                type="text"
                value={form.storeAddress}
                onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Policies */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Truck className="w-4 h-4 text-[#D45520]" />
            <h3>Logistics & Courier Delivery Fees</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Inside Dhaka City (BDT)</label>
              <input
                type="number"
                value={form.shippingFeeDhaka}
                onChange={(e) => setForm({ ...form, shippingFeeDhaka: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Outside Dhaka / Districts (BDT)</label>
              <input
                type="number"
                value={form.shippingFeeOutside}
                onChange={(e) => setForm({ ...form, shippingFeeOutside: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Complimentary Delivery Threshold (BDT)</label>
              <input
                type="number"
                value={form.freeShippingThreshold}
                onChange={(e) => setForm({ ...form, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Operational Alerts */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Bell className="w-4 h-4 text-[#D45520]" />
            <h3>Operational Alerts & Notifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Order Dispatch Notification Email</label>
              <input
                type="email"
                value={form.orderNotificationEmail}
                onChange={(e) => setForm({ ...form, orderNotificationEmail: e.target.value })}
                className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Default Low Stock Alert Threshold (Units)</label>
              <input
                type="number"
                value={form.lowStockThresholdDefault}
                onChange={(e) => setForm({ ...form, lowStockThresholdDefault: parseInt(e.target.value, 10) || 10 })}
                className="w-full p-2.5 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#D45520]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D45520] text-white rounded-xl text-xs font-semibold hover:bg-[#B34316] transition shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Atelier Policies...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

