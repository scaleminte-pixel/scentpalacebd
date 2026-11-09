import { ScentFamily } from '@/types';

export interface ScentInfo {
  id: ScentFamily;
  name: string;
  tagline: string;
  keyNotes: string;
  image: string;
  itemCount: number;
}

export const SCENT_FAMILIES: ScentInfo[] = [
  {
    id: 'Oud & Woody',
    name: 'Oud & Woody',
    tagline: 'Ancient Cambodian agarwood, smoky birch, cedarwood, and vetiver root.',
    keyNotes: 'Cambodian Oud, Atlas Cedar, Guaiac Wood, Smoked Birch',
    image: '/images/scent-oud.webp',
    itemCount: 12,
  },
  {
    id: 'Fresh & Citrus',
    name: 'Fresh & Citrus',
    tagline: 'Sun-kissed Italian bergamot, neroli blossoms, aldehydes, and sea salt.',
    keyNotes: 'Calabrian Bergamot, Neroli, Mandora, Ocean Amber',
    image: '/images/scent-citrus.webp',
    itemCount: 9,
  },
  {
    id: 'Floral',
    name: 'Floral',
    tagline: 'Velvety Taif rose, Grasse jasmine sambac, iris concrete, and orange bloom.',
    keyNotes: 'Taif Rose, Jasmine Sambac, Orris Root, White Peony',
    image: '/images/scent-floral.webp',
    itemCount: 11,
  },
  {
    id: 'Amber & Spicy',
    name: 'Amber & Spicy',
    tagline: 'Warm golden resin, saffron threads, cinnamon bark, and Madagascar vanilla.',
    keyNotes: 'Baltic Amber, Saffron, Cardamom, Bourbon Vanilla',
    image: '/images/scent-amber.webp',
    itemCount: 14,
  },
];
