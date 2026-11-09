'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '@/components/common/AnnouncementBar';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { CartDrawer } from '@/components/common/CartDrawer';
import { SizePickerModal } from '@/components/common/SizePickerModal';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { WelcomePromoModal } from '@/components/common/WelcomePromoModal';
import { MobileBottomBar } from '@/components/common/MobileBottomBar';

export const StorefrontShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <CartDrawer />
      <SizePickerModal />
      <ScrollToTop />
      <WelcomePromoModal />
      <MobileBottomBar />
    </>
  );
};
