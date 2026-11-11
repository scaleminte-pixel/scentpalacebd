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
    const isFavicon = (formData.get('isFavicon') as string) === 'true';
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

    // Generate safe base name
    const rawName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
    const rawExt = path.extname(rawName);
    const baseName = path.basename(rawName, rawExt).replace(/_+/g, '_').substring(0, 40);

    const timestamp = Date.now();
    const uploadDir = path.join(process.cwd(), 'public', 'images', safeFolder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let outputFileName = `${baseName}-${timestamp}.webp`;
    let optimizedBuffer: Buffer;
    let format = 'webp';

    if (isFavicon) {
      outputFileName = `${baseName}-${timestamp}.png`;
      format = 'png';
      // High-res crisp PNG favicon
      optimizedBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: 128,
          height: 128,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ quality: 100 })
        .toBuffer();

      // Also automatically update disk favicon.ico files for direct browser root requests
      try {
        const ico64 = await sharp(inputBuffer)
          .rotate()
          .resize({ width: 64, height: 64, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        await fs.promises.writeFile(path.join(process.cwd(), 'public', 'favicon.ico'), ico64);
        const appIcoPath = path.join(process.cwd(), 'src', 'app', 'favicon.ico');
        if (fs.existsSync(path.dirname(appIcoPath))) {
          await fs.promises.writeFile(appIcoPath, ico64);
        }
      } catch (icoErr) {
        console.warn('Non-fatal favicon.ico disk sync warning:', icoErr);
      }
    } else {
      // High quality luxury optimization for general images
      optimizedBuffer = await sharp(inputBuffer)
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
    }

    const outputPath = path.join(uploadDir, outputFileName);
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
      format,
      message: `Image processed successfully. Saved ${savedPercent}% (${formatBytes(originalSize)} → ${formatBytes(optimizedSize)})`,
    });
  } catch (error: any) {
    console.error('Image upload & conversion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
