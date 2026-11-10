import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getAdminSessionFromRequest } from '@/lib/auth';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/tiff',
    ];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Please upload a valid image file (JPEG, PNG, WEBP, AVIF).' },
        { status: 400 }
      );
    }

    const originalSize = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Support custom upload folder (e.g., 'branding' for logo/favicon)
    const folder = (formData.get('folder') as string) || 'products';
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

    // Generate safe base name
    const rawName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const rawExt = path.extname(rawName);
    const baseName = path.basename(rawName, rawExt).replace(/_+/g, '_').substring(0, 40);

    // Convert and compress to modern WebP using Sharp
    const timestamp = Date.now();
    const outputFileName = `${baseName}-${timestamp}.webp`;
    const uploadDir = path.join(process.cwd(), 'public', 'images', safeFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const outputPath = path.join(uploadDir, outputFileName);

    // High quality luxury optimization:
    // 1. auto-rotate according to EXIF
    // 2. resize down if larger than 1600px
    // 3. convert to WebP with 82 quality (crystal clear flacons, tiny byte footprint)
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();

    await fs.promises.writeFile(outputPath, optimizedBuffer);

    const optimizedSize = optimizedBuffer.length;
    const savedBytes = Math.max(0, originalSize - optimizedSize);
    const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

    const metadata = await sharp(optimizedBuffer).metadata();

    const publicUrl = `/images/${safeFolder}/${outputFileName}`;
    const autoAlt = baseName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: outputFileName,
      alt: autoAlt,
      originalSize,
      optimizedSize,
      originalSizeFormatted: formatBytes(originalSize),
      optimizedSizeFormatted: formatBytes(optimizedSize),
      savedPercent,
      dimensions: {
        width: metadata.width || 0,
        height: metadata.height || 0,
      },
      format: 'webp',
      message: `Image converted to WebP successfully. Saved ${savedPercent}% (${formatBytes(originalSize)} → ${formatBytes(optimizedSize)})`,
    });
  } catch (error: any) {
    console.error('Image upload & conversion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
