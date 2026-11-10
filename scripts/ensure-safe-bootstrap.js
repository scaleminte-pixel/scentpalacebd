const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_SECTIONS = [
  {
    sectionKey: 'announcement',
    sectionName: 'Top Announcement Bar',
    sectionType: 'ANNOUNCEMENT',
    sortOrder: 1,
    content: {
      text: 'Complimentary 2ml extrait sample & free express delivery on orders over ৳5,000',
      badgeText: 'ROYAL PRIVILEGE',
      promoCode: 'Use code: ROYAL15',
      promoDiscount: '15% OFF',
      timerEnabled: false,
      timerTarget: '',
      currency: 'BDT (৳)',
    },
  },
  {
    sectionKey: 'hero',
    sectionName: 'Desert Hero Section',
    sectionType: 'HERO',
    sortOrder: 2,
    content: {
      headline: 'A Signature Scent, Crafted with Soul',
      subtitle: 'A bold composition of rare woods, warm amber, and delicate florals created to leave an unforgettable impression.',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      badgeText: 'Pure Formulation',
      badgeNumber: '18',
      badgeLabel: 'Signature Scents',
      imageUrl: '/images/banner-oud-collection.webp',
      bgImage: '/images/banner-oud-collection.webp',
      secondaryImage: '/images/products/lattafa-blue-oud.webp',
    },
  },
  {
    sectionKey: 'editorial',
    sectionName: 'Luxury, No Compromise.',
    sectionType: 'EDITORIAL',
    sortOrder: 3,
    content: {
      title: 'Luxury, No Compromise.',
      headline: 'Our Signature Scents (18)',
      description: 'Explore our collection of refined fragrances, inspired by tradition and crafted for modern elegance.',
      badgeText: 'Pure Formulation',
    },
  },
  {
    sectionKey: 'best_sellers',
    sectionName: 'BEST SELLING PRODUCT.',
    sectionType: 'BEST_SELLERS',
    sortOrder: 4,
    content: {
      title: 'BEST SELLING PRODUCT.',
      subtitle: 'Hand-blended with high concentration oils for lasting sillage.',
      badgeText: 'MASTERPIECES',
    },
  },
  {
    sectionKey: 'collection_banner',
    sectionName: 'The Oud Royale Collection',
    sectionType: 'COLLECTION_BANNER',
    sortOrder: 5,
    content: {
      title: 'The Oud Royale Collection',
      description: 'Matured for 15 years in aged agarwood casks. An intoxicating symphony of wild Assam oud, spiced amber, and velvety Taif rose.',
      ctaText: 'Discover Oud Royale',
      ctaLink: '/shop?category=oud',
      badgeText: 'LIMITED RESERVATION',
      imageUrl: '/images/banner-oud-collection.webp',
      bgImage: '/images/banner-oud-collection.webp',
    },
  },
  {
    sectionKey: 'daily_deal',
    sectionName: 'Deal of the Day',
    sectionType: 'DAILY_DEAL',
    sortOrder: 6,
    content: {
      title: 'Daily Exclusive: Lattafa Blue Oud',
      subtitle: 'Deep ocean depths meeting mysterious smoky Cambodian agarwood at an exclusive rate.',
      badgeText: 'LIMITED TIME DEAL',
    },
  },
  {
    sectionKey: 'gift_sets_banner',
    sectionName: 'Curated Gift Sets',
    sectionType: 'GIFT_SETS_BANNER',
    sortOrder: 7,
    content: {
      title: 'The Royale Discovery Gift Coffret',
      subtitle: 'Three iconic 50ml flacons presented in an embossed calfskin presentation chest.',
      ctaText: 'Explore Gift Sets',
      ctaLink: '/shop?category=gift-sets',
      imageUrl: '/images/products/arabiyat-prestige-marwa-tester.webp',
      bgImage: '/images/products/arabiyat-prestige-marwa-tester.webp',
    },
  },
  {
    sectionKey: 'welcome_promo',
    sectionName: 'Welcome Privilege Modal',
    sectionType: 'PROMOTIONS',
    sortOrder: 8,
    content: {
      title: 'Welcome to Haute Parfumerie',
      subtitle: 'Enjoy 15% privilege discount on your first artisanal order',
      couponCode: 'ROYAL15',
      discountPercentage: 15,
      imageUrl: '/images/products/rayhaan-azul.webp',
      image: '/images/products/rayhaan-azul.webp',
      delaySeconds: 4,
      isEnabled: true,
    },
  },
];

