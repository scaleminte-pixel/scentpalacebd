import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Rāwdah Haute Parfumerie Database ---');

  const existingProductCount = await prisma.product.count();
  if (existingProductCount > 0) {
    console.log(`Database already contains ${existingProductCount} products. Skipping duplicate seed.`);
    return;
  }

  // 1. Create Admin Users with distinct roles
  console.log('Seeding administrative team...');
  const salt = await bcrypt.genSalt(10);
  const passwordHashOwner = await bcrypt.hash('RawdahOwner2026!', salt);
  const passwordHashManager = await bcrypt.hash('RawdahManager2026!', salt);
  const passwordHashStaff = await bcrypt.hash('RawdahStaff2026!', salt);
  const passwordHashEditor = await bcrypt.hash('RawdahEditor2026!', salt);
  const passwordHashAccounts = await bcrypt.hash('RawdahAccounts2026!', salt);

  const owner = await prisma.adminUser.upsert({
    where: { email: 'owner@rawdahperfumes.com' },
    update: {},
    create: {
      name: 'Tanvir Ahmed Chowdhury',
      email: 'owner@rawdahperfumes.com',
      passwordHash: passwordHashOwner,
      role: 'OWNER',
      phone: '+880 1711-000001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  });

  const manager = await prisma.adminUser.upsert({
    where: { email: 'manager@rawdahperfumes.com' },
    update: {},
    create: {
      name: 'Farzana Huq',
      email: 'manager@rawdahperfumes.com',
      passwordHash: passwordHashManager,
      role: 'MANAGER',
      phone: '+880 1711-000002',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'orderstaff@rawdahperfumes.com' },
    update: {},
    create: {
      name: 'Kamrul Hassan',
      email: 'orderstaff@rawdahperfumes.com',
      passwordHash: passwordHashStaff,
      role: 'ORDER_STAFF',
      phone: '+880 1711-000003',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'editor@rawdahperfumes.com' },
    update: {},
    create: {
      name: 'Nusrat Jahan',
      email: 'editor@rawdahperfumes.com',
      passwordHash: passwordHashEditor,
      role: 'CATALOG_EDITOR',
      phone: '+880 1711-000004',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'accountant@rawdahperfumes.com' },
    update: {},
    create: {
      name: 'Mahbubur Rahman, FCA',
      email: 'accountant@rawdahperfumes.com',
      passwordHash: passwordHashAccounts,
      role: 'ACCOUNTANT',
      phone: '+880 1711-000005',
    },
  });

  // 2. Finance Accounts
  console.log('Seeding finance accounts...');
  const bkashAccount = await prisma.financeAccount.upsert({
    where: { id: 'fa-bkash-merchant' },
    update: {},
    create: {
      id: 'fa-bkash-merchant',
      name: 'bKash Merchant Account (01711-888999)',
      type: 'BKASH',
      accountNumber: '01711-888999',
      openingBalance: 125000,
      currentBalance: 348500,
      notes: 'Official verified bKash Tokenized Checkout merchant wallet',
    },
  });

  const bankAccount = await prisma.financeAccount.upsert({
    where: { id: 'fa-prime-bank' },
    update: {},
    create: {
      id: 'fa-prime-bank',
      name: 'Prime Bank Ltd (Gulshan Branch)',
      type: 'BANK',
      accountNumber: '104-982-1002345',
      openingBalance: 650000,
      currentBalance: 980000,
      notes: 'Corporate Current Account for supplier settlements & payroll',
    },
  });

  const cashAccount = await prisma.financeAccount.upsert({
    where: { id: 'fa-cash-drawer' },
    update: {},
    create: {
      id: 'fa-cash-drawer',
      name: 'Flagship Atelier Cash Drawer (Gulshan-2)',
      type: 'CASH',
      openingBalance: 45000,
      currentBalance: 72000,
      notes: 'Physical cash on hand for petty cash and walk-in sales',
    },
  });

  const courierAccount = await prisma.financeAccount.upsert({
    where: { id: 'fa-steadfast-escrow' },
    update: {},
    create: {
      id: 'fa-steadfast-escrow',
      name: 'Steadfast Courier COD Escrow',
      type: 'COURIER_ESCROW',
      openingBalance: 0,
      currentBalance: 42500,
      notes: 'Courier receivable balance pending weekly disbursement',
    },
  });

  // 3. Taxonomies: Categories & Scent Families
  console.log('Seeding categories and scent families...');
  const catMen = await prisma.category.upsert({
    where: { name: 'Men' },
    update: {},
    create: {
      name: 'Men',
      slug: 'men',
      description: 'Regal, bold creations balancing noble woods, smoked ambergris, and spices.',
      image: '/images/products/oud-ambre-1.jpg',
      itemCount: 4,
    },
  });

  const catWomen = await prisma.category.upsert({
    where: { name: 'Women' },
    update: {},
    create: {
      name: 'Women',
      slug: 'women',
      description: 'Sensual elixirs of dewy Taif roses, royal jasmine, and golden vanilla.',
      image: '/images/products/rose-imperiale-1.jpg',
      itemCount: 3,
    },
  });

  const catUnisex = await prisma.category.upsert({
    where: { name: 'Unisex' },
    update: {},
    create: {
      name: 'Unisex',
      slug: 'unisex',
      description: 'Transcendent olfactory expressions defying traditional gender boundaries.',
      image: '/images/products/royal-saffron-1.jpg',
      itemCount: 4,
    },
  });

  const catGiftSets = await prisma.category.upsert({
    where: { name: 'Gift Sets' },
    update: {},
    create: {
      name: 'Gift Sets',
      slug: 'gift-sets',
      description: 'Bespoke coffrets with gold filigree and miniature discovery flacons.',
      image: '/images/products/banner-gift-sets.jpg',
      itemCount: 1,
    },
  });

  const scentOud = await prisma.scentFamily.upsert({
    where: { name: 'Oud & Woody' },
    update: {},
    create: {
      name: 'Oud & Woody',
      slug: 'oud-woody',
      description: 'Aged Cambodian agarwood, Mysore sandalwood, and smoked birch.',
      itemCount: 4,
    },
  });

  const scentCitrus = await prisma.scentFamily.upsert({
    where: { name: 'Fresh & Citrus' },
    update: {},
    create: {
      name: 'Fresh & Citrus',
      slug: 'fresh-citrus',
      description: 'Sun-drenched Calabrian bergamot, aquatic accords, and crisp greens.',
      itemCount: 2,
    },
  });

  const scentFloral = await prisma.scentFamily.upsert({
    where: { name: 'Floral' },
    update: {},
    create: {
      name: 'Floral',
      slug: 'floral',
      description: 'Velvety Turkish damask roses, white neroli, and powdery irises.',
      itemCount: 3,
    },
  });

  const scentAmber = await prisma.scentFamily.upsert({
    where: { name: 'Amber & Spicy' },
    update: {},
    create: {
      name: 'Amber & Spicy',
      slug: 'amber-spicy',
      description: 'Hand-picked saffron threads, honeyed resins, and warm cinnamon.',
      itemCount: 3,
    },
  });

  // 4. Products & Variants (Migrated from src/data/products.ts with stable IDs & URLs)
  console.log('Seeding masterwork fragrance collection...');
  const PRODUCTS_DATA = [
    {
      id: 'prod-oud-ambre',
      slug: 'oud-ambre',
      name: 'Oud Ambre',
      concentration: 'Extrait de Parfum',
      tagline: 'Smoky Cambodian Oud with Warm Golden Amber',
      description: 'A sovereign union of 15-year aged Cambodian agarwood resin, warm ambergris crystals, and Madagascar bourbon vanilla. Crafted for those who command the room in regal silence.',
      story: 'Distilled in small batches in Grasse and aged in French oak casks.',
      categoryId: catMen.id,
      scentFamilyId: scentOud.id,
      images: JSON.stringify(['/images/products/oud-ambre-1.jpg', '/images/products/oud-ambre-2.jpg']),
      rating: 4.95,
      reviewsCount: 48,
      notesTop: JSON.stringify(['Calabrian Bergamot', 'Cardamom Pods', 'Sweet Mandarin']),
      notesHeart: JSON.stringify(['Aged Cambodian Oud', 'Bourbon Vanilla', 'Labdanum Resin']),
      notesBase: JSON.stringify(['Smoked Birch', 'Golden Ambergris', 'Velvet Musk']),
      longevity: '14-18 Hours',
      sillage: 'Regal & Enveloping',
      bestSeason: 'Autumn / Winter / Evening Soirées',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum (Fragrance)', 'Aquilaria Agallocha Wood Oil', 'Amber Extract']),
      isBestSeller: true,
      isFeatured: true,
      variants: [
        { sku: 'RDH-OA-50', size: '50ml', purchaseCost: 4800, sellingPrice: 12500, stock: 18, reservedStock: 2 },
        { sku: 'RDH-OA-100', size: '100ml', purchaseCost: 6500, sellingPrice: 17500, originalPrice: 19500, stock: 12, reservedStock: 1 },
        { sku: 'RDH-OA-200', size: '200ml', purchaseCost: 9800, sellingPrice: 28000, stock: 6, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-royal-saffron',
      slug: 'royal-saffron',
      name: 'Royal Saffron',
      concentration: 'Extrait de Parfum',
      tagline: 'Hand-Harvested Kashmiri Saffron with Honey & Woods',
      description: 'Rare saffron stamens harvested by hand at dawn in Pampore, layered with raw mountain wildflower honey and cedarwood. A radiant spicy-gourmand composition of unmatched nobility.',
      story: 'Formulated in homage to royal Mughal coronation ceremonies.',
      categoryId: catUnisex.id,
      scentFamilyId: scentAmber.id,
      images: JSON.stringify(['/images/products/royal-saffron-1.jpg', '/images/products/royal-saffron-2.jpg']),
      rating: 4.97,
      reviewsCount: 35,
      notesTop: JSON.stringify(['Kashmiri Saffron Threads', 'Wild Blossom Honey', 'Pink Pepper']),
      notesHeart: JSON.stringify(['Turkish Damask Rose', 'Cistus Incanus', 'Nutmeg Butter']),
      notesBase: JSON.stringify(['Cedarwood Atlas', 'Smoked Amber', 'White Leather']),
      longevity: '16-20 Hours',
      sillage: 'Transcendent',
      bestSeason: 'All Seasons / Special Occasions',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Crocus Sativus Stigma Extract', 'Cedarwood Essential Oil']),
      isBestSeller: true,
      isFeatured: true,
      variants: [
        { sku: 'RDH-RS-50', size: '50ml', purchaseCost: 5200, sellingPrice: 13500, stock: 14, reservedStock: 1 },
        { sku: 'RDH-RS-100', size: '100ml', purchaseCost: 7200, sellingPrice: 18500, originalPrice: 20500, stock: 8, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-bleu-oud',
      slug: 'bleu-oud',
      name: 'Bleu Oud',
      concentration: 'Extrait de Parfum',
      tagline: 'Ocean Breeze Meets Deep Royal Agarwood',
      description: 'The dramatic clash of bracing Atlantic marine accords and smoldering Assam agarwood. Vibrant, aquatic, yet possessing an unmistakably dark, sensual backbone.',
      story: 'Inspired by midnight oceanic voyages along the Arabian sea.',
      categoryId: catMen.id,
      scentFamilyId: scentCitrus.id,
      images: JSON.stringify(['/images/products/bleu-oud-1.jpg', '/images/products/bleu-oud-2.jpg']),
      rating: 4.92,
      reviewsCount: 62,
      notesTop: JSON.stringify(['Sea Salt Accord', 'Grapefruit Zest', 'Italian Mint']),
      notesHeart: JSON.stringify(['Assam Agarwood', 'Crushed Geranium', 'Black Pepper']),
      notesBase: JSON.stringify(['Vetiver Haiti', 'Driftwood', 'Dry Ambergris']),
      longevity: '12-16 Hours',
      sillage: 'Magnetic & Clean',
      bestSeason: 'Spring / Summer / Daytime Elegance',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Aqua', 'Limonene', 'Linalool']),
      isBestSeller: true,
      isFeatured: true,
      dealDiscountPercent: 20,
      variants: [
        { sku: 'RDH-BO-50', size: '50ml', purchaseCost: 4500, sellingPrice: 11500, stock: 22, reservedStock: 3 },
        { sku: 'RDH-BO-100', size: '100ml', purchaseCost: 6200, sellingPrice: 16500, originalPrice: 18500, stock: 15, reservedStock: 2 },
      ],
    },
    {
      id: 'prod-rose-imperiale',
      slug: 'rose-imperiale',
      name: 'Rose Impériale',
      concentration: 'Extrait de Parfum',
      tagline: 'Dewy Taif Rose with Velvety White Musks',
      description: 'Distilled at sunrise in the high-altitude gardens of Taif, this opulent rose absolute is buffered by creamy Madagascar vanilla and powdery white musk.',
      story: 'Created with over three thousand rose petals per flacon.',
      categoryId: catWomen.id,
      scentFamilyId: scentFloral.id,
      images: JSON.stringify(['/images/products/rose-imperiale-1.jpg', '/images/products/rose-imperiale-2.jpg']),
      rating: 4.88,
      reviewsCount: 29,
      notesTop: JSON.stringify(['Morning Dew Accord', 'Pink Peppercorn', 'Lychee']),
      notesHeart: JSON.stringify(['Taif Rose Absolute', 'Bulgarian Rose', 'Jasmine Sambac']),
      notesBase: JSON.stringify(['White Musk', 'Praline Vanilla', 'Sandalwood']),
      longevity: '14-16 Hours',
      sillage: 'Luminous & Romantic',
      bestSeason: 'All Seasons',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Rosa Damascena Flower Oil']),
      isNewArrival: true,
      variants: [
        { sku: 'RDH-RI-50', size: '50ml', purchaseCost: 4900, sellingPrice: 12800, stock: 16, reservedStock: 0 },
        { sku: 'RDH-RI-100', size: '100ml', purchaseCost: 6800, sellingPrice: 17800, stock: 9, reservedStock: 1 },
      ],
    },
    {
      id: 'prod-sultan-vetiver',
      slug: 'sultan-vetiver',
      name: 'Sultan Vetiver',
      concentration: 'Extrait de Parfum',
      tagline: 'Earthy Haitian Vetiver & Smoked Leather',
      description: 'Four distinct origins of vetiver roots intertwined with Italian leather and smoky birch tar. Earthy, dignified, and unapologetically masculine.',
      story: 'A bespoke scent commissioned for statesmen and connoisseurs.',
      categoryId: catMen.id,
      scentFamilyId: scentOud.id,
      images: JSON.stringify(['/images/products/sultan-vetiver-1.jpg']),
      rating: 4.85,
      reviewsCount: 19,
      notesTop: JSON.stringify(['Grapefruit Peel', 'Cardamom', 'Cypress']),
      notesHeart: JSON.stringify(['Haitian Vetiver', 'Bourbon Vetiver', 'Neroli']),
      notesBase: JSON.stringify(['Italian Leather', 'Smoked Birch Tar', 'Tonka Bean']),
      longevity: '14-18 Hours',
      sillage: 'Dignified & Earthy',
      bestSeason: 'Autumn / Winter',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Vetiveria Zizanoides Root Oil']),
      variants: [
        { sku: 'RDH-SV-50', size: '50ml', purchaseCost: 4600, sellingPrice: 11800, stock: 11, reservedStock: 0 },
        { sku: 'RDH-SV-100', size: '100ml', purchaseCost: 6400, sellingPrice: 16800, stock: 7, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-musk-kashmir',
      slug: 'musk-kashmir',
      name: 'Musk Kashmir',
      concentration: 'Extrait de Parfum',
      tagline: 'Silken White Musks & Dewy Magnolia',
      description: 'A second-skin whisper of clean cashmeran, powdery iris, and luminous white florals. Gentle yet possessing an eternal trail that endures through evening.',
      story: 'Evoking the pure white snow caps of the Pir Panjal mountains.',
      categoryId: catUnisex.id,
      scentFamilyId: scentFloral.id,
      images: JSON.stringify(['/images/products/musk-kashmir-1.jpg']),
      rating: 4.91,
      reviewsCount: 38,
      notesTop: JSON.stringify(['White Gardenia', 'Dewy Pear', 'Freesia']),
      notesHeart: JSON.stringify(['Cashmeran Wood', 'Florentine Iris', 'Cotton Blossom']),
      notesBase: JSON.stringify(['White Musk', 'Warm Amber', 'Vanilla Silk']),
      longevity: '12-16 Hours',
      sillage: 'Intimate & Sensual',
      bestSeason: 'All Seasons / Office & Casual Luxury',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Alpha-Isomethyl Ionone']),
      isNewArrival: true,
      variants: [
        { sku: 'RDH-MK-50', size: '50ml', purchaseCost: 4200, sellingPrice: 11000, stock: 20, reservedStock: 1 },
        { sku: 'RDH-MK-100', size: '100ml', purchaseCost: 5900, sellingPrice: 15500, stock: 14, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-leather-majesty',
      slug: 'leather-majesty',
      name: 'Leather Majesty',
      concentration: 'Extrait de Parfum',
      tagline: 'Tuscan Leather, Smoked Resins & Saffron',
      description: 'Hand-burnished leather accord bathed in raspberry nectar, thyme, and Frankincense tears. A commanding signature for the discerning elite.',
      story: 'Formulated in Florence using rare botanical tinctures.',
      categoryId: catMen.id,
      scentFamilyId: scentAmber.id,
      images: JSON.stringify(['/images/products/leather-majesty-1.jpg']),
      rating: 4.94,
      reviewsCount: 42,
      notesTop: JSON.stringify(['Wild Raspberry', 'Wild Thyme', 'Saffron']),
      notesHeart: JSON.stringify(['Olibanum Resin', 'Night Jasmine', 'Leather']),
      notesBase: JSON.stringify(['Tuscan Suede', 'Black Amber', 'Smoky Cedar']),
      longevity: '16-20 Hours',
      sillage: 'Powerhouse',
      bestSeason: 'Winter / Gala & Black Tie',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Leather Extracts']),
      isBestSeller: true,
      variants: [
        { sku: 'RDH-LM-50', size: '50ml', purchaseCost: 5100, sellingPrice: 13200, stock: 12, reservedStock: 0 },
        { sku: 'RDH-LM-100', size: '100ml', purchaseCost: 7100, sellingPrice: 18200, stock: 9, reservedStock: 1 },
      ],
    },
    {
      id: 'prod-amber-supreme',
      slug: 'amber-supreme',
      name: 'Amber Supreme',
      concentration: 'Extrait de Parfum',
      tagline: 'Smoky Benzoin, Tonka & Amber Crystals',
      description: 'Luminous golden resins heated over embers of agarwood, finished with creamy Venezuelan tonka beans and powdered benzoin.',
      story: 'A tribute to the timeless oriental amber accords of ancient Damascus.',
      categoryId: catUnisex.id,
      scentFamilyId: scentAmber.id,
      images: JSON.stringify(['/images/products/amber-supreme-1.jpg']),
      rating: 4.89,
      reviewsCount: 22,
      notesTop: JSON.stringify(['Sweet Orange', 'Nutmeg', 'Coriander']),
      notesHeart: JSON.stringify(['Golden Amber Resin', 'Benzoin Siam', 'Patchouli']),
      notesBase: JSON.stringify(['Tonka Bean Absolute', 'Labdanum', 'Oud Smoke']),
      longevity: '14-18 Hours',
      sillage: 'Warm & Radiating',
      bestSeason: 'Winter / Autumn',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Benzoin Resinoid']),
      variants: [
        { sku: 'RDH-AS-50', size: '50ml', purchaseCost: 4700, sellingPrice: 12000, stock: 15, reservedStock: 0 },
        { sku: 'RDH-AS-100', size: '100ml', purchaseCost: 6500, sellingPrice: 17000, stock: 10, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-tobacco-noir',
      slug: 'tobacco-noir',
      name: 'Tobacco Noir',
      concentration: 'Extrait de Parfum',
      tagline: 'Cuban Tobacco Leaf, Cocoa & Bourbon Vanilla',
      description: 'Cured whole Cuban tobacco leaves steeped in honeyed dried fruits, ginger, and aged rum, settling into a dark cocoa and vanilla drydown.',
      story: 'Blended in London with aged Caribbean rum barrel essences.',
      categoryId: catMen.id,
      scentFamilyId: scentOud.id,
      images: JSON.stringify(['/images/products/tobacco-noir-1.jpg']),
      rating: 4.96,
      reviewsCount: 51,
      notesTop: JSON.stringify(['Tobacco Leaf', 'Spicy Notes', 'Ginger']),
      notesHeart: JSON.stringify(['Tonka Bean', 'Tobacco Blossom', 'Vanilla', 'Cacao']),
      notesBase: JSON.stringify(['Dried Fruit Accord', 'Wood Sap', 'Honey']),
      longevity: '16-22 Hours',
      sillage: 'Intense & Warm',
      bestSeason: 'Autumn / Winter',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Nicotiana Tabacum Leaf Extract']),
      isBestSeller: true,
      variants: [
        { sku: 'RDH-TN-50', size: '50ml', purchaseCost: 5000, sellingPrice: 13000, stock: 17, reservedStock: 1 },
        { sku: 'RDH-TN-100', size: '100ml', purchaseCost: 6900, sellingPrice: 18000, stock: 11, reservedStock: 2 },
      ],
    },
    {
      id: 'prod-vanilla-d-or',
      slug: 'vanilla-d-or',
      name: 'Vanilla D\'Or',
      concentration: 'Extrait de Parfum',
      tagline: 'Tahitian Vanilla Caviar & Golden Caramel',
      description: 'Not merely sweet, but dark, woody, and resinous. Tahitian and Madagascar vanilla beans steeped with amberwood, brown sugar, and toasted almonds.',
      story: 'An elevated gourmand designed exclusively for royal banquet evenings.',
      categoryId: catWomen.id,
      scentFamilyId: scentFloral.id,
      images: JSON.stringify(['/images/products/vanilla-d-or-1.jpg']),
      rating: 4.9,
      reviewsCount: 34,
      notesTop: JSON.stringify(['Brown Sugar', 'Almond Milk', 'Bergamot']),
      notesHeart: JSON.stringify(['Tahitian Vanilla Caviar', 'Orchid', 'Tonka']),
      notesBase: JSON.stringify(['Amberwood', 'Musk', 'Bourbon Vanilla']),
      longevity: '14-16 Hours',
      sillage: 'Enchanting & Sweet',
      bestSeason: 'All Seasons',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Vanilla Planifolia Fruit Extract']),
      isNewArrival: true,
      variants: [
        { sku: 'RDH-VO-50', size: '50ml', purchaseCost: 4600, sellingPrice: 12200, stock: 19, reservedStock: 1 },
        { sku: 'RDH-VO-100', size: '100ml', purchaseCost: 6400, sellingPrice: 17200, stock: 13, reservedStock: 0 },
      ],
    },
    {
      id: 'prod-bergamot-royale',
      slug: 'bergamot-royale',
      name: 'Bergamot Royale',
      concentration: 'Extrait de Parfum',
      tagline: 'First-Press Calabrian Bergamot & White Amber',
      description: 'Bright, invigorating sunbeams of first-press Italian bergamot balanced by sparkling pink grapefruit, green petitgrain, and clean Iso E Super woods.',
      story: 'Handcrafted in Grasse using traditional copper alembic stills.',
      categoryId: catUnisex.id,
      scentFamilyId: scentCitrus.id,
      images: JSON.stringify(['/images/products/bergamot-royale-1.jpg']),
      rating: 4.87,
      reviewsCount: 26,
      notesTop: JSON.stringify(['Calabrian Bergamot', 'Grapefruit', 'Bitter Orange']),
      notesHeart: JSON.stringify(['Petitgrain', 'White Pepper', 'Neroli']),
      notesBase: JSON.stringify(['Cedarwood', 'Vetiver', 'White Amber']),
      longevity: '10-14 Hours',
      sillage: 'Sparkling & Radiant',
      bestSeason: 'Spring / Summer',
      ingredients: JSON.stringify(['Alcohol Denat', 'Parfum', 'Citrus Aurantium Bergamia Fruit Oil']),
      variants: [
        { sku: 'RDH-BR-50', size: '50ml', purchaseCost: 4100, sellingPrice: 10800, stock: 24, reservedStock: 0 },
        { sku: 'RDH-BR-100', size: '100ml', purchaseCost: 5800, sellingPrice: 15000, stock: 16, reservedStock: 1 },
      ],
    },
    {
      id: 'prod-discovery-coffret',
      slug: 'discovery-coffret',
      name: 'Bespoke Discovery Coffret',
      concentration: 'Extrait de Parfum Ensemble',
      tagline: '5 Miniature Flacons in Lacquered Wood Box',
      description: 'An immaculate discovery set featuring five signature 10ml flacons: Oud Ambre, Royal Saffron, Bleu Oud, Rose Impériale, and Tobacco Noir. Arrives in signature black lacquered wood with gold filigree and personal calligraphy.',
      story: 'The ultimate royal gift ensemble for connoisseurs.',
      categoryId: catGiftSets.id,
      scentFamilyId: scentOud.id,
      images: JSON.stringify(['/images/products/banner-gift-sets.jpg']),
      rating: 4.99,
      reviewsCount: 57,
      notesTop: JSON.stringify(['Curated Multi-Note Experience']),
      notesHeart: JSON.stringify(['5 Signature Fragrance Profiles']),
      notesBase: JSON.stringify(['Aged Woods, Ambers & Florals']),
      longevity: '14-20 Hours',
      sillage: 'Curated Collection',
      bestSeason: 'Year Round / Luxury Gifting',
      ingredients: JSON.stringify(['5 x 10ml Extrait de Parfum flacons in velvet lining']),
      isFeatured: true,
      bundleType: 'DISCOVERY_SET',
      bundleDeductsComponents: false,
      variants: [
        { sku: 'RDH-SET-5X10', size: '5 x 10ml', purchaseCost: 5500, sellingPrice: 15500, stock: 25, reservedStock: 2 },
      ],
    },
  ];

  for (const prodData of PRODUCTS_DATA) {
    const { variants, ...prodFields } = prodData;
    const product = await prisma.product.upsert({
      where: { slug: prodFields.slug },
      update: prodFields,
      create: prodFields,
    });

    for (const v of variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          ...v,
          productId: product.id,
        },
        create: {
          ...v,
          productId: product.id,
        },
      });

      // Register opening stock movement
      await prisma.stockMovement.create({
        data: {
          variantId: variant.id,
          type: 'OPENING',
          quantity: v.stock,
          beforeStock: 0,
          afterStock: v.stock,
          reason: 'Initial physical inventory opening audit',
          userId: owner.id,
          userName: owner.name,
        },
      });
    }
  }

  // 5. Daily Deals & Coupons
  console.log('Seeding coupons and deals...');
  await prisma.coupon.upsert({
    where: { code: 'WELCOME15' },
    update: {},
    create: {
      code: 'WELCOME15',
      type: 'PERCENTAGE',
      value: 15,
      minSpend: 5000,
      description: '15% off first order for VIP patrons',
      isActive: true,
      usageLimit: 1000,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'ROYAL10' },
    update: {},
    create: {
      code: 'ROYAL10',
      type: 'PERCENTAGE',
      value: 10,
      minSpend: 8000,
      description: '10% privilege discount across all flacons',
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'EIDVVIP' },
    update: {},
    create: {
      code: 'EIDVVIP',
      type: 'FIXED',
      value: 2000,
      minSpend: 15000,
      description: '৳2,000 cash discount on orders over ৳15,000',
      isActive: true,
    },
  });

  // Daily deal for Bleu Oud
  const bleuOudProduct = await prisma.product.findUnique({ where: { slug: 'bleu-oud' }, include: { variants: true } });
  if (bleuOudProduct && bleuOudProduct.variants[1]) {
    const endTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.dailyDeal.create({
      data: {
        productId: bleuOudProduct.id,
        variantId: bleuOudProduct.variants[1].id,
        title: 'Deal of the Day',
        tagline: 'Save ৳2,000 on Sovereign Bleu Oud 100ml Flacon',
        dealPrice: 14500,
        originalPrice: 16500,
        startTime: new Date(),
        endTime: endTomorrow,
        stockTotal: 25,
        stockRemaining: 11,
        isEnabled: true,
      },
    });
  }

  // 6. Expenses (Financial records)
  console.log('Seeding financial operating expenses...');
  const expensesData = [
    {
      title: 'French Extrait Oil Batch #RDH-901 Import & Clearance',
      category: 'PRODUCT_PURCHASE',
      amount: 185000,
      accountId: bankAccount.id,
      vendor: 'Grasse Aromatics SAS',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      notes: 'Customs duty and raw extrait imports for Q4 production',
    },
    {
      title: 'Heavy Polish Crystal Flacons & Filigree Caps Packaging',
      category: 'PACKAGING',
      amount: 62000,
      accountId: bankAccount.id,
      vendor: 'LuxeGlass Packaging Ltd',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      notes: '500 units bespoke 50ml and 100ml crystal bottles',
    },
    {
      title: 'Facebook & Instagram Luxury Brand Awareness Ads',
      category: 'ADVERTISING',
      amount: 45000,
      accountId: bankAccount.id,
      vendor: 'Meta Platforms Ireland Ltd',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: 'Targeted high-net-worth audiences in Dhaka & Chittagong',
    },
    {
      title: 'Steadfast Courier Delivery Charges & Return Fees (Oct)',
      category: 'COURIER_CHARGES',
      amount: 18600,
      accountId: courierAccount.id,
      vendor: 'Steadfast Courier Ltd',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: 'Settled against courier COD balance deductions',
    },
    {
      title: 'Flagship Atelier Rent (Gulshan Avenue, Dhaka)',
      category: 'OFFICE_RENT',
      amount: 120000,
      accountId: bankAccount.id,
      vendor: 'Navana Real Estate Ltd',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: 'Monthly showroom rent for VIP salon & private tasting room',
    },
    {
      title: 'Master Perfumer & Concierge Staff Payroll',
      category: 'SALARY',
      amount: 160000,
      accountId: bankAccount.id,
      vendor: 'Rāwdah Payroll Fund',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      notes: 'Staff salaries for 4 full-time atelier ambassadors',
    },
  ];

  for (const exp of expensesData) {
    const expense = await prisma.expense.create({
      data: {
        ...exp,
        recordedBy: owner.name,
      },
    });

    // Record in financial ledger
    await prisma.financeLedger.create({
      data: {
        accountId: exp.accountId,
        type: 'EXPENSE_OUTFLOW',
        amount: exp.amount,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        category: exp.category,
        notes: exp.title,
        createdBy: owner.name,
        createdAt: exp.date,
      },
    });
  }

  // 7. Seed Customers & Realistic Orders for Dashboard Reporting
  console.log('Seeding customer profiles and realistic order history...');
  const customersData = [
    {
      name: 'Tanvir Ahmed Chowdhury',
      email: 'tanvir.chowdhury@example.com',
      phone: '01711223344',
      address: 'House 14, Road 71, Gulshan-2',
      city: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1212',
    },
    {
      name: 'Sabrina Rahman',
      email: 'sabrina.rahman@example.com',
      phone: '01819334455',
      address: 'Apt 5B, Concord Tower, Banani',
      city: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1213',
    },
    {
      name: 'Zubair Hossain',
      email: 'zubair.hossain@example.com',
      phone: '01911445566',
      address: 'GEC Circle, Nasirabad',
      city: 'Chittagong',
      division: 'Chittagong',
      postalCode: '4000',
    },
    {
      name: 'Farhana Akhter',
      email: 'farhana.akhter@example.com',
      phone: '01722556677',
      address: 'Shahjalal Upashahar, Block D',
      city: 'Sylhet',
      division: 'Sylhet',
      postalCode: '3100',
    },
    {
      name: 'Iftekhar Alam',
      email: 'iftekhar.alam@example.com',
      phone: '01611667788',
      address: 'Dhanmondi 27, House 42',
      city: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1209',
    },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers.push(cust);
  }

  // Fetch created variants to assign in orders
  const allVariants = await prisma.productVariant.findMany({ include: { product: true } });

  // Generate 8 diverse orders across timeline:
  // 1. Delivered + Paid via bKash
  // 2. Delivered + Paid via COD (settled)
  // 3. Shipped + Pending COD
  // 4. Packed + Confirmed
  // 5. Confirmed + bKash Paid
  // 6. Pending New Order (Guest)
  // 7. Cancelled Order
  // 8. Return Requested / Returned

  const ordersSeed = [
    {
      orderNumber: 'RDH-10491',
      customer: createdCustomers[0],
      deliveryMethod: 'express_dhaka',
      fulfillmentStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'BKASH',
      paymentReference: 'BKH98214A7',
      courierProvider: 'STEADFAST',
      courierTrackingNumber: 'STEAD-901411',
      courierStatus: 'DELIVERED',
      variant: allVariants[0], // Oud Ambre 50ml
      quantity: 1,
      shippingFee: 0,
      daysAgo: 5,
    },
    {
      orderNumber: 'RDH-10492',
      customer: createdCustomers[1],
      deliveryMethod: 'inside_dhaka',
      fulfillmentStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'COD',
      courierProvider: 'STEADFAST',
      courierTrackingNumber: 'STEAD-901412',
      courierStatus: 'DELIVERED',
      courierCodCollected: 18500,
      courierDeductions: 185,
      courierRemittanceReceived: 18315,
      variant: allVariants[3], // Royal Saffron 100ml
      quantity: 1,
      shippingFee: 0,
      daysAgo: 4,
    },
    {
      orderNumber: 'RDH-10493',
      customer: createdCustomers[2],
      deliveryMethod: 'outside_dhaka',
      fulfillmentStatus: 'SHIPPED',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      courierProvider: 'STEADFAST',
      courierTrackingNumber: 'STEAD-901413',
      courierStatus: 'IN_TRANSIT',
      variant: allVariants[4], // Bleu Oud 50ml
      quantity: 1,
      shippingFee: 120,
      daysAgo: 2,
    },
    {
      orderNumber: 'RDH-10494',
      customer: createdCustomers[3],
      deliveryMethod: 'inside_dhaka',
      fulfillmentStatus: 'PACKED',
      paymentStatus: 'PAID',
      paymentMethod: 'BKASH',
      paymentReference: 'BKH98288C2',
      courierProvider: 'STEADFAST',
      courierTrackingNumber: 'STEAD-901414',
      courierStatus: 'PENDING_PICKUP',
      variant: allVariants[6], // Rose Imperiale 50ml
      quantity: 1,
      shippingFee: 0,
      daysAgo: 1,
    },
    {
      orderNumber: 'RDH-10495',
      customer: createdCustomers[4],
      deliveryMethod: 'inside_dhaka',
      fulfillmentStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'BKASH',
      paymentReference: 'BKH99011X9',
      variant: allVariants[1], // Oud Ambre 100ml
      quantity: 1,
      shippingFee: 0,
      daysAgo: 0,
    },
    {
      orderNumber: 'RDH-10496',
      customer: createdCustomers[0],
      deliveryMethod: 'inside_dhaka',
      fulfillmentStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      variant: allVariants[12], // Tobacco Noir 50ml
      quantity: 1,
      shippingFee: 60,
      daysAgo: 0,
    },
    {
      orderNumber: 'RDH-10497',
      customer: createdCustomers[1],
      deliveryMethod: 'inside_dhaka',
      fulfillmentStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      paymentMethod: 'BKASH',
      paymentReference: 'BKH97120R1',
      cancelReason: 'Customer requested change of bottle size before dispatch',
      variant: allVariants[7], // Rose Imperiale 100ml
      quantity: 1,
      shippingFee: 0,
      daysAgo: 6,
    },
    {
      orderNumber: 'RDH-10498',
      customer: createdCustomers[2],
      deliveryMethod: 'outside_dhaka',
      fulfillmentStatus: 'RETURNED',
      paymentStatus: 'REFUNDED',
      paymentMethod: 'COD',
      courierProvider: 'STEADFAST',
      courierTrackingNumber: 'STEAD-901418',
      returnReason: 'Customer unreachable at delivery address in Chittagong',
      variant: allVariants[9], // Musk Kashmir 50ml
      quantity: 1,
      shippingFee: 120,
      daysAgo: 7,
    },
  ];

  for (const o of ordersSeed) {
    const itemTotal = o.variant.sellingPrice * o.quantity;
    const finalTotal = itemTotal + o.shippingFee;
    const orderDate = new Date(Date.now() - o.daysAgo * 24 * 60 * 60 * 1000);

    const order = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerId: o.customer.id,
        customerName: o.customer.name,
        customerEmail: o.customer.email,
        customerPhone: o.customer.phone,
        shippingAddress: JSON.stringify({
          address: o.customer.address,
          city: o.customer.city,
          division: o.customer.division,
          postalCode: o.customer.postalCode,
        }),
        deliveryMethod: o.deliveryMethod,
        subtotal: itemTotal,
        discount: 0,
        shippingFee: o.shippingFee,
        total: finalTotal,
        fulfillmentStatus: o.fulfillmentStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        paymentReference: o.paymentReference || null,
        courierProvider: o.courierProvider || null,
        courierTrackingNumber: o.courierTrackingNumber || null,
        courierStatus: o.courierStatus || null,
        courierCodCollected: o.courierCodCollected || 0,
        courierDeductions: o.courierDeductions || 0,
        courierRemittanceReceived: o.courierRemittanceReceived || 0,
        cancelReason: o.cancelReason || null,
        returnReason: o.returnReason || null,
        itemsSnapshot: JSON.stringify([
          {
            productId: o.variant.product.id,
            productName: o.variant.product.name,
            variantId: o.variant.id,
            variantSku: o.variant.sku,
            size: o.variant.size,
            unitPrice: o.variant.sellingPrice,
            purchaseCost: o.variant.purchaseCost,
            quantity: o.quantity,
            totalPrice: itemTotal,
          },
        ]),
        createdAt: orderDate,
        updatedAt: orderDate,
        confirmedAt: o.fulfillmentStatus !== 'PENDING' ? orderDate : null,
        deliveredAt: o.fulfillmentStatus === 'DELIVERED' ? orderDate : null,
      },
    });

    // Create Order Item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: o.variant.product.id,
        variantId: o.variant.id,
        productName: o.variant.product.name,
        variantSku: o.variant.sku,
        size: o.variant.size,
        unitPrice: o.variant.sellingPrice,
        purchaseCost: o.variant.purchaseCost,
        quantity: o.quantity,
        totalPrice: itemTotal,
      },
    });

    // Create Payment Transaction
    if (o.paymentStatus === 'PAID') {
      const targetAccount = o.paymentMethod === 'BKASH' ? bkashAccount : courierAccount;
      const paymentTrx = await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          amount: finalTotal,
          method: o.paymentMethod,
          trxId: o.paymentReference || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'SUCCESS',
          createdAt: orderDate,
        },
      });

      // Financial ledger entry
      await prisma.financeLedger.create({
        data: {
          accountId: targetAccount.id,
          type: 'SALE_INFLOW',
          amount: finalTotal,
          referenceType: 'ORDER',
          referenceId: order.id,
          category: 'PERFUME_SALES',
          notes: `Delivered order ${order.orderNumber} payment received`,
          createdBy: 'System Automation',
          createdAt: orderDate,
        },
      });
    }

    // Update customer stats
    if (o.fulfillmentStatus === 'DELIVERED') {
      await prisma.customer.update({
        where: { id: o.customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: finalTotal },
          lastOrderAt: orderDate,
        },
      });
    }
  }

  // 8. Website Content Sections
  console.log('Seeding dynamic website content sections...');
  const sectionsData = [
    {
      sectionKey: 'announcement',
      type: 'ANNOUNCEMENT',
      title: 'Top Announcement Bar',
      contentJson: JSON.stringify({
        text: 'Complimentary 2ml extrait sample & free express delivery on orders over ৳5,000',
        linkText: 'Discover Collection',
        linkUrl: '/shop',
      }),
      sortOrder: 1,
      animationPreset: 'LUXURY_EASE',
    },
    {
      sectionKey: 'hero',
      type: 'HERO',
      title: 'Desert Hero Section',
      subtitle: 'SCENT THAT LINGERS',
      contentJson: JSON.stringify({
        heading: 'A Signature Scent, Crafted with Soul',
        description: 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
        ctaText: 'Discover Fragrance',
        ctaLink: '/shop',
        badgeText: 'Long Lasting',
        bgImage: '/images/hero/hero-bg.jpg',
      }),
      sortOrder: 2,
      animationPreset: 'SCALE_SETTLE',
    },
    {
      sectionKey: 'editorial',
      type: 'EDITORIAL',
      title: 'Luxury, No Compromise.',
      subtitle: 'MAISON RĀWDAH',
      contentJson: JSON.stringify({
        headingLine1: 'Luxury,',
        headingLine2: 'No Compromise.',
        body: 'Every droplet is formulated at a sovereign 30% pure fragrance oil density, macerated for half a year in French oak casks before being poured into diamond-cut crystal.',
        amberTitle: 'Warm Golden Amber',
        amberDesc: 'Sun-warmed fossil resins providing exceptional sillage that endures through day and night.',
        saffronTitle: 'Kashmiri Dawn Saffron',
        saffronDesc: 'Hand-picked stamens delivering deep spicy warmth, revered by perfumers since ancient antiquity.',
      }),
      sortOrder: 3,
      animationPreset: 'EDITORIAL_REVEAL',
    },
    {
      sectionKey: 'best_sellers',
      type: 'BEST_SELLERS',
      title: 'BEST SELLING PRODUCT.',
      subtitle: 'MASTERPIECES',
      contentJson: JSON.stringify({
        heading: 'BEST SELLING PRODUCT.',
        viewAllText: 'View All',
        viewAllLink: '/shop?filter=best-seller',
      }),
      sortOrder: 4,
      animationPreset: 'LUXURY_EASE',
    },
    {
      sectionKey: 'collection_banner',
      type: 'COLLECTION_BANNER',
      title: 'The Oud Royale Collection',
      subtitle: 'THE ROYAL OUD COLLECTION',
      contentJson: JSON.stringify({
        heading: 'The Oud Royale Collection',
        description: 'Matured for 15 years in aged agarwood casks. An intoxicating symphony of wild Assam oud, spiced amber, and velvety Taif rose.',
        ctaText: 'Explore Oud',
        ctaLink: '/shop?category=Men',
        bgImage: '/images/banners/banner-collection.jpg',
      }),
      sortOrder: 5,
      animationPreset: 'SCALE_SETTLE',
    },
    {
      sectionKey: 'daily_deal',
      type: 'DAILY_DEAL',
      title: 'Deal of the Day',
      subtitle: 'LIMITED RESERVATION',
      contentJson: JSON.stringify({
        title: 'Deal of the Day',
        badge: 'Deal of the Day',
      }),
      sortOrder: 6,
      animationPreset: 'LUXURY_EASE',
    },
    {
      sectionKey: 'gift_sets_banner',
      type: 'GIFT_SETS_BANNER',
      title: 'Bespoke Coffrets & Discovery Ensembles',
      subtitle: 'THE ART OF GIVING',
      contentJson: JSON.stringify({
        heading: 'Bespoke Coffrets & Discovery Ensembles',
        description: 'Encased in signature black lacquered wood with gold filigree accents. Each gift set arrives with personalized calligraphy and hand-tied silk ribbon.',
        ctaText: 'Explore Gift Sets',
        ctaLink: '/shop?category=Gift+Sets',
        bgImage: '/images/products/banner-gift-sets.jpg',
      }),
      sortOrder: 7,
      animationPreset: 'SCALE_SETTLE',
    },
    {
      sectionKey: 'reviews',
      type: 'REVIEWS',
      title: 'Read reviews, wear with sovereign confidence.',
      subtitle: 'TESTIMONIALS',
      contentJson: JSON.stringify({
        heading: 'Read reviews, wear with sovereign confidence.',
        rating: '4.95',
        ratingCount: '1,280+ Reviews from Verified Collectors',
      }),
      sortOrder: 8,
      animationPreset: 'LUXURY_EASE',
    },
    {
      sectionKey: 'faq',
      type: 'FAQ',
      title: 'Frequently asked questions',
      subtitle: 'FAQS',
      contentJson: JSON.stringify({
        heading: 'Frequently asked questions',
        description: 'Key information regarding performance, our 2ml sample policy, and nationwide delivery.',
      }),
      sortOrder: 9,
      animationPreset: 'LUXURY_EASE',
    },
  ];

  for (const s of sectionsData) {
    await prisma.websiteSection.upsert({
      where: { sectionKey: s.sectionKey },
      update: s,
      create: s,
    });
  }

  // 9. Initial Analytics Events
  console.log('Seeding initial visitor traffic and conversion events...');
  const eventTypes = [
    { type: 'PAGE_VIEW', count: 1420 },
    { type: 'SESSION_START', count: 480 },
    { type: 'PRODUCT_VIEW', count: 720 },
    { type: 'ADD_TO_CART', count: 184 },
    { type: 'CHECKOUT_START', count: 96 },
    { type: 'ORDER_PLACED', count: 28 },
    { type: 'PAYMENT_CONFIRMED', count: 24 },
  ];

  for (const et of eventTypes) {
    for (let i = 0; i < Math.min(et.count, 20); i++) {
      await prisma.analyticsEvent.create({
        data: {
          eventType: et.type,
          sessionId: `sess-${Math.random().toString(36).substring(2, 10)}`,
          anonymousId: `anon-${Math.random().toString(36).substring(2, 10)}`,
          path: et.type === 'PRODUCT_VIEW' ? '/product/oud-ambre' : et.type === 'CHECKOUT_START' ? '/checkout' : '/',
          device: i % 3 === 0 ? 'mobile' : i % 3 === 1 ? 'desktop' : 'tablet',
          utmSource: i % 2 === 0 ? 'instagram' : 'google',
          utmMedium: i % 2 === 0 ? 'cpc' : 'organic',
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

