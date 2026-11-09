'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('owner@rawdahperfumes.com');
  const [password, setPassword] = useState('RawdahOwner2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (res.ok && data.success) {
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

  const prefillAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 admin-shell">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EAE4DC] shadow-xl p-8 sm:p-10">
        {/* Brand Crest */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#141312] text-[#FAF7F2] flex items-center justify-center mx-auto font-bold text-2xl mb-4 shadow-md">
            R
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D45520] block mb-1">
            Maison Rāwdah
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Atelier Workspace
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
                placeholder="admin@rawdahperfumes.com"
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

        {/* Quick Demo Credentials Switcher */}
        <div className="mt-8 pt-6 border-t border-[#EAE4DC]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3 text-center">
            Role-Based Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => prefillAccount('owner@rawdahperfumes.com', 'RawdahOwner2026!')}
              className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-left transition-colors"
            >
              <div className="font-bold text-neutral-900">Owner</div>
              <div className="text-[9px] text-neutral-500">Full Access</div>
            </button>
            <button
              type="button"
              onClick={() => prefillAccount('manager@rawdahperfumes.com', 'RawdahManager2026!')}
              className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-left transition-colors"
            >
              <div className="font-bold text-neutral-900">Manager</div>
              <div className="text-[9px] text-neutral-500">Operations & Catalog</div>
            </button>
            <button
              type="button"
              onClick={() => prefillAccount('orderstaff@rawdahperfumes.com', 'RawdahStaff2026!')}
              className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-left transition-colors"
            >
              <div className="font-bold text-neutral-900">Order Staff</div>
              <div className="text-[9px] text-neutral-500">Fulfillment & Courier</div>
            </button>
            <button
              type="button"
              onClick={() => prefillAccount('accountant@rawdahperfumes.com', 'RawdahAccounts2026!')}
              className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-left transition-colors"
            >
              <div className="font-bold text-neutral-900">Accountant</div>
              <div className="text-[9px] text-neutral-500">Finance & Ledgers</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

