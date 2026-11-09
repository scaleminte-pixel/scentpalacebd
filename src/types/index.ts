export type ProductCategory = 'Men' | 'Women' | 'Unisex' | 'Gift Sets';

export type ScentFamily = 'Oud & Woody' | 'Fresh & Citrus' | 'Floral' | 'Amber & Spicy';

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string; // e.g. '50ml', '100ml', '200ml'
  price: number; // in BDT (৳)
  originalPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  bengaliName?: string;
  concentration: string; // e.g. 'Extrait de Parfum', 'Eau de Parfum'
  tagline: string;
  description: string;
  bengaliDescription?: string;
  story: string;
  category: ProductCategory;
  scentFamily: ScentFamily;
  images: string[];
  rating: number;
  reviewsCount: number;
  notes: FragranceNotes;
  longevity: string; // e.g. '12-16 Hours'
  sillage: string; // e.g. 'Enveloping & Royal'
  bestSeason: string;
  ingredients: string[];
  variants: ProductVariant[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  dealDiscountPercent?: number;
}

export interface DailyDealConfig {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  tagline: string;
  dealPrice: number;
  originalPrice: number;
  endTime: string; // ISO date string
  stockTotal: number;
  stockRemaining: number;
  enabled: boolean;
}

export interface BannerConfig {
  id: string;
  tagline: string;
  title: string;
  description: string;
  image: string;
  mobileImage?: string;
  ctaText: string;
  ctaLink: string;
  placement: 'hero' | 'collection' | 'gift-sets';
  visible: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  scentFamily: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10%, 500 for 500 BDT
  minSpend: number;
  description: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  estimate: string;
  cost: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  division: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  orderId: string;
  createdAt: string;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'card';
  status: 'confirmed' | 'packaging' | 'dispatched' | 'out_for_delivery' | 'delivered';
  trackingNumber: string;
  estimatedDelivery: string;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  productName: string;
  verified: boolean;
}

