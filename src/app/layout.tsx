import type { Metadata } from 'next';
import { Bodoni_Moda, Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CartProvider } from '@/context/CartContext';
import { ContentProvider } from '@/context/ContentContext';
import { StorefrontShell } from '@/components/common/StorefrontShell';
import { getServerSections } from '@/lib/server-catalog';

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Rāwdah Haute Parfumerie | Artisanal Luxury Fragrances & Royal Ouds',
  description:
    'Experience the sovereign world of Rāwdah Haute Parfumerie. Blended with rare Cambodian oud, Baltic amber, and Taif roses. Complimentary shipping across Bangladesh.',
  keywords: [
    'luxury perfume',
    'oud',
    'attar',
    'rawdah',
    'bleu oud',
    'oud ambre',
    'extrait de parfum',
    'bangladesh perfume',
    'dhaka luxury fragrance',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSections = await getServerSections();

  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${plusJakartaSans.variable} ${inter.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#141312] selection:bg-[#D45520] selection:text-white font-sans">
        <CurrencyProvider>
          <CartProvider>
            <ContentProvider initialSections={initialSections}>
              <StorefrontShell>{children}</StorefrontShell>
            </ContentProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
