import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { key: 'faviconUrl' },
    });

    let targetFilePath: string | null = null;
    let contentType = 'image/png';

    if (setting) {
      try {
        const rawUrl = JSON.parse(setting.valueJson);
        if (typeof rawUrl === 'string' && rawUrl.trim()) {
          const cleanUrl = rawUrl.split('?')[0].replace(/^\//, '');
          const candidate = path.join(process.cwd(), 'public', cleanUrl);
          if (fs.existsSync(candidate)) {
            targetFilePath = candidate;
            if (candidate.endsWith('.ico')) contentType = 'image/x-icon';
            else if (candidate.endsWith('.png')) contentType = 'image/png';
            else if (candidate.endsWith('.svg')) contentType = 'image/svg+xml';
            else if (candidate.endsWith('.webp')) contentType = 'image/webp';
          }
        }
      } catch (_) {}
    }

    if (!targetFilePath) {
      const defaultIco = path.join(process.cwd(), 'public', 'favicon.ico');
      if (fs.existsSync(defaultIco)) {
        targetFilePath = defaultIco;
        contentType = 'image/x-icon';
      }
    }

    if (targetFilePath && fs.existsSync(targetFilePath)) {
      const buffer = await fs.promises.readFile(targetFilePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('Dynamic favicon error:', err);
    return new NextResponse(null, { status: 500 });
  }
}

