'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Key,
  Clock,
  CheckCircle,
  X,
  Lock,
  UserCheck,
  Activity,
} from 'lucide-react';

export default function AdminTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite/Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setForm({
          name: '',
          email: '',
          password: '',
          role: 'MANAGER',
          phone: '',
        });
        fetchTeam();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-50 text-purple-700 border-purple-200',
    MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
    ORDER_STAFF: 'bg-amber-50 text-amber-800 border-amber-200',
    CATALOG_EDITOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACCOUNTANT: 'bg-stone-100 text-stone-800 border-stone-200',
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Atelier Staff & Role Permissions</h1>
          <p className="text-xs text-stone-500 mt-1">
            Role-based access control (RBAC), audit trails, and staff member authentication.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D45520] text-white rounded-xl text-xs font-semibold hover:bg-[#B34316] transition shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Team Directory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Authorized Personnel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-stone-200 border-t-[#D45520] rounded-full animate-spin mx-auto mb-2" />
                    Loading staff members...
                  </td>
                </tr>
              ) : (
                team.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">{u.name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          roleColors[u.role] || 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Atelier Security & Audit Log</h3>
            <p className="text-xs text-stone-500">Traceable chronological record of administrative actions and status mutations.</p>
          </div>
          <Activity className="w-4 h-4 text-stone-400" />
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{log.userName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-600">
                      {log.action}
                    </span>
                    <span className="text-stone-500 font-mono text-[11px]">{log.entity}</span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-stone-400 font-mono mt-1 line-clamp-1">{log.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 whitespace-nowrap ml-4">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Team Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Add Team Member</h3>
                <p className="text-xs text-stone-500">Issue credentials for an atelier administrator.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Al-Mansoor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="tariq@scentpalacebd.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D45520]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-medium mb-1">Role Permission</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2.5 border border-stone-200 rounded-lg bg-stone-50"
                  >
                    <option value="MANAGER">MANAGER (Fulfillment & Catalog)</option>
                    <option value="ORDER_STAFF">ORDER_STAFF (Orders & Courier)</option>
                    <option value="CATALOG_EDITOR">CATALOG_EDITOR (Fragrances & CMS)</option>
                    <option value="ACCOUNTANT">ACCOUNTANT (Finance & Expenses)</option>
                    <option value="OWNER">OWNER (Full Sovereignty)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full p-2.5 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">Direct Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+880 1711-..."
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D45520] text-white rounded-lg hover:bg-[#B34316] font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

