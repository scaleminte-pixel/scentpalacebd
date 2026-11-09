import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

interface MediaUsage {
  type: 'product' | 'category' | 'section';
  id: string;
  name: string;
}

interface MediaItem {
  url: string;
  fileName: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  folder: string;
  usedIn: MediaUsage[];
  isUsed: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const VALID_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const imagesDir = path.join(publicDir, 'images');

    // Pre-fetch DB entities to check image usage
    const [products, categories, sections] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, name: true, slug: true, images: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, image: true },
      }),
      prisma.websiteSection.findMany({
        select: { id: true, sectionKey: true, title: true, contentJson: true },
      }),
    ]);

    const mediaItems: MediaItem[] = [];

    // Helper to scan a directory recursively
    function scanDir(dirPath: string, folderName: string) {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath, `${folderName}/${entry.name}`);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (VALID_IMAGE_EXTENSIONS.has(ext)) {
            const stat = fs.statSync(fullPath);
            const relFromPublic = path.relative(publicDir, fullPath).replace(/\\/g, '/');
            const url = `/${relFromPublic}`;

            // Check usage
            const usedIn: MediaUsage[] = [];

            // Check products
            for (const p of products) {
              if (p.images && p.images.includes(url)) {
                usedIn.push({ type: 'product', id: p.id, name: p.name });
              }
            }

            // Check categories
            for (const c of categories) {
              if (c.image && c.image === url) {
                usedIn.push({ type: 'category', id: c.id, name: c.name });
              }
            }

            // Check website sections
            for (const s of sections) {
              if (s.contentJson && s.contentJson.includes(url)) {
                usedIn.push({
                  type: 'section',
                  id: s.id,
                  name: `${s.title || s.sectionKey} Banner`,
                });
              }
            }

            mediaItems.push({
              url,
              fileName: entry.name,
              relativePath: relFromPublic,
              sizeBytes: stat.size,
              sizeFormatted: formatBytes(stat.size),
              createdAt: stat.mtime.toISOString(),
              folder: folderName,
              usedIn,
              isUsed: usedIn.length > 0,
            });
          }
        }
      }
    }

    scanDir(imagesDir, 'images');

    // Sort newest first
    mediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalBytes = mediaItems.reduce((sum, item) => sum + item.sizeBytes, 0);
    const usedCount = mediaItems.filter((i) => i.isUsed).length;
    const unusedCount = mediaItems.length - usedCount;

    return NextResponse.json({
      success: true,
      media: mediaItems,
      stats: {
        totalImages: mediaItems.length,
        totalSizeFormatted: formatBytes(totalBytes),
        usedCount,
        unusedCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to list media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: 'Missing image URL' }, { status: 400 });
    }

    // Security path sanitization
    const publicDir = path.resolve(process.cwd(), 'public');
    const sanitizedRelPath = targetUrl.replace(/^\/+/, '').replace(/\.\.\//g, '');
    const absolutePath = path.resolve(publicDir, sanitizedRelPath);

    // Guard against path traversal outside public directory
    if (!absolutePath.startsWith(publicDir)) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: 'File does not exist on disk' },
        { status: 404 }
      );
    }

    // Permanently remove from filesystem
    fs.unlinkSync(absolutePath);

    return NextResponse.json({
      success: true,
      message: `Image ${path.basename(absolutePath)} deleted permanently from disk.`,
      url: targetUrl,
    });
  } catch (error: any) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

