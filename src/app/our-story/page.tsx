import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Story & Heritage | Scent Palace BD',
  description:
    'Discover the philosophy, artisanal sourcing, and master perfumers behind Scent Palace BD in Dhaka and Dubai.',
};

export default function OurStoryPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* Hero Banner */}
      <section className="relative w-full h-[55vh] min-h-[400px] flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
        <Image
          src="/images/banner-oud-collection.jpg"
          alt="Scent Palace BD Heritage Atelier"
          fill
          priority
          className="object-cover object-center opacity-40 scale-105"
          sizes="100vw"
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300 mb-3 block">
            Maison Philosophy
          </span>
          <h1 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
            The Soul of Ancient Resins
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto font-sans leading-relaxed">
            Bridging the storied heritage of Arabian perfumery with the technical mastery of French haute perfumery.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6 space-y-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">
              The Genesis
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 leading-tight">
              Crafted with Soul, Bottled Without Compromise.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
              Scent Palace BD was founded on a singular conviction: that true luxury perfume is not merely a cosmetic accessory, but an intimate emotional sanctuary. A palace of exquisite, timeless fragrances designed to elevate daily life into an art.
            </p>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
              Frustrated by mass-market formulations that trade pure botanical essences for fleeting synthetic top notes, our founder set out on a three-year pilgrimage through the agarwood jungles of Pursat, Cambodia, the high rose terraces of Taif, and the historic copper distilleries of Grasse, France.
            </p>
          </div>

          <div className="md:col-span-6 relative aspect-4/5 rounded-3xl overflow-hidden shadow-xl border border-[#EAE4DC] bg-white">
            <Image
              src="/images/banner-oud-collection.webp"
              alt="Artisanal perfume blending"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-[#EAE4DC] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] mb-4">
              <Sparkles className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
              Extrait Concentration
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Every Scent Palace BD creation is composed at an exceptional 25% to 30% pure perfume oil concentration, ensuring sovereign projection and over 14 hours of persistent sillage.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-[#EAE4DC] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] mb-4">
              <span className="font-serif text-xl font-bold">20</span>
            </div>
            <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
              Twenty-Year Aged Oud
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Our master distillers curate only heartwood from wild, naturally matured Aquilaria trees, patiently aged in dark oak casks to eliminate barnyard sharpness and release warm, medicinal golden resins.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-[#EAE4DC] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] mb-4">
              <span className="font-serif text-xl font-bold">✦</span>
            </div>
            <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">
              Sample First Guarantee
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              We believe a fragrance must choose you. Every full bottle order includes matching 2ml discovery vials to wear before breaking the wax and crystal seal.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-20 text-center py-12 px-6 bg-white rounded-3xl border border-[#EAE4DC]">
          <h2 className="font-serif italic text-3xl font-normal text-neutral-900 mb-3">
            Experience Our Sovereign Creations
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6">
            Explore the complete collection of extraits de parfum, or visit our flagship atelier in Gulshan-2, Dhaka.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-all"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

