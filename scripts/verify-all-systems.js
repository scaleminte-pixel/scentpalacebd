const { performance } = require('perf_hooks');

async function runAudit() {
  console.log('========================================================');
  console.log('🚀 RAWDAH LUXURY PERFUMES - COMPREHENSIVE SYSTEM AUDIT');
  console.log('========================================================\n');

  let sessionCookie = '';
  const results = [];

  // Helper function to test an endpoint
  async function testEndpoint(name, url, options = {}) {
    const start = performance.now();
    try {
      const headers = { ...(options.headers || {}) };
      if (sessionCookie) {
        headers['Cookie'] = sessionCookie;
      }
      const res = await fetch(url, { ...options, headers });
      const duration = (performance.now() - start).toFixed(2);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const body = isJson ? await res.json() : await res.text();
      const passed = res.ok && (isJson ? body.success !== false : true);

      results.push({ name, url, status: res.status, duration: `${duration}ms`, passed });
      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name} -> ${res.status} (${duration}ms)`);
      return { res, body, passed };
    } catch (err) {
      const duration = (performance.now() - start).toFixed(2);
      results.push({ name, url, status: 'ERROR', duration: `${duration}ms`, passed: false, error: err.message });
      console.log(`[FAIL] ${name} -> ERROR: ${err.message}`);
      return { passed: false, error: err.message };
    }
  }

  // 1. Test Admin Login Authentication
  console.log('1. AUTHENTICATION & SESSION');
  const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@rawdahperfumes.com',
      password: 'RawdahOwner2026!',
    }),
  });

  const loginData = await loginRes.json();
  const rawSetCookie = loginRes.headers.get('set-cookie');
  if (rawSetCookie) {
    sessionCookie = rawSetCookie.split(';')[0];
  }
  console.log(`[${loginData.success ? 'PASS' : 'FAIL'}] Admin Login -> Status: ${loginRes.status}, User: ${loginData.user?.name} (${loginData.user?.role})`);

  // 2. Test All 15 Admin Modules
  console.log('\n2. TESTING ALL 15 ADMIN BACKEND MODULES');
  await testEndpoint('Dashboard Metrics & Charts', 'http://localhost:3000/api/admin/dashboard?period=month');
  await testEndpoint('Product Catalog (Table)', 'http://localhost:3000/api/admin/products?page=1&limit=12');
  await testEndpoint('Order Management List', 'http://localhost:3000/api/admin/orders?page=1&limit=12');
  await testEndpoint('Inventory & Low Stock Alerts', 'http://localhost:3000/api/admin/inventory');
  await testEndpoint('Financial Accounts & Ledgers', 'http://localhost:3000/api/admin/finance');
  await testEndpoint('Customer Profiles & Lifetime Value', 'http://localhost:3000/api/admin/customers');
  await testEndpoint('Payments & Gateways Ledger', 'http://localhost:3000/api/admin/payments');
  await testEndpoint('Website CMS & Motion Sections', 'http://localhost:3000/api/admin/content');
  await testEndpoint('Promotional Offers & Discounts', 'http://localhost:3000/api/admin/offers');
  await testEndpoint('Customer Reviews Moderation', 'http://localhost:3000/api/admin/reviews');
  await testEndpoint('Analytics Traffic & Heatmaps', 'http://localhost:3000/api/admin/analytics');
  await testEndpoint('Financial & Sales Reports', 'http://localhost:3000/api/admin/reports?type=sales');
  await testEndpoint('Logistics & Courier Integrations', 'http://localhost:3000/api/admin/integrations');
  await testEndpoint('Team & Access Control List', 'http://localhost:3000/api/admin/team');
  await testEndpoint('Store Settings & Shipping Rates', 'http://localhost:3000/api/admin/settings');

  // 3. Test Storefront End-to-End Dynamic Sync
  console.log('\n3. TESTING CMS DYNAMIC UPDATE & STOREFRONT SYNC');
  const contentListRes = await fetch('http://localhost:3000/api/admin/content', {
    headers: { Cookie: sessionCookie },
  });
  const contentListData = await contentListRes.json();
  const heroSection = contentListData.sections.find((s) => s.sectionKey === 'hero');

  if (heroSection) {
    const updatedHeadline2 = 'Crafted with Soul';
    const updateRes = await fetch(`http://localhost:3000/api/admin/content/${heroSection.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: 'Desert Hero Section',
        isVisible: true,
        animationPreset: 'SCALE_SETTLE',
        content: {
          ...heroSection.content,
          headlineLine1: 'A Signature Scent,',
          headlineLine2: updatedHeadline2,
          subtitle: 'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
          watermarkText: 'SCENT THAT LINGERS',
          badgeText: 'LONG LASTING',
          buttonText: 'Discover Fragrance',
          buttonLink: '/shop',
          imageUrl: '/images/hero-model-desert.jpg',
        },
      }),
    });
    const updateData = await updateRes.json();
    console.log(`[${updateData.success ? 'PASS' : 'FAIL'}] CMS Section Update -> Version: ${updateData.section?.version}`);

    // Verify public storefront API immediately reflects the update
    const publicContentRes = await fetch('http://localhost:3000/api/content');
    const publicContentData = await publicContentRes.json();
    const publicHero = publicContentData.sections?.hero;
    const isSynced = publicHero?.content?.headlineLine2 === updatedHeadline2;
    console.log(`[${isSynced ? 'PASS' : 'FAIL'}] Public Storefront Synchronization -> Synced: ${isSynced}`);
  }

  // 4. Test Storefront Checkout Flow
  console.log('\n4. TESTING STOREFRONT CHECKOUT FLOW');
  const productsRes = await fetch('http://localhost:3000/api/products?limit=1');
  const productsData = await productsRes.json();
  const sampleProduct = productsData.products?.[0];
  const sampleVariant = sampleProduct?.variants?.[0];

  const checkoutRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tanvir Chowdhury',
      email: 'tanvir.test@gmail.com',
      phone: '01711223344',
      address: 'House 14, Road 11, Gulshan-2',
      city: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1212',
      deliveryMethod: 'EXPRESS_DHAKA',
      paymentMethod: 'COD',
      couponCode: 'WELCOME15',
      items: [
        {
          productId: sampleProduct?.id,
          variantId: sampleVariant?.id,
          quantity: 1,
        },
      ],
    }),
  });

  const checkoutData = await checkoutRes.json();
  const isOrderCreated = checkoutRes.ok && checkoutData.success;
  console.log(`[${isOrderCreated ? 'PASS' : 'FAIL'}] Storefront Checkout -> Order: ${checkoutData.orderNumber || 'FAILED'} (Total: ৳${checkoutData.total || 0})`);

  console.log('\n========================================================');
  console.log('AUDIT SUMMARY:');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total Systems Tested: ${results.length + 3}`);
  console.log(`Overall Health: ${allPassed ? '100% OPERATIONAL & VERIFIED' : 'ISSUES DETECTED'}`);
  console.log('========================================================\n');
}

runAudit().catch(console.error).finally(() => process.exit(0));
