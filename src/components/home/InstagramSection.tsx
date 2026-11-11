'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LUXURY_EASE, viewportOnce } from '@/utils/motion';

export const InstagramSection: React.FC = () => {
  const instaPosts = [
    { id: 1, image: '/images/insta-1.webp', tag: '@scentpalace.bd' },
    { id: 2, image: '/images/insta-2.webp', tag: '@scentpalace.bd' },
    { id: 3, image: '/images/insta-3.webp', tag: '@scentpalace.bd' },
    { id: 4, image: '/images/insta-4.webp', tag: '@scentpalace.bd' },
    { id: 5, image: '/images/insta-5.webp', tag: '@scentpalace.bd' },
  ];

  return (
    <section className="bg-[#FAF7F2] py-20 px-4 sm:px-6 lg:px-8 border-b border-[#EAE4DC] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, ease: LUXURY_EASE }}
          className="flex items-baseline justify-between mb-8"
        >
          <h2 className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-neutral-900 tracking-tight font-normal">
            Follow Our Journey
          </h2>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-[#D45520] transition-colors"
          >
            <span>Instagram</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </a>
        </motion.div>

        {/* 5-Column Grid with short stagger and contained hover zoom */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.08 },
            },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
        >
          {instaPosts.map((post) => (
            <motion.div
              key={post.id}
              variants={{
                hidden: { opacity: 0, scale: 0.96 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: LUXURY_EASE } },
              }}
            >
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl overflow-hidden aspect-square bg-neutral-200 border border-[#EAE4DC] shadow-xs block"
              >
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.tag}
                    fill
                    className="object-cover group-hover:scale-[1.045] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 text-center text-white">
                  <span className="text-xs font-semibold text-white tracking-wider">
                    {post.tag}
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
