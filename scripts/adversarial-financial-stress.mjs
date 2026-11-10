import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3005';
const prisma = new PrismaClient();

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(name, passed, message = '', extra = {}) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name} - ${message}`);
  }
  results.details.push({ name, passed, message, ...extra });
}

async function run() {
  console.log('================================================================');
  console.log('  ADVERSARIAL STRESS TEST SUITE — MILESTONE 3 (CHALLENGER 1)');
  console.log(`  Target Host: ${BASE_URL}`);
  console.log('================================================================\n');

  // ============================================================================
  // STAGE 0: Initial DB Snapshot
  // ============================================================================
  console.log('--- STAGE 0: DATABASE PRE-TEST SNAPSHOT ---');
  const targetOrder = await prisma.order.findFirst({
    where: { OR: [{ orderNumber: 'RDH-10491' }, { id: 'cmw39a0rw0040o0pktyl671p6' }] }
  });

  if (!targetOrder) {
    throw new Error('Target order RDH-10491 / cmw39a0rw0040o0pktyl671p6 not found in DB!');
  }
  console.log(`Found target order: ${targetOrder.orderNumber} (ID: ${targetOrder.id})`);
  console.log(`Payment Status: ${targetOrder.paymentStatus}, Total: ${targetOrder.total}`);

  const initialTxCount = await prisma.paymentTransaction.count();
  const initialLedgerCount = await prisma.financeLedger.count();
  const initialAccounts = await prisma.financeAccount.findMany();
  const bkashAccountPre = initialAccounts.find(a => a.type === 'BKASH');

  console.log(`Initial PaymentTransaction count: ${initialTxCount}`);
  console.log(`Initial FinanceLedger count: ${initialLedgerCount}`);
  console.log(`Initial bKash Account Balance: ${bkashAccountPre ? bkashAccountPre.currentBalance : 'N/A'}\n`);

  // ============================================================================
  // SCOPE 1: bKash Callback Idempotency Stress Test
  // ============================================================================
  console.log('--- SCOPE 1: bKASH CALLBACK IDEMPOTENCY CONCURRENCY STRESS TEST ---');
  
  // 1.1: 5 Rapid/Concurrent GET requests with orderNumber (RDH-10491)
  console.log('Firing 5 concurrent requests with orderNumber=RDH-10491...');
  const orderNumPromises = Array.from({ length: 5 }, (_, i) => {
    const url = `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_STRESS_NUM_${i + 1}&orderId=RDH-10491&status=success`;
    return fetch(url, { redirect: 'manual' }).then(res => ({
      index: i + 1,
      status: res.status,
      location: res.headers.get('location') || ''
    }));
  });

  const orderNumResponses = await Promise.all(orderNumPromises);
  let orderNumAll307 = true;
  let orderNumAllRedirectPaid = true;

  orderNumResponses.forEach(r => {
    console.log(`  Req #${r.index}: HTTP ${r.status} -> ${r.location}`);
    if (r.status !== 307) orderNumAll307 = false;
    if (!r.location.includes('/order-confirmation') || !r.location.includes('paid=true') || !r.location.includes('RDH-10491')) {
      orderNumAllRedirectPaid = false;
    }
  });

  recordTest(
    'Scope 1.1: 5 concurrent callback requests with orderNumber return HTTP 307',
    orderNumAll307,
    `Expected all 307, got statuses: ${orderNumResponses.map(r => r.status).join(', ')}`
  );

  recordTest(
    'Scope 1.1: 5 concurrent callback requests redirect to /order-confirmation with paid=true',
    orderNumAllRedirectPaid,
    `Locations: ${orderNumResponses.map(r => r.location).join('; ')}`
  );

  // 1.2: 5 Rapid/Concurrent GET requests with CUID (cmw39a0rw0040o0pktyl671p6)
  console.log('\nFiring 5 concurrent requests with orderId=CUID (cmw39a0rw0040o0pktyl671p6)...');
  const cuidPromises = Array.from({ length: 5 }, (_, i) => {
    const url = `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_STRESS_CUID_${i + 1}&orderId=${targetOrder.id}&status=success`;
    return fetch(url, { redirect: 'manual' }).then(res => ({
      index: i + 1,
      status: res.status,
      location: res.headers.get('location') || ''
    }));
  });

  const cuidResponses = await Promise.all(cuidPromises);
  let cuidAll307 = true;
  let cuidAllRedirectPaid = true;

  cuidResponses.forEach(r => {
    console.log(`  Req #${r.index}: HTTP ${r.status} -> ${r.location}`);
    if (r.status !== 307) cuidAll307 = false;
    if (!r.location.includes('/order-confirmation') || !r.location.includes('paid=true') || !r.location.includes(targetOrder.id)) {
      cuidAllRedirectPaid = false;
    }
  });

  recordTest(
    'Scope 1.2: 5 concurrent callback requests with CUID return HTTP 307',
    cuidAll307,
    `Expected all 307, got statuses: ${cuidResponses.map(r => r.status).join(', ')}`
  );

  recordTest(
    'Scope 1.2: 5 concurrent callback requests redirect to /order-confirmation with paid=true & CUID',
    cuidAllRedirectPaid,
    `Locations: ${cuidResponses.map(r => r.location).join('; ')}`
  );

  // 1.3: Database state verification after 10 concurrent callback attempts
  const postTxCount = await prisma.paymentTransaction.count();
  const postLedgerCount = await prisma.financeLedger.count();
  const postAccounts = await prisma.financeAccount.findMany();
  const bkashAccountPost = postAccounts.find(a => a.type === 'BKASH');

  console.log(`\nDB Post-Check:`);
  console.log(`  PaymentTransaction: initial=${initialTxCount}, post=${postTxCount} (delta=${postTxCount - initialTxCount})`);
  console.log(`  FinanceLedger: initial=${initialLedgerCount}, post=${postLedgerCount} (delta=${postLedgerCount - initialLedgerCount})`);
  console.log(`  bKash Account Balance: pre=${bkashAccountPre?.currentBalance}, post=${bkashAccountPost?.currentBalance}`);

  recordTest(
    'Scope 1.3: Zero new PaymentTransaction records created under concurrent callbacks',
    postTxCount === initialTxCount,
    `Expected ${initialTxCount}, got ${postTxCount}`
  );

  recordTest(
    'Scope 1.3: Zero new FinanceLedger records created under concurrent callbacks',
    postLedgerCount === initialLedgerCount,
    `Expected ${initialLedgerCount}, got ${postLedgerCount}`
  );

  recordTest(
    'Scope 1.3: FinanceAccount currentBalance remained strictly unchanged',
    bkashAccountPre && bkashAccountPost && bkashAccountPre.currentBalance === bkashAccountPost.currentBalance,
    `Balance shifted from ${bkashAccountPre?.currentBalance} to ${bkashAccountPost?.currentBalance}`
  );

  // ============================================================================
  // SCOPE 2: Negative & Malformed Callback Stress Test
  // ============================================================================
  console.log('\n--- SCOPE 2: NEGATIVE & MALFORMED CALLBACK STRESS TEST ---');

  // 2.1: Non-existent order ID RDH-999999
  const resNonExistent = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_INVALID_1&orderId=RDH-999999&status=success`,
    { redirect: 'manual' }
  );
  const locNonExistent = resNonExistent.headers.get('location') || '';
  console.log(`Non-existent order (RDH-999999): HTTP ${resNonExistent.status} -> ${locNonExistent}`);
  recordTest(
    'Scope 2.1: Non-existent order ID redirects to /checkout?error=Order+not+found with HTTP 307',
    resNonExistent.status === 307 && locNonExistent.includes('/checkout?error=Order+not+found'),
    `Status: ${resNonExistent.status}, Location: ${locNonExistent}`
  );

  // 2.2: status=cancel on existing order
  // Note: if order is already paid, does status=cancel redirect to order-confirmation or /checkout?
  // Let's check: in route.ts, lines 29-31: if order is already paid, it redirects to confirmation.
  // What about for an unpaid order? Let's check status=cancel on an unpaid order or non-paid scenario.
  // First, test status=cancel with non-existent or fresh order, or let's create a temporary test order to test negative status before payment.
  console.log('Creating a temporary unpaid order to test status=cancel and status=failure...');
  const tempOrder = await prisma.order.create({
    data: {
      orderNumber: `RDH-STRESS-TEMP-${Date.now()}`,
      customerName: 'Adversarial Stress Tester',
      customerEmail: 'stress@rawdahperfumes.com',
      customerPhone: '01700000000',
      shippingAddress: 'Stress Test Lab, Dhaka',
      total: 3500,
      subtotal: 3500,
      shippingFee: 80,
      paymentMethod: 'BKASH',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      itemsSnapshot: '[]',
    }
  });
  console.log(`Created temp unpaid order: ${tempOrder.orderNumber} (ID: ${tempOrder.id})`);

  // Test status=cancel on unpaid order
  const resCancel = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_CANCEL_1&orderId=${tempOrder.id}&status=cancel`,
    { redirect: 'manual' }
  );
  const locCancel = resCancel.headers.get('location') || '';
  console.log(`status=cancel on unpaid order: HTTP ${resCancel.status} -> ${locCancel}`);
  recordTest(
    'Scope 2.2a: Callback with status=cancel redirects to /checkout?error=bKash+payment+was+cancel',
    resCancel.status === 307 && locCancel.includes('/checkout?error=bKash+payment+was+cancel'),
    `Status: ${resCancel.status}, Location: ${locCancel}`
  );

  // Test status=failure on unpaid order
  const resFailure = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_FAIL_1&orderId=${tempOrder.id}&status=failure`,
    { redirect: 'manual' }
  );
  const locFailure = resFailure.headers.get('location') || '';
  console.log(`status=failure on unpaid order: HTTP ${resFailure.status} -> ${locFailure}`);
  recordTest(
    'Scope 2.2b: Callback with status=failure redirects to /checkout?error=bKash+payment+was+failure',
    resFailure.status === 307 && locFailure.includes('/checkout?error=bKash+payment+was+failure'),
    `Status: ${resFailure.status}, Location: ${locFailure}`
  );

  // Test status=cancel with orderNumber
  const resCancelNum = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_CANCEL_2&orderId=${tempOrder.orderNumber}&status=cancel`,
    { redirect: 'manual' }
  );
  const locCancelNum = resCancelNum.headers.get('location') || '';
  recordTest(
    'Scope 2.2c: Callback with status=cancel and orderNumber redirects correctly',
    resCancelNum.status === 307 && locCancelNum.includes('/checkout?error=bKash+payment+was+cancel'),
    `Status: ${resCancelNum.status}, Location: ${locCancelNum}`
  );

  // Clean up temp order
  await prisma.order.delete({ where: { id: tempOrder.id } });
  console.log('Temp unpaid order cleaned up.');

  // 2.3: Callback without orderId parameter
  const resMissingOrderId = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_NO_ORDER&status=success`,
    { redirect: 'manual' }
  );
  const locMissingOrderId = resMissingOrderId.headers.get('location') || '';
  console.log(`Callback without orderId: HTTP ${resMissingOrderId.status} -> ${locMissingOrderId}`);
  recordTest(
    'Scope 2.3: Callback without orderId redirects cleanly to /checkout?error=Missing+order+id without crashing',
    resMissingOrderId.status === 307 && locMissingOrderId.includes('/checkout?error=Missing+order+id'),
    `Status: ${resMissingOrderId.status}, Location: ${locMissingOrderId}`
  );

  // 2.4: Malformed query parameters (empty strings, special characters, SQL injection probe)
  const resSqlProbe = await fetch(
    `${BASE_URL}/api/payments/bkash/callback?paymentID=BK_SQL&orderId=' OR '1'='1&status=success`,
    { redirect: 'manual' }
  );
  const locSqlProbe = resSqlProbe.headers.get('location') || '';
  recordTest(
    'Scope 2.4a: SQL injection probe in orderId is handled safely without 500 error',
    resSqlProbe.status === 307 && locSqlProbe.includes('/checkout?error=Order+not+found'),
    `Status: ${resSqlProbe.status}, Location: ${locSqlProbe}`
  );

  const resEmptyParams = await fetch(
    `${BASE_URL}/api/payments/bkash/callback`,
    { redirect: 'manual' }
  );
  recordTest(
    'Scope 2.4b: Completely empty callback parameters handled safely with 307 redirect',
    resEmptyParams.status === 307,
    `Status: ${resEmptyParams.status}`
  );

  // ============================================================================
  // SCOPE 3: Cryptographic Token Tampering Stress Test
  // ============================================================================
  console.log('\n--- SCOPE 3: CRYPTOGRAPHIC TOKEN TAMPERING STRESS TEST ---');

  // 3.1: Admin login with valid credentials
  console.log('Testing admin login with valid credentials...');
  const resValidLogin = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'RawdahOwner2026!' })
  });
  const dataValidLogin = await resValidLogin.json();
  const setCookie = resValidLogin.headers.get('set-cookie') || '';
  const tokenMatch = setCookie.match(/rawdah_admin_token=([^;]+)/);
  const validToken = tokenMatch ? tokenMatch[1] : null;

  console.log(`Valid login: HTTP ${resValidLogin.status}, success: ${dataValidLogin.success}`);
  recordTest(
    'Scope 3.1a: Admin login with valid credentials returns HTTP 200 and success=true',
    resValidLogin.status === 200 && dataValidLogin.success === true,
    `Status: ${resValidLogin.status}, Body: ${JSON.stringify(dataValidLogin)}`
  );

  recordTest(
    'Scope 3.1b: Admin login sets rawdah_admin_token cookie with valid HMAC signature',
    !!validToken && validToken.includes('.'),
    `Cookie token: ${validToken?.substring(0, 30)}...`
  );

  // Verify valid token grants access to /api/admin/orders
  const resValidAccess = await fetch(`${BASE_URL}/api/admin/orders`, {
    headers: { 'Cookie': `rawdah_admin_token=${validToken}` }
  });
  recordTest(
    'Scope 3.1c: Valid admin token successfully accesses /api/admin/orders (HTTP 200)',
    resValidAccess.status === 200,
    `Status: ${resValidAccess.status}`
  );

  // 3.2: Admin login with invalid credentials
  console.log('Testing admin login with invalid password...');
  const resInvalidLogin = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rawdahperfumes.com', password: 'WrongPassword999!' })
  });
  console.log(`Invalid password login: HTTP ${resInvalidLogin.status}`);
  recordTest(
    'Scope 3.2a: Admin login with invalid password returns HTTP 401 Unauthorized',
    resInvalidLogin.status === 401,
    `Status: ${resInvalidLogin.status}`
  );

  console.log('Testing admin login with non-existent email...');
  const resNonExistentEmail = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'intruder@hacker.io', password: 'RawdahOwner2026!' })
  });
  console.log(`Non-existent email login: HTTP ${resNonExistentEmail.status}`);
  recordTest(
    'Scope 3.2b: Admin login with non-existent email returns HTTP 401 Unauthorized',
    resNonExistentEmail.status === 401,
    `Status: ${resNonExistentEmail.status}`
  );

  // 3.3: Cryptographic Token Tampering & Forgery Attacks
  if (validToken) {
    const [payloadBase, originalSig] = validToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadBase, 'base64url').toString('utf8'));
    console.log('\nDecoded legitimate payload:', decodedPayload);

    // Attack 1: Modify payload claims (privilege escalation / identity switch) keeping original signature
    console.log('Attack 1: Tampered payload claims with legitimate signature...');
    const tamperedPayload = { ...decodedPayload, role: 'OWNER', email: 'forged_admin@attacker.com' };
    const tamperedPayloadBase = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
    const forgedClaimToken = `${tamperedPayloadBase}.${originalSig}`;

    const resForgedClaimOrders = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `rawdah_admin_token=${forgedClaimToken}` }
    });
    const resForgedClaimContent = await fetch(`${BASE_URL}/api/admin/content`, {
      headers: { 'Authorization': `Bearer ${forgedClaimToken}` }
    });
    recordTest(
      'Scope 3.3a: Forged payload claim rejected on /api/admin/orders with HTTP 401',
      resForgedClaimOrders.status === 401,
      `Status: ${resForgedClaimOrders.status}`
    );
    recordTest(
      'Scope 3.3b: Forged payload claim rejected on /api/admin/content via Bearer with HTTP 401',
      resForgedClaimContent.status === 401,
      `Status: ${resForgedClaimContent.status}`
    );

    // Attack 2: Tampered signature bytes (bit flip / corrupt signature)
    console.log('Attack 2: Corrupted HMAC signature bytes...');
    const corruptedSig = originalSig.slice(0, -4) + 'AAAA';
    const corruptedSigToken = `${payloadBase}.${corruptedSig}`;

    const resCorruptSigOrders = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `rawdah_admin_token=${corruptedSigToken}` }
    });
    recordTest(
      'Scope 3.3c: Corrupted HMAC signature rejected on /api/admin/orders with HTTP 401',
      resCorruptSigOrders.status === 401,
      `Status: ${resCorruptSigOrders.status}`
    );

    // Attack 3: Stripped signature (algorithm none / missing signature)
    console.log('Attack 3: Stripped signature / missing HMAC...');
    const strippedSigToken = `${payloadBase}.`;
    const noSigToken = payloadBase;

    const resStrippedSig = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `rawdah_admin_token=${strippedSigToken}` }
    });
    const resNoSig = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `rawdah_admin_token=${noSigToken}` }
    });
    recordTest(
      'Scope 3.3d: Token with trailing dot but empty signature rejected with HTTP 401',
      resStrippedSig.status === 401,
      `Status: ${resStrippedSig.status}`
    );
    recordTest(
      'Scope 3.3e: Token without signature delimiter rejected with HTTP 401',
      resNoSig.status === 401,
      `Status: ${resNoSig.status}`
    );

    // Attack 4: Expired token timestamp (replay attack simulation)
    console.log('Attack 4: Expired token timestamp...');
    const SECRET = process.env.ADMIN_SESSION_SECRET || 'rawdah_luxury_haute_parfumerie_secret_key_2026_dhaka';
    const expiredPayload = { ...decodedPayload, exp: Date.now() - 3600000 }; // 1 hour ago
    const expiredPayloadBase = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const expiredSig = crypto.createHmac('sha256', SECRET).update(expiredPayloadBase).digest('base64url');
    const expiredToken = `${expiredPayloadBase}.${expiredSig}`;

    const resExpired = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `rawdah_admin_token=${expiredToken}` }
    });
    recordTest(
      'Scope 3.3f: Cryptographically valid but expired token rejected with HTTP 401',
      resExpired.status === 401,
      `Status: ${resExpired.status}`
    );

    // Attack 5: Arbitrary malformed strings and random garbage in Auth header
    console.log('Attack 5: Random garbage & SQL injection in Authorization header...');
    const garbageHeaders = [
      'Bearer invalid_garbage_token_12345',
      'Bearer \' OR 1=1 --',
      'Bearer <script>alert(1)</script>',
      'Basic YWRtaW46cGFzc3dvcmQ=',
      'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.'
    ];

    for (let i = 0; i < garbageHeaders.length; i++) {
      const gHeader = garbageHeaders[i];
      const resGarbage = await fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { 'Authorization': gHeader }
      });
      recordTest(
        `Scope 3.3g.${i + 1}: Malformed header (${gHeader.slice(0, 25)}...) rejected with HTTP 401`,
        resGarbage.status === 401,
        `Status: ${resGarbage.status}`
      );
    }
  }

  // ============================================================================
  // FINAL RE-CHECK OF DATABASE INTEGRITY
  // ============================================================================
  console.log('\n--- FINAL DATABASE INTEGRITY AUDIT ---');
  const finalTxCount = await prisma.paymentTransaction.count();
  const finalLedgerCount = await prisma.financeLedger.count();
  const finalAccounts = await prisma.financeAccount.findMany();
  const bkashAccountFinal = finalAccounts.find(a => a.type === 'BKASH');

  console.log(`Final PaymentTransaction count: ${finalTxCount} (Initial: ${initialTxCount})`);
  console.log(`Final FinanceLedger count: ${finalLedgerCount} (Initial: ${initialLedgerCount})`);
  console.log(`Final bKash Account Balance: ${bkashAccountFinal?.currentBalance} (Initial: ${bkashAccountPre?.currentBalance})`);

  recordTest(
    'Audit: Total PaymentTransactions delta across entire stress test is exactly 0',
    finalTxCount === initialTxCount,
    `Delta: ${finalTxCount - initialTxCount}`
  );

  recordTest(
    'Audit: Total FinanceLedger delta across entire stress test is exactly 0',
    finalLedgerCount === initialLedgerCount,
    `Delta: ${finalLedgerCount - initialLedgerCount}`
  );

  recordTest(
    'Audit: bKash FinanceAccount currentBalance remained perfectly static',
    bkashAccountPre?.currentBalance === bkashAccountFinal?.currentBalance,
    `Pre: ${bkashAccountPre?.currentBalance}, Final: ${bkashAccountFinal?.currentBalance}`
  );

  console.log('\n================================================================');
  console.log(`  STRESS TEST SUMMARY: ${results.passed}/${results.total} PASSED (${Math.round((results.passed / results.total) * 100)}%)`);
  console.log(`  Failed: ${results.failed}`);
  console.log('================================================================\n');

  return results;
}

run()
  .catch(err => {
    console.error('Fatal stress test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
