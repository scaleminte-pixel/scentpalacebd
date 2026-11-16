import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getOurStory } from '@/lib/our-story';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Our Story & Heritage | Scent Palace BD',
  description:
    'Discover the philosophy, artisanal sourcing, and master perfumers behind Scent Palace BD in Dhaka and Dubai.',
};

/** All text and images come from Admin → Website Content → Our Story Page. */
export default async function OurStoryPage() {
  const c = await getOurStory();

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* Hero Banner */}
      <section className="relative w-full h-[55vh] min-h-[400px] flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
        {c.heroImage && (
          <Image
            src={c.heroImage}
            alt={c.heroTitle || 'Our Story'}
            fill
            priority
            className="object-cover object-center opacity-40 scale-105"
            sizes="100vw"
          />
        )}
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          {c.heroEyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300 mb-3 block">{c.heroEyebrow}</span>
          )}
          <h1 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">{c.heroTitle}</h1>
          {c.heroSubtitle && (
            <p className="mt-4 text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto font-sans leading-relaxed">
              {c.heroSubtitle}
            </p>
          )}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Narrative Section */}
        {(c.storyHeading || c.storyParagraphs.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className={`${c.storyImage ? 'md:col-span-6' : 'md:col-span-12'} space-y-5`}>
              {c.storyEyebrow && (
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D45520]">{c.storyEyebrow}</span>
              )}
              {c.storyHeading && (
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-neutral-900 leading-tight">
                  {c.storyHeading}
                </h2>
              )}
              {c.storyParagraphs.map((para, i) => (
                <p key={i} className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>

            {c.storyImage && (
              <div className="md:col-span-6 relative aspect-4/5 rounded-3xl overflow-hidden shadow-xl border border-[#EAE4DC] bg-white">
                <Image
                  src={c.storyImage}
                  alt={c.storyHeading || 'Our story'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        )}

        {/* Pillars */}
        {c.pillars.length > 0 && (
          <div
            className={`mt-24 grid grid-cols-1 gap-8 ${
              c.pillars.length >= 3 ? 'md:grid-cols-3' : c.pillars.length === 2 ? 'md:grid-cols-2' : ''
            }`}
          >
            {c.pillars.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-[#EAE4DC] shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EAE4DC] flex items-center justify-center text-[#D45520] mb-4">
                  <span className="font-serif text-xl font-bold">{p.icon || '✦'}</span>
                </div>
                <h3 className="font-serif text-xl font-normal text-neutral-900 mb-2">{p.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans whitespace-pre-line">{p.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Call to action */}
        {(c.ctaTitle || c.ctaText) && (
          <div className="mt-20 text-center py-12 px-6 bg-white rounded-3xl border border-[#EAE4DC]">
            {c.ctaTitle && <h2 className="font-serif italic text-3xl font-normal text-neutral-900 mb-3">{c.ctaTitle}</h2>}
            {c.ctaText && <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6">{c.ctaText}</p>}
            {c.ctaButtonText && (
              <Link
                href={c.ctaButtonLink || '/shop'}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#D45520] hover:bg-[#BD4616] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-all"
              >
                <span>{c.ctaButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
