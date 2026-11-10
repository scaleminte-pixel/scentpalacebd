import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { transformDbProduct } from '@/lib/server-catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const scent = searchParams.get('scent');
    const sort = searchParams.get('sort') || 'featured';
    const q = searchParams.get('q');
    const status = searchParams.get('status') || 'PUBLISHED';

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = {
        OR: [
          { name: { equals: category } },
          { slug: { equals: category.toLowerCase() } },
        ],
      };
    }

    if (scent && scent !== 'all') {
      where.scentFamily = {
        name: { equals: scent },
      };
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { tagline: { contains: q } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'best-seller') {
      where.isBestSeller = true;
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'name-asc') {
      orderBy = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        scentFamily: true,
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: 'asc' },
        },
      },
    });

    // Transform products into format compatible with existing frontend Product type
    const transformed = products.map(transformDbProduct);

    return NextResponse.json(
      { success: true, count: transformed.length, products: transformed },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

