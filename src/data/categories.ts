import { ProductCategory } from '@/types';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  tagline: string;
  image: string;
  itemCount: number;
  slug: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'Men',
    name: 'Men',
    tagline: 'Bold leathers, dark woods, and commanding sillage for the modern gentleman.',
    image: '/images/products/lattafa-asad-elixir.webp',
    itemCount: 20,
    slug: 'men',
  },
  {
    id: 'Women',
    name: 'Women',
    tagline: 'Luminous damask florals, creamy vanillas, and bewitching golden ambers.',
    image: '/images/products/lattafa-yara-elixir.webp',
    itemCount: 4,
    slug: 'women',
  },
  {
    id: 'Unisex',
    name: 'Unisex',
    tagline: 'Universal masterworks crossing borders of convention and pure aroma.',
    image: '/images/products/rayhaan-azul.webp',
    itemCount: 18,
    slug: 'unisex',
  },
  {
    id: 'Gift Sets',
    name: 'Gift Sets',
    tagline: 'Handcrafted velvet coffrets and discovery sets for bespoke gifting.',
    image: '/images/products/arabiyat-prestige-marwa-tester.webp',
    itemCount: 1,
    slug: 'gift-sets',
  },
];
