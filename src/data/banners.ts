import { BannerConfig } from '@/types';

export const BANNERS: BannerConfig[] = [
  {
    id: 'banner-hero',
    tagline: 'A SCENT THAT LINGERS',
    title: 'A Signature Scent, Crafted with Soul',
    description:
      'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
    image: '/images/products/desert_elegance_with_arabian_perfume-1793886616226.webp',
    mobileImage: '/images/products/desert_elegance_with_arabian_perfume-1793886616226.webp',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    placement: 'hero',
    visible: true,
  },
  {
    id: 'banner-oud-collection',
    tagline: 'THE ROYAL HERITAGE',
    title: 'The Oud Royale Collection',
    description:
      'Aged in antique French oak barrels and distilled with wild twenty-year-old agarwood from the mist-covered mountains of Pursat. An uncompromising statement of sovereign elegance.',
    image: '/images/banner-oud-collection.webp',
    ctaText: 'Explore Oud',
    ctaLink: '/shop?scent=Oud+%26+Woody',
    placement: 'collection',
    visible: true,
  },
  {
    id: 'banner-gift-sets',
    tagline: 'THE ART OF GIVING',
    title: 'The Discovery Coffret',
    description:
      'Curated presentation sets of our finest extraits, crafted for the discerning connoisseur.',
    image: '/images/products/discovery-coffret.webp',
    ctaText: 'Explore Gift Sets',
    ctaLink: '/shop?category=Gift+Sets',
    placement: 'gift-sets',
    visible: true,
  },
];
