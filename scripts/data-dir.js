/**
 * Where persistent data lives (database, uploaded images, session secret).
 *
 * Hostinger builds every deploy into a NEW folder:
 *   /home/<user>/domains/<domain>/hbuilds/versions/<build-id>/nodejs
 * Anything written inside it is lost on the next deploy. So on Hostinger we keep
 * data in /home/<user>/domains/<domain>/data, which deploys never touch.
 *
 * Override with PERSISTENT_DATA_DIR. Locally (no Hostinger path) this returns
 * null and the project keeps using prisma/dev.db and public/ as before.
 */
const path = require('path');

function getDataDir() {
  if (process.env.PERSISTENT_DATA_DIR) return process.env.PERSISTENT_DATA_DIR;
  const cwd = process.cwd().replace(/\\/g, '/');
  const m = cwd.match(/^(.*)\/hbuilds\/versions\/[^/]+\/nodejs\/?$/);
  return m ? `${m[1]}/data` : null;
}

function getDatabaseUrl() {
  const dir = getDataDir();
  return dir ? `file:${dir}/scentpalace.db` : process.env.DATABASE_URL;
}

function getDatabaseFile() {
  const url = getDatabaseUrl() || 'file:./dev.db';
  const p = url.replace(/^file:/, '');
  // Prisma resolves relative SQLite paths from the prisma/ folder
  return path.isAbsolute(p) ? p : path.join(process.cwd(), 'prisma', p);
}

/** PrismaClient options pointing at the persistent DB (empty object locally). */
function prismaOptions() {
  const dir = getDataDir();
  return dir ? { datasources: { db: { url: getDatabaseUrl() } } } : {};
}

module.exports = { getDataDir, getDatabaseUrl, getDatabaseFile, prismaOptions };
