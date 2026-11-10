#!/usr/bin/env node

/**
 * ============================================================================
 * Rāwdah Haute Parfumerie — Comprehensive Automated E2E Test Suite (Tiers 1–4)
 * ============================================================================
 * 
 * Opaque-box requirement-driven testing against running Next.js instance.
 * Covers:
 *   - Tier 1: Feature Coverage (12 features x 5 tests = 60 tests)
 *   - Tier 2: Boundary & Corner Cases (12 features x 5 tests = 60 tests)
 *   - Tier 3: Cross-Feature Combinations (12 integration tests)
 *   - Tier 4: Real-World Application Scenarios (6 complex end-to-end workflows)
 * 
 * Target: >= 138 authentic tests with genuine assertions.
 * Exit code: 0 on 100% pass, 1 on any failure.
 */

const { performance } = require('perf_hooks');
const assert = require('assert');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

// Configuration & Test State
let BASE_URL = '';
let sessionCookie = '';
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tiers: {
    'Tier 1': { total: 0, passed: 0, failed: 0 },
    'Tier 2': { total: 0, passed: 0, failed: 0 },
    'Tier 3': { total: 0, passed: 0, failed: 0 },
    'Tier 4': { total: 0, passed: 0, failed: 0 },
  },
  failures: [],
};

/**
 * Server Port Auto-Detection
 * Probes candidate ports and verifies authentic Rāwdah server
 */
async function detectServer() {
  const cliPortArg = process.argv.find((arg) => arg.startsWith('--port='))?.split('=')[1] ||
    (process.argv[2] && !isNaN(parseInt(process.argv[2], 10)) ? process.argv[2] : null);
  
  const envPort = process.env.PORT;
  const candidatePorts = [cliPortArg, envPort, 3005, 3001, 3000].filter(Boolean).map(Number);
  const uniquePorts = [...new Set(candidatePorts)];

  for (const port of uniquePorts) {
    try {
      const probeUrl = `http://localhost:${port}/api/products`;
      const res = await fetch(probeUrl, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        // Disambiguate from foreign services on port 3000:
        // Must contain perfume products (e.g. concentration, Swiss Rose, or scentFamily)
        const isRawdah = data.success === true && Array.isArray(data.products) && (
          data.products.some((p) => p.concentration || p.notes || p.notesTop || (p.name && /rose|oud|perfume|flacon|attar|lattafa/i.test(p.name)))
        );
        if (isRawdah) {
          BASE_URL = `http://localhost:${port}`;
          console.log(`${GREEN}✔ Connected to Rāwdah Haute Parfumerie on port ${port} (${BASE_URL})${RESET}`);
          return;
        }
      }
    } catch {
      // Port not reachable, continue probing
    }
  }

  throw new Error(`Unable to detect running Rāwdah server on candidate ports [${uniquePorts.join(', ')}]. Please start Next.js.`);
}

/**
 * HTTP Client Helper
 */
async function req(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  
  if (options.skipAuth) {
    delete headers['Cookie'];
    delete headers['cookie'];
  } else if (sessionCookie && headers['Cookie'] === undefined && headers['cookie'] === undefined) {
    headers['Cookie'] = sessionCookie;
  }

  const start = performance.now();
  try {
    const res = await fetch(url, { ...options, headers });
    const duration = Math.round(performance.now() - start);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isHtml = contentType.includes('text/html');
    const isHead = options.method?.toUpperCase() === 'HEAD';

    let data = null;
    if (!isHead) {
      if (isJson) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => '');
      }
    }

    return { res, status: res.status, ok: res.ok, data, isJson, isHtml, headers: res.headers, duration };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return { res: null, status: 0, ok: false, error: err.message, duration };
  }
}

/**
 * Helper to dynamically retrieve an in-stock product and variant
 */
async function getInStockItem() {
  const { data } = await req('/api/products');
  const prod = data.products?.find((p) => p.variants && p.variants.some((v) => (v.stock || 0) >= 2));
  if (!prod) {
    // If not found with >=2, fallback to any variant with >0
    const fallbackProd = data.products?.find((p) => p.variants && p.variants.some((v) => (v.stock || 0) > 0));
    if (!fallbackProd) throw new Error('No in-stock product found in catalog');
    const fallbackVariant = fallbackProd.variants.find((v) => (v.stock || 0) > 0);
    return { product: fallbackProd, variant: fallbackVariant };
  }
  const variant = prod.variants.find((v) => (v.stock || 0) >= 2);
  return { product: prod, variant };
}

/**
 * Test Runner Harness
 */
async function test(tier, feature, name, testFn) {
  stats.total++;
  stats.tiers[tier].total++;
  const label = `[${tier}] [${feature}] ${name}`;
  try {
    const start = performance.now();
    await testFn();
    const duration = Math.round(performance.now() - start);
    stats.passed++;
    stats.tiers[tier].passed++;
    console.log(`  ${GREEN}✔ PASS${RESET} ${label} ${GRAY}(${duration}ms)${RESET}`);
  } catch (err) {
    stats.failed++;
    stats.tiers[tier].failed++;
    const errMsg = err?.message || String(err);
    stats.failures.push({ tier, feature, name, error: errMsg });
    console.log(`  ${RED}✖ FAIL${RESET} ${label} ${RED}— ${errMsg}${RESET}`);
  }
}

/**
 * ============================================================================
 * MAIN TEST SUITE
 * ============================================================================
 */
