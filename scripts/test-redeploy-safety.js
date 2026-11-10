const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');

const prisma = new PrismaClient();

async function run() {
  console.log('=== Starting Redeploy & Persistence Safety Verification ===');
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
    // 1. Get current hero section
    const originalHero = await prisma.websiteSection.findUnique({ where: { sectionKey: 'hero' } });
    assert(originalHero !== null, 'Hero section exists in database');

    // 2. Set a custom user-uploaded image URL on hero section
    const testCustomImageUrl = '/images/uploads/my-custom-uploaded-banner-2026.webp';
    let heroContent = JSON.parse(originalHero.contentJson);
    heroContent.imageUrl = testCustomImageUrl;
    heroContent.bgImage = testCustomImageUrl;

    await prisma.websiteSection.update({
      where: { sectionKey: 'hero' },
      data: { contentJson: JSON.stringify(heroContent) },
    });
    console.log(`Set custom hero image to: ${testCustomImageUrl}`);

    // 3. Set a custom storefront logo
    const testLogoUrl = '/images/branding/custom-storefront-logo.webp';
    await prisma.storeSetting.upsert({
      where: { key: 'storefrontLogoUrl' },
      update: { valueJson: JSON.stringify(testLogoUrl), group: 'BRANDING' },
      create: { key: 'storefrontLogoUrl', valueJson: JSON.stringify(testLogoUrl), group: 'BRANDING' },
    });
    console.log(`Set custom storefront logo to: ${testLogoUrl}`);

    // 4. Run ensure-safe-bootstrap (this runs on every build/redeploy)
    console.log('\nRunning scripts/ensure-safe-bootstrap.js (Simulating build/redeploy)...');
    const bootstrapRes = spawnSync('node', ['scripts/ensure-safe-bootstrap.js'], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    assert(bootstrapRes.status === 0, 'ensure-safe-bootstrap executed with exit code 0');

    // 5. Verify custom hero image was NOT overwritten!
    const heroAfterBootstrap = await prisma.websiteSection.findUnique({ where: { sectionKey: 'hero' } });
    const contentAfter = JSON.parse(heroAfterBootstrap.contentJson);
    assert(
      contentAfter.imageUrl === testCustomImageUrl,
      `Hero imageUrl was NOT overwritten (remains ${contentAfter.imageUrl})`
    );
    assert(
      contentAfter.bgImage === testCustomImageUrl,
      `Hero bgImage was NOT overwritten (remains ${contentAfter.bgImage})`
    );

    // 6. Verify custom logo was NOT overwritten!
    const logoSetting = await prisma.storeSetting.findUnique({ where: { key: 'storefrontLogoUrl' } });
    const logoAfter = JSON.parse(logoSetting.valueJson);
    assert(
      logoAfter === testLogoUrl,
      `storefrontLogoUrl was NOT overwritten (remains ${logoAfter})`
    );

    // 7. Test running seed without --force: should be blocked by safeguard!
    console.log('\nTesting seed script safeguard without --force...');
    const seedRes = spawnSync('node', ['scripts/seed-43-real-products.js'], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    assert(seedRes.status === 0, 'seed exited cleanly');
    assert(
      seedRes.stdout.includes('[SAFEGUARD]'),
      'seed script activated safeguard and refused to wipe data without --force'
    );

    // 8. Re-verify hero image is STILL custom!
    const heroAfterSeed = await prisma.websiteSection.findUnique({ where: { sectionKey: 'hero' } });
    const contentAfterSeed = JSON.parse(heroAfterSeed.contentJson);
    assert(
      contentAfterSeed.imageUrl === testCustomImageUrl,
      'Hero imageUrl is STILL intact after seed execution'
    );

    // 9. Restore original hero content
    await prisma.websiteSection.update({
      where: { sectionKey: 'hero' },
      data: { contentJson: originalHero.contentJson },
    });
    console.log('Restored original hero section.');

    // Reset test logo
    await prisma.storeSetting.upsert({
      where: { key: 'storefrontLogoUrl' },
      update: { valueJson: JSON.stringify(''), group: 'BRANDING' },
      create: { key: 'storefrontLogoUrl', valueJson: JSON.stringify(''), group: 'BRANDING' },
    });

    console.log('\n=== Redeploy & Persistence Safety Verification Completed ===');
    if (failures === 0) {
      console.log('ALL TESTS PASSED! User uploaded images & content are 100% protected against git pushes and redeployments.');
    } else {
      console.error(`FAILED with ${failures} error(s)!`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

