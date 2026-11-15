import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, path, referrer, utmSource, utmMedium, utmCampaign, device, metadata } = body;

    const ALLOWED = ['PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT_START', 'SEARCH'];
    if (!ALLOWED.includes(eventType)) {
      return NextResponse.json({ success: false, error: 'Invalid eventType' }, { status: 400 });
    }
    const clip = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);

    let sessionId = req.cookies.get('rawdah_session_id')?.value;
    const isNewSession = !sessionId;
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    let anonId = req.cookies.get('rawdah_anon_id')?.value;
    if (!anonId) {
      anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // Record the event
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        sessionId,
        anonymousId: anonId,
        path: clip(path, 200) || '/',
        referrer: clip(referrer, 300),
        utmSource: clip(utmSource, 100),
        utmMedium: clip(utmMedium, 100),
        utmCampaign: clip(utmCampaign, 100),
        device: ['mobile', 'tablet', 'desktop'].includes(device) ? device : 'desktop',
        metadataJson: metadata ? JSON.stringify(metadata).slice(0, 2000) : null,
      },
    });

    // Keep the table small: ~1 in 500 requests prunes events older than 180 days.
    if (Math.random() < 0.002) {
      const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => {});
    }

    const res = NextResponse.json({ success: true, sessionId, isNewSession });
    // Sliding 30-minute session window
    res.cookies.set('rawdah_session_id', sessionId, { path: '/', maxAge: 60 * 30, sameSite: 'lax' });
    if (!req.cookies.get('rawdah_anon_id')) {
      res.cookies.set('rawdah_anon_id', anonId, { path: '/', maxAge: 60 * 60 * 24 * 365 }); // 1 year anon ID
    }

    return res;
  } catch (error: any) {
    console.error('Analytics recording error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

