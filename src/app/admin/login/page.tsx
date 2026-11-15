'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({
    adminLogoUrl: '',
    adminBrandTitle: 'Scent Palace BD',
    adminBrandSubtitle: 'Commerce & Atelier Portal',
  });

  useEffect(() => {
    const fetchLogo = () => {
      fetch('/api/branding')
        .then((r) => r.json())
        .then((data) => {
          if (data) {
            setBranding({
              adminLogoUrl: data.adminLogoUrl || '',
              adminBrandTitle: data.adminBrandTitle || data.storeName || 'Scent Palace BD',
              adminBrandSubtitle: data.adminBrandSubtitle || 'Commerce & Atelier Portal',
            });
          }
        })
        .catch(() => {});
    };
    fetchLogo();
    window.addEventListener('branding_updated', fetchLogo);
    window.addEventListener('storage', fetchLogo);
    return () => {
      window.removeEventListener('branding_updated', fetchLogo);
      window.removeEventListener('storage', fetchLogo);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${branding.adminBrandTitle || 'Scent Palace BD'} — Admin Login`;
    }
  }, [branding.adminBrandTitle]);

  // Forced password change (old default passwords are publicly known)
  const [mustChange, setMustChange] = useState<{ user: any } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 10) return setError('New password must be at least 10 characters.');
    if (newPassword !== confirmPassword) return setError('The two new passwords do not match.');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        login('', mustChange!.user);
      } else {
        setError(data.error || 'Could not change password.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.mustChangePassword) {
        setMustChange({ user: data.user });
      } else if (res.ok && data.success) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 admin-shell">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EAE4DC] shadow-xl p-8 sm:p-10">
        {/* Brand Crest */}
        <div className="text-center mb-8">
          {branding.adminLogoUrl ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-md flex items-center justify-center bg-white border border-stone-200">
              <img src={branding.adminLogoUrl} alt={branding.adminBrandTitle} className="w-12 h-12 object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#141312] text-[#FAF7F2] flex items-center justify-center mx-auto font-bold text-2xl mb-4 shadow-md">
              {(branding.adminBrandTitle || 'S').charAt(0)}
            </div>
          )}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D45520] block mb-1">
            {branding.adminBrandTitle}
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            {branding.adminBrandSubtitle}
          </h1>
          <p className="text-xs text-neutral-600 mt-1.5 font-medium">
            Administrative access & commerce control portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mustChange ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Set a new password to continue.</strong> Your current password is an old default that is
              publicly known, so it can no longer be used to access the admin panel.
            </div>
            {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">New password (min. 10 characters)</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#EAE4DC] text-sm focus:outline-none focus:border-[#D45520]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Confirm new password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#EAE4DC] text-sm focus:outline-none focus:border-[#D45520]"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#D45520] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save new password & continue'}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                placeholder="admin@scentpalacebd.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Secret Passphrase
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D4CFCE] text-sm text-neutral-900 bg-white focus:outline-none focus:border-[#D45520]"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
        )}

      </div>
    </div>
  );
}

