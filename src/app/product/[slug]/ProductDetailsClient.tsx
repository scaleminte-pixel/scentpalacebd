'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ProductCard } from '@/components/common/ProductCard';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  Sparkles,
  Check,
  ArrowRight,
  Clock,
  Droplets,
  Plus,
  Minus,
  Wind,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LUXURY_EASE } from '@/utils/motion';

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export const ProductDetailsClient: React.FC<Props> = ({ product, relatedProducts }) => {
  const router = useRouter();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  // Active selected flacon variant (Volume / size selection)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0] || {
      id: 'default',
      sku: `${product.slug}-50`,
      size: '50ml',
      price: 10500,
      stock: 15,
    }
  );

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  // States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // FAQ open state (matching reference image with 2 columns and plus/minus buttons)
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const isOutOfStock = selectedVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedVariant, quantity);
    router.push('/checkout');
  };

  // Product-specific FAQs in pure, international English
  const productFaqs = [
    {
      q: 'How long will this fragrance last on skin and fabric?',
      a: `Our ${product.name} is formulated at a sovereign Extrait de Parfum tier (30% pure fragrance oil concentration). It comfortably delivers ${product.longevity} of longevity on skin and lasts multiple days on jackets, scarves, and fine fabrics. No midday re-application is required.`,
    },
    {
      q: 'Can I test the scent before breaking the box seal?',
      a: 'Yes. Every order arrives with a complimentary unsealed 2ml discovery vial. We invite you to experience the fragrance on your skin first for 48 hours. If it does not harmonize with you, return the sealed master box for a full refund or exchange.',
    },
    {
      q: 'How should I apply this extrait for optimal projection?',
      a: 'Hold the flacon 4 to 6 inches away and apply 2 to 3 sprays onto warm pulse points—wrists, sides of the neck, and collarbone. Allow the mist to settle naturally into the skin without rubbing.',
    },
    {
      q: 'What is the delivery timeline across Bangladesh?',
      a: 'Deliveries inside Dhaka arrive within 24 to 48 hours via dedicated courier. Nationwide across all 64 districts, delivery takes 2 to 4 business days in tamper-proof security packaging. Orders over ৳5,000 enjoy complimentary express shipping.',
    },
  ];

  const midpoint = Math.ceil(productFaqs.length / 2);
  const leftFaqs = productFaqs.slice(0, midpoint);
  const rightFaqs = productFaqs.slice(midpoint);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation with subtle fade entrance */}
        <motion.nav
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: LUXURY_EASE }}
          className="flex items-center gap-2 text-xs text-neutral-400 mb-6 sm:mb-8 font-sans"
        >
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/shop" className="hover:text-neutral-900 transition-colors">
            Shop
          </Link>
          <span className="text-neutral-300">/</span>
          <Link
            href={`/shop?category=${encodeURIComponent(product.category)}`}
            className="hover:text-neutral-900 transition-colors"
          >
            {product.category}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-800 font-medium truncate">{product.name}</span>
        </motion.nav>

        {/* =========================================================================
            SECTION 1: HERO PRODUCT SHOWCASE (MATCHING USER'S SHOE REFERENCE LAYOUT)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pb-16 border-b border-[#EAE4DC] items-start">
          {/* Left Side: Featured Showcase Box + Thumbnails Row Below */}
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: LUXURY_EASE }}
            className="lg:col-span-6 space-y-4"
          >
            <div className="relative aspect-square sm:aspect-4/3 lg:aspect-square w-full bg-[#F4EFEB] rounded-3xl border border-[#EAE4DC] flex items-center justify-center p-8 sm:p-12 overflow-hidden shadow-xs group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 1.035 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: LUXURY_EASE }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <Image
                    src={product.images[activeImageIndex] || product.images[0]}
                    alt={product.name}
                    fill
                    priority
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-md"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Thumbnail Row Directly Below the Main Stage */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#F4EFEB] border-2 transition-all duration-200 p-2 shrink-0 active:scale-95 ${
                    activeImageIndex === idx
                      ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                      : 'border-[#EAE4DC] opacity-70 hover:opacity-100 hover:border-neutral-400'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    fill
                    className="object-contain p-1"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Product Details & Purchase Actions (Grouped Entrance) */}
          <div className="lg:col-span-6 flex flex-col justify-start lg:pl-2">
            {/* Group 1: Brand & Heading */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: LUXURY_EASE }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#D45520]" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Rāwdah Haute Parfumerie
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mt-3 text-xs">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-neutral-800">{product.rating}</span>
                <span className="text-neutral-400">({product.reviewsCount} Total Reviews)</span>
              </div>
            </motion.div>

            {/* Group 2: Description */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: LUXURY_EASE }}
              className="mt-5"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5 font-sans">
                Product Description
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans max-w-xl">
                {product.description}
              </p>
            </motion.div>

            {/* Group 3: Price & Specification Pills */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: LUXURY_EASE }}
            >
              {/* Dynamic Price Display */}
              <div className="mt-6 flex items-baseline gap-4">
                <span className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight tabular-nums">
                  {formatPrice(selectedVariant.price)}
                </span>
                {selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
                  <span className="text-lg text-neutral-400 line-through font-sans tabular-nums">
                    {formatPrice(selectedVariant.originalPrice)}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#EAE4DC] text-xs font-bold text-[#D45520] uppercase tracking-wider">
                  {selectedVariant.size}
                </span>
              </div>

              {/* Specification Badges - Compact Luxury Strip */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white border border-[#EAE4DC] font-medium text-neutral-700 shadow-2xs">
                  Concentration: <strong className="text-neutral-900">{product.concentration}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-[#EAE4DC] font-medium text-neutral-700 shadow-2xs">
                  Olfactive: <strong className="text-neutral-900">{product.scentFamily}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FDF3EE] border border-[#D45520]/25 font-bold text-[#D45520] shadow-2xs">
                  Sovereign Flacon
                </span>
              </div>
            </motion.div>

            {/* Group 4: Integrated Ordering Console (Size, Stepper, Purchase) */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: LUXURY_EASE }}
              className="mt-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#EAE4DC] shadow-xs"
            >
              {/* Flacon Volume / Size Selection */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-sans">
                      Select Flacon Size
                    </label>
                    <span className="text-xs text-[#D45520] font-bold font-sans">
                      {selectedVariant.size}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant.id === v.id || selectedVariant.size === v.size;
                      const isAvailable = v.stock > 0;

                      return (
                        <button
                          key={v.id || v.size}
                          type="button"
                          onClick={() => {
                            setSelectedVariant(v);
                            setQuantity(1);
                          }}
                          className={`group relative py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center justify-between sm:justify-start gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-[#141312] bg-[#141312] text-white shadow-sm ring-1 ring-[#141312]'
                              : 'border-[#EAE4DC] bg-[#FAF7F2]/60 text-neutral-800 hover:border-neutral-400 hover:bg-white'
                          } ${!isAvailable ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                        >
                          <span className="text-xs sm:text-sm font-bold tracking-tight">{v.size}</span>
                          <span
                            className={`text-xs font-semibold tabular-nums font-mono ${
                              isSelected ? 'text-neutral-300' : 'text-neutral-600'
                            }`}
                          >
                            {formatPrice(v.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stepper + Stock Status */}
              <div className="mt-4 pt-4 border-t border-[#F4EFEB] flex items-center justify-between">
                <div className="flex items-center border border-[#D4CFCE] rounded-full bg-[#FAF7F2] px-2.5 py-1 shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-20 text-base font-bold transition-transform active:scale-90 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-3 font-semibold text-xs text-neutral-900 tabular-nums font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                    disabled={quantity >= selectedVariant.stock}
                    className="px-2 text-neutral-500 hover:text-neutral-900 disabled:opacity-20 text-base font-bold transition-transform active:scale-90 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {selectedVariant.stock > 0 ? (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    In Stock ({selectedVariant.stock} units)
                  </span>
                ) : (
                  <span className="text-xs text-rose-600 font-medium">Sold Out</span>
                )}
              </div>

              {/* Action Buttons: Buy Now + Add To Cart + Wishlist */}
              <div className="mt-4 flex items-center gap-2.5">
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-40 cursor-pointer text-center"
                >
                  Buy Now
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-4 rounded-xl border-2 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xs cursor-pointer ${
                    added
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : isOutOfStock
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'border-neutral-900 bg-white hover:bg-neutral-900 hover:text-white text-neutral-900'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add To Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3.5 rounded-xl border-2 transition-all duration-200 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer ${
                    isWishlisted
                      ? 'border-rose-500 bg-rose-50 text-rose-500'
                      : 'border-[#D4CFCE] bg-white text-neutral-500 hover:text-neutral-900 hover:border-neutral-400'
                  }`}
                  aria-label="Save to wishlist"
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 transition-transform duration-200 ${isWishlisted ? 'fill-rose-500 scale-110' : ''}`} />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-neutral-500 font-sans">
                <Truck className="w-4 h-4 text-[#D45520] shrink-0" />
                <span>Free Express Delivery On Orders Over ৳5,000 across Bangladesh</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: SCENT PROFILE & PERFORMANCE (HARMONIOUS & PURE ENGLISH)
            Clean, balanced, matching warm cream aesthetic. No black blocks, no voids!
           ========================================================================= */}
        <div className="py-20 border-b border-[#EAE4DC]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: LUXURY_EASE }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D45520] block mb-2">
              Performance & Architecture
            </span>
            <h2 className="font-serif italic text-3xl sm:text-4xl font-normal text-neutral-900 tracking-tight">
              Scent Profile & Endurance
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans">
              Formulated at the sovereign extrait tier for extraordinary longevity and dignified sillage.
            </p>
          </motion.div>

          {/* 3 Balanced Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs flex items-start gap-4 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Longevity
                </span>
                <h3 className="font-serif text-xl font-normal text-neutral-900">
                  {product.longevity}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 font-sans">
                  Sustained all-day presence on skin and days on fine fabrics.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs flex items-start gap-4 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#C5A059] shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Concentration
                </span>
                <h3 className="font-serif text-xl font-normal text-neutral-900">
                  30% Pure Extrait
                </h3>
                <p className="text-xs text-neutral-500 mt-1 font-sans">
                  Highest aromatic oil density with zero synthetic thinning.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.19, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs flex items-start gap-4 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-neutral-800 shrink-0">
                <Wind className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Sillage & Projection
                </span>
                <h3 className="font-serif text-xl font-normal text-neutral-900">
                  {product.sillage}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 font-sans">
                  Enveloping aura commanding respect without overpowering.
                </p>
              </div>
            </motion.div>
          </div>

          {/* 3 Clean Fragrance Notes Cards (Top, Heart, Base) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F4EFEB] mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D45520]">
                  The Opening
                </span>
                <span className="text-xs text-neutral-400 font-sans">0 – 30 Mins</span>
              </div>
              <h4 className="font-serif text-lg font-medium text-neutral-900 mb-2">
                Top Notes
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-neutral-800 font-sans mb-3">
                {product.notes.top.join('  •  ')}
              </p>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                The bright, luminous introduction that greets the senses upon initial atomization.
              </p>
            </motion.div>

            {/* Heart Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F4EFEB] mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">
                  The Heart
                </span>
                <span className="text-xs text-neutral-400 font-sans">2 – 6 Hours</span>
              </div>
              <h4 className="font-serif text-lg font-medium text-neutral-900 mb-2">
                Heart Notes
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-neutral-800 font-sans mb-3">
                {product.notes.heart.join('  •  ')}
              </p>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                The signature theme and true personality that defines the fragrance core.
              </p>
            </motion.div>

            {/* Base Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.19, ease: LUXURY_EASE }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAE4DC] shadow-xs hover:-translate-y-1 transition-transform duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F4EFEB] mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">
                  The Soul
                </span>
                <span className="text-xs text-neutral-400 font-sans">8 – 18+ Hours</span>
              </div>
              <h4 className="font-serif text-lg font-medium text-neutral-900 mb-2">
                Base Notes
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-neutral-800 font-sans mb-3">
                {product.notes.base.join('  •  ')}
              </p>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                The deep, sovereign woods, resins, and musks that anchor the eternal sillage.
              </p>
            </motion.div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: FAQ SECTION (100% IN ENGLISH, MATCHING 2-COLUMN REFERENCE)
           ========================================================================= */}
        <div className="py-20 border-b border-[#EAE4DC]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: LUXURY_EASE }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EAE4DC] text-xs font-semibold text-neutral-800 shadow-2xs mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D45520]" />
              <span>FAQs</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight leading-tight">
              Frequently asked questions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-sans">
              Key information regarding performance, our 2ml sample policy, and nationwide delivery.
            </p>
          </motion.div>

          {/* 2-Column Grid of Distinct Rounded Cards with Circular Plus/Minus Buttons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start max-w-6xl mx-auto">
            {/* Left Column */}
            <div className="space-y-4">
              {leftFaqs.map((faq, i) => {
                const actualIdx = i;
                const isOpen = openFaqIndices.includes(actualIdx);
                return (
                  <motion.div
                    key={actualIdx}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: LUXURY_EASE }}
                    className="bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-2xs transition-all hover:border-neutral-300"
                  >
                    <div
                      onClick={() => toggleFaq(actualIdx)}
                      className="flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <h3 className="font-sans text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                        {faq.q}
                      </h3>

                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                        className="w-8 h-8 rounded-full bg-[#141312] hover:bg-neutral-800 text-white flex items-center justify-center shrink-0 transition-transform active:scale-90"
                      >
                        {isOpen ? (
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: LUXURY_EASE }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-[#F4EFEB] text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {rightFaqs.map((faq, i) => {
                const actualIdx = midpoint + i;
                const isOpen = openFaqIndices.includes(actualIdx);
                return (
                  <motion.div
                    key={actualIdx}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: LUXURY_EASE }}
                    className="bg-white rounded-2xl border border-[#EAE4DC] p-6 shadow-2xs transition-all hover:border-neutral-300"
                  >
                    <div
                      onClick={() => toggleFaq(actualIdx)}
                      className="flex items-start justify-between gap-4 cursor-pointer select-none"
                    >
                      <h3 className="font-sans text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                        {faq.q}
                      </h3>

                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Collapse answer' : 'Expand answer'}
                        className="w-8 h-8 rounded-full bg-[#141312] hover:bg-neutral-800 text-white flex items-center justify-center shrink-0 transition-transform active:scale-90"
                      >
                        {isOpen ? (
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: LUXURY_EASE }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-[#F4EFEB] text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 4: RELATED PERFUMES
           ========================================================================= */}
        {relatedProducts.length > 0 && (
          <div className="pt-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: LUXURY_EASE }}
              className="flex flex-col sm:flex-row items-baseline justify-between mb-8 gap-4"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D45520] block mb-1">
                  Complementary Olfactive Works
                </span>
                <h2 className="font-serif italic text-2xl sm:text-3xl text-neutral-900 font-normal">
                  You May Also Admire
                </h2>
              </div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#D45520] transition-colors group"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.06,
                  },
                },
              }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            >
              {relatedProducts.map((p) => (
                <motion.div
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.45, ease: LUXURY_EASE },
                    },
                  }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Quick Order Bar (Docked cleanly at bottom on mobile) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#EAE4DC] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] flex items-center justify-between gap-2 safe-area-pb">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block truncate">
            {selectedVariant.size} • {selectedVariant.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
          <span className="text-sm font-bold text-neutral-900 font-sans tabular-nums">
            {formatPrice(selectedVariant.price * quantity)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-[#D4CFCE] rounded-lg bg-[#FAF7F2] px-1.5 py-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-20 text-xs font-bold active:scale-90"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-1.5 font-bold text-xs text-neutral-900 tabular-nums font-mono">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
              disabled={quantity >= selectedVariant.stock}
              className="px-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-20 text-xs font-bold active:scale-90"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            aria-label="Add to bag"
            title="Add to bag"
          >
            {added ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="px-4 py-2.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};
