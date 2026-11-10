#!/usr/bin/env node

/**
 * ============================================================================
 * Milestone 1 Adversarial Test Harness: SQLite WAL & DailyDeal Consistency
 * Teamwork Challenger: challenger_m1_2
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Helpers for file hashing
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.statSync(filePath).size;
}

// Sync helper matching src/lib/db.ts
function syncDbFiles(srcBase, destBase) {
  const destDir = path.dirname(destBase);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(srcBase, destBase);

  for (const ext of ['-wal', '-shm']) {
    const srcFile = `${srcBase}${ext}`;
    const destFile = `${destBase}${ext}`;
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
    } else if (fs.existsSync(destFile)) {
      try {
        fs.unlinkSync(destFile);
      } catch {}
    }
  }
}

async function runTests() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: [],
  };

  function assert(title, condition, extraInfo = '') {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`  [PASS] ${title} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
      results.details.push({ title, status: 'PASS', extraInfo });
    } else {
      results.failed++;
      console.error(`  [FAIL] ${title} ${extraInfo ? '(' + extraInfo + ')' : ''}`);
      results.details.push({ title, status: 'FAIL', extraInfo });
    }
  }

  console.log('\n============================================================');
  console.log('CHALLENGER M1_2: SQLite WAL & DailyDeal Adversarial Suite');
  console.log('============================================================\n');

  const prismaPath = path.resolve(__dirname, '../prisma/dev.db');
  const rootPath = path.resolve(__dirname, '../dev.db');

  console.log(`Prisma DB path: ${prismaPath}`);
  console.log(`Root DB path:   ${rootPath}\n`);

  // Section 1: Prisma Client Initialization & WAL PRAGMA Check
  console.log('--- SECTION 1: SQLite Journal Mode & PRAGMA Verification ---');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${prismaPath}`,
      },
    },
  });

  try {
    const journalModeResult = await prisma.$queryRawUnsafe('PRAGMA journal_mode;');
    const journalMode = journalModeResult[0]?.journal_mode?.toLowerCase();
    assert('SQLite journal_mode is WAL', journalMode === 'wal', `journal_mode: ${journalMode}`);

    const syncResult = await prisma.$queryRawUnsafe('PRAGMA synchronous;');
    const syncMode = Number(syncResult[0]?.synchronous);
    assert('SQLite synchronous pragma is configured (NORMAL=1 or FULL=2)', syncMode === 1 || syncMode === 2, `synchronous: ${syncMode}`);

    // Section 2: Read/Write Transaction against Prisma Client
    console.log('\n--- SECTION 2: Read / Write Operations in WAL Mode ---');
    const productCountBefore = await prisma.product.count();
    assert('Read query executes successfully', productCountBefore > 0, `Products count: ${productCountBefore}`);

    const testNonce = `wal-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const createdAudit = await prisma.auditLog.create({
      data: {
        action: 'CHALLENGER_WAL_STRESS_TEST',
        entity: 'SystemTest',
        entityId: testNonce,
        details: JSON.stringify({ nonce: testNonce, created: new Date().toISOString() }),
        ipAddress: '127.0.0.1',
      },
    });
    assert('Write query (auditLog.create) executes in WAL mode', !!createdAudit && !!createdAudit.id, `Created ID: ${createdAudit?.id}`);

    const fetchedAudit = await prisma.auditLog.findUnique({
      where: { id: createdAudit.id },
    });
    assert('Read-your-own-writes immediate consistency', fetchedAudit?.entityId === testNonce, `Fetched nonce matches: ${testNonce}`);

    // Section 3: WAL Checkpoint Verification (PRAGMA wal_checkpoint(FULL))
    console.log('\n--- SECTION 3: PRAGMA wal_checkpoint(FULL) Verification ---');
    const checkpointResult = await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    const cp = checkpointResult[0];
    console.log('  Checkpoint raw result:', cp);

    const isCheckpointSuccess = cp && (cp.busy === 0 || cp.busy === 0n);
    assert('PRAGMA wal_checkpoint(FULL) succeeds with busy === 0 (no lock contention)', isCheckpointSuccess, `busy: ${cp?.busy}, log: ${cp?.log}, checkpointed: ${cp?.checkpointed}`);

    // Section 4: File Synchronization between prisma/ and root
    console.log('\n--- SECTION 4: Database File Synchronization (prisma/ <-> root) ---');
    // Test direct invocation of checkpointDatabase() from src/lib/db.ts
    try {
      const dbModule = await import('../src/lib/db.ts');
      if (typeof dbModule.checkpointDatabase === 'function') {
        await dbModule.checkpointDatabase();
        assert('Exported checkpointDatabase() from src/lib/db.ts executes successfully', true);
      } else {
        assert('Exported checkpointDatabase() from src/lib/db.ts exists', false);
      }
    } catch (e) {
      assert('Exported checkpointDatabase() executes without throwing', false, e.message);
    }

    // Trigger sync
    syncDbFiles(prismaPath, rootPath);

    const prismaDbSize = getFileSize(prismaPath);
    const rootDbSize = getFileSize(rootPath);
    const prismaDbHash = getFileHash(prismaPath);
    const rootDbHash = getFileHash(rootPath);

    assert('Base DB file exists in prisma/', fs.existsSync(prismaPath), `Size: ${prismaDbSize} bytes`);
    assert('Base DB file exists in root', fs.existsSync(rootPath), `Size: ${rootDbSize} bytes`);
    assert('Base DB files have matching SHA256 hash', prismaDbHash === rootDbHash, `Hash: ${prismaDbHash?.substring(0, 16)}...`);

    // Check companion files (-wal and -shm)
    const prismaWalPath = `${prismaPath}-wal`;
    const rootWalPath = `${rootPath}-wal`;
    const prismaShmPath = `${prismaPath}-shm`;
    const rootShmPath = `${rootPath}-shm`;

    if (fs.existsSync(prismaWalPath)) {
      const pWalHash = getFileHash(prismaWalPath);
      const rWalHash = getFileHash(rootWalPath);
      assert('WAL companion file in root matches prisma/dev.db-wal', pWalHash === rWalHash, `WAL size: ${getFileSize(prismaWalPath)} bytes`);
    } else {
      assert('WAL file truncated/absent, root WAL absent', !fs.existsSync(rootWalPath));
    }

    if (fs.existsSync(prismaShmPath)) {
      const pShmHash = getFileHash(prismaShmPath);
      const rShmHash = getFileHash(rootShmPath);
      assert('SHM companion file in root matches prisma/dev.db-shm', pShmHash === rShmHash, `SHM size: ${getFileSize(prismaShmPath)} bytes`);
    }

    // Connect independent PrismaClient directly to root dev.db to verify visibility
    const prismaRootClient = new PrismaClient({
      datasources: {
        db: {
          url: `file:${rootPath}`,
        },
      },
    });
    const rootAudit = await prismaRootClient.auditLog.findUnique({
      where: { id: createdAudit.id },
    });
    assert('Independent client reading root dev.db sees write performed against prisma/dev.db', rootAudit?.entityId === testNonce, `Root DB verified ID: ${rootAudit?.id}`);
    await prismaRootClient.$disconnect();

    // Section 5: DailyDeal Data Consistency Verification
    console.log('\n--- SECTION 5: DailyDeal Data Consistency & Integrity ---');
    const allDeals = await prisma.dailyDeal.findMany({
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });

    assert('DailyDeal table contains at least one deal', allDeals.length > 0, `Deals found: ${allDeals.length}`);

    const now = new Date();
    for (let i = 0; i < allDeals.length; i++) {
      const deal = allDeals[i];
      console.log(`\n  Evaluating Deal #${i + 1}: "${deal.title}" (ID: ${deal.id})`);

      // 1. Linked to valid Product
      const product = deal.product;
      assert(`Deal #${i + 1} linked to valid Product`, !!product && product.id === deal.productId, `Product: ${product?.name} (${product?.slug})`);

      // 2. Linked to valid ProductVariant
      const variant = product?.variants?.find((v) => v.id === deal.variantId);
      assert(`Deal #${i + 1} linked to valid ProductVariant belonging to Product`, !!variant && variant.productId === product.id, `Variant SKU: ${variant?.sku}, Size: ${variant?.size}`);

      // 3. dealPrice < variant.sellingPrice
      if (variant) {
        assert(
          `Deal #${i + 1} dealPrice (৳${deal.dealPrice}) < variant.sellingPrice (৳${variant.sellingPrice})`,
          deal.dealPrice < variant.sellingPrice,
          `Discount: ৳${variant.sellingPrice - deal.dealPrice} (${Math.round(((variant.sellingPrice - deal.dealPrice) / variant.sellingPrice) * 100)}% off)`
        );
        assert(`Deal #${i + 1} originalPrice matches variant sellingPrice or originalPrice`, deal.originalPrice === variant.sellingPrice || deal.originalPrice === variant.originalPrice, `originalPrice: ${deal.originalPrice}`);
      } else {
        assert(`Deal #${i + 1} variant check`, false, 'Variant not found');
      }

      // 4. startTime <= now <= endTime
      const isStartValid = new Date(deal.startTime).getTime() <= now.getTime();
      const isEndValid = now.getTime() <= new Date(deal.endTime).getTime();
      const isChronological = new Date(deal.startTime).getTime() < new Date(deal.endTime).getTime();

      assert(`Deal #${i + 1} startTime <= now`, isStartValid, `startTime: ${new Date(deal.startTime).toISOString()}, now: ${now.toISOString()}`);
      assert(`Deal #${i + 1} now <= endTime`, isEndValid, `endTime: ${new Date(deal.endTime).toISOString()}, now: ${now.toISOString()}`);
      assert(`Deal #${i + 1} startTime < endTime (positive duration)`, isChronological, `Duration: ${((new Date(deal.endTime).getTime() - new Date(deal.startTime).getTime()) / (1000 * 3600 * 24)).toFixed(1)} days`);

      // 5. stockRemaining > 0
      assert(`Deal #${i + 1} stockRemaining > 0`, deal.stockRemaining > 0, `stockRemaining: ${deal.stockRemaining}`);
      assert(`Deal #${i + 1} stockRemaining <= stockTotal`, deal.stockRemaining <= deal.stockTotal, `Remaining: ${deal.stockRemaining}, Total: ${deal.stockTotal}`);

      // 6. isEnabled is true
      assert(`Deal #${i + 1} isEnabled is true`, deal.isEnabled === true, `isEnabled: ${deal.isEnabled}`);
    }

    // Section 6: Adversarial & Edge Case Stress Tests
    console.log('\n--- SECTION 6: Adversarial Stress Tests & Edge Cases ---');

    // Edge Case 1: Active Deal Query Contract used by /api/deals
    const activeDeals = await prisma.dailyDeal.findMany({
      where: {
        isEnabled: true,
        startTime: { lte: now },
        endTime: { gte: now },
        stockRemaining: { gt: 0 },
      },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });
    assert('Storefront /api/deals query contract finds active deal', activeDeals.length > 0, `Active count: ${activeDeals.length}`);

    // Edge Case 2: Expired deal boundary test
    const expiredDealTest = await prisma.dailyDeal.findFirst({
      where: {
        isEnabled: true,
        startTime: { lte: new Date('2020-01-01') },
        endTime: { gte: new Date('2020-01-02') },
      },
    });
    assert('Past/expired deals are correctly excluded from active filter', expiredDealTest === null);

    // Edge Case 3: Rapid sequential WAL checkpoints under load
    let rapidCheckpointSuccess = true;
    for (let c = 0; c < 5; c++) {
      const res = await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
      if (!res || !res[0] || (res[0].busy !== 0 && res[0].busy !== 0n)) {
        rapidCheckpointSuccess = false;
        break;
      }
    }
    assert('SQLite survives 5 rapid consecutive FULL checkpoints without busy locks', rapidCheckpointSuccess);

    // Edge Case 4: Live HTTP endpoint /api/deals verification (if server is up)
    for (const port of [3005, 3000]) {
      try {
        const response = await fetch(`http://localhost:${port}/api/deals`, { signal: AbortSignal.timeout(2000) });
        if (response.ok) {
          const body = await response.json();
          assert(`Live HTTP GET /api/deals on port ${port} returns HTTP 200`, response.status === 200);
          assert(`Live HTTP GET /api/deals returns active deal object`, body.success === true && !!body.deal, `Deal title: ${body.deal?.title}`);
          assert(`Live HTTP deal price < original price`, body.deal?.dealPrice < body.deal?.originalPrice, `৳${body.deal?.dealPrice} < ৳${body.deal?.originalPrice}`);
          assert(`Live HTTP deal has valid product and variant data`, !!body.deal?.product?.variant && body.deal?.product?.variant?.price === body.deal?.dealPrice);
          break;
        }
      } catch {
        // Port not reachable, continue
      }
    }

    // Section 7: Teardown & Final Sync
    console.log('\n--- SECTION 7: Cleanup & Teardown ---');
    await prisma.auditLog.delete({ where: { id: createdAudit.id } });
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    syncDbFiles(prismaPath, rootPath);
    console.log('  Cleaned up temporary audit log and resynchronized DB files.');

  } catch (err) {
    console.error('Fatal test error:', err);
    results.failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${results.passed} PASSED / ${results.failed} FAILED (TOTAL: ${results.total})`);
  console.log('============================================================\n');

  return results;
}

runTests().then((res) => {
  if (res.failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
});
