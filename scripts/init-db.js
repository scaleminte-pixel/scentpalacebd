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
  const exists = fs.existsSync(dbFile) && fs.statSync(dbFile).size > 0;
  if (!exists && fs.existsSync(launchDb)) {
    fs.copyFileSync(launchDb, dbFile);
    console.log(`[init-db] First deploy: copied launch database to ${dbFile}`);
  } else {
    console.log(`[init-db] Using persistent database ${dbFile} (${exists ? 'existing' : 'new'})`);
  }
  env.DATABASE_URL = getDatabaseUrl();
} else {
  console.log('[init-db] No persistent data folder (local build); using DATABASE_URL as configured.');
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
