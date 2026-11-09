import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const sections = await prisma.websiteSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });

    const contentMap: Record<string, any> = {};

    for (const section of sections) {
      let parsed = {};
      try {
        parsed = JSON.parse(section.contentJson);
      } catch {
        parsed = {};
      }
      contentMap[section.sectionKey] = {
        id: section.id,
        sectionKey: section.sectionKey,
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        animationPreset: section.animationPreset || 'LUXURY_EASE',
        isVisible: section.isVisible,
        content: parsed,
      };
    }

    return NextResponse.json(
      {
        success: true,
        sections: contentMap,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Failed to load public website content:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

