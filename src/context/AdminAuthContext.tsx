'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'ORDER_STAFF' | 'CATALOG_EDITOR' | 'ACCOUNTANT';
  phone?: string | null;
  avatar?: string | null;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (token: string, userData: AdminUser) => void;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      // If user is already authenticated in session, don't block or re-fetch on every route navigation
      if (user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
          } else if (isMounted) {
            setUser(null);
          }
        } else if (isMounted) {
          setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (pathname !== '/admin/login') {
      checkAuth();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pathname, user]);

  const login = (token: string, userData: AdminUser) => {
    setUser(userData);
    router.push('/admin');
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/admin/login');
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    return roles.includes(user.role);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

