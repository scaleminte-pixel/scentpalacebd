/**
 * Milestone 3 Tier 5 Adversarial Stress Testing:
 * Storefront Filtering Boundaries & Order Tracking Edge Cases
 *
 * Requirements:
 * 1. Shop Catalog Price Slider & Boundary Stress Testing
 *    - Min boundary: ৳1,500 (0 products or <= ৳1,500)
 *    - Low perfume range: ৳2,200 (perfumes <= ৳2,200)
 *    - Mid range: ৳6,000 (standard luxury perfumes)
 *    - Upper luxury boundaries: ৳6,500 (must include Swiss Rose 01 & Afnan 9PM Nightout @ ৳6,400)
 *    - Top ceiling: ৳7,500 & ৳8,000 (must include Afnan Supremacy CE @ ৳7,200)
 *    - Verify all 43 perfumes in SQLite catalogued without stranding
 * 2. Order Tracking Edge Cases & Attack Resilience
 *    - SQLi, path traversal, non-existent queries -> clean 404, no 500 crashes
 *    - Real order query -> authentic details, items, courier, timeline, no synthetic mocks
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005';

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const req = http.request(
      fullUrl,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (_) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: data,
            json,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// Emulate ShopCatalogContent.tsx filtering logic
function filterCatalog(products, { category = 'all', scent = 'all', size = 'all', priceRange = 8000, searchQuery = '', sortBy = 'featured' }) {
  return products
    .filter((product) => {
      // Category filter
      if (category !== 'all') {
        const prodCat = (product.category || '').toLowerCase().trim();
        const selCat = category.toLowerCase().trim();
        if (prodCat !== selCat) return false;
      }

      // Scent family filter
      if (scent !== 'all' && product.scentFamily !== scent) {
        return false;
      }

      // Size filter
      if (size !== 'all') {
        const hasSize = (product.variants || []).some((v) =>
          (v.size || '').toLowerCase().includes(size.toLowerCase())
        );
        if (!hasSize) return false;
      }

      // Price filter (based on minProductPrice)
      const variantPrices = (product.variants || []).map((v) => v.price !== undefined ? v.price : v.sellingPrice);
      const minProductPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      if (minProductPrice > priceRange) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const topNotes = product.notes?.top || [];
        const heartNotes = product.notes?.heart || [];
        const baseNotes = product.notes?.base || [];
        const matches =
          (product.name || '').toLowerCase().includes(q) ||
          (product.tagline || '').toLowerCase().includes(q) ||
          (product.scentFamily || '').toLowerCase().includes(q) ||
          topNotes.some((n) => n.toLowerCase().includes(q)) ||
          heartNotes.some((n) => n.toLowerCase().includes(q)) ||
          baseNotes.some((n) => n.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const getMin = (p) => {
        const vp = (p.variants || []).map((v) => v.price !== undefined ? v.price : v.sellingPrice);
        return vp.length > 0 ? Math.min(...vp) : 0;
      };
      const priceA = getMin(a);
      const priceB = getMin(b);
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'best-seller') return ((b.rating || 0) * (b.reviewsCount || 0)) - ((a.rating || 0) * (a.reviewsCount || 0));
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
}

async function runAdversarialTests() {
  console.log('='.repeat(80));
  console.log('  MILESTONE 3: ADVERSARIAL STRESS TEST & BOUNDARY HARDENING HARNESS');
  console.log(`  Target: ${BASE_URL}`);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${details ? `-> ${details}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: Catalog & Price Slider Boundary Stress Testing
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 1: Catalog & Price Slider Boundary Stress Testing ---');

  // 1.1 Fetch all catalog products
  const productsRes = await fetchUrl('/api/products');
  assert(productsRes.status === 200, 'API /api/products returns HTTP 200');
  assert(productsRes.json && productsRes.json.success === true, 'API /api/products response is success: true');
  
  const allProducts = productsRes.json?.products || [];
  assert(allProducts.length === 43, `All 43 perfumes in SQLite catalogued (Found: ${allProducts.length})`);

  // Analyze pricing distributions
  const productPriceStats = allProducts.map((p) => {
    const prices = (p.variants || []).map((v) => v.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    return { name: p.name, slug: p.slug, minP, maxP };
  });

  const absoluteMinPrice = Math.min(...productPriceStats.map((p) => p.minP));
  const absoluteMaxPrice = Math.max(...productPriceStats.map((p) => p.minP));
  console.log(`  Catalog Price Span: Lowest minPrice = ৳${absoluteMinPrice}, Highest minPrice = ৳${absoluteMaxPrice}`);

  // Test Boundary 1: Min boundary ৳1,500
  // Expect 0 products returned or only products <= ৳1,500
  const filtered1500 = filterCatalog(allProducts, { priceRange: 1500 });
  assert(
    filtered1500.length === 0,
    `Min boundary ৳1,500 returns 0 products (lowest perfume is ৳${absoluteMinPrice})`,
    `Found ${filtered1500.length} products`
  );
  const api1500 = await fetchUrl('/api/products?maxPrice=1500');
  assert(
    api1500.json?.products?.length === 0,
    'API /api/products?maxPrice=1500 returns 0 products'
  );

  // Test Boundary 2: Low perfume range ৳2,200
  // Expect perfumes <= ৳2,200
  const filtered2200 = filterCatalog(allProducts, { priceRange: 2200 });
  const allUnder2200 = filtered2200.every((p) => Math.min(...p.variants.map((v) => v.price)) <= 2200);
  assert(
    filtered2200.length > 0 && allUnder2200,
    `Low perfume range ৳2,200 returns ${filtered2200.length} perfumes (all <= ৳2,200)`,
    `Matches: ${filtered2200.map((p) => p.name).join(', ')}`
  );
  const api2200 = await fetchUrl('/api/products?maxPrice=2200');
  assert(
    api2200.json?.products?.length === filtered2200.length,
    `API /api/products?maxPrice=2200 matches component filtering count (${api2200.json?.products?.length} items)`
  );

  // Test Boundary 3: Mid range ৳6,000
  // Expect standard luxury perfumes, but excluding perfumes > ৳6,000
  const filtered6000 = filterCatalog(allProducts, { priceRange: 6000 });
  const allUnder6000 = filtered6000.every((p) => Math.min(...p.variants.map((v) => v.price)) <= 6000);
  const excludedBy6000 = allProducts.filter((p) => Math.min(...p.variants.map((v) => v.price)) > 6000);
  assert(
    filtered6000.length === 40 && allUnder6000,
    `Mid range ৳6,000 returns 40 standard luxury perfumes (all <= ৳6,000)`,
    `Actual count: ${filtered6000.length}`
  );
  assert(
    excludedBy6000.length === 3,
    `Mid range ৳6,000 correctly excludes the 3 highest luxury perfumes (> ৳6,000)`,
    `Excluded: ${excludedBy6000.map((p) => `${p.name} (৳${Math.min(...p.variants.map((v) => v.price))})`).join(', ')}`
  );

  // Test Boundary 4: Upper luxury boundaries ৳6,500
  // Must include Swiss Rose 01 and Afnan 9PM Nightout at ৳6,400, but exclude Afnan Supremacy CE @ ৳7,200
  const filtered6500 = filterCatalog(allProducts, { priceRange: 6500 });
  const hasSwissRose = filtered6500.some((p) => p.name.includes('Swiss Rose 01'));
  const has9PM = filtered6500.some((p) => p.name.includes('Afnan 9PM Nightout'));
  const hasSupremacyAt6500 = filtered6500.some((p) => p.name.includes('Afnan Supremacy CE'));
  assert(
    hasSwissRose,
    'Upper luxury boundary ৳6,500 includes Swiss Rose 01 (৳6,400)'
  );
  assert(
    has9PM,
    'Upper luxury boundary ৳6,500 includes Afnan 9PM Nightout (৳6,400)'
  );
  assert(
    !hasSupremacyAt6500,
    'Upper luxury boundary ৳6,500 excludes Afnan Supremacy CE (৳7,200)'
  );
  assert(
    filtered6500.length === 42,
    `Upper luxury boundary ৳6,500 returns exactly 42 perfumes (Found: ${filtered6500.length})`
  );

  // Test Boundary 5: Top ceiling ৳7,500 & ৳8,000
  // Must include Afnan Supremacy CE at ৳7,200, and ৳8,000 includes all 43 perfumes
  const filtered7500 = filterCatalog(allProducts, { priceRange: 7500 });
  const hasSupremacyAt7500 = filtered7500.some((p) => p.name.includes('Afnan Supremacy CE'));
  assert(
    hasSupremacyAt7500,
    'Top ceiling range ৳7,500 includes Afnan Supremacy CE (৳7,200)'
  );
  assert(
    filtered7500.length === 43,
    `Top ceiling range ৳7,500 includes all 43 catalog perfumes`
  );

  const filtered8000 = filterCatalog(allProducts, { priceRange: 8000 });
  assert(
    filtered8000.length === 43,
    `Top ceiling ৳8,000 includes 100% of the 43 perfumes without any stranded product`
  );

  // Monotonic step stress-testing: test from 1500 to 8000 in steps of 500
  let previousCount = 0;
  let monotonicPassed = true;
  for (let price = 1500; price <= 8000; price += 500) {
    const count = filterCatalog(allProducts, { priceRange: price }).length;
    if (count < previousCount) {
      monotonicPassed = false;
      break;
    }
    previousCount = count;
  }
  assert(monotonicPassed, 'Price filter exhibits strictly monotonic non-decreasing behavior across [1500..8000]');

  // Verify /shop SSR HTML contains the hardened 8000 ceiling
  const shopHtmlRes = await fetchUrl('/shop');
  assert(shopHtmlRes.status === 200, 'GET /shop returns HTTP 200');
  assert(shopHtmlRes.text.includes('8000'), 'GET /shop HTML includes max="8000" slider bound');
  assert(shopHtmlRes.text.includes('1500'), 'GET /shop HTML includes min="1500" slider bound');
  assert(shopHtmlRes.text.includes('Swiss Rose 01'), 'GET /shop SSR HTML includes Swiss Rose 01');
  assert(shopHtmlRes.text.includes('Afnan Supremacy CE'), 'GET /shop SSR HTML includes Afnan Supremacy CE');

  // -------------------------------------------------------------------------
  // SECTION 2: Order Tracking Edge Cases & Attack Resilience
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Order Tracking Edge Cases & Attack Resilience ---');

  const attackVectors = [
    { name: 'Standard non-existent order number', path: '/api/orders/RDH-NONEXISTENT-999' },
    { name: 'SQL Injection: simple OR bypass', path: '/api/orders/%27%20OR%20%271%27=%271' },
    { name: 'SQL Injection: comment bypass', path: '/api/orders/admin%27--' },
    { name: 'SQL Injection: union select', path: '/api/orders/1%27%20UNION%20SELECT%201,2,3--' },
    { name: 'SQL Injection: stacked statement', path: '/api/orders/%27;%20DROP%20TABLE%20Order;--' },
    { name: 'Path traversal: ../../etc', path: '/api/orders/..%2F..%2Fetc' },
    { name: 'Path traversal: /etc/passwd attempt', path: '/api/orders/..%2F..%2F..%2F..%2Fetc%2Fpasswd' },
    { name: 'XSS script tags', path: '/api/orders/%3Cscript%3Ealert(1)%3C%2Fscript%3E' },
    { name: 'Whitespace payload', path: '/api/orders/%20' },
    { name: 'Literal string "null"', path: '/api/orders/null' },
    { name: 'Literal string "undefined"', path: '/api/orders/undefined' },
    { name: 'Non-existent CUID format', path: '/api/orders/cmw9999999999999999999999' },
  ];

  for (const vector of attackVectors) {
    const res = await fetchUrl(vector.path);
    const isClean404 = res.status === 404 && res.json?.success === false && res.json?.error === 'Order not found';
    assert(
      isClean404,
      `Attack Vector [${vector.name}]: Clean HTTP 404 with { error: 'Order not found' }`,
      `Status: ${res.status}, body: ${res.text.slice(0, 100)}`
    );
  }

  // 2.2 Real Order Verification: Querying authentic orders from database
  console.log('\n--- SECTION 3: Authentic Real Order Verification ---');

  // Test 3.1: Historical Seed Order (RDH-10491 / cmw39a0rw0040o0pktyl671p6)
  const seedOrderRes = await fetchUrl('/api/orders/RDH-10491');
  assert(seedOrderRes.status === 200, 'Historical order RDH-10491 returns HTTP 200');
  const seedOrder = seedOrderRes.json?.order;
  assert(seedOrder?.orderNumber === 'RDH-10491', 'Historical order orderNumber matches (RDH-10491)');
  assert(seedOrder?.id === 'cmw39a0rw0040o0pktyl671p6', 'Historical order CUID matches (cmw39a0rw0040o0pktyl671p6)');
  assert(seedOrder?.courierProvider === 'STEADFAST', `Historical order courier is authentic (${seedOrder?.courierProvider})`);
  assert(seedOrder?.courierTrackingNumber === 'STEAD-901411', `Historical order tracking number is authentic (${seedOrder?.courierTrackingNumber})`);
  assert(seedOrder?.fulfillmentStatus === 'DELIVERED', `Historical order status is authentic (${seedOrder?.fulfillmentStatus})`);
  assert(seedOrder?.paymentStatus === 'PAID', `Historical order payment status is authentic (${seedOrder?.paymentStatus})`);
  assert(seedOrder?.customerName === 'Tanvir Ahmed Chowdhury', `Historical order customer is authentic (${seedOrder?.customerName})`);
  assert(seedOrder?.total === 12500, `Historical order total matches (৳${seedOrder?.total})`);
  const seedItemsSnapshot = JSON.parse(seedOrder?.itemsSnapshot || '[]');
  assert(seedItemsSnapshot.length > 0, `Historical order contains authentic itemsSnapshot (${seedItemsSnapshot.length} item(s): ${seedItemsSnapshot[0]?.productName})`);

  // Verify lookup by CUID returns identical order
  const seedOrderByCuidRes = await fetchUrl('/api/orders/cmw39a0rw0040o0pktyl671p6');
  assert(seedOrderByCuidRes.status === 200 && seedOrderByCuidRes.json?.order?.orderNumber === 'RDH-10491', 'Historical order accessible by CUID (cmw39a0rw0040o0pktyl671p6)');

  // Test 3.2: Storefront Placed Order with relational OrderItem records
  console.log('  Testing live storefront order with relational OrderItem records...');
  // Find in-stock variant to place authentic test order
  const inStockVariant = allProducts.flatMap(p => p.variants || []).find(v => (v.stock || 0) > 0);
  let liveOrderNumber = 'RDH-57080';
  let liveOrderRes = await fetchUrl(`/api/orders/${liveOrderNumber}`);

  if (liveOrderRes.status !== 200 || !liveOrderRes.json?.order?.items?.length) {
    // Place a fresh test order
    const placePayload = {
      name: 'Empirical Challenger Patron',
      phone: '01711223344',
      email: 'challenger_m3@rawdahperfumes.com',
      address: 'House 5, Road 11, Dhanmondi',
      city: 'Dhaka',
      deliveryMethod: 'inside_dhaka',
      paymentMethod: 'cod',
      items: [
        {
          variantId: inStockVariant?.id,
          quantity: 1,
        },
      ],
    };
    const placeRes = await fetchUrl('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placePayload),
    });
    assert(placeRes.status === 200, 'Created live test order via POST /api/orders');
    liveOrderNumber = placeRes.json?.orderNumber;
    liveOrderRes = await fetchUrl(`/api/orders/${liveOrderNumber}`);
  }

  assert(liveOrderRes.status === 200, `Live order ${liveOrderNumber} returns HTTP 200`);
  const liveOrder = liveOrderRes.json?.order;
  assert(liveOrder?.orderNumber === liveOrderNumber, `Live order orderNumber matches (${liveOrder?.orderNumber})`);
  assert(Array.isArray(liveOrder?.items) && liveOrder.items.length > 0, `Live order contains authentic relational items (${liveOrder?.items?.length} items)`);
  assert(liveOrder?.items[0]?.productName, `Live order item has authentic productName (${liveOrder?.items[0]?.productName})`);
  assert(liveOrder?.items[0]?.productImage, `Live order item has authentic productImage (${liveOrder?.items[0]?.productImage})`);
  assert(liveOrder?.items[0]?.unitPrice > 0, `Live order item has authentic unitPrice (৳${liveOrder?.items[0]?.unitPrice})`);
  assert(liveOrder?.items[0]?.variantSku, `Live order item has authentic variantSku (${liveOrder?.items[0]?.variantSku})`);
  assert(liveOrder?.total > 0, `Live order has authentic total amount (৳${liveOrder?.total})`);
  assert(!liveOrder?.isMock && !liveOrder?.synthetic, 'Live order is authentic without synthetic mock flags');

  // Verify lookup by CUID
  const liveOrderByCuidRes = await fetchUrl(`/api/orders/${liveOrder.id}`);
  assert(liveOrderByCuidRes.status === 200 && liveOrderByCuidRes.json?.order?.orderNumber === liveOrderNumber, `Live order accessible by both CUID and orderNumber`);

  // 2.3 Storefront /track-order page sanity
  const trackOrderPageRes = await fetchUrl('/track-order');
  assert(trackOrderPageRes.status === 200, 'GET /track-order returns HTTP 200');
  assert(trackOrderPageRes.text.includes('Track Your Royal Parcel'), 'Track order page renders authentic branding');
  assert(trackOrderPageRes.text.includes('Order ID Number'), 'Track order page has input field for Order ID');

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`  ADVERSARIAL STRESS TEST SUMMARY`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialTests().catch((err) => {
  console.error('Fatal execution error in test harness:', err);
  process.exit(1);
});