async function ensureSafeBootstrap() {
  console.log('--- Checking database state for safe deployment bootstrap ---');

  // 1. Ensure Admin Users exist
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    console.log('No admin users found. Seeding initial admin users...');
    const salt = await bcrypt.genSalt(10);
    const passOwner = await bcrypt.hash('RawdahOwner2026!', salt);
    const passManager = await bcrypt.hash('RawdahManager2026!', salt);
    const passStaff = await bcrypt.hash('RawdahStaff2026!', salt);
    const passAccountant = await bcrypt.hash('RawdahAccounts2026!', salt);

    await prisma.adminUser.createMany({
      data: [
        { email: 'owner@rawdahperfumes.com', name: 'Tanvir Ahmed Chowdhury', role: 'OWNER', passwordHash: passOwner, isActive: true },
        { email: 'manager@rawdahperfumes.com', name: 'Nusrat Jahan', role: 'MANAGER', passwordHash: passManager, isActive: true },
        { email: 'orderstaff@rawdahperfumes.com', name: 'Rakib Hasan', role: 'ORDER_STAFF', passwordHash: passStaff, isActive: true },
        { email: 'accountant@rawdahperfumes.com', name: 'Mahmudul Karim', role: 'ACCOUNTANT', passwordHash: passAccountant, isActive: true },
      ],
    });
    console.log('Admin users seeded successfully.');
  } else {
    console.log(`[SAFE] ${adminCount} admin user(s) already exist. Preserving existing accounts.`);
  }

  // 2. Ensure WebsiteSections exist WITHOUT OVERWRITING existing user images/texts
  for (const def of DEFAULT_SECTIONS) {
    const existing = await prisma.websiteSection.findUnique({
      where: { sectionKey: def.sectionKey },
    });

    if (!existing) {
      console.log(`[BOOTSTRAP] Section "${def.sectionKey}" missing. Creating with defaults...`);
      await prisma.websiteSection.create({
        data: {
          sectionKey: def.sectionKey,
          sectionName: def.sectionName,
          sectionType: def.sectionType,
          sortOrder: def.sortOrder,
          contentJson: JSON.stringify(def.content),
          isVisible: true,
        },
      });
    } else {
      // PRESERVE user content! Do not touch or overwrite existing uploaded images or texts!
      console.log(`[SAFE] Section "${def.sectionKey}" already exists. Preserving custom user images & content.`);
    }
  }

  // 3. Ensure Products exist. Only seed if catalog is completely empty!
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    console.log('[BOOTSTRAP] Database has 0 products. Running initial catalog seed...');
    // Execute initial seed once
    const { spawnSync } = require('child_process');
    const res = spawnSync('node', ['scripts/seed-43-real-products.js', '--force'], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    if (res.status !== 0) {
      console.warn('Initial seed exited with code:', res.status);
    }
  } else {
    console.log(`[SAFE] Catalog already contains ${productCount} products. Preserving all product data, prices, and stock.`);
  }

  // 4. Checkpoint WAL to flush all changes to main SQLite database file
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    console.log('[SAFE] SQLite WAL checkpoint executed.');
  } catch (err) {
    console.warn('WAL checkpoint non-fatal notice:', err.message);
  }

  console.log('--- Safe bootstrap completed. All user uploads, images, and content are protected. ---');
}

ensureSafeBootstrap()
  .catch((err) => {
    console.error('Safe bootstrap error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

