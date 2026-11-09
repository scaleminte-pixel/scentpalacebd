'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DAILY_DEAL } from '@/data/deals';
import { PRODUCTS } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Product } from '@/types';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

interface DailyDealProps {
  dealProductProp?: Product | null;
}

export const DailyDeal: React.FC<DailyDealProps> = ({ dealProductProp }) => {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 18, minutes: 42, seconds: 19, expired: false });

  const dealProduct = dealProductProp || PRODUCTS.find((p) => p.id === DAILY_DEAL.productId);
  const dealVariant =
    dealProduct?.variants.find((v) => v.id === DAILY_DEAL.variantId) || dealProduct?.variants?.[0];

  useEffect(() => {
    setMounted(true);
    if (!DAILY_DEAL.enabled) return;

    const calculateTime = () => {
      const difference = +new Date(DAILY_DEAL.endTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!DAILY_DEAL.enabled || timeLeft.expired || !dealProduct || !dealVariant) {
    return null;
  }

  const handleShopDeal = () => {
    const dealPriceVariant = {
      ...dealVariant,
      price: DAILY_DEAL.dealPrice,
    };
    addItem(dealProduct, dealPriceVariant, 1);
  };

  const discountPercent = Math.round(
    ((DAILY_DEAL.originalPrice - DAILY_DEAL.dealPrice) / DAILY_DEAL.originalPrice) * 100
  );

  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Reveal the outer white panel first */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: LUXURY_EASE }}
          className="bg-white rounded-3xl border border-[#EAE4DC] shadow-sm overflow-hidden p-6 sm:p-10 lg:p-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Product image from small left offset on desktop, vertical on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.2, ease: LUXURY_EASE }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              <div className="relative w-full max-w-sm h-88 sm:h-[420px] bg-white rounded-2xl p-4 flex items-center justify-center">
                <Image
                  src={dealProduct.images[0]}
                  alt={dealProduct.name}
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />

                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#D45520] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  Save {discountPercent}%
                </span>
              </div>
            </motion.div>

            {/* Right: Offer details from small right offset on desktop, vertical on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.3, ease: LUXURY_EASE }}
              className="lg:col-span-7 flex flex-col justify-center"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D45520] mb-2 block">
                Daily Curation
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight">
                {DAILY_DEAL.title}
              </h2>

              {/* Pricing */}
              <div className="mt-5 flex items-baseline gap-4">
                <span className="text-3xl sm:text-4xl font-semibold text-neutral-900 font-sans tabular-nums">
                  {formatPrice(DAILY_DEAL.dealPrice)}
                </span>
                <span className="text-base text-neutral-400 line-through font-sans tabular-nums">
                  {formatPrice(DAILY_DEAL.originalPrice)}
                </span>
              </div>

              {/* Countdown Timer with Tabular Numerals for Rock-Solid Stability */}
              <div className="mt-6 pt-6 border-t border-[#F4EFEB]">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC]">
                    <span className="text-base font-bold font-serif text-neutral-900 tabular-nums">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                      Hrs
                    </span>
                  </div>

                  <span className="font-bold text-neutral-300">:</span>

                  <div className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC]">
                    <span className="text-base font-bold font-serif text-neutral-900 tabular-nums">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                      Min
                    </span>
                  </div>

                  <span className="font-bold text-neutral-300">:</span>

                  <div className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC]">
                    <span className="text-base font-bold font-serif text-[#D45520] tabular-nums">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400">
                      Sec
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handleShopDeal}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop the Deal • {formatPrice(DAILY_DEAL.dealPrice)}</span>
                </button>

                <Link
                  href={`/product/${dealProduct.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition-colors py-2 px-3"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
