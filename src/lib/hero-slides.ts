/** One homepage banner (Admin → Website Content → Hero). */
export interface HeroSlide {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  /** Wide image used on tablet / desktop (and on phones when no mobile image is set). */
  imageUrl: string;
  /** Optional separate image for the phone banner card. */
  mobileImageUrl: string;
  /** Optional short heading for the phone banner card (falls back to heading line 1). */
  mobileHeadline: string;
}

export const MAX_HERO_SLIDES = 6;

export const DEFAULT_HERO_SLIDE: HeroSlide = {
  eyebrow: 'New Arrivals',
  headlineLine1: 'A Signature Scent,',
  headlineLine2: 'Crafted with Soul',
  subtitle:
    'A bold composition of rare woods, warm amber, and delicate florals, created to leave an unforgettable impression.',
  buttonText: 'Shop Now',
  buttonLink: '/shop',
  imageUrl: '/images/banner-oud-collection.webp',
  mobileImageUrl: '',
  mobileHeadline: '',
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function normalize(raw: any): HeroSlide {
  return {
    eyebrow: str(raw?.eyebrow),
    headlineLine1: str(raw?.headlineLine1) || str(raw?.heading),
    headlineLine2: str(raw?.headlineLine2),
    subtitle: str(raw?.subtitle) || str(raw?.description),
    buttonText: str(raw?.buttonText) || str(raw?.ctaText),
    buttonLink: str(raw?.buttonLink) || str(raw?.ctaLink) || '/shop',
    imageUrl: str(raw?.imageUrl) || str(raw?.bgImage),
    mobileImageUrl: str(raw?.mobileImageUrl),
    mobileHeadline: str(raw?.mobileHeadline),
  };
}

/**
 * Slides from the hero section content. Content saved before multi-banner support
 * (single banner fields at the top level) becomes slide 1, so nothing is lost.
 */
export function getHeroSlides(content: any): HeroSlide[] {
  const c = content || {};
  let slides: HeroSlide[] = Array.isArray(c.slides) ? c.slides.map(normalize) : [];
  if (slides.length === 0) {
    const legacy = normalize(c);
    slides = [
      {
        ...legacy,
        eyebrow: legacy.eyebrow || DEFAULT_HERO_SLIDE.eyebrow,
        headlineLine1: legacy.headlineLine1 || DEFAULT_HERO_SLIDE.headlineLine1,
        headlineLine2: legacy.headlineLine2 || (legacy.headlineLine1 ? '' : DEFAULT_HERO_SLIDE.headlineLine2),
        subtitle: legacy.subtitle || DEFAULT_HERO_SLIDE.subtitle,
        buttonText: legacy.buttonText || 'Discover Fragrance',
        imageUrl: legacy.imageUrl || DEFAULT_HERO_SLIDE.imageUrl,
      },
    ];
  }
  // A slide needs an image to be shown
  return slides.filter((s) => s.imageUrl || s.mobileImageUrl).slice(0, MAX_HERO_SLIDES).map((s) => ({
    ...s,
    imageUrl: s.imageUrl || s.mobileImageUrl,
  }));
}
