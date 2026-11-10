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
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : null;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 12) : null;
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : null;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;

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

    // Helper to get minimum variant price for each product
    const getMinVariantPrice = (p: any): number => {
      if (!p.variants || p.variants.length === 0) return 0;
      return Math.min(...p.variants.map((v: any) => v.sellingPrice));
    };

    // Filter by minPrice / maxPrice if specified
    let filtered = products;
    if (minPrice !== null && !isNaN(minPrice)) {
      filtered = filtered.filter((p) => {
        const prices = p.variants?.map((v: any) => v.sellingPrice) || [];
        return prices.some((price: number) => price >= minPrice);
      });
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter((p) => {
        const prices = p.variants?.map((v: any) => v.sellingPrice) || [];
        return prices.some((price: number) => price <= maxPrice);
      });
    }

    // Sort if price-low, price-high, or newest
    if (sort === 'price-low') {
      filtered.sort((a, b) => getMinVariantPrice(a) - getMinVariantPrice(b));
    } else if (sort === 'price-high') {
      filtered.sort((a, b) => getMinVariantPrice(b) - getMinVariantPrice(a));
    } else if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = filtered.length;

    // Apply pagination if limit is specified
    let paginated = filtered;
    if (limit !== null) {
      const currentPage = page || 1;
      const skip = (currentPage - 1) * limit;
      paginated = filtered.slice(skip, skip + limit);
    }

    // Transform products into format compatible with existing frontend Product type
    const transformed = paginated.map(transformDbProduct);

    return NextResponse.json(
      {
        success: true,
        count: transformed.length,
        total,
        page: page || 1,
        products: transformed,
      },
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

