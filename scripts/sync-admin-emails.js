const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Syncing admin user accounts for Scent Palace BD...');
  const salt = await bcrypt.genSalt(10);
  const passOwner = await bcrypt.hash('RawdahOwner2026!', salt);
  const passManager = await bcrypt.hash('RawdahManager2026!', salt);

  const newAdmins = [
    { email: 'owner@scentpalacebd.com', name: 'Scent Palace Owner', role: 'OWNER', passwordHash: passOwner, isActive: true },
    { email: 'admin@scentpalacebd.com', name: 'Scent Palace Administrator', role: 'OWNER', passwordHash: passOwner, isActive: true },
    { email: 'manager@scentpalacebd.com', name: 'Scent Palace Manager', role: 'MANAGER', passwordHash: passManager, isActive: true },
  ];

  for (const adm of newAdmins) {
    const existing = await prisma.adminUser.findUnique({ where: { email: adm.email } });
    if (!existing) {
      await prisma.adminUser.create({ data: adm });
      console.log(`Created admin user: ${adm.email}`);
    } else {
      console.log(`Admin user already exists: ${adm.email}`);
    }
  }

  // Also update storeSetting orderNotificationEmail if it has rawdah
  const notifEmail = await prisma.storeSetting.findUnique({ where: { key: 'orderNotificationEmail' } });
  if (!notifEmail || notifEmail.valueJson.includes('rawdah')) {
    await prisma.storeSetting.upsert({
      where: { key: 'orderNotificationEmail' },
      update: { valueJson: JSON.stringify('orders@scentpalacebd.com'), group: 'NOTIFICATIONS' },
      create: { key: 'orderNotificationEmail', valueJson: JSON.stringify('orders@scentpalacebd.com'), group: 'NOTIFICATIONS' },
    });
    console.log('Updated orderNotificationEmail to orders@scentpalacebd.com');
  }

  // Ensure adminBrandTitle is Scent Palace BD
  await prisma.storeSetting.upsert({
    where: { key: 'adminBrandTitle' },
    update: { valueJson: JSON.stringify('Scent Palace BD'), group: 'BRANDING' },
    create: { key: 'adminBrandTitle', valueJson: JSON.stringify('Scent Palace BD'), group: 'BRANDING' },
  });

  // Ensure storeName is Scent Palace BD
  await prisma.storeSetting.upsert({
    where: { key: 'storeName' },
    update: { valueJson: JSON.stringify('Scent Palace BD'), group: 'GENERAL' },
    create: { key: 'storeName', valueJson: JSON.stringify('Scent Palace BD'), group: 'GENERAL' },
  });

  // Flush WAL
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
  } catch (_) {}

  console.log('Admin sync completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

