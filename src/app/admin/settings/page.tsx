'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Truck,
  Store,
  Bell,
  Shield,
  CreditCard,
  ImageIcon,
  Upload,
  X,
  Palette,
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
    storefrontLogoUrl: '',
    storefrontLogoDarkUrl: '',
    faviconUrl: '',
    adminLogoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleBrandingUpload = async (fieldKey: string, file: File) => {
    setUploadingField(fieldKey);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'branding');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev: any) => ({ ...prev, [fieldKey]: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setUploadingField(null);
    }
  };

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
        window.dispatchEvent(new Event('branding_updated'));
        try {
          localStorage.setItem('rawdah_branding_updated', Date.now().toString());
        } catch (_) {}
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

        {/* Branding & Visual Assets */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
            <Palette className="w-4 h-4 text-[#D45520]" />
            <h3>Branding & Visual Assets</h3>
          </div>
          <p className="text-xs text-stone-500 -mt-2">
            Upload logos and favicon. Changes reflect immediately across the storefront and admin panel.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Storefront Logo (Light / Header) */}
            <BrandingUploadCard
              label="Storefront Logo (Light / Header)"
              description="Displayed on the dark header bar. Use a light or white logo."
              currentUrl={form.storefrontLogoUrl}
              fieldKey="storefrontLogoUrl"
              uploading={uploadingField === 'storefrontLogoUrl'}
              onUpload={handleBrandingUpload}
              onClear={() => setForm((p: any) => ({ ...p, storefrontLogoUrl: '' }))}
              previewBg="bg-[#141312]"
            />

            {/* Storefront Logo (Dark / Footer) */}
            <BrandingUploadCard
              label="Storefront Logo (Dark / Footer)"
              description="Displayed on light backgrounds (footer, drawers). Use a dark logo."
              currentUrl={form.storefrontLogoDarkUrl}
              fieldKey="storefrontLogoDarkUrl"
              uploading={uploadingField === 'storefrontLogoDarkUrl'}
              onUpload={handleBrandingUpload}
              onClear={() => setForm((p: any) => ({ ...p, storefrontLogoDarkUrl: '' }))}
              previewBg="bg-[#FAF7F2]"
            />

            {/* Favicon */}
            <BrandingUploadCard
              label="Website Favicon"
              description="Browser tab icon. Square image recommended (e.g. 64x64 or 128x128)."
              currentUrl={form.faviconUrl}
              fieldKey="faviconUrl"
              uploading={uploadingField === 'faviconUrl'}
              onUpload={handleBrandingUpload}
              onClear={() => setForm((p: any) => ({ ...p, faviconUrl: '' }))}
              previewBg="bg-white"
              small
            />

            {/* Admin Logo */}
            <BrandingUploadCard
              label="Admin Panel Logo"
              description="Shown on admin login page and sidebar header."
              currentUrl={form.adminLogoUrl}
              fieldKey="adminLogoUrl"
              uploading={uploadingField === 'adminLogoUrl'}
              onUpload={handleBrandingUpload}
              onClear={() => setForm((p: any) => ({ ...p, adminLogoUrl: '' }))}
              previewBg="bg-white"
              small
            />
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

/* ─── Branding Upload Card Component ─── */
interface BrandingUploadCardProps {
  label: string;
  description: string;
  currentUrl: string;
  fieldKey: string;
  uploading: boolean;
  onUpload: (fieldKey: string, file: File) => void;
  onClear: () => void;
  previewBg?: string;
  small?: boolean;
}

function BrandingUploadCard({
  label,
  description,
  currentUrl,
  fieldKey,
  uploading,
  onUpload,
  onClear,
  previewBg = 'bg-white',
  small = false,
}: BrandingUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border border-stone-200 rounded-xl p-4 space-y-3">
      <div>
        <div className="text-xs font-bold text-stone-900">{label}</div>
        <div className="text-[10px] text-stone-500 mt-0.5">{description}</div>
      </div>

      {/* Preview */}
      <div
        className={`${previewBg} rounded-lg border border-stone-200 flex items-center justify-center overflow-hidden ${
          small ? 'h-20 w-20' : 'h-24 w-full'
        }`}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={label}
            className={`object-contain ${small ? 'max-h-16 max-w-16' : 'max-h-20 max-w-[80%]'}`}
          />
        ) : (
          <div className="text-stone-300 text-xs flex flex-col items-center gap-1">
            <ImageIcon className="w-5 h-5" />
            <span>No image</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(fieldKey, f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-[#D45520] text-white hover:bg-[#B34316] transition disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" />
              Upload
            </>
          )}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

