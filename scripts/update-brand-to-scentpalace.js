const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDb() {
  await prisma.storeSetting.upsert({
    where: { key: 'storeName' },
    update: { valueJson: JSON.stringify('Scent Palace BD'), group: 'GENERAL' },
    create: { key: 'storeName', valueJson: JSON.stringify('Scent Palace BD'), group: 'GENERAL' },
  });

  await prisma.storeSetting.upsert({
    where: { key: 'adminBrandTitle' },
    update: { valueJson: JSON.stringify('Scent Palace BD'), group: 'BRANDING' },
    create: { key: 'adminBrandTitle', valueJson: JSON.stringify('Scent Palace BD'), group: 'BRANDING' },
  });

  await prisma.storeSetting.upsert({
    where: { key: 'storeEmail' },
    update: { valueJson: JSON.stringify('concierge@scentpalacebd.com'), group: 'GENERAL' },
    create: { key: 'storeEmail', valueJson: JSON.stringify('concierge@scentpalacebd.com'), group: 'GENERAL' },
  });

  await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
  console.log('Database brand settings updated to Scent Palace BD successfully.');
}

updateDb().catch(console.error).finally(() => prisma.$disconnect());

