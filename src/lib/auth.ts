import crypto from 'crypto';
import { NextRequest } from 'next/server';

export type AdminRole = 'OWNER' | 'MANAGER' | 'ORDER_STAFF' | 'CATALOG_EDITOR' | 'ACCOUNTANT';

export interface AdminSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string | null;
}

// Cryptographically signed session helper for Next.js API & Server Actions
const SECRET = process.env.ADMIN_SESSION_SECRET || 'rawdah_luxury_haute_parfumerie_secret_key_2026_dhaka';

export function signAdminToken(user: AdminSession): string {
  const payloadBase = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payloadBase).digest('base64url');
  return `${payloadBase}.${sig}`;
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const [payloadBase, sig] = token.split('.');
    if (!payloadBase || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadBase).digest('base64url');
    if (sig !== expectedSig) return null;

    const decoded = JSON.parse(Buffer.from(payloadBase, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now()) return null;

    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      avatar: decoded.avatar,
    };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(req: NextRequest): AdminSession | null {
  const cookie = req.cookies.get('rawdah_admin_token')?.value;
  if (cookie) {
    const verified = verifyAdminToken(cookie);
    if (verified) return verified;
  }

  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyAdminToken(token);
  }

  return null;
}

export const getAdminSession = getAdminSessionFromRequest;

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

