import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CATEGORIES } from '@/data/categories';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface DbCategoryRecord {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count: { products: number };
  sortOrder: number;
}

export async function GET() {
  try {
    const dbCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (dbCategories.length === 0) {
      return NextResponse.json({
        success: true,
        categories: CATEGORIES,
      });
    }

    const categories = (dbCategories as unknown as DbCategoryRecord[]).map((c: DbCategoryRecord) => ({
      id: c.name,
      name: c.name,
      slug: c.slug,
      tagline: c.description || 'Exclusive handcrafted luxury parfumerie creation.',
      description: c.description || '',
      image: c.image || '/images/products/rayhaan-azul.webp',
      itemCount: c._count.products,
      sortOrder: c.sortOrder,
    }));

    return NextResponse.json(
      {
        success: true,
        categories,
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
    console.error('Error fetching public categories:', error);
    return NextResponse.json({
      success: true,
      categories: CATEGORIES,
    });
  }
}
