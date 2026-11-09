import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Search by ID or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        customer: true,
        paymentTransactions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let shippingAddress = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddress = { address: order.shippingAddress };
    }

    const transformedItems = order.items.map((it: any) => {
      let productImages: string[] = [];
      if (it.product?.images) {
        if (Array.isArray(it.product.images)) {
          productImages = it.product.images;
        } else if (typeof it.product.images === 'string') {
          try {
            const parsed = JSON.parse(it.product.images);
            productImages = Array.isArray(parsed) ? parsed : [it.product.images];
          } catch {
            productImages = [it.product.images];
          }
        }
      }

      const primaryImg = productImages[0] || it.product?.primaryImage || '/images/bottle-bleu-oud.jpg';

      return {
        ...it,
        productImage: primaryImg,
      };
    });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: transformedItems,
        shippingAddress,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

