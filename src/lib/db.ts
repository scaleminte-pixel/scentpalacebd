import { PrismaClient } from '@prisma/client';
import { getDataDir, getDatabaseUrl } from './data-dir';
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
  if (getDataDir()) throw new Error('persistent data dir in use; skip legacy dev.db sync');
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

// Hostinger: make sure the persistent database exists before Prisma connects.
// On the very first start it is created from the bundled launch database.
try {
  const dataDir = getDataDir();
  if (dataDir) {
    fs.mkdirSync(path.join(dataDir, 'uploads', 'images'), { recursive: true });
    const dbFile = path.join(dataDir, 'scentpalace.db');
    const hasDb = fs.existsSync(dbFile) && fs.statSync(dbFile).size > 0;
    if (!hasDb) {
      for (const candidate of ['launch.db', 'dev.db']) {
        const src = path.join(process.cwd(), 'prisma', candidate);
        if (fs.existsSync(src) && fs.statSync(src).size > 0) {
          fs.copyFileSync(src, dbFile);
          console.log(`[db] Created persistent database from prisma/${candidate}`);
          break;
        }
      }
    }
  }
} catch (e) {
  console.error('[db] Persistent database setup failed:', e);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasConfigured: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    ...(getDataDir() ? { datasources: { db: { url: getDatabaseUrl() } } } : {}),
  });

export async function checkpointDatabase(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(FULL);');
    if (getDataDir()) return;
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
