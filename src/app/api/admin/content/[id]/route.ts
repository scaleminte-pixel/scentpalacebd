import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.websiteSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    const updated = await prisma.websiteSection.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
        contentJson: body.content ? JSON.stringify(body.content) : existing.contentJson,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
        isVisible: body.isVisible !== undefined ? Boolean(body.isVisible) : existing.isVisible,
        animationPreset: body.animationPreset || existing.animationPreset,
        status: body.status || existing.status,
        version: { increment: 1 },
        publishedAt: body.status === 'PUBLISHED' ? new Date() : existing.publishedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'UPDATE_SECTION',
        entity: 'WebsiteSection',
        entityId: id,
        details: JSON.stringify({ sectionKey: existing.sectionKey, version: updated.version }),
      },
    });

    return NextResponse.json({
      success: true,
      section: updated,
      message: `Section "${updated.title}" updated.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

