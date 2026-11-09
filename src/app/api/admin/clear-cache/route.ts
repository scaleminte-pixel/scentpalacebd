import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Purge Next.js App Router route cache across storefront
    revalidatePath('/', 'layout');
    revalidatePath('/shop', 'page');
    revalidatePath('/admin', 'layout');

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name || 'Admin',
          action: 'CACHE_PURGE',
          entity: 'System',
          entityId: 'full_site',
          details: JSON.stringify({
            purgedAt: new Date().toISOString(),
            triggeredBy: session.email,
          }),
        },
      });
    } catch {
      // Ignore if audit log creation fails
    }

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      message: 'Storefront and admin cache successfully cleared and synchronized.',
    });
  } catch (error: any) {
    console.error('Failed to clear cache:', error);
    return NextResponse.json({ success: false, error: error.message || 'Cache clear failed' }, { status: 500 });
  }
}
