import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, path, referrer, utmSource, utmMedium, utmCampaign, device, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'eventType required' }, { status: 400 });
    }

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
        path: path || '/',
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        device: device || 'desktop',
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    const res = NextResponse.json({ success: true, sessionId, isNewSession });
    if (isNewSession) {
      res.cookies.set('rawdah_session_id', sessionId, { path: '/', maxAge: 60 * 30 }); // 30 min session
    }
    if (!req.cookies.get('rawdah_anon_id')) {
      res.cookies.set('rawdah_anon_id', anonId, { path: '/', maxAge: 60 * 60 * 24 * 365 }); // 1 year anon ID
    }

    return res;
  } catch (error: any) {
    console.error('Analytics recording error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

