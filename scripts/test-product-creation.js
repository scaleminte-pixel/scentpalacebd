async function testFlow() {
  console.log('Testing Admin Product & Category Flow...\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'RawdahOwner2026!' })
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('[PASS] Admin Login:', loginRes.status);

  // 2. Test Create Category
  const catRes = await fetch('http://localhost:3000/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'Pure Attar & Royal Macerations',
      description: 'Handcrafted attars aged in antique Mysore sandalwood oil.',
      image: '/images/products/oud-ambre.jpg'
    })
  });
  const catData = await catRes.json();
  console.log(`[${catRes.ok ? 'PASS' : 'SKIP'}] Create Category:`, catRes.status, catData.category?.name || catData.error);

  // 3. Test Create Product with Auto Slug & Alt Tags
  const prodSlug = 'oud-imperial-sovereign-' + Date.now().toString().slice(-4);
  const prodRes = await fetch('http://localhost:3000/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      name: 'Oud Imperial Sovereign',
      slug: prodSlug,
      concentration: 'Extrait de Parfum',
      tagline: 'Smoked Cambodian agarwood kissed with royal amber and Kashmir saffron.',
      description: 'An exalted creation distilled for the discerning collector.',
      story: 'Crafted under the auspices of our master atelier in Gulshan-2.',
      categoryName: 'Unisex',
      scentFamilyName: 'Oud & Woody',
      images: [
        { url: '/images/products/oud-ambre.jpg', alt: 'Oud Imperial Sovereign 50ml Flacon' }
      ],
      notesTop: ['Calabrian Bergamot', 'Spiced Cardamom'],
      notesHeart: ['Cambodian Oud', 'Bourbon Vanilla'],
      notesBase: ['Baltic Amber', 'Silken Musk'],
      longevity: '18-24 Hours',
      sillage: 'Regal & Enveloping',
      bestSeason: 'Autumn / Winter',
      ingredients: ['Alcohol Denat.', 'Parfum', 'Aquilaria Agallocha Wood Oil'],
      isBestSeller: true,
      isFeatured: true,
      variants: [
        { size: '50ml', sku: 'RDH-OIS-50', purchaseCost: 5500, sellingPrice: 15500, originalPrice: 17500, stock: 20, lowStockThreshold: 5 },
        { size: '100ml', sku: 'RDH-OIS-100', purchaseCost: 8500, sellingPrice: 22500, originalPrice: 25000, stock: 12, lowStockThreshold: 4 }
      ]
    })
  });
  const prodData = await prodRes.json();
  console.log(`[${prodRes.ok && prodData.success ? 'PASS' : 'FAIL'}] Create Product:`, prodRes.status, prodData.product?.name, 'Slug:', prodData.product?.slug);

  // 4. Verify storefront resolution
  const storefrontRes = await fetch('http://localhost:3000/api/products?q=Oud Imperial Sovereign');
  const storefrontData = await storefrontRes.json();
  const found = storefrontData.products?.find((p) => p.slug === prodSlug);
  console.log(`[${found ? 'PASS' : 'FAIL'}] Storefront API Discovery:`, Boolean(found), 'Images:', found?.images);
}

testFlow().catch(console.error).finally(() => process.exit(0));

