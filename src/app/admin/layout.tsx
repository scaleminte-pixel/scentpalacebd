'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  CreditCard,
  CircleDollarSign,
  Globe,
  Tag,
  Star,
  BarChart3,
  FileText,
  Workflow,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  Trash2,
  Tags,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, logout } = useAdminAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearSuccess, setCacheClearSuccess] = useState(false);
  const [branding, setBranding] = useState({
    adminLogoUrl: '',
    adminBrandTitle: 'Rāwdah Atelier',
    adminBrandSubtitle: 'Admin Console',
    adminHideText: false,
  });

  // Fetch branding on mount and listen to updates
  React.useEffect(() => {
    const fetchBranding = () => {
      fetch('/api/branding')
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setBranding({
              adminLogoUrl: data.adminLogoUrl || '',
              adminBrandTitle: data.adminBrandTitle || data.storeName || 'Rāwdah Atelier',
              adminBrandSubtitle: data.adminBrandSubtitle || 'Admin Console',
              adminHideText: data.adminHideText === true || data.adminHideText === 'true',
            });
          }
        })
        .catch(() => {});
    };
    fetchBranding();
    window.addEventListener('storage', fetchBranding);
    window.addEventListener('branding_updated', fetchBranding);
    return () => {
      window.removeEventListener('storage', fetchBranding);
      window.removeEventListener('branding_updated', fetchBranding);
    };
  }, []);

  // Fetch notifications on mount
  React.useEffect(() => {
    fetch('/api/admin/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, []);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    setCacheClearSuccess(false);
    try {
      const res = await fetch('/api/admin/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCacheClearSuccess(true);
        setTimeout(() => setCacheClearSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  // If on login page, render children directly
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center admin-shell">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#D45520] border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-700 text-sm font-semibold tracking-tight">Authenticating Rāwdah Workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/admin/login');
    return null;
  }

  const currentTab = searchParams.get('tab');
  const fullPathWithTab = currentTab ? `${pathname}?tab=${currentTab}` : pathname;

  const navGroups = [
    {
      group: 'CORE ATELIER',
      items: [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Categories', href: '/admin/categories', icon: Tags },
        { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
        { name: 'Inventory', href: '/admin/inventory', icon: Layers },
        { name: 'Customers', href: '/admin/customers', icon: Users },
      ],
    },
    {
      group: 'ORDERS MANAGEMENT',
      items: [
        { name: 'All Orders', href: '/admin/orders', icon: ShoppingBag },
        { name: 'Incomplete Orders', href: '/admin/orders?tab=incomplete', icon: AlertTriangle },
        { name: 'Trashed Orders', href: '/admin/orders?tab=trashed', icon: Trash2 },
      ],
    },
    {
      group: 'FINANCE & COMMERCE',
      items: [
        { name: 'Payments', href: '/admin/payments', icon: CreditCard },
        { name: 'Finance', href: '/admin/finance', icon: CircleDollarSign },
        { name: 'Website Content', href: '/admin/content', icon: Globe },
        { name: 'Offers & Deals', href: '/admin/offers', icon: Tag },
        { name: 'Reviews', href: '/admin/reviews', icon: Star },
      ],
    },
    {
      group: 'MANAGEMENT & INSIGHTS',
      items: [
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Reports', href: '/admin/reports', icon: FileText },
        { name: 'Integrations', href: '/admin/integrations', icon: Workflow },
        { name: 'Team & Roles', href: '/admin/team', icon: ShieldCheck },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-neutral-900 flex admin-shell antialiased">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#EAE4DC] transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#EAE4DC] flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            {branding.adminLogoUrl ? (
              <img
                src={branding.adminLogoUrl}
                alt={branding.adminBrandTitle}
                className={
                  branding.adminHideText && !isCollapsed
                    ? 'h-9 w-auto max-w-[160px] object-contain shrink-0'
                    : 'w-8 h-8 rounded-lg object-contain bg-white border border-stone-200 shrink-0 p-0.5 shadow-xs'
                }
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#141312] text-[#FAF7F2] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {(branding.adminBrandTitle || 'R').charAt(0)}
              </div>
            )}
            {!isCollapsed && (!branding.adminHideText || !branding.adminLogoUrl) && (
              <div className="truncate">
                <span className="font-bold text-sm tracking-tight text-neutral-900 block leading-tight">
                  {branding.adminBrandTitle}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D45520] block">
                  {branding.adminBrandSubtitle}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                  {group.group}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : item.href.includes('?')
                      ? fullPathWithTab === item.href
                      : pathname === item.href && !currentTab;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#FDF3EE] text-[#D45520] shadow-2xs font-bold'
                          : 'text-neutral-600 hover:bg-[#FAF7F2] hover:text-neutral-900'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D45520]' : 'text-neutral-500'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-[#EAE4DC] bg-[#FAF7F2]/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full bg-[#141312] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate leading-tight">{user.name}</p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#EAE4DC] text-neutral-700 mt-0.5">
                  {user.role}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-white transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Bar (matching Shodai & FinSet references) */}
        <header className="h-16 bg-white border-b border-[#EAE4DC] sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search with ⌘K Indicator */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search orders, flacons, customers, SKU..."
                className="w-full pl-9 pr-12 py-2 rounded-xl bg-[#F7F5F0] border border-transparent focus:border-[#D45520] focus:bg-white text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#D4CFCE] text-neutral-500 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clear Cache Button */}
            <div className="relative">
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isClearingCache
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-700 border-[#EAE4DC] hover:border-stone-400 shadow-2xs active:scale-95'
                }`}
                title="Purge storefront & admin cache, synchronizing products & images immediately"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-[#D45520] ${isClearingCache ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isClearingCache ? 'Purging Cache...' : 'Clear Cache'}</span>
              </button>

              {/* Toast Notification on Cache Clear */}
              {cacheClearSuccess && (
                <div className="absolute right-0 top-10 z-50 whitespace-nowrap px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cache cleared & storefront refreshed!</span>
                </div>
              )}
            </div>

            {/* View Live Storefront */}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EAE4DC] text-xs font-semibold text-neutral-700 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </Link>

            {/* Notifications Bell with Interactive Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-xl transition-colors ${
                  notificationsOpen ? 'bg-stone-200 text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
                title="Notifications & Alerts"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#D45520] absolute top-2 right-2 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white rounded-2xl border border-[#EAE4DC] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-[#FAF7F2] border-b border-[#EAE4DC] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#D45520]" />
                        <h4 className="font-bold text-xs text-neutral-900 uppercase tracking-wider">
                          Atelier Notifications
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF3EE] text-[#D45520]">
                        {notifications.length} updates
                      </span>
                    </div>

                    <div className="divide-y divide-[#F7F4EE] max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.link}
                            onClick={() => setNotificationsOpen(false)}
                            className="p-3 hover:bg-[#FAF7F2] transition-colors flex items-start gap-3 block"
                          >
                            <span className="w-2 h-2 rounded-full bg-[#D45520] shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-neutral-900 truncate">{item.title}</span>
                                <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2">{item.time}</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-neutral-400">
                          No pending notifications. All systems optimal.
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-[#FAF7F2] border-t border-[#EAE4DC] text-center">
                      <button
                        onClick={() => {
                          setUnreadCount(0);
                          setNotificationsOpen(false);
                        }}
                        className="text-[11px] font-bold text-[#D45520] hover:underline"
                      >
                        Dismiss / Mark all as acknowledged
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#EAE4DC]">
              <div className="w-8 h-8 rounded-full bg-[#141312] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-neutral-900 leading-tight">{user.name}</div>
                <div className="text-[10px] text-neutral-500">{user.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-r border-[#EAE4DC]">
            <div className="h-16 px-6 border-b border-[#EAE4DC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {branding.adminLogoUrl ? (
                  <img
                    src={branding.adminLogoUrl}
                    alt={branding.adminBrandTitle}
                    className="w-7 h-7 rounded-md object-contain bg-white border border-stone-200 shrink-0 p-0.5"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#141312] text-[#FAF7F2] flex items-center justify-center font-bold text-xs shrink-0">
                    {(branding.adminBrandTitle || 'R').charAt(0)}
                  </div>
                )}
                <span className="font-bold text-base text-neutral-900 tracking-tight">
                  {branding.adminBrandTitle}
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {navGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    {group.group}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === '/admin'
                          ? pathname === '/admin'
                          : item.href.includes('?')
                          ? fullPathWithTab === item.href
                          : pathname === item.href && !currentTab;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            isActive ? 'bg-[#FDF3EE] text-[#D45520] font-bold' : 'text-neutral-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#EAE4DC]">
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-800 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <React.Suspense fallback={<div className="min-h-screen bg-[#FBF9F5]" />}>
        <AdminShell>{children}</AdminShell>
      </React.Suspense>
    </AdminAuthProvider>
  );
}

