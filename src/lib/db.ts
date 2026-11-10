import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Ensure SQLite database file is synchronized between root and prisma directory
try {
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const rootDb = path.join(process.cwd(), 'dev.db');

  if (fs.existsSync(prismaDb) && !fs.existsSync(rootDb)) {
    fs.copyFileSync(prismaDb, rootDb);
  } else if (fs.existsSync(rootDb) && !fs.existsSync(prismaDb)) {
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir, { recursive: true });
    fs.copyFileSync(rootDb, prismaDb);
  }
} catch {
  // Ignore sync errors in restricted environments
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasConfigured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Optimize SQLite for high performance, zero lock contention, and minimal RAM footprint on Hostinger
if (!globalForPrisma.sqlitePragmasConfigured) {
  globalForPrisma.sqlitePragmasConfigured = true;
  Promise.allSettled([
    prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;'),
    prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'),
    prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY;'),
    prisma.$queryRawUnsafe('PRAGMA cache_size = -32000;'),
  ]).catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;


