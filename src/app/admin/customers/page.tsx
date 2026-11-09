'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Crown,
  ChevronRight,
  X,
  ExternalLink,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/admin/customers?q=${encodeURIComponent(q)}` : '/api/admin/customers';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery.trim());
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Clientele Directory</h1>
          <p className="text-xs text-stone-500 mt-1">
            Fragrance connoisseurs, VIP patrons, order histories, and lifetime value tracking.
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search clients by name, phone, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#D45520]"
          />
        </form>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Phone & City</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Lifetime Spend (BDT)</th>
                <th className="py-3 px-4">Patron Tier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
                    Loading client roster...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No clients found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isVip = c.totalSpent >= 25000 || c.totalOrders >= 2;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-stone-50/70 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-semibold text-xs shrink-0">
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              {c.name}
                              {isVip && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-[11px] text-stone-400 truncate max-w-[200px]">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-900 font-medium">{c.phone}</div>
                        <div className="text-[11px] text-stone-400">{c.city || 'Dhaka'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        {c.totalOrders} order{c.totalOrders === 1 ? '' : 's'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        ৳{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {isVip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" /> VIP Connoisseur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Dossier Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-900 font-bold text-base">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    {selectedCustomer.name}
                    {selectedCustomer.totalSpent >= 25000 && (
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </h3>
                  <span className="text-xs text-stone-400">Client ID: {selectedCustomer.id.slice(-8)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Spent</span>
                <span className="text-lg font-bold font-mono text-stone-900 mt-1 block">
                  ৳{selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block">Total Orders</span>
                <span className="text-lg font-bold text-stone-900 mt-1 block">
                  {selectedCustomer.totalOrders}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 text-xs border border-stone-200 rounded-xl p-4">
              <h4 className="font-semibold uppercase tracking-wider text-stone-400 text-[10px]">Contact Particulars</h4>
              <div className="flex items-center gap-3 text-stone-700">
                <Phone className="w-4 h-4 text-stone-400" />
                <a href={`tel:${selectedCustomer.phone}`} className="hover:text-[#D45520] font-medium">
                  {selectedCustomer.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-stone-700">
                <Mail className="w-4 h-4 text-stone-400" />
                <a href={`mailto:${selectedCustomer.email}`} className="hover:text-[#D45520]">
                  {selectedCustomer.email}
                </a>
              </div>
              <div className="flex items-start gap-3 text-stone-700">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <p>{selectedCustomer.address || 'Standard Delivery Address'}</p>
                  <p className="text-stone-400">{selectedCustomer.city || 'Dhaka'}{selectedCustomer.division ? `, ${selectedCustomer.division}` : ''}</p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="font-semibold uppercase tracking-wider text-stone-400 text-[10px]">Recent Fragrance Orders</h4>
              {selectedCustomer.recentOrders?.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No orders recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.recentOrders?.map((ord: any) => (
                    <Link
                      key={ord.id}
                      href={`/admin/orders/${ord.id}`}
                      className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between hover:bg-stone-100 transition group text-xs"
                    >
                      <div>
                        <div className="font-semibold text-stone-900 flex items-center gap-2">
                          <span>{ord.id.slice(0, 10)}...</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white border border-stone-200">
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1">
                          {new Date(ord.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-stone-900">৳{ord.total.toLocaleString()}</div>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800 ml-auto mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer.internalNotes && (
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900">
                <strong className="block text-[10px] uppercase tracking-wider text-amber-700 mb-1">Concierge Notes</strong>
                {selectedCustomer.internalNotes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

