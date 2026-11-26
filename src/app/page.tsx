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
import { getAgentProducts, getStoreInfo } from '@/lib/agent-catalog';
import { itemListNode, ldJson, organizationNode, websiteNode } from '@/lib/structured-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
  const [categories, bestSellers, newArrivals, allProducts, storeInfo, agentProducts] = await Promise.all([
    getServerCategories(),
    getServerProducts({ isBestSeller: true, take: 6 }),
    getServerProducts({ isNewArrival: true, take: 6 }),
    getServerProducts(),
    getStoreInfo(),
    getAgentProducts().catch(() => []),
  ]);
  // JSON-LD: the business, the site (with search) and the catalog with prices (BDT)
  const jsonLd = ldJson([
    organizationNode(storeInfo),
    websiteNode(storeInfo),
    itemListNode(agentProducts, `${storeInfo.name} perfumes`),
  ]);
  // slug -> name/image, used by the editorial showcase tiles chosen in admin
  const productIndex = Object.fromEntries(
    allProducts.map((p) => [p.slug, { name: p.name, image: p.images?.[0] || '' }])
  );

  return (
    <div className="flex flex-col w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* 2. Campaign Hero */}
      <Hero />

      {/* 3. Editorial Intro + Shop by Category */}
      <EditorialIntro initialCategories={categories} productIndex={productIndex} />

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
