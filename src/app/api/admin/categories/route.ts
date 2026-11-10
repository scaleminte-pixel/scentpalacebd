import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        itemCount: c._count.products,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, image, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanSlug = (slug || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if category name or slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: cleanName }, { slug: cleanSlug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A category named "${cleanName}" already exists.` },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        description: description?.trim() || null,
        image: image?.trim() || '/images/products/rayhaan-azul.webp',
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: 'CREATE_CATEGORY',
        entity: 'Category',
        entityId: newCategory.id,
        details: JSON.stringify({ name: newCategory.name, slug: newCategory.slug }),
      },
    });

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: `Category "${newCategory.name}" created successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid items array' }, { status: 400 });
    }

    await prisma.$transaction(
      items.map((item: any, index: number) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index + 1 },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Category order updated successfully.',
    });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

