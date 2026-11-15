import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * `next start` only serves files that existed in /public at boot, so images
 * uploaded from the admin afterwards 404. next.config rewrites unmatched
 * /images/* requests here, and we stream the file from disk.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const root = path.join(process.cwd(), 'public', 'images');
  const target = path.resolve(root, ...parts.map((p) => decodeURIComponent(p)));

  if (!target.startsWith(root + path.sep)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const type = TYPES[path.extname(target).toLowerCase()];
  if (!type) return new NextResponse('Not found', { status: 404 });

  try {
    const data = await fs.promises.readFile(target);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': type,
        // Filenames are timestamped, so a file never changes once uploaded.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
