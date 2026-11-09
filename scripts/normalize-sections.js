const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const faqItems = [
    {
      q: 'How long do Rāwdah perfumes last on skin and clothes?',
      a: 'Because our formulations are pure Extrait de Parfum (25% – 30% oil concentration), they easily last 14 to 18+ hours on skin and multiple days on clothing. You do not need to re-spray throughout the day.'
    },
    {
      q: 'How does the "Sample First" policy work?',
      a: 'Every full-size flacon arrives with a complimentary unsealed 2ml sample vial. Test the scent on your skin first. If it does not resonate with you, simply return the sealed master box for a full refund or exchange.'
    },
    {
      q: 'Are your ouds made from 100% genuine aged agarwood?',
      a: 'Yes, without exception. We source wild Cambodian agarwood from Pursat and wild Assam oud, aged in oak barrels for up to 20 years to achieve pure balsamic depth with zero synthetic sharpness.'
    },
    {
      q: 'How fast is delivery in Dhaka and across Bangladesh?',
      a: 'Inside Dhaka, parcels arrive within 24–48 hours via dedicated couriers. Nationwide across all 64 districts, delivery takes 2–4 business days. Orders over ৳5,000 enjoy free express delivery.'
    },
    {
      q: 'What payment options do you offer for online orders?',
      a: 'We accept Cash on Delivery (COD) across all districts of Bangladesh, as well as bKash, Nagad, Rocket, and all major Visa, Mastercard, and Amex credit/debit cards.'
    },
    {
      q: 'Can I test the fragrances before purchasing online?',
      a: 'Yes. You can order our 5-Piece Discovery Coffret to test at home, or visit our flagship sensory tasting salon in Road 11, Block D, Gulshan-2, Dhaka (Everyday 11 AM – 10 PM).'
    }
  ];

  await prisma.websiteSection.upsert({
    where: { sectionKey: 'faq' },
    update: {
      contentJson: JSON.stringify({
        title: 'Frequently asked questions',
        subtitle: 'Key information regarding performance, our 2ml sample policy, and nationwide delivery.',
        items: faqItems
      })
    },
    create: {
      sectionKey: 'faq',
      type: 'FAQ',
      title: 'Frequently asked questions',
      subtitle: 'FAQS',
      sortOrder: 9,
      isVisible: true,
      animationPreset: 'LUXURY_EASE',
      contentJson: JSON.stringify({
        title: 'Frequently asked questions',
        subtitle: 'Key information regarding performance, our 2ml sample policy, and nationwide delivery.',
        items: faqItems
      })
    }
  });

  await prisma.websiteSection.upsert({
    where: { sectionKey: 'welcome_promo' },
    update: {
      contentJson: JSON.stringify({
        enabled: true,
        discountPercentage: 15,
        couponCode: 'WELCOME15',
        tagline: 'CELEBRATE YOUR SIGNATURE SCENT',
        title: 'Complimentary 15% Privilege',
        subtitle: 'Step into the sovereign world of Rāwdah Haute Parfumerie with an exclusive welcome privilege on your maiden flacon.',
        perks: [
          '15% instant reduction on any extrait or coffret',
          'Two complimentary 2ml luxury extrait samples included',
          'Free express delivery nationwide across Bangladesh'
        ],
        buttonText: 'Claim 15% Privilege & Shop',
        floatingPillText: 'Special 15% Off Privilege',
        imageUrl: '/images/products/royal-saffron.jpg'
      })
    },
    create: {
      sectionKey: 'welcome_promo',
      type: 'PROMO_MODAL',
      title: 'Welcome Privilege Pop-up & Badge',
      subtitle: 'PROMOTIONAL OFFER',
      sortOrder: 10,
      isVisible: true,
      animationPreset: 'SCALE_SETTLE',
      contentJson: JSON.stringify({
        enabled: true,
        discountPercentage: 15,
        couponCode: 'WELCOME15',
        tagline: 'CELEBRATE YOUR SIGNATURE SCENT',
        title: 'Complimentary 15% Privilege',
        subtitle: 'Step into the sovereign world of Rāwdah Haute Parfumerie with an exclusive welcome privilege on your maiden flacon.',
        perks: [
          '15% instant reduction on any extrait or coffret',
          'Two complimentary 2ml luxury extrait samples included',
          'Free express delivery nationwide across Bangladesh'
        ],
        buttonText: 'Claim 15% Privilege & Shop',
        floatingPillText: 'Special 15% Off Privilege',
        imageUrl: '/images/products/royal-saffron.jpg'
      })
    }
  });

  await prisma.websiteSection.upsert({
    where: { sectionKey: 'hero' },
    update: {
      contentJson: JSON.stringify({
        headlineLine1: 'A Signature Scent,',
        headlineLine2: 'Crafted with Soul',
        subtitle: 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
        watermarkText: 'SCENT THAT LINGERS',
        badgeText: 'LONG LASTING',
        buttonText: 'Discover Fragrance',
        buttonLink: '/shop',
        imageUrl: '/images/hero-model-desert.jpg'
      })
    },
    create: {
      sectionKey: 'hero',
      type: 'HERO',
      title: 'Desert Hero Section',
      subtitle: 'SCENT THAT LINGERS',
      sortOrder: 2,
      isVisible: true,
      animationPreset: 'SCALE_SETTLE',
      contentJson: JSON.stringify({
        headlineLine1: 'A Signature Scent,',
        headlineLine2: 'Crafted with Soul',
        subtitle: 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
        watermarkText: 'SCENT THAT LINGERS',
        badgeText: 'LONG LASTING',
        buttonText: 'Discover Fragrance',
        buttonLink: '/shop',
        imageUrl: '/images/hero-model-desert.jpg'
      })
    }
  });

  console.log('Sections normalized successfully');
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

