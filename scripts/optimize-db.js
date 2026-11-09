const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function optimizeDb() {
  const journalMode = await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  const busyTimeout = await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
  const sync = await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
  console.log('SQLite Optimization complete:', { journalMode, busyTimeout, sync });
}

optimizeDb()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
