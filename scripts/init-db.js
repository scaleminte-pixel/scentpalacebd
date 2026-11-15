/**
 * Runs before `next build`.
 *
 * On Hostinger every deploy lands in a new folder, so the database must live in
 * the persistent data folder (see scripts/data-dir.js). This script:
 *   1. creates that folder,
 *   2. on the very first deploy, seeds it with prisma/launch.db (the clean
 *      launch database) if present,
 *   3. applies the Prisma schema (never with --accept-data-loss: a destructive
 *      schema change fails the build instead of wiping live data),
 *   4. runs the safe bootstrap against the persistent database.
 * Locally (no Hostinger path) it behaves like the old build script.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getDataDir, getDatabaseUrl, getDatabaseFile } = require('./data-dir');

const dataDir = getDataDir();
const env = { ...process.env };

if (dataDir) {
  fs.mkdirSync(path.join(dataDir, 'uploads', 'images'), { recursive: true });
  const dbFile = getDatabaseFile();
  const launchDb = path.join(process.cwd(), 'prisma', 'launch.db');
  env.DATABASE_URL = getDatabaseUrl();
  const marker = path.join(dataDir, '.launch-db-applied');
  const hasFile = fs.existsSync(dbFile) && fs.statSync(dbFile).size > 0;
  const { tables, orders } = hasFile ? inspectDb(env.DATABASE_URL) : { tables: 0, orders: 0 };

  if (fs.existsSync(marker)) {
    console.log(`[init-db] Using persistent database ${dbFile} (${tables} tables, ${orders} orders)`);
  } else if (orders === 0 && fs.existsSync(launchDb)) {
    // First real launch: replace an empty or auto-seeded DB (no orders) with the
    // prepared launch database. Old file is kept aside, never deleted.
    if (hasFile) {
      const aside = `${dbFile}.replaced-${Date.now()}`;
      fs.renameSync(dbFile, aside);
      for (const ext of ['-wal', '-shm']) if (fs.existsSync(dbFile + ext)) fs.renameSync(dbFile + ext, aside + ext);
      console.log(`[init-db] Previous DB (${tables} tables, 0 orders) kept as ${path.basename(aside)}`);
    }
    fs.copyFileSync(launchDb, dbFile);
    fs.writeFileSync(marker, new Date().toISOString());
    console.log(`[init-db] Launch database installed at ${dbFile}`);
  } else {
    // Has real orders: never replace.
    fs.writeFileSync(marker, new Date().toISOString());
    console.log(`[init-db] Keeping existing database with ${orders} orders.`);
  }
} else {
  console.log('[init-db] No persistent data folder (local build); using DATABASE_URL as configured.');
}

function inspectDb(url) {
  const code =
    "const {PrismaClient}=require('@prisma/client');" +
    'const p=new PrismaClient({datasources:{db:{url:process.env.DATABASE_URL}}});' +
    '(async()=>{let t=0,o=0;' +
    "try{const r=await p.$queryRawUnsafe(\"SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'\");t=Number(r[0].n)}catch(e){}" +
    "try{const r=await p.$queryRawUnsafe('SELECT count(*) AS n FROM \"Order\"');o=Number(r[0].n)}catch(e){}" +
    "console.log('TABLES='+t+' ORDERS='+o)})().finally(()=>p.$disconnect())";
  const r = spawnSync(process.execPath, ['-e', code], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' });
  const m = /TABLES=(\d+) ORDERS=(\d+)/.exec(r.stdout || '');
  return m ? { tables: Number(m[1]), orders: Number(m[2]) } : { tables: 0, orders: 0 };
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`[init-db] "${cmd} ${args.join(' ')}" failed with code ${r.status}`);
    process.exit(r.status || 1);
  }
}

run('npx', ['prisma', 'db', 'push', '--skip-generate']);
run('node', ['scripts/ensure-safe-bootstrap.js']);
