import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await prisma.websiteSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const transformed = sections.map((s) => {
      let content = {};
      try { content = JSON.parse(s.contentJson); } catch { content = {}; }
      return {
        id: s.id,
        sectionKey: s.sectionKey,
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        content,
        sortOrder: s.sortOrder,
        isVisible: s.isVisible,
        animationPreset: s.animationPreset || 'LUXURY_EASE',
        status: s.status,
        version: s.version,
        publishedAt: s.publishedAt ? s.publishedAt.toISOString() : null,
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, sections: transformed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionKey, type, title, subtitle, content, sortOrder, isVisible, animationPreset } = await req.json();

    if (!sectionKey || !title || !type) {
      return NextResponse.json({ success: false, error: 'sectionKey, type, and title are required.' }, { status: 400 });
    }

    const newSection = await prisma.websiteSection.create({
      data: {
        sectionKey: sectionKey.trim().toLowerCase(),
        type,
        title: title.trim(),
        subtitle: subtitle || null,
        contentJson: JSON.stringify(content || {}),
        sortOrder: sortOrder || 99,
        isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
        animationPreset: animationPreset || 'LUXURY_EASE',
        status: 'PUBLISHED',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'CREATE_SECTION',
        entity: 'WebsiteSection',
        entityId: newSection.id,
        details: JSON.stringify({ sectionKey: newSection.sectionKey, title: newSection.title }),
      },
    });

    return NextResponse.json({ success: true, section: newSection });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

