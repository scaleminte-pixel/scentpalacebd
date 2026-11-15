import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export type AdminRole = 'OWNER' | 'MANAGER' | 'ORDER_STAFF' | 'CATALOG_EDITOR' | 'ACCOUNTANT';

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string | null;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

/**
 * SHA-256 of secrets/passwords that were published in the public git
 * repository. They must never be trusted again.
 */
const LEAKED_SECRET_HASHES = new Set([
  '34913c0363f749f6c8f8f139b8f03cb6ed1f9bd343d7406df7ae7ae37e548d3d',
  '21d792d8ced761538d11b923599cd79e98038addd1b751200ed12e75b72b3f15',
]);
const LEAKED_PASSWORD_HASHES = new Set([
  '65fbb30e5ff9871b559c7352a333b3335683199e0ee0b789a6248e4dd676b434',
  'adcb8155947f29c7496e353aad119dcb2870c35b243e1996f069c0d2160e9536',
  '75a600a3e0c47641484a8481ba3ebc4cc7a52696dd1b65376a4ba4be4f6c37e3',
  'b0a53cb4ce9345cdc730fab946c6d1dfc31c80d10567357c395015a6963f7b62',
  'ef064628b9c90eb675f679eb631e2ea9ce016790498cd1d02cb4df3abac8dd0b',
]);

/** True if this password was published (old demo/default passwords). */
export function isLeakedPassword(password: string): boolean {
  return LEAKED_PASSWORD_HASHES.has(sha256(password));
}

/**
 * Session signing secret. Uses ADMIN_SESSION_SECRET only if it is strong and
 * was never published; otherwise a random per-server secret is generated once
 * and stored in prisma/.session-secret (git-ignored, persists with the DB).
 */
function resolveSecret(): string {
  const env = process.env.ADMIN_SESSION_SECRET || '';
  if (env.length >= 32 && !LEAKED_SECRET_HASHES.has(sha256(env))) return env;

  const file = path.join(process.cwd(), 'prisma', '.session-secret');
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing.length >= 32) return existing;
  } catch {}
  const generated = crypto.randomBytes(48).toString('base64url');
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, generated, { mode: 0o600 });
  } catch (e) {
    console.warn('[auth] Could not persist session secret; sessions reset on restart.', e);
  }
  return generated;
}

const SECRET = resolveSecret();

interface TokenPayload extends AdminSession {
  exp: number;
  /** must change password before using the admin panel */
  mcp?: boolean;
}

export function signAdminToken(user: AdminSession, opts: { mustChangePassword?: boolean } = {}): string {
  const ttl = opts.mustChangePassword ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const payload: TokenPayload = { ...user, exp: Date.now() + ttl, ...(opts.mustChangePassword ? { mcp: true } : {}) };
  const payloadBase = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payloadBase).digest('base64url');
  return `${payloadBase}.${sig}`;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const [payloadBase, sig] = token.split('.');
    if (!payloadBase || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadBase).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const decoded = JSON.parse(Buffer.from(payloadBase, 'base64url').toString('utf8'));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

const toSession = (d: TokenPayload): AdminSession => ({
  id: d.id,
  name: d.name,
  email: d.email,
  role: d.role,
  avatar: d.avatar,
});

/** Full session only — pending (must-change-password) sessions are rejected. */
export function verifyAdminToken(token: string): AdminSession | null {
  const d = decodeToken(token);
  if (!d || d.mcp) return null;
  return toSession(d);
}

function tokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get('rawdah_admin_token')?.value;
  if (cookie) return cookie;
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  return null;
}

export function getAdminSessionFromRequest(req: NextRequest): AdminSession | null {
  const token = tokenFromRequest(req);
  return token ? verifyAdminToken(token) : null;
}

export const getAdminSession = getAdminSessionFromRequest;

/** Accepts full AND pending sessions — only for the change-password endpoint. */
export function getPendingOrFullSession(req: NextRequest): (AdminSession & { mustChangePassword: boolean }) | null {
  const token = tokenFromRequest(req);
  const d = token ? decodeToken(token) : null;
  return d ? { ...toSession(d), mustChangePassword: Boolean(d.mcp) } : null;
}

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
};

// Module permission check
export function canAccessModule(role: AdminRole, module: string): boolean {
  const mod = module.toLowerCase();
  switch (role) {
    case 'OWNER':
      return true; // Full access
    case 'MANAGER':
      return mod !== 'system_danger_zone';
    case 'ACCOUNTANT':
      return ['dashboard', 'finance', 'payments', 'orders', 'reports', 'inventory'].includes(mod);
    case 'ORDER_STAFF':
      return ['dashboard', 'orders', 'customers', 'inventory'].includes(mod);
    case 'CATALOG_EDITOR':
      return ['dashboard', 'products', 'content', 'offers', 'reviews', 'inventory'].includes(mod);
    default:
      return false;
  }
}
