const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== Starting Branding Management Verification ===');
  let failures = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      failures++;
    }
  }

  try {
    // 1. Verify public favicon.ico exists
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    assert(fs.existsSync(faviconPath), 'public/favicon.ico exists');
    const faviconStat = fs.statSync(faviconPath);
    assert(faviconStat.size > 0, `public/favicon.ico has non-zero size (${faviconStat.size} bytes)`);

    // 2. Verify branding upload folder exists
    const brandingDir = path.join(process.cwd(), 'public', 'images', 'branding');
    assert(fs.existsSync(brandingDir), 'public/images/branding directory exists');

    // 3. Test saving and reading branding settings via Prisma
    const testBranding = {
      storefrontLogoUrl: '/images/branding/test-logo-light.webp',
      storefrontLogoDarkUrl: '/images/branding/test-logo-dark.webp',
      faviconUrl: '/images/branding/test-favicon.webp',
      adminLogoUrl: '/images/branding/test-admin-logo.webp',
    };

    const keys = Object.keys(testBranding);
    for (const key of keys) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: {
          valueJson: JSON.stringify(testBranding[key]),
          group: 'BRANDING',
        },
        create: {
          key,
          valueJson: JSON.stringify(testBranding[key]),
          group: 'BRANDING',
        },
      });
    }

    // 4. Query back to ensure persistence
    const saved = await prisma.storeSetting.findMany({
      where: { group: 'BRANDING' },
    });

    const savedMap = {};
    for (const s of saved) {
      savedMap[s.key] = JSON.parse(s.valueJson);
    }

    assert(savedMap.storefrontLogoUrl === testBranding.storefrontLogoUrl, 'storefrontLogoUrl correctly persisted');
    assert(savedMap.storefrontLogoDarkUrl === testBranding.storefrontLogoDarkUrl, 'storefrontLogoDarkUrl correctly persisted');
    assert(savedMap.faviconUrl === testBranding.faviconUrl, 'faviconUrl correctly persisted');
    assert(savedMap.adminLogoUrl === testBranding.adminLogoUrl, 'adminLogoUrl correctly persisted');

    // 5. Clean up test values (reset to empty string so user starts fresh)
    for (const key of keys) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: {
          valueJson: JSON.stringify(''),
          group: 'BRANDING',
        },
        create: {
          key,
          valueJson: JSON.stringify(''),
          group: 'BRANDING',
        },
      });
    }

    console.log('\n=== Branding Verification Completed ===');
    if (failures === 0) {
      console.log('ALL BRANDING TESTS PASSED (0 failures)!');
    } else {
      console.error(`BRANDING TESTS FAILED with ${failures} error(s)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

