import { Hero } from '@/components/home/Hero';
import { EditorialIntro } from '@/components/home/EditorialIntro';
import { BestSellers } from '@/components/home/BestSellers';
import { CollectionBanner } from '@/components/home/CollectionBanner';
import { ShopByScent } from '@/components/home/ShopByScent';
import { DailyDeal } from '@/components/home/DailyDeal';
import { NewArrivals } from '@/components/home/NewArrivals';
import { GiftSetsBanner } from '@/components/home/GiftSetsBanner';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { InstagramSection } from '@/components/home/InstagramSection';
import { getServerCategories, getServerProducts } from '@/lib/server-catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
  const [categories, bestSellers, newArrivals] = await Promise.all([
    getServerCategories(),
    getServerProducts({ isBestSeller: true, take: 6 }),
    getServerProducts({ isNewArrival: true, take: 6 }),
  ]);

  return (
    <div className="flex flex-col w-full">
      {/* 2. Campaign Hero */}
      <Hero />

      {/* 3. Editorial Intro + Shop by Category */}
      <EditorialIntro initialCategories={categories} />

      {/* 4. Best Sellers */}
      <BestSellers initialProducts={bestSellers} />

      {/* 5. Collection Campaign Banner */}
      <CollectionBanner />

      {/* 6. Shop by Scent */}
      <ShopByScent />

      {/* 7. Daily Deal */}
      <DailyDeal />

      {/* 8. New Arrivals */}
      <NewArrivals initialProducts={newArrivals} />

      {/* 9. Gift Sets Banner */}
      <GiftSetsBanner />

      {/* 10. Reviews */}
      <ReviewsSection />

      {/* 10. Instagram Grid */}
      <InstagramSection />
    </div>
  );
}
