import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { PRODUCTS } from '@/data/products';
import { Product } from '@/types';
import { ProductDetailsClient } from './ProductDetailsClient';
import { transformDbProduct } from '@/lib/server-catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProductData(slug: string): Promise<{ product: Product | null; relatedProducts: Product[] }> {
  try {
    const dbProduct = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        scentFamily: true,
        variants: {
          where: { isActive: true },
          orderBy: { sellingPrice: 'asc' },
        },
      },
    });

    if (dbProduct) {
      const product = transformDbProduct(dbProduct);

      const relatedDb = await prisma.product.findMany({
        where: {
          id: { not: dbProduct.id },
          status: 'PUBLISHED',
        },
        take: 3,
        include: {
          category: true,
          scentFamily: true,
          variants: { where: { isActive: true }, orderBy: { sellingPrice: 'asc' } },
        },
      });

      const relatedProducts: Product[] = relatedDb.map(transformDbProduct);

      return { product, relatedProducts };
    }
  } catch (err) {
    console.error('Error fetching product from DB:', err);
  }

  // Fallback to static mock products
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) {
    return { product: null, relatedProducts: [] };
  }

  const relatedProducts = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.scentFamily === product.scentFamily)
  ).slice(0, 3);

  return { product, relatedProducts };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductData(slug);

  if (!product) {
    return {
      title: 'Fragrance Not Found | Rāwdah Haute Parfumerie',
    };
  }

  return {
    title: `${product.name} — ${product.concentration} | Rāwdah Haute Parfumerie`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Rāwdah`,
      description: product.description,
      images: [{ url: product.images[0] || '/images/products/lattafa-blue-oud.webp' }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { product, relatedProducts } = await getProductData(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailsClient product={product} relatedProducts={relatedProducts} />;
}
