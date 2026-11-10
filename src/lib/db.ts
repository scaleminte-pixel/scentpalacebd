import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

function syncDbFiles(srcBase: string, destBase: string) {
  try {
    const destDir = path.dirname(destBase);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(srcBase, destBase);

    // Sync WAL and SHM companion files if present to prevent desync or split-brain
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
  } catch {
    // Ignore sync errors in restricted environments
  }
}

// Ensure SQLite database file is synchronized between root and prisma directory
try {
  const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
  const rootDb = path.join(process.cwd(), 'dev.db');

  if (fs.existsSync(prismaDb) && fs.existsSync(rootDb)) {
    const pStat = fs.statSync(prismaDb);
    const rStat = fs.statSync(rootDb);
    if (pStat.size > 0 && rStat.size === 0) {
      syncDbFiles(prismaDb, rootDb);
    } else if (rStat.size > 0 && pStat.size === 0) {
      syncDbFiles(rootDb, prismaDb);
    } else if (pStat.mtimeMs > rStat.mtimeMs + 2000) {
      syncDbFiles(prismaDb, rootDb);
    } else if (rStat.mtimeMs > pStat.mtimeMs + 2000) {
      syncDbFiles(rootDb, prismaDb);
    }
  } else if (fs.existsSync(prismaDb) && !fs.existsSync(rootDb)) {
    syncDbFiles(prismaDb, rootDb);
  } else if (fs.existsSync(rootDb) && !fs.existsSync(prismaDb)) {
    syncDbFiles(rootDb, prismaDb);
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

export async function checkpointDatabase(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
    const rootDb = path.join(process.cwd(), 'dev.db');
    if (fs.existsSync(prismaDb)) {
      syncDbFiles(prismaDb, rootDb);
    } else if (fs.existsSync(rootDb)) {
      syncDbFiles(rootDb, prismaDb);
    }
  } catch {
    // Checkpoint might fail if DB connection is busy or closing
  }
}

// Optimize SQLite for high performance, zero lock contention, and minimal RAM footprint on Hostinger
if (!globalForPrisma.sqlitePragmasConfigured) {
  globalForPrisma.sqlitePragmasConfigured = true;
  Promise.allSettled([
    prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;'),
    prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'),
    prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY;'),
    prisma.$queryRawUnsafe('PRAGMA cache_size = -32000;'),
    prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);'),
  ])
    .then(() => {
      checkpointDatabase().catch(() => {});
    })
    .catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
