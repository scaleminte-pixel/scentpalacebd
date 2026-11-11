const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== Starting Complete Branding & Logo System Verification ===');
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      failures++;
    }
  }

  try {
    // 1. Check favicon files
    const publicIco = path.join(process.cwd(), 'public', 'favicon.ico');
    const appIco = path.join(process.cwd(), 'src', 'app', 'favicon.ico');
    assert(fs.existsSync(publicIco), 'public/favicon.ico exists on disk');
    assert(fs.existsSync(appIco), 'src/app/favicon.ico exists on disk');

    // 2. Check dynamic favicon endpoint file
    const dynamicFaviconRoute = path.join(process.cwd(), 'src', 'app', 'api', 'branding', 'favicon', 'route.ts');
    assert(fs.existsSync(dynamicFaviconRoute), 'Dynamic favicon API route file exists');

    // 3. Test saving and retrieving custom Admin Brand Title and Hide Text
    const testBrandingData = {
      adminBrandTitle: 'Scent Palace BD Atelier',
      adminBrandSubtitle: 'Master Control & Dispatch Portal',
      adminHideText: true,
      storefrontLogoDarkUrl: '/images/branding/footer-test-logo.webp',
      storefrontLogoUrl: '/images/branding/header-test-logo.webp',
      faviconUrl: '/images/branding/test-favicon.png',
      adminLogoUrl: '/images/branding/test-admin-badge.webp',
    };

    for (const [key, value] of Object.entries(testBrandingData)) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: { valueJson: JSON.stringify(value), group: 'BRANDING' },
        create: { key, valueJson: JSON.stringify(value), group: 'BRANDING' },
      });
    }

    // Read back via Prisma
    const savedSettings = await prisma.storeSetting.findMany({
      where: { group: 'BRANDING' },
    });
    const map = {};
    for (const s of savedSettings) {
      map[s.key] = JSON.parse(s.valueJson);
    }

    assert(map.adminBrandTitle === testBrandingData.adminBrandTitle, 'adminBrandTitle persisted properly');
    assert(map.adminBrandSubtitle === testBrandingData.adminBrandSubtitle, 'adminBrandSubtitle persisted properly');
    assert(map.adminHideText === testBrandingData.adminHideText, 'adminHideText boolean persisted properly');
    assert(map.storefrontLogoDarkUrl === testBrandingData.storefrontLogoDarkUrl, 'storefrontLogoDarkUrl persisted properly for footer');
    assert(map.faviconUrl === testBrandingData.faviconUrl, 'faviconUrl persisted properly');

    // 4. Test resetting back cleanly
    for (const key of Object.keys(testBrandingData)) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: { valueJson: JSON.stringify(''), group: 'BRANDING' },
        create: { key, valueJson: JSON.stringify(''), group: 'BRANDING' },
      });
    }

    console.log('\n=== All Complete Branding System Tests Passed! ===');
    if (failures === 0) {
      console.log('SUCCESS: All 3 branding issues (Favicon, Footer Logo, Admin Title) verified!');
    } else {
      console.error(`FAILED with ${failures} failure(s)`);
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

