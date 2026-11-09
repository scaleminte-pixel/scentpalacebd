'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Compass, Sparkles, ShoppingBag, Package } from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const pathname = usePathname();
  const { totalCount, openDrawer } = useCart();

  // Hide on admin routes, checkout, or product details (which has its own native purchase bar)
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout') || pathname?.startsWith('/product/')) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home, isAction: false },
    { label: 'Shop', href: '/shop', icon: Compass, isAction: false },
    { label: 'Deals', href: '/shop?deal=true', icon: Sparkles, isAction: false },
    { label: 'Bag', href: '#', icon: ShoppingBag, isAction: true },
    { label: 'Track', href: '/track-order', icon: Package, isAction: false },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#EAE4DC] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.isAction && pathname === item.href;

        if (item.isAction) {
          return (
            <button
              key={item.label}
              onClick={openDrawer}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative text-neutral-600 active:scale-95"
              aria-label="View Shopping Bag"
            >
              <div className="relative">
                <Icon className="w-5 h-5 text-[#D45520]" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#D45520] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-scale-in">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 text-[#D45520]">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95 ${
              isActive ? 'text-[#D45520]' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
            <span
              className={`text-[10px] mt-1 ${
                isActive ? 'font-bold text-[#D45520]' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

