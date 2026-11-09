import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ShopCatalogContent } from '@/components/shop/ShopCatalogContent';
import { getServerProducts, getServerCategories } from '@/lib/server-catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Luxury Fragrance Catalog & Collections | Rāwdah Haute Parfumerie',
  description:
    'Browse our complete masterwork fragrance collection. Filter by olfactive family (Oud & Woody, Amber, Floral, Citrus), gender, size, and price. Delivered across Bangladesh.',
};

export default async function ShopPage() {
  const [initialProducts, initialCategories] = await Promise.all([
    getServerProducts(),
    getServerCategories(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-[#D45520] border-t-transparent animate-spin mx-auto" />
            <p className="font-serif text-lg text-neutral-800">
              Curating Royal Fragrance Catalog...
            </p>
          </div>
        </div>
      }
    >
      <ShopCatalogContent
        initialProducts={initialProducts}
        initialCategories={initialCategories}
      />
    </Suspense>
  );
}
