'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RawdahLogo } from './RawdahLogo';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Search, ShoppingBag, Menu, X, ChevronRight, Phone } from 'lucide-react';
import { SearchModal } from './SearchModal';

interface NavbarProps {
  isHeroOverlay?: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { totalCount, openDrawer } = useCart();
  const { currency, setCurrency } = useCurrency();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Collections', href: '/shop?filter=collections' },
    { label: 'Our Story', href: '/our-story' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* 
        Solid luxury charcoal black background ensures 100% contrast, 
        making the brand logo, navigation links, search, and cart 
        instantly clear and legible at all times on first landing and when scrolled.
      */}
      <header
        className={`no-print sticky top-0 z-40 transition-all duration-300 bg-[#033528] text-[#F7F2E6] border-b border-[#E8CE5F]/15 print:hidden ${
          isScrolled ? 'shadow-xl bg-[#033528]/95 backdrop-blur-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#F7F2E6] hover:text-[#E8CE5F] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo is ALWAYS light on dark #033528 bar for 100% crisp visibility */}
            <RawdahLogo variant="light" showSubtitle={true} imgClassName="h-10 sm:h-11 lg:h-14" />
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-9">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-semibold tracking-wider uppercase transition-colors relative py-1 group ${
                    isActive ? 'text-[#E8CE5F]' : 'text-[#F7F2E6]/85 hover:text-[#E8CE5F]'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#E8CE5F] rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions (Search, Currency, Cart) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 xl:px-3 rounded-full border border-[#E8CE5F]/25 bg-white/5 hover:border-[#E8CE5F] text-[#F7F2E6] transition-all flex items-center gap-2 text-xs"
              aria-label="Search fragrances"
            >
              <Search className="w-4 h-4 text-[#E8CE5F]" />
              <span className="hidden xl:inline font-normal text-[#F7F2E6]/70">
                Search perfumes...
              </span>
            </button>

            {/* Currency Pill */}
            <button
              onClick={() => setCurrency(currency === 'BDT' ? 'USD' : 'BDT')}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#E8CE5F]/25 bg-white/5 text-[#F7F2E6] hover:border-[#E8CE5F] transition-colors"
              title="Change Currency"
            >
              <span>{currency}</span>
              <span className="text-[#E8CE5F]/80 font-normal">({currency === 'BDT' ? '৳' : '$'})</span>
            </button>

            {/* Cart Bag Icon with Live Badge */}
            <button
              onClick={openDrawer}
              className="relative p-2 rounded-full text-[#F7F2E6] hover:text-[#E8CE5F] transition-transform active:scale-95"
              aria-label={`Cart with ${totalCount} items`}
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-[#E8CE5F] stroke-[1.8]" />
                <span className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1 bg-[#E8CE5F] text-[#033528] text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalCount}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Slide-Out Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsMobileMenuOpen(false)} />

          <div className="relative w-4/5 max-w-sm bg-[#F7F2E6] h-full shadow-2xl flex flex-col z-10 p-6 border-r border-[#E8DFCB] overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-[#E8DFCB]">
              <RawdahLogo variant="dark" showSubtitle={false} imgClassName="h-9" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-neutral-500 hover:text-neutral-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="py-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Explore Fragrances
              </p>
              <div className="space-y-1">
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-base font-medium text-neutral-800 hover:text-[#033528]"
                >
                  <span>Shop All Perfumes</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/shop?category=Men"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm text-neutral-600 hover:text-[#033528]"
                >
                  <span>Men&apos;s Collection</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/shop?category=Women"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm text-neutral-600 hover:text-[#033528]"
                >
                  <span>Women&apos;s Collection</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/shop?category=Unisex"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm text-neutral-600 hover:text-[#033528]"
                >
                  <span>Unisex Masterpieces</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
                <Link
                  href="/shop?category=Gift+Sets"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm text-neutral-600 hover:text-[#033528]"
                >
                  <span>Gift Sets & Coffrets</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 pt-4">
                Shop By Scent Family
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Oud & Woody', link: '/shop?scent=Oud+%26+Woody' },
                  { name: 'Fresh & Citrus', link: '/shop?scent=Fresh+%26+Citrus' },
                  { name: 'Floral', link: '/shop?scent=Floral' },
                  { name: 'Amber & Spicy', link: '/shop?scent=Amber+%26+Spicy' },
                ].map((s) => (
                  <Link
                    key={s.name}
                    href={s.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2.5 rounded-lg bg-[#EFE7D5] text-neutral-800 hover:bg-[#033528] hover:text-white transition-colors text-center font-medium"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>

              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 pt-4">
                Maison
              </p>
              <div className="space-y-1">
                <Link
                  href="/our-story"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-neutral-700 hover:text-[#033528]"
                >
                  Our Story & Heritage
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-neutral-700 hover:text-[#033528]"
                >
                  Gulshan Showroom & Contact
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-sm text-neutral-700 hover:text-[#033528]"
                >
                  Track Your Order
                </Link>
              </div>
            </div>

            {/* Currency (moved here from the header on small phones) */}
            <div className="sm:hidden flex items-center justify-between py-4 border-t border-[#E8DFCB] text-sm">
              <span className="text-neutral-700 font-medium">Currency</span>
              <div className="inline-flex rounded-full border border-[#E8DFCB] p-0.5 bg-white">
                {(['BDT', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      currency === c ? 'bg-[#033528] text-[#F7F2E6]' : 'text-neutral-600'
                    }`}
                  >
                    {c} {c === 'BDT' ? '৳' : '$'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Footer info */}
            <div className="mt-auto pt-6 border-t border-[#E8DFCB] text-xs text-neutral-500">
              <div className="flex items-center gap-2 mb-2 text-neutral-800 font-medium">
                <Phone className="w-4 h-4 text-[#033528]" />
                <span>+880 1711-000000</span>
              </div>
              <p>Gulshan-2, Dhaka 1212, Bangladesh</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
