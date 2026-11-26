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
    <div className="md:hidden fixed left-3 right-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 rounded-[26px] lg-glass lg-ivory [--lg-blur:24px] px-1.5 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.isAction && pathname === item.href;

        if (item.isAction) {
          return (
            <button
              key={item.label}
              onClick={openDrawer}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-[18px] transition-all relative text-neutral-600 active:scale-95"
              aria-label="View Shopping Bag"
            >
              <div className="relative">
                <Icon className="w-5 h-5 text-[#033528]" />
                {totalCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#033528] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-scale-in">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 text-[#033528]">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-[18px] transition-all active:scale-95 ${
              isActive ? 'text-[#033528] bg-[#033528]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
            <span
              className={`text-[10px] mt-1 ${
                isActive ? 'font-bold text-[#033528]' : 'font-medium'
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

