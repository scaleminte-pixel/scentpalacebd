import path from 'path';

/**
 * Persistent data location — see scripts/data-dir.js for the full explanation.
 * On Hostinger: /home/<user>/domains/<domain>/data (survives deploys).
 * Locally: null (keep using prisma/dev.db and public/).
 */
export function getDataDir(): string | null {
  if (process.env.PERSISTENT_DATA_DIR) return process.env.PERSISTENT_DATA_DIR;
  const cwd = process.cwd().replace(/\\/g, '/');
  const m = cwd.match(/^(.*)\/hbuilds\/versions\/[^/]+\/nodejs\/?$/);
  return m ? `${m[1]}/data` : null;
}

export function getDatabaseUrl(): string | undefined {
  const dir = getDataDir();
  return dir ? `file:${dir}/scentpalace.db` : process.env.DATABASE_URL;
}

/** Root that contains the `images/` folder for admin uploads. */
export function getUploadsRoot(): string {
  const dir = getDataDir();
  return dir ? path.join(dir, 'uploads') : path.join(process.cwd(), 'public');
}