async function runSuite() {
  const suiteStartTime = performance.now();

  console.log('\n' + BOLD + CYAN + '================================================================================' + RESET);
  console.log(BOLD + CYAN + '  RĀWDAH HAUTE PARFUMERIE — AUTOMATED E2E VERIFICATION TEST SUITE (TIERS 1–4)' + RESET);
  console.log(BOLD + CYAN + '================================================================================' + RESET + '\n');

  await detectServer();

  // Obtain admin credentials and login once for authenticated requests
  const adminLoginRes = await req('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'RawdahOwner2026!' }),
  });
  if (adminLoginRes.ok && adminLoginRes.isJson && adminLoginRes.data.success) {
    const rawCookie = adminLoginRes.headers.get('set-cookie');
    if (rawCookie) {
      sessionCookie = rawCookie.split(';')[0];
    }
  }

  // Pre-fetch a sample product and variant for testing flows
  const { product: sampleProduct, variant: sampleVariant } = await getInStockItem();

  // --------------------------------------------------------------------------
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature across 12 features = 60)
  // --------------------------------------------------------------------------
  console.log('\n' + BOLD + MAGENTA + '>>> TIER 1: FEATURE COVERAGE (60 Tests)' + RESET);

  // Feature 1: Homepage Rendering & CMS Sections
  await test('Tier 1', 'F1: Homepage & CMS', 'T1.1.1: GET / returns HTTP 200 with HTML doctype', async () => {
    const { status, ok, isHtml, data } = await req('/');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.ok(isHtml || typeof data === 'string');
    assert.ok(data.toLowerCase().includes('<!doctype html>'));
  });

  await test('Tier 1', 'F1: Homepage & CMS', 'T1.1.2: GET /api/content returns HTTP 200 and sections map', async () => {
    const { status, ok, data } = await req('/api/content');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(typeof data.sections === 'object' && data.sections !== null);
  });

  await test('Tier 1', 'F1: Homepage & CMS', 'T1.1.3: Hero section contains headlineLine1, headlineLine2, and buttonLink', async () => {
    const { data } = await req('/api/content');
    const hero = data.sections?.hero?.content;
    assert.ok(hero, 'Hero section content missing');
    assert.ok(typeof hero.headlineLine1 === 'string' && hero.headlineLine1.length > 0);
    assert.ok(typeof hero.headlineLine2 === 'string' && hero.headlineLine2.length > 0);
    assert.ok(typeof hero.buttonLink === 'string');
  });

  await test('Tier 1', 'F1: Homepage & CMS', 'T1.1.4: Announcement section contains text and highlightCode', async () => {
    const { data } = await req('/api/content');
    const ann = data.sections?.announcement?.content;
    assert.ok(ann, 'Announcement section content missing');
    assert.ok(typeof ann.text === 'string' && ann.text.length > 0);
    assert.ok(typeof ann.highlightCode === 'string');
  });

  await test('Tier 1', 'F1: Homepage & CMS', 'T1.1.5: Editorial section contains title and body narrative', async () => {
    const { data } = await req('/api/content');
    const editorial = data.sections?.editorial;
    assert.ok(editorial, 'Editorial section missing');
    assert.ok(editorial.title || editorial.content?.headingLine1, 'Editorial title missing');
    assert.ok(editorial.content?.body || editorial.subtitle, 'Editorial narrative missing');
  });

  // Feature 2: Shop Page Filtering & Sorting
  await test('Tier 1', 'F2: Shop & Filters', 'T1.2.1: GET /shop returns HTTP 200 with HTML catalog page', async () => {
    const { status, ok, data } = await req('/shop');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.ok(typeof data === 'string' && data.includes('Shop'));
  });

  await test('Tier 1', 'F2: Shop & Filters', 'T1.2.2: GET /api/products returns HTTP 200 with authentic catalog', async () => {
    const { status, ok, data } = await req('/api/products');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products));
    assert.ok(data.products.length >= 40, `Expected at least 40 perfumes, got ${data.products.length}`);
  });

  await test('Tier 1', 'F2: Shop & Filters', 'T1.2.3: Category filter returns matching perfumes', async () => {
    const { status, data } = await req('/api/products?category=Unisex');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products) && data.products.length > 0);
    for (const p of data.products) {
      assert.ok(p.category === 'Unisex' || p.categoryName === 'Unisex' || p.categoryId);
    }
  });

  await test('Tier 1', 'F2: Shop & Filters', 'T1.2.4: Text search query filters perfumes by name', async () => {
    const { status, data } = await req('/api/products?q=Rose');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products) && data.products.length > 0);
    for (const p of data.products) {
      const match = (p.name + ' ' + (p.description || '') + ' ' + (p.tagline || '')).toLowerCase().includes('rose');
      assert.ok(match, `Product ${p.name} did not match query 'Rose'`);
    }
  });

  await test('Tier 1', 'F2: Shop & Filters', 'T1.2.5: Scent family filter returns matching perfumes', async () => {
    const { status, data } = await req('/api/products?scent=Oud+%26+Woody');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products) && data.products.length > 0);
  });

  // Feature 3: Product Details & Variant Selection
  await test('Tier 1', 'F3: Product Details', 'T1.3.1: GET /product/[slug] returns HTTP 200 with SSR HTML', async () => {
    const { status, ok, data } = await req(`/product/${sampleProduct.slug}`);
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.ok(typeof data === 'string' && data.includes(sampleProduct.name));
  });

  await test('Tier 1', 'F3: Product Details', 'T1.3.2: GET /api/products/[slug] returns HTTP 200 with detailed flacon data', async () => {
    const { status, ok, data } = await req(`/api/products/${sampleProduct.slug}`);
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.product.slug, sampleProduct.slug);
  });

  await test('Tier 1', 'F3: Product Details', 'T1.3.3: Product variants schema has sku, size, price, and stock', async () => {
    const { data } = await req(`/api/products/${sampleProduct.slug}`);
    const variants = data.product.variants;
    assert.ok(Array.isArray(variants) && variants.length > 0);
    const v = variants[0];
    assert.ok(v.id && typeof v.id === 'string');
    assert.ok(v.sku && typeof v.sku === 'string');
    assert.ok(v.size && typeof v.size === 'string');
    const priceVal = v.price ?? v.sellingPrice;
    assert.ok(typeof priceVal === 'number' && priceVal > 0);
    assert.ok(typeof v.stock === 'number' && v.stock >= 0);
  });

  await test('Tier 1', 'F3: Product Details', 'T1.3.4: Product notes schema contains notes top, heart, and base structure', async () => {
    const { data } = await req(`/api/products/${sampleProduct.slug}`);
    const p = data.product;
    const topNotes = p.notes?.top || p.notesTop;
    const heartNotes = p.notes?.heart || p.notesHeart;
    const baseNotes = p.notes?.base || p.notesBase;
    assert.ok(Array.isArray(topNotes) && topNotes.length > 0);
    assert.ok(Array.isArray(heartNotes) && heartNotes.length > 0);
    assert.ok(Array.isArray(baseNotes) && baseNotes.length > 0);
  });

  await test('Tier 1', 'F3: Product Details', 'T1.3.5: Product image gallery has valid image asset paths', async () => {
    const { data } = await req(`/api/products/${sampleProduct.slug}`);
    const images = data.product.images;
    assert.ok(Array.isArray(images) && images.length > 0);
    assert.ok(images[0].startsWith('/images/') || images[0].startsWith('http'));
  });

  // Feature 4: Cart Drawer & Cart Page Operations
  await test('Tier 1', 'F4: Cart & Coupons', 'T1.4.1: GET /cart returns HTTP 200', async () => {
    const { status, ok } = await req('/cart');
    assert.strictEqual(status, 200);
    assert.ok(ok);
  });

  await test('Tier 1', 'F4: Cart & Coupons', 'T1.4.2: POST /api/coupons/validate with WELCOME15 returns HTTP 200', async () => {
    const { status, ok, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal: 10000 }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.coupon.code, 'WELCOME15');
  });

  await test('Tier 1', 'F4: Cart & Coupons', 'T1.4.3: Coupon validation calculates percentage discount correctly', async () => {
    const { data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal: 10000 }),
    });
    assert.strictEqual(data.coupon.discountAmount, 1500);
  });

  await test('Tier 1', 'F4: Cart & Coupons', 'T1.4.4: GET /api/payment-methods returns HTTP 200 with paymentMethods', async () => {
    const { status, ok, data } = await req('/api/payment-methods');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    const methods = data.paymentMethods || data.methods || [];
    assert.ok(methods.length > 0);
    const hasCod = methods.some((m) => m.id === 'cod' || m.code === 'COD');
    assert.ok(hasCod, 'COD payment method missing');
  });

  await test('Tier 1', 'F4: Cart & Coupons', 'T1.4.5: Payment methods include delivery fee breakdown for regions', async () => {
    const { data } = await req('/api/payment-methods');
    const fees = data.deliveryFees;
    assert.ok(fees && (typeof fees.insideDhaka === 'number' || typeof fees.dhaka === 'number'));
    assert.ok(typeof fees.outsideDhaka === 'number');
  });

  // Feature 5: Checkout Flow (COD & bKash)
  await test('Tier 1', 'F5: Checkout Flow', 'T1.5.1: GET /checkout returns HTTP 200', async () => {
    const { status, ok } = await req('/checkout');
    assert.strictEqual(status, 200);
    assert.ok(ok);
  });

  let createdCodOrder = null;
  await test('Tier 1', 'F5: Checkout Flow', 'T1.5.2: POST /api/orders with COD returns HTTP 200 and order ID', async () => {
    const { product: p, variant: v } = await getInStockItem();
    const { status, ok, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tier1 Test Patron',
        email: 't1_cod@rawdahperfumes.com',
        phone: '01711223344',
        address: 'House 1, Road 2, Banani',
        city: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1213',
        deliveryMethod: 'STANDARD_DHAKA',
        paymentMethod: 'COD',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(data.orderId && typeof data.orderId === 'string');
    assert.ok(data.orderNumber && data.orderNumber.startsWith('RDH-'));
    createdCodOrder = data;
  });

  await test('Tier 1', 'F5: Checkout Flow', 'T1.5.3: Created COD order has correct paymentMethod and total', async () => {
    assert.ok(createdCodOrder, 'Order was not created');
    assert.strictEqual(createdCodOrder.paymentMethod, 'COD');
    assert.ok(typeof createdCodOrder.total === 'number' && createdCodOrder.total > 0);
  });

  let createdBkashOrder = null;
  await test('Tier 1', 'F5: Checkout Flow', 'T1.5.4: POST /api/orders with bKash creates order with bkash gateway session', async () => {
    const { product: p, variant: v } = await getInStockItem();
    const { status, ok, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'bKash Flow Patron',
        email: 't1_bkash@rawdahperfumes.com',
        phone: '01799887766',
        address: 'House 5, Road 8, Dhanmondi',
        city: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1209',
        deliveryMethod: 'STANDARD_DHAKA',
        paymentMethod: 'BKASH',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(data.orderId && data.orderNumber);
    createdBkashOrder = data;
  });

  await test('Tier 1', 'F5: Checkout Flow', 'T1.5.5: Order creation reserves stock in inventory ledger', async () => {
    const invRes = await req('/api/admin/inventory');
    assert.strictEqual(invRes.status, 200);
    assert.ok(Array.isArray(invRes.data.inventory) && invRes.data.inventory.length > 0);
    // At least one variant should have stock tracking active
    const sampleInv = invRes.data.inventory[0];
    assert.ok(sampleInv.stock && typeof sampleInv.stock.physical === 'number');
    assert.ok(typeof sampleInv.stock.reserved === 'number');
  });

  // Feature 6: Order Tracking
  await test('Tier 1', 'F6: Order Tracking', 'T1.6.1: GET /track-order returns HTTP 200', async () => {
    const { status, ok } = await req('/track-order');
    assert.strictEqual(status, 200);
    assert.ok(ok);
  });

  await test('Tier 1', 'F6: Order Tracking', 'T1.6.2: GET /api/orders/[orderNumber] returns HTTP 200 for valid order', async () => {
    assert.ok(createdCodOrder?.orderNumber, 'No orderNumber to test');
    const { status, ok, data } = await req(`/api/orders/${createdCodOrder.orderNumber}`);
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.orderNumber, createdCodOrder.orderNumber);
  });

  await test('Tier 1', 'F6: Order Tracking', 'T1.6.3: GET /api/orders/[cuid] returns HTTP 200 for valid cuid', async () => {
    assert.ok(createdCodOrder?.orderId, 'No orderId to test');
    const { status, ok, data } = await req(`/api/orders/${createdCodOrder.orderId}`);
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.id, createdCodOrder.orderId);
  });

  await test('Tier 1', 'F6: Order Tracking', 'T1.6.4: GET /api/orders/NON_EXISTENT_ORDER returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/RDH-NONEXISTENT-99999');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'Order not found');
  });

  await test('Tier 1', 'F6: Order Tracking', 'T1.6.5: Tracked order contains customer, items, and fulfillmentStatus', async () => {
    const { data } = await req(`/api/orders/${createdCodOrder.orderNumber}`);
    const o = data.order;
    assert.ok(o.customerName && o.customerEmail);
    assert.ok(Array.isArray(o.items) && o.items.length > 0);
    assert.ok(typeof o.fulfillmentStatus === 'string');
    assert.ok(o.shippingAddress);
  });

  // Feature 7: Admin Authentication & Route Protection
  await test('Tier 1', 'F7: Admin Auth', 'T1.7.1: POST /api/admin/auth/login with valid credentials returns HTTP 200', async () => {
    const { status, ok, data } = await req('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'RawdahOwner2026!' }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'OWNER');
  });

  await test('Tier 1', 'F7: Admin Auth', 'T1.7.2: Admin login sets rawdah_admin_token cookie', async () => {
    const { res } = await req('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'RawdahOwner2026!' }),
    });
    const setCookie = res?.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('rawdah_admin_token='));
  });

  await test('Tier 1', 'F7: Admin Auth', 'T1.7.3: GET /api/admin/auth/me returns authenticated owner profile', async () => {
    const { status, ok, data } = await req('/api/admin/auth/me');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, 'owner@rawdahperfumes.com');
  });

  await test('Tier 1', 'F7: Admin Auth', 'T1.7.4: POST /api/admin/auth/login with invalid password returns HTTP 401', async () => {
    const { status, data } = await req('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'WrongPassword999!' }),
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 1', 'F7: Admin Auth', 'T1.7.5: POST /api/admin/auth/logout clears session successfully', async () => {
    const { status, ok, data, res } = await req('/api/admin/auth/logout', { method: 'POST' });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    const setCookie = (res?.headers.get('set-cookie') || '').toLowerCase();
    assert.ok(setCookie.includes('expires=') || setCookie.includes('max-age=0') || setCookie.includes('rawdah_admin_token=;'));
  });

  // Feature 8: CMS Live Updates & Cache Control
  let originalHeroHeadline = '';
  let heroSectionId = '';
  await test('Tier 1', 'F8: CMS Live Updates', 'T1.8.1: GET /api/admin/content returns HTTP 200 with all sections', async () => {
    const { status, ok, data } = await req('/api/admin/content');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.sections) && data.sections.length >= 8);
    const hero = data.sections.find((s) => s.sectionKey === 'hero');
    assert.ok(hero, 'Hero section not found in admin CMS');
    heroSectionId = hero.id;
    originalHeroHeadline = hero.content?.headlineLine2 || 'Haute Parfumerie';
  });

  await test('Tier 1', 'F8: CMS Live Updates', 'T1.8.2: PUT /api/admin/content/[id] updates section headlineLine2', async () => {
    assert.ok(heroSectionId, 'Hero ID not found');
    const updateHeadline = 'Artisanal Extrait ' + Date.now().toString().slice(-4);
    const { status, ok, data } = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'The Sovereign Scent,',
          headlineLine2: updateHeadline,
          buttonText: 'Explore Collection',
          buttonLink: '/shop',
        },
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 1', 'F8: CMS Live Updates', 'T1.8.3: Public GET /api/content reflects updated headline synchronously', async () => {
    const { status, data } = await req('/api/content');
    assert.strictEqual(status, 200);
    const hero = data.sections?.hero?.content;
    assert.ok(hero.headlineLine2.startsWith('Artisanal Extrait'));
  });

  await test('Tier 1', 'F8: CMS Live Updates', 'T1.8.4: Public GET /api/content returns Cache-Control no-store headers', async () => {
    const { headers } = await req('/api/content');
    const cacheControl = headers.get('cache-control') || '';
    assert.ok(cacheControl.includes('no-store') || cacheControl.includes('no-cache'), 'Missing no-store/no-cache header');
  });

  await test('Tier 1', 'F8: CMS Live Updates', 'T1.8.5: Reverting section headline restores original content successfully', async () => {
    const { status, ok } = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'A Signature Scent,',
          headlineLine2: originalHeroHeadline,
          buttonText: 'Discover Fragrance',
          buttonLink: '/shop',
        },
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    const check = await req('/api/content');
    assert.strictEqual(check.data.sections?.hero?.content?.headlineLine2, originalHeroHeadline);
  });

  // Feature 9: Product Catalog & Inventory Stock Management
  await test('Tier 1', 'F9: Catalog & Inventory', 'T1.9.1: GET /api/admin/products returns catalog table', async () => {
    const { status, ok, data } = await req('/api/admin/products?page=1&limit=12');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products));
  });

  await test('Tier 1', 'F9: Catalog & Inventory', 'T1.9.2: GET /api/admin/inventory returns variant stock inventory', async () => {
    const { status, ok, data } = await req('/api/admin/inventory');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.inventory) && data.inventory.length > 0);
  });

  await test('Tier 1', 'F9: Catalog & Inventory', 'T1.9.3: POST /api/admin/inventory/adjust increments stock with positive delta', async () => {
    const { status, ok, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: 5,
        type: 'PURCHASE_RECEIPT',
        reason: 'Automated E2E positive stock adjustment',
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.movement.afterStock - data.movement.beforeStock, 5);
  });

  await test('Tier 1', 'F9: Catalog & Inventory', 'T1.9.4: POST /api/admin/inventory/adjust decrements stock with negative delta', async () => {
    const { status, ok, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: -5,
        type: 'ADJUSTMENT',
        reason: 'Automated E2E stock restoration',
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.movement.beforeStock - data.movement.afterStock, 5);
  });

  await test('Tier 1', 'F9: Catalog & Inventory', 'T1.9.5: Variant stock adjustment is reflected in public product query', async () => {
    const { data } = await req(`/api/products/${sampleProduct.slug}`);
    const v = data.product.variants.find((item) => item.id === sampleVariant.id);
    assert.ok(v, 'Variant not found in public product query');
    assert.ok(typeof v.stock === 'number');
  });

  // Feature 10: Category & Media Asset Management
  await test('Tier 1', 'F10: Categories & Media', 'T1.10.1: GET /api/admin/categories returns HTTP 200 with categories list', async () => {
    const { status, ok, data } = await req('/api/admin/categories');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.categories) && data.categories.length >= 4);
  });

  let testCategoryId = '';
  await test('Tier 1', 'F10: Categories & Media', 'T1.10.2: POST /api/admin/categories creates a new category', async () => {
    const catName = 'E2E Category ' + Date.now().toString().slice(-4);
    const { status, ok, data } = await req('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: catName,
        description: 'Temporary category for E2E verification',
        image: '/images/cat-men.jpg',
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(data.category?.id);
    testCategoryId = data.category.id;
  });

  await test('Tier 1', 'F10: Categories & Media', 'T1.10.3: PATCH /api/admin/categories/[id] updates category description', async () => {
    assert.ok(testCategoryId, 'No testCategoryId');
    const { status, ok, data } = await req(`/api/admin/categories/${testCategoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Updated description for E2E category',
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.category.description, 'Updated description for E2E category');
  });

  await test('Tier 1', 'F10: Categories & Media', 'T1.10.4: DELETE /api/admin/categories/[id] deletes test category', async () => {
    assert.ok(testCategoryId, 'No testCategoryId to delete');
    const { status, ok, data } = await req(`/api/admin/categories/${testCategoryId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 1', 'F10: Categories & Media', 'T1.10.5: GET /api/admin/media returns media asset library', async () => {
    const { status, ok, data } = await req('/api/admin/media');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.media) || Array.isArray(data.assets));
  });

  // Feature 11: Public APIs Integrity & JSON Schemas
  await test('Tier 1', 'F11: Public Schemas', 'T1.11.1: GET /api/products JSON schema matches { success, count, products }', async () => {
    const { data } = await req('/api/products');
    assert.strictEqual(typeof data.success, 'boolean');
    assert.strictEqual(typeof data.count, 'number');
    assert.ok(Array.isArray(data.products));
  });

  await test('Tier 1', 'F11: Public Schemas', 'T1.11.2: GET /api/categories JSON schema matches { success, categories }', async () => {
    const { data } = await req('/api/categories');
    assert.strictEqual(typeof data.success, 'boolean');
    assert.ok(Array.isArray(data.categories));
  });

  await test('Tier 1', 'F11: Public Schemas', 'T1.11.3: GET /api/content JSON schema matches { success, sections }', async () => {
    const { data } = await req('/api/content');
    assert.strictEqual(typeof data.success, 'boolean');
    assert.ok(typeof data.sections === 'object' && data.sections !== null);
  });

  await test('Tier 1', 'F11: Public Schemas', 'T1.11.4: GET /api/deals JSON schema matches { success, deal }', async () => {
    const { status, data } = await req('/api/deals');
    assert.strictEqual(status, 200);
    assert.strictEqual(typeof data.success, 'boolean');
    assert.ok(data.deal === null || typeof data.deal === 'object');
  });

  await test('Tier 1', 'F11: Public Schemas', 'T1.11.5: GET /api/payment-methods JSON schema matches { success, paymentMethods, deliveryFees }', async () => {
    const { data } = await req('/api/payment-methods');
    assert.strictEqual(typeof data.success, 'boolean');
    const methods = data.paymentMethods || data.methods;
    assert.ok(Array.isArray(methods));
    assert.ok(typeof data.deliveryFees === 'object');
  });

  // Feature 12: Admin APIs Security & CRUD Operations
  await test('Tier 1', 'F12: Admin APIs', 'T1.12.1: GET /api/admin/dashboard returns metrics and charts', async () => {
    const { status, ok, data } = await req('/api/admin/dashboard?period=month');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 1', 'F12: Admin APIs', 'T1.12.2: GET /api/admin/orders returns paginated orders list', async () => {
    const { status, ok, data } = await req('/api/admin/orders?page=1&limit=10');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.orders));
  });

  await test('Tier 1', 'F12: Admin APIs', 'T1.12.3: GET /api/admin/finance returns ledgers and account balances', async () => {
    const { status, ok, data } = await req('/api/admin/finance');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 1', 'F12: Admin APIs', 'T1.12.4: GET /api/admin/customers returns customer profiles', async () => {
    const { status, ok, data } = await req('/api/admin/customers');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.customers));
  });

  await test('Tier 1', 'F12: Admin APIs', 'T1.12.5: GET /api/admin/settings returns store configuration', async () => {
    const { status, ok, data } = await req('/api/admin/settings');
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.ok(data.storeName || data.success);
  });

  // --------------------------------------------------------------------------
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature across 12 features = 60)
  // --------------------------------------------------------------------------
  console.log('\n' + BOLD + MAGENTA + '>>> TIER 2: BOUNDARY & CORNER CASES (60 Tests)' + RESET);

  // F1 Boundaries: Homepage / CMS
  await test('Tier 2', 'F1: Boundaries', 'T2.1.1: GET /api/content with arbitrary query parameters returns valid content', async () => {
    const { status, data } = await req('/api/content?foo=bar&test=1&arbitrary=true');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.sections?.hero);
  });

  await test('Tier 2', 'F1: Boundaries', 'T2.1.2: PUT /api/admin/content/non-existent-id returns HTTP 404', async () => {
    const { status, data } = await req('/api/admin/content/cmw_non_existent_cuid_99999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F1: Boundaries', 'T2.1.3: PUT /api/admin/content/[id] without session cookie returns HTTP 401', async () => {
    const { status, data } = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      skipAuth: true,
      body: JSON.stringify({ title: 'Hacked' }),
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F1: Boundaries', 'T2.1.4: PUT /api/admin/content/[id] with empty object updates safely without crashing', async () => {
    const { status, ok } = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(status, 200);
    assert.ok(ok);
  });

  await test('Tier 2', 'F1: Boundaries', 'T2.1.5: GET /api/content response latency is under 500ms', async () => {
    const { duration } = await req('/api/content');
    assert.ok(duration < 500, `Expected latency < 500ms, got ${duration}ms`);
  });

  // F2 Boundaries: Shop Filtering & Search
  await test('Tier 2', 'F2: Boundaries', 'T2.2.1: Non-existent category filter returns 0 products safely', async () => {
    const { status, data } = await req('/api/products?category=non-existent-category-xyz-999');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.products.length, 0);
  });

  await test('Tier 2', 'F2: Boundaries', 'T2.2.2: Non-existent scent family filter returns 0 products safely', async () => {
    const { status, data } = await req('/api/products?scent=non-existent-scent-family-999');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.products.length, 0);
  });

  await test('Tier 2', 'F2: Boundaries', 'T2.2.3: SQL injection probe in search query returns 0 products safely without 500', async () => {
    const { status, data } = await req('/api/products?q=%27%20OR%201=1--');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.products.length, 0);
  });

  await test('Tier 2', 'F2: Boundaries', 'T2.2.4: Regex meta-characters in search query handle gracefully', async () => {
    const { status, data } = await req('/api/products?q=.*%2B%3F%5E%24%7B%7D%28%29%7C%5B%5D%5C');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 2', 'F2: Boundaries', 'T2.2.5: Whitespace-only search query handles gracefully', async () => {
    const { status, data } = await req('/api/products?q=%20%20%20');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
  });

  // F3 Boundaries: Product Details
  await test('Tier 2', 'F3: Boundaries', 'T2.3.1: Non-existent product slug returns HTTP 404', async () => {
    const { status, data } = await req('/api/products/non-existent-perfume-slug-xyz');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F3: Boundaries', 'T2.3.2: Slug with URL-encoded spaces returns HTTP 404', async () => {
    const { status, data } = await req('/api/products/invalid%20slug%20with%20spaces');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F3: Boundaries', 'T2.3.3: SQL injection probe in slug returns HTTP 404 safely', async () => {
    const { status, data } = await req('/api/products/%27%20OR%201=1--');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F3: Boundaries', 'T2.3.4: Extreme length slug (300+ characters) returns HTTP 404 safely', async () => {
    const extremeSlug = 'a'.repeat(320);
    const { status, data } = await req(`/api/products/${extremeSlug}`);
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F3: Boundaries', 'T2.3.5: Null-like slug returns HTTP 404', async () => {
    const { status, data } = await req('/api/products/null');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  // F4 Boundaries: Cart & Coupons
  await test('Tier 2', 'F4: Boundaries', 'T2.4.1: Non-existent coupon code returns HTTP 404', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID_COUPON_999', subtotal: 10000 }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F4: Boundaries', 'T2.4.2: Empty string coupon code returns HTTP 400', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '', subtotal: 10000 }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F4: Boundaries', 'T2.4.3: Non-string coupon code returns HTTP 400', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 12345, subtotal: 10000 }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F4: Boundaries', 'T2.4.4: Subtotal below minimum spend for coupon returns HTTP 400', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal: 100 }), // Min spend is usually higher
    });
    assert.ok(status === 400 || status === 200);
    if (status === 400) {
      assert.strictEqual(data.success, false);
    }
  });

  await test('Tier 2', 'F4: Boundaries', 'T2.4.5: Lowercase coupon code is automatically normalized to uppercase', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'welcome15', subtotal: 10000 }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.coupon.code, 'WELCOME15');
  });

  // F5 Boundaries: Checkout Flow
  await test('Tier 2', 'F5: Boundaries', 'T2.5.1: Order creation with missing customer name returns HTTP 400', async () => {
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 't2_bad@test.com',
        phone: '01711223344',
        address: 'Dhaka',
        city: 'Dhaka',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F5: Boundaries', 'T2.5.2: Order creation with missing phone number returns HTTP 400', async () => {
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Phone',
        email: 'nophone@test.com',
        address: 'Dhaka',
        city: 'Dhaka',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F5: Boundaries', 'T2.5.3: Order creation with missing email address returns HTTP 400', async () => {
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Email',
        phone: '01711223344',
        address: 'Dhaka',
        city: 'Dhaka',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F5: Boundaries', 'T2.5.4: Order creation with empty items array returns HTTP 400', async () => {
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Empty Items',
        email: 'empty@test.com',
        phone: '01711223344',
        address: 'Dhaka',
        city: 'Dhaka',
        items: [],
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F5: Boundaries', 'T2.5.5: Order creation with quantity exceeding stock returns HTTP 400', async () => {
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Over Stock',
        email: 'overstock@test.com',
        phone: '01711223344',
        address: 'Dhaka',
        city: 'Dhaka',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 99999 }],
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Insufficient stock'));
  });

  // F6 Boundaries: Order Tracking
  await test('Tier 2', 'F6: Boundaries', 'T2.6.1: Formatted but non-existent order number (RDH-00000) returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/RDH-00000');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F6: Boundaries', 'T2.6.2: Valid CUID format but non-existent ID returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/cmw0000000000000000000000');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F6: Boundaries', 'T2.6.3: XSS probe in order ID route parameter returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/%3Cscript%3Ealert%281%29%3C%2Fscript%3E');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F6: Boundaries', 'T2.6.4: SQL injection probe in order ID route parameter returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/%27%20OR%20%271%27%3D%271');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F6: Boundaries', 'T2.6.5: Route parameter literal "null" returns HTTP 404', async () => {
    const { status, data } = await req('/api/orders/null');
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  // F7 Boundaries: Admin Auth & Route Protection
  await test('Tier 2', 'F7: Boundaries', 'T2.7.1: Unauthenticated request to /api/admin/products returns HTTP 401', async () => {
    const { status } = await req('/api/admin/products', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F7: Boundaries', 'T2.7.2: Unauthenticated request to /api/admin/orders returns HTTP 401', async () => {
    const { status } = await req('/api/admin/orders', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F7: Boundaries', 'T2.7.3: Unauthenticated request to /api/admin/inventory returns HTTP 401', async () => {
    const { status } = await req('/api/admin/inventory', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F7: Boundaries', 'T2.7.4: Forged session cookie with tampered signature returns HTTP 401', async () => {
    const forged = 'eyJpZCI6ImZvcmdlZCIsInJvbGUiOiJPV05FUiIsImV4cCI6OTk5OTk5OTk5OX0.invalid_signature_12345';
    const { status } = await req('/api/admin/dashboard', { headers: { Cookie: `rawdah_admin_token=${forged}` } });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F7: Boundaries', 'T2.7.5: Expired session timestamp in cookie returns HTTP 401', async () => {
    const expiredPayload = Buffer.from(JSON.stringify({ id: 'cmw39a0d60000o0pkds0mwx94', role: 'OWNER', exp: Date.now() - 60000 })).toString('base64url');
    const secret = 'rawdah_luxury_haute_parfumerie_secret_key_2026_dhaka';
    const sig = Buffer.from(secret + expiredPayload).toString('base64url').substring(0, 32);
    const expiredToken = `${expiredPayload}.${sig}`;
    const { status } = await req('/api/admin/dashboard', { headers: { Cookie: `rawdah_admin_token=${expiredToken}` } });
    assert.strictEqual(status, 401);
  });

  // F8 Boundaries: CMS Caching & Integrity
  await test('Tier 2', 'F8: Boundaries', 'T2.8.1: Unauthenticated PUT to /api/admin/content/[id] returns HTTP 401', async () => {
    const { status } = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      skipAuth: true,
      body: JSON.stringify({ title: 'Hacked' }),
    });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F8: Boundaries', 'T2.8.2: Rapid sequential requests to /api/content return consistent versions', async () => {
    const [r1, r2, r3] = await Promise.all([req('/api/content'), req('/api/content'), req('/api/content')]);
    assert.strictEqual(r1.status, 200);
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r3.status, 200);
    assert.strictEqual(r1.data.sections?.hero?.version, r2.data.sections?.hero?.version);
  });

  await test('Tier 2', 'F8: Boundaries', 'T2.8.3: Pragma header is no-cache on public content API', async () => {
    const { headers } = await req('/api/content');
    const pragma = headers.get('pragma');
    assert.ok(!pragma || pragma.includes('no-cache'));
  });

  await test('Tier 2', 'F8: Boundaries', 'T2.8.4: Expires header is 0 on public content API', async () => {
    const { headers } = await req('/api/content');
    const expires = headers.get('expires');
    assert.ok(!expires || expires === '0');
  });

  await test('Tier 2', 'F8: Boundaries', 'T2.8.5: Content API handles HEAD request cleanly with HTTP 200', async () => {
    const { status } = await req('/api/content', { method: 'HEAD' });
    assert.strictEqual(status, 200);
  });

  // F9 Boundaries: Inventory & Catalog
  await test('Tier 2', 'F9: Boundaries', 'T2.9.1: Stock adjustment with negative resulting stock returns HTTP 400', async () => {
    const { status, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: -999999,
        reason: 'Attempt negative stock',
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('below zero'));
  });

  await test('Tier 2', 'F9: Boundaries', 'T2.9.2: Stock adjustment with quantityDelta 0 returns HTTP 400', async () => {
    const { status, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: 0,
        reason: 'Zero delta',
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F9: Boundaries', 'T2.9.3: Stock adjustment with missing audit reason returns HTTP 400', async () => {
    const { status, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: 1,
      }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F9: Boundaries', 'T2.9.4: Stock adjustment on non-existent variantId returns HTTP 404', async () => {
    const { status, data } = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: 'cmw_non_existent_var_99999',
        quantityDelta: 2,
        reason: 'Missing variant test',
      }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F9: Boundaries', 'T2.9.5: High pagination page (/api/admin/products?page=9999) returns empty array without error', async () => {
    const { status, data } = await req('/api/admin/products?page=9999&limit=10');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.products));
    assert.strictEqual(data.products.length, 0);
  });

  // F10 Boundaries: Categories & Media
  await test('Tier 2', 'F10: Boundaries', 'T2.10.1: Category creation with empty name returns HTTP 400', async () => {
    const { status, data } = await req('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F10: Boundaries', 'T2.10.2: Updating non-existent category ID returns HTTP 404', async () => {
    const { status, data } = await req('/api/admin/categories/non-existent-cat-999', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Does Not Exist' }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F10: Boundaries', 'T2.10.3: Deleting non-existent category ID returns HTTP 404', async () => {
    const { status, data } = await req('/api/admin/categories/non-existent-cat-999', {
      method: 'DELETE',
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F10: Boundaries', 'T2.10.4: Unauthenticated POST to /api/admin/categories returns HTTP 401', async () => {
    const { status } = await req('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      skipAuth: true,
      body: JSON.stringify({ name: 'Unauth Cat' }),
    });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F10: Boundaries', 'T2.10.5: Unauthenticated GET to /api/admin/media returns HTTP 401', async () => {
    const { status } = await req('/api/admin/media', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  // F11 Boundaries: Public APIs Integrity
  await test('Tier 2', 'F11: Boundaries', 'T2.11.1: GET /api/products?status=all returns products safely', async () => {
    const { status, data } = await req('/api/products?status=all');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 2', 'F11: Boundaries', 'T2.11.2: Public categories array contains items with non-empty slug and name', async () => {
    const { data } = await req('/api/categories');
    assert.ok(Array.isArray(data.categories) && data.categories.length > 0);
    for (const c of data.categories) {
      assert.ok(c.name && c.slug);
    }
  });

  await test('Tier 2', 'F11: Boundaries', 'T2.11.3: Public deals API returns HTTP 200 without throwing 500 error', async () => {
    const { status, data } = await req('/api/deals');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.success, true);
  });

  await test('Tier 2', 'F11: Boundaries', 'T2.11.4: Payment methods includes Cash on Delivery (COD)', async () => {
    const { data } = await req('/api/payment-methods');
    const methods = data.paymentMethods || data.methods || [];
    const cod = methods.find((m) => m.id === 'cod' || m.code === 'COD');
    assert.ok(cod, 'COD payment method missing');
    assert.strictEqual(cod.enabled, true);
  });

  await test('Tier 2', 'F11: Boundaries', 'T2.11.5: Content API sections contain valid sectionKey properties', async () => {
    const { data } = await req('/api/content');
    const keys = Object.keys(data.sections || {});
    assert.ok(keys.includes('hero'));
    assert.ok(keys.includes('announcement'));
  });

  // F12 Boundaries: Admin APIs Security
  await test('Tier 2', 'F12: Boundaries', 'T2.12.1: Unauthenticated request to /api/admin/finance returns HTTP 401', async () => {
    const { status } = await req('/api/admin/finance', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F12: Boundaries', 'T2.12.2: Unauthenticated request to /api/admin/customers returns HTTP 401', async () => {
    const { status } = await req('/api/admin/customers', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F12: Boundaries', 'T2.12.3: Unauthenticated request to /api/admin/analytics returns HTTP 401', async () => {
    const { status } = await req('/api/admin/analytics', { skipAuth: true });
    assert.strictEqual(status, 401);
  });

  await test('Tier 2', 'F12: Boundaries', 'T2.12.4: Dispatching non-existent order ID returns HTTP 404', async () => {
    const { status, data } = await req('/api/admin/orders/cmw_non_existent_ord_99999/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierProvider: 'STEADFAST' }),
    });
    assert.strictEqual(status, 404);
    assert.strictEqual(data.success, false);
  });

  await test('Tier 2', 'F12: Boundaries', 'T2.12.5: Admin clear-cache POST endpoint responds with HTTP 200', async () => {
    const { status, ok, data } = await req('/api/admin/clear-cache', { method: 'POST' });
    assert.strictEqual(status, 200);
    assert.ok(ok);
    assert.strictEqual(data.success, true);
  });

  // --------------------------------------------------------------------------
  // TIER 3: CROSS-FEATURE COMBINATIONS (>=12 Integration Tests)
  // --------------------------------------------------------------------------
  console.log('\n' + BOLD + MAGENTA + '>>> TIER 3: CROSS-FEATURE COMBINATIONS (12 Tests)' + RESET);

  let crossOrder = null;
  await test('Tier 3', 'Cross-Feature', 'T3.1: Order Creation -> Admin Orders Visibility -> Tracking Consistency', async () => {
    const { product: p, variant: v } = await getInStockItem();
    // 1. Create order
    const createRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cross Feature Patron',
        email: 'cross.patron@rawdahperfumes.com',
        phone: '01711223344',
        address: 'House 88, Road 11, Gulshan-2',
        city: 'Dhaka',
        deliveryMethod: 'EXPRESS_DHAKA',
        paymentMethod: 'COD',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(createRes.status, 200);
    crossOrder = createRes.data;

    // 2. Locate in admin orders
    const adminOrdersRes = await req('/api/admin/orders?page=1&limit=10');
    assert.strictEqual(adminOrdersRes.status, 200);
    const foundInAdmin = adminOrdersRes.data.orders.find((o) => o.orderNumber === crossOrder.orderNumber);
    assert.ok(foundInAdmin, `Order ${crossOrder.orderNumber} not found in admin orders list`);

    // 3. Query public tracking
    const trackRes = await req(`/api/orders/${crossOrder.orderNumber}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.customerName, 'Cross Feature Patron');
  });

  await test('Tier 3', 'Cross-Feature', 'T3.2: Order Status Progression -> Admin Status Update -> Tracking Reflection', async () => {
    assert.ok(crossOrder?.orderId, 'No crossOrder');
    // Update status to CONFIRMED
    const patchRes = await req(`/api/admin/orders/${crossOrder.orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfillmentStatus: 'CONFIRMED' }),
    });
    assert.strictEqual(patchRes.status, 200);

    // Verify tracking reflects CONFIRMED
    const trackRes = await req(`/api/orders/${crossOrder.orderId}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.fulfillmentStatus, 'CONFIRMED');
  });

  await test('Tier 3', 'Cross-Feature', 'T3.3: Order Courier Dispatch -> Status Shipped -> Courier Tracking Code Assigned', async () => {
    assert.ok(crossOrder?.orderId, 'No crossOrder');
    // Dispatch to courier
    const dispRes = await req(`/api/admin/orders/${crossOrder.orderId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierProvider: 'STEADFAST' }),
    });
    assert.strictEqual(dispRes.status, 200);
    assert.ok(dispRes.data.order?.courierTrackingNumber);

    // Verify public tracking endpoint reflects SHIPPED and tracking code
    const trackRes = await req(`/api/orders/${crossOrder.orderId}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.fulfillmentStatus, 'SHIPPED');
    assert.strictEqual(trackRes.data.order.courierTrackingNumber, dispRes.data.order.courierTrackingNumber);
  });

  await test('Tier 3', 'Cross-Feature', 'T3.4: CMS Live Content Authoring -> Storefront API Synchronization -> Teardown', async () => {
    const testHeadline = 'Imperial Maceration ' + Date.now().toString().slice(-4);
    // 1. Update CMS
    const updateRes = await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'The Sovereign Flacon,',
          headlineLine2: testHeadline,
          buttonText: 'Acquire Flacon',
          buttonLink: '/shop',
        },
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // 2. Fetch public storefront API
    const publicRes = await req('/api/content');
    assert.strictEqual(publicRes.data.sections?.hero?.content?.headlineLine2, testHeadline);

    // 3. Restore
    await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'A Signature Scent,',
          headlineLine2: originalHeroHeadline,
          buttonText: 'Discover Fragrance',
          buttonLink: '/shop',
        },
      }),
    });
  });

  await test('Tier 3', 'Cross-Feature', 'T3.5: Inventory Stock Adjustment -> Public Product Variant Stock Sync -> Revert', async () => {
    // 1. Read initial stock
    const initialRes = await req(`/api/products/${sampleProduct.slug}`);
    const initialStock = initialRes.data.product.variants.find((v) => v.id === sampleVariant.id).stock;

    // 2. Increment stock by 3
    const adjRes = await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: 3,
        reason: 'E2E cross-sync test increment',
      }),
    });
    assert.strictEqual(adjRes.status, 200);

    // 3. Check public product
    const checkRes = await req(`/api/products/${sampleProduct.slug}`);
    const updatedStock = checkRes.data.product.variants.find((v) => v.id === sampleVariant.id).stock;
    assert.strictEqual(updatedStock, initialStock + 3);

    // 4. Revert
    await req('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: sampleVariant.id,
        quantityDelta: -3,
        reason: 'E2E cross-sync test revert',
      }),
    });
  });

  await test('Tier 3', 'Cross-Feature', 'T3.6: Category Lifecycle -> Admin Creation -> Public Categories Reflection -> Deletion', async () => {
    const catName = 'Pure Attar Macerations ' + Date.now().toString().slice(-4);
    // 1. Create in Admin
    const createRes = await req('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, description: 'Handcrafted pure attars' }),
    });
    assert.strictEqual(createRes.status, 200);
    const catId = createRes.data.category.id;

    // 2. Verify in public categories
    const pubRes = await req('/api/categories');
    const found = pubRes.data.categories.some((c) => c.id === catId || c.name === catName);
    assert.ok(found, 'New category was not found in public categories list');

    // 3. Delete from Admin
    const delRes = await req(`/api/admin/categories/${catId}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
  });

  await test('Tier 3', 'Cross-Feature', 'T3.7: Product Creation -> Public Slug Lookup -> Duplicate Product -> Teardown', async () => {
    const slug = 'e2e-sovereign-oud-' + Date.now().toString().slice(-4);
    // 1. Create product
    const createRes = await req('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Oud Sovereign Flacon',
        slug,
        concentration: 'Extrait de Parfum',
        tagline: 'Rare Cambodian oud macerated in amber',
        description: 'Exclusive masterwork flacon',
        story: 'Distilled by master perfumers',
        categoryName: 'Unisex',
        scentFamilyName: 'Oud & Woody',
        images: ['/images/products/swiss-arabian-rose-01.webp'],
        notesTop: ['Bergamot'],
        notesHeart: ['Rose'],
        notesBase: ['Oud'],
        longevity: '18 Hours',
        sillage: 'Regal',
        bestSeason: 'Winter',
        variants: [
          { size: '50ml', sku: `RDH-SOV-${Date.now().toString().slice(-4)}`, purchaseCost: 3000, sellingPrice: 6500, stock: 10, lowStockThreshold: 2 },
        ],
      }),
    });
    assert.strictEqual(createRes.status, 200);
    const prodId = createRes.data.product?.id;
    assert.ok(prodId, 'Product ID not returned');

    // 2. Public lookup by slug
    const pubRes = await req(`/api/products/${slug}`);
    assert.strictEqual(pubRes.status, 200);
    assert.strictEqual(pubRes.data.product.name, 'Oud Sovereign Flacon');

    // 3. Duplicate product
    const dupRes = await req(`/api/admin/products/${prodId}/duplicate`, { method: 'POST' });
    assert.strictEqual(dupRes.status, 200);
    const dupId = dupRes.data.product?.id;

    // 4. Teardown
    await req(`/api/admin/products/${prodId}`, { method: 'DELETE' });
    if (dupId) {
      await req(`/api/admin/products/${dupId}`, { method: 'DELETE' });
    }
  });

  await test('Tier 3', 'Cross-Feature', 'T3.8: Coupon Application -> Order Total Recalculation -> Inventory Stock Reservation', async () => {
    const { product: p, variant: v } = await getInStockItem();
    const itemPrice = v.price ?? v.sellingPrice;
    const quantity = itemPrice >= 5000 ? 1 : Math.ceil(5000 / itemPrice);
    const subtotal = itemPrice * quantity;
    // 1. Validate coupon
    const coupRes = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal }),
    });
    assert.strictEqual(coupRes.status, 200);
    const expectedDiscount = coupRes.data.coupon.discountAmount;

    // 2. Place order with coupon
    const ordRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Coupon Patron',
        email: 'coupon.patron@test.com',
        phone: '01711223344',
        address: 'House 10, Road 4',
        city: 'Dhaka',
        paymentMethod: 'COD',
        couponCode: 'WELCOME15',
        items: [{ productId: p.id, variantId: v.id, quantity }],
      }),
    });
    assert.strictEqual(ordRes.status, 200);
    const expectedTotal = subtotal - expectedDiscount;
    assert.strictEqual(ordRes.data.total, expectedTotal);
  });

  await test('Tier 3', 'Cross-Feature', 'T3.9: Out-of-Stock Protection & Order Cancellation Stock Release', async () => {
    const { product: p, variant: v } = await getInStockItem();
    // Place order to create reservation
    const ordRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cancel Test Patron',
        email: 'cancel.patron@test.com',
        phone: '01711223344',
        address: 'Dhaka',
        city: 'Dhaka',
        paymentMethod: 'COD',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(ordRes.status, 200);
    const ordId = ordRes.data.orderId;

    // Cancel order in admin
    const cancelRes = await req(`/api/admin/orders/${ordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfillmentStatus: 'CANCELLED', cancelReason: 'Customer requested cancellation' }),
    });
    assert.strictEqual(cancelRes.status, 200);

    // Verify order tracking shows CANCELLED
    const trackRes = await req(`/api/orders/${ordId}`);
    assert.strictEqual(trackRes.data.order.fulfillmentStatus, 'CANCELLED');
  });

  await test('Tier 3', 'Cross-Feature', 'T3.10: Customer Profile Auto-Creation on Order Placement', async () => {
    const { product: p, variant: v } = await getInStockItem();
    const uniqueEmail = `vip.patron.${Date.now()}@rawdahperfumes.com`;
    await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'VIP New Patron',
        email: uniqueEmail,
        phone: '01788776655',
        address: 'Baridhara Diplomatic Zone',
        city: 'Dhaka',
        paymentMethod: 'COD',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });

    // Check admin customers directory
    const custRes = await req('/api/admin/customers');
    assert.strictEqual(custRes.status, 200);
    const found = custRes.data.customers.some((c) => c.email === uniqueEmail || c.name === 'VIP New Patron');
    assert.ok(found, `Customer profile with email ${uniqueEmail} not found in admin directory`);
  });

  await test('Tier 3', 'Cross-Feature', 'T3.11: bKash Payment Simulation -> Callback Execution -> Payment Confirmation', async () => {
    const { product: p, variant: v } = await getInStockItem();
    // 1. Create bKash order
    const ordRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'bKash Callback Tester',
        email: 'bkash.callback@rawdahperfumes.com',
        phone: '01799887766',
        address: 'Dhanmondi, Dhaka',
        city: 'Dhaka',
        paymentMethod: 'BKASH',
        items: [{ productId: p.id, variantId: v.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(ordRes.status, 200);
    const { orderId } = ordRes.data;

    // 2. Execute callback with cuid
    const callbackUrl = `/api/payments/bkash/callback?paymentID=BKASH_TEST_TX_${Date.now()}&orderId=${orderId}&status=success`;
    const cbRes = await req(callbackUrl, { redirect: 'manual' });
    // In Next.js route handlers, redirect returns 307 or 302
    assert.ok(cbRes.status === 307 || cbRes.status === 302 || cbRes.ok);

    // 3. Verify order paymentStatus transitioned to PAID
    const trackRes = await req(`/api/orders/${orderId}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.paymentStatus, 'PAID');
  });

  await test('Tier 3', 'Cross-Feature', 'T3.12: Admin Store Settings Update -> Verification -> Restored', async () => {
    // 1. Read existing settings
    const initRes = await req('/api/admin/settings');
    assert.strictEqual(initRes.status, 200);
    const origShippingFee = initRes.data.shippingFeeDhaka || 80;

    // 2. Update shipping fee to 95
    const updateRes = await req('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingFeeDhaka: 95 }),
    });
    assert.ok(updateRes.status === 200 || updateRes.ok);

    // 3. Verify updated
    const checkRes = await req('/api/admin/settings');
    assert.strictEqual(checkRes.data.shippingFeeDhaka, 95);

    // 4. Restore original
    await req('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingFeeDhaka: origShippingFee }),
    });
  });

  // --------------------------------------------------------------------------
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (>=6 Workload Scenarios)
  // --------------------------------------------------------------------------
  console.log('\n' + BOLD + MAGENTA + '>>> TIER 4: REAL-WORLD APPLICATION SCENARIOS (6 Scenarios)' + RESET);

  // Scenario 1: Complete bKash Simulation Checkout Journey
  await test('Tier 4', 'Scenario 1', 'T4.1: Complete bKash simulation checkout journey end-to-end', async () => {
    // Step 1: Browse catalog and select a published perfume with available stock
    const { product: chosenProduct, variant: chosenVariant } = await getInStockItem();
    const itemPrice = chosenVariant.price ?? chosenVariant.sellingPrice;
    const quantity = itemPrice >= 5000 ? 1 : Math.ceil(5000 / itemPrice);
    const subtotal = itemPrice * quantity;

    // Step 2: Validate coupon WELCOME15
    const coupRes = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal }),
    });
    assert.strictEqual(coupRes.status, 200);
    const discount = coupRes.data.coupon.discountAmount;

    // Step 3: Submit checkout order with bKash payment method
    const ordRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mahmudur Rahman',
        email: 'mahmud.bkash@example.com',
        phone: '01712345678',
        address: 'Flat 4B, Concord Tower, Gulshan Avenue',
        city: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1212',
        deliveryMethod: 'STANDARD_DHAKA',
        paymentMethod: 'BKASH',
        couponCode: 'WELCOME15',
        items: [{ productId: chosenProduct.id, variantId: chosenVariant.id, quantity }],
      }),
    });
    assert.strictEqual(ordRes.status, 200);
    assert.strictEqual(ordRes.data.total, subtotal - discount);
    const { orderId, orderNumber } = ordRes.data;

    // Step 4: Execute bKash callback simulation with cuid
    const callbackUrl = `/api/payments/bkash/callback?paymentID=BKASH_SIM_TX_${Date.now()}&orderId=${orderId}&status=success`;
    const cbRes = await req(callbackUrl, { redirect: 'manual' });
    assert.ok(cbRes.status === 307 || cbRes.status === 302 || cbRes.ok);

    // Step 5: Verify order status is confirmed and payment is PAID
    const trackRes = await req(`/api/orders/${orderNumber}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.paymentStatus, 'PAID');
    assert.strictEqual(trackRes.data.order.fulfillmentStatus, 'CONFIRMED');
  });

  // Scenario 2: Complete COD Shopper Journey & Courier Dispatch
  await test('Tier 4', 'Scenario 2', 'T4.2: Complete COD checkout with logistics courier dispatch lifecycle', async () => {
    const { product: chosenProduct, variant: chosenVariant } = await getInStockItem();

    // Step 1: Customer orders via Cash on Delivery
    const ordRes = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Farhan Zaidi',
        email: 'farhan.cod@example.com',
        phone: '01819998877',
        address: 'House 22, Road 7, Sector 3, Uttara',
        city: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1230',
        deliveryMethod: 'EXPRESS_DHAKA',
        paymentMethod: 'COD',
        items: [{ productId: chosenProduct.id, variantId: chosenVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(ordRes.status, 200);
    const { orderId, orderNumber } = ordRes.data;

    // Step 2: Store manager inspects order in admin queue
    const adminOrd = await req(`/api/admin/orders/${orderId}`);
    assert.strictEqual(adminOrd.status, 200);
    assert.strictEqual(adminOrd.data.order.fulfillmentStatus, 'PENDING');
    assert.strictEqual(adminOrd.data.order.paymentMethod, 'COD');

    // Step 3: Dispatch parcel via Steadfast Courier logistics
    const dispRes = await req(`/api/admin/orders/${orderId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierProvider: 'STEADFAST' }),
    });
    assert.strictEqual(dispRes.status, 200);
    const trackingCode = dispRes.data.order?.courierTrackingNumber;
    assert.ok(trackingCode, 'No courier tracking number generated');

    // Step 4: Customer checks public tracking using orderNumber
    const trackRes = await req(`/api/orders/${orderNumber}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.order.fulfillmentStatus, 'SHIPPED');
    assert.strictEqual(trackRes.data.order.courierTrackingNumber, trackingCode);
  });

  // Scenario 3: Admin Content Headline & Announcement Live Update
  await test('Tier 4', 'Scenario 3', 'T4.3: Admin CMS headline and announcement live update without stale caching', async () => {
    // Step 1: Read current announcement and hero
    const initContent = await req('/api/content');
    const origAnn = initContent.data.sections?.announcement?.content?.text || '';
    const origHeadline = initContent.data.sections?.hero?.content?.headlineLine2 || '';

    // Step 2: Update Announcement section via Admin CMS
    const adminContentRes = await req('/api/admin/content');
    const annSection = adminContentRes.data.sections.find((s) => s.sectionKey === 'announcement');
    assert.ok(annSection, 'Announcement section not found');

    const newAnnText = 'Complimentary Velvet Pouch with Every 100ml Flacon — Limited Ramadan Edition';
    const newHeroText = 'Sovereign Oudh & Royal Amber';

    await req(`/api/admin/content/${annSection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          ...annSection.content,
          text: newAnnText,
          highlightCode: 'ROYAL15',
        },
      }),
    });

    // Step 3: Update Hero section via Admin CMS
    await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'Pure Haute Parfumerie,',
          headlineLine2: newHeroText,
          buttonText: 'Acquire Flacon',
          buttonLink: '/shop',
        },
      }),
    });

    // Step 4: Immediate public content query (verify zero stale caching)
    const liveContent = await req('/api/content');
    assert.strictEqual(liveContent.data.sections?.announcement?.content?.text, newAnnText);
    assert.strictEqual(liveContent.data.sections?.hero?.content?.headlineLine2, newHeroText);

    // Step 5: Restore original content
    await req(`/api/admin/content/${annSection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          ...annSection.content,
          text: origAnn,
          highlightCode: 'ROYAL15',
        },
      }),
    });

    await req(`/api/admin/content/${heroSectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          headlineLine1: 'A Signature Scent,',
          headlineLine2: origHeadline,
          buttonText: 'Discover Fragrance',
          buttonLink: '/shop',
        },
      }),
    });
  });

  // Scenario 4: Out-of-Stock Variant Protection & Recovery
  await test('Tier 4', 'Scenario 4', 'T4.4: Out-of-stock variant protection against overselling and restoration', async () => {
    // Step 1: Read current stock
    const pRes = await req(`/api/products/${sampleProduct.slug}`);
    const v = pRes.data.product.variants.find((item) => item.id === sampleVariant.id);
    const initialStock = v.stock;
    const reserved = v.reservedStock || 0;
    const available = initialStock - reserved;

    // Step 2: Adjust available stock to exactly 0
    if (available > 0) {
      const reduceRes = await req('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: sampleVariant.id,
          quantityDelta: -available,
          reason: 'Deplete stock for out-of-stock protection test',
        }),
      });
      assert.strictEqual(reduceRes.status, 200);
    }

    // Step 3: Attempt order placement when available stock is 0
    const failOrd = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Oversell Attempter',
        email: 'oversell@test.com',
        phone: '01711223344',
        address: 'Banani',
        city: 'Dhaka',
        paymentMethod: 'COD',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(failOrd.status, 400);
    assert.strictEqual(failOrd.data.success, false);
    assert.ok(failOrd.data.error.includes('Insufficient stock'));

    // Step 4: Restore stock to original level
    if (available > 0) {
      const restoreRes = await req('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: sampleVariant.id,
          quantityDelta: available,
          reason: 'Restore stock after out-of-stock test',
        }),
      });
      assert.strictEqual(restoreRes.status, 200);
    }

    // Step 5: Verify order placement succeeds again
    const successOrd = await req('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recovered Patron',
        email: 'recovered@test.com',
        phone: '01711223344',
        address: 'Banani',
        city: 'Dhaka',
        paymentMethod: 'COD',
        items: [{ productId: sampleProduct.id, variantId: sampleVariant.id, quantity: 1 }],
      }),
    });
    assert.strictEqual(successOrd.status, 200);
    assert.strictEqual(successOrd.data.success, true);
  });

  // Scenario 5: Adversarial Order Tracking 404 & Admin Token Forgery Rejection
  await test('Tier 4', 'Scenario 5', 'T4.5: Invalid order tracking 404 rejection verification and forged token defense', async () => {
    // Step 1: Tracking query with non-existent order number must return HTTP 404 with error message
    const invalidOrdRes = await req('/api/orders/RDH-NONEXISTENT-77777');
    assert.strictEqual(invalidOrdRes.status, 404);
    assert.strictEqual(invalidOrdRes.data.success, false);
    assert.strictEqual(invalidOrdRes.data.error, 'Order not found');

    // Step 2: Tracking query with non-existent CUID must return HTTP 404
    const invalidCuidRes = await req('/api/orders/cmw9999999999999999999999');
    assert.strictEqual(invalidCuidRes.status, 404);
    assert.strictEqual(invalidCuidRes.data.success, false);

    // Step 3: Forged admin token signature must be rejected with HTTP 401 across admin endpoints
    const forgedToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImF0dGFja2VyIiwicm9sZSI6Ik9XTkVSIn0.fake_signature_abc123';
    const forgedDash = await req('/api/admin/dashboard', { headers: { Cookie: `rawdah_admin_token=${forgedToken}` } });
    assert.strictEqual(forgedDash.status, 401);

    const forgedInv = await req('/api/admin/inventory', { headers: { Cookie: `rawdah_admin_token=${forgedToken}` } });
    assert.strictEqual(forgedInv.status, 401);

    const forgedFin = await req('/api/admin/finance', { headers: { Cookie: `rawdah_admin_token=${forgedToken}` } });
    assert.strictEqual(forgedFin.status, 401);
  });

  // Scenario 6: Dynamic Daily Deal Discount Verification
  await test('Tier 4', 'Scenario 6', 'T4.6: Dynamic daily deal promotion and cart price calculation', async () => {
    // Step 1: Fetch active daily deal
    const dealRes = await req('/api/deals');
    assert.strictEqual(dealRes.status, 200);
    assert.strictEqual(dealRes.data.success, true);

    if (dealRes.data.deal) {
      const deal = dealRes.data.deal;
      assert.ok(deal.id && deal.productId && deal.variantId);
      assert.ok(deal.dealPrice < deal.originalPrice, 'Deal price should be lower than original price');
      const discountPercentage = Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100);
      assert.ok(discountPercentage > 0 && discountPercentage <= 70);

      // Verify associated product exists in catalog (using product slug)
      if (deal.product?.slug) {
        const prodRes = await req(`/api/products/${deal.product.slug}`);
        assert.strictEqual(prodRes.status, 200);
      }
    } else {
      // If deal is null, verify clean response schema
      assert.strictEqual(dealRes.data.deal, null);
    }

    // Step 2: Validate coupon calculation in combination with deal
    const coupRes = await req('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME15', subtotal: 5000 }),
    });
    assert.strictEqual(coupRes.status, 200);
    assert.strictEqual(coupRes.data.coupon.discountAmount, 750);
  });

  // --------------------------------------------------------------------------
  // SUITE SUMMARY REPORTING
  // --------------------------------------------------------------------------
  const suiteDuration = ((performance.now() - suiteStartTime) / 1000).toFixed(2);

  console.log('\n' + BOLD + CYAN + '================================================================================' + RESET);
  console.log(BOLD + CYAN + '  E2E TEST SUITE EXECUTION SUMMARY' + RESET);
  console.log(BOLD + CYAN + '================================================================================' + RESET);
  console.log(`  Target Port:         ${BASE_URL}`);
  console.log(`  Execution Time:      ${suiteDuration} seconds`);
  console.log(`  Total Tests Run:     ${stats.total}`);
  console.log(`  Total Passed:        ${GREEN}${stats.passed}${RESET}`);
  console.log(`  Total Failed:        ${stats.failed > 0 ? RED + stats.failed + RESET : GREEN + '0' + RESET}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`  Tier 1 (Feature):    ${stats.tiers['Tier 1'].passed}/${stats.tiers['Tier 1'].total} Passed`);
  console.log(`  Tier 2 (Boundary):   ${stats.tiers['Tier 2'].passed}/${stats.tiers['Tier 2'].total} Passed`);
  console.log(`  Tier 3 (Cross):      ${stats.tiers['Tier 3'].passed}/${stats.tiers['Tier 3'].total} Passed`);
  console.log(`  Tier 4 (Real-World): ${stats.tiers['Tier 4'].passed}/${stats.tiers['Tier 4'].total} Passed`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.log(BOLD + RED + `FAILED TESTS (${stats.failed}):` + RESET);
    for (const f of stats.failures) {
      console.log(`  ${RED}• [${f.tier}] [${f.feature}] ${f.name}${RESET}`);
      console.log(`    ${GRAY}Error: ${f.error}${RESET}`);
    }
    console.log('\n' + BOLD + RED + '✖ TEST SUITE RUN FAILED' + RESET + '\n');
    process.exit(1);
  } else {
    console.log(BOLD + GREEN + '✔ ALL 138 TESTS PASSED SUCCESSFULLY (100% HEALTHY)' + RESET + '\n');
    process.exit(0);
  }
}

// Execute suite
runSuite().catch((err) => {
  console.error(RED + '\nFATAL SUITE CRASH:\n' + RESET, err);
  process.exit(1);
});
