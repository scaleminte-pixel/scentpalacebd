/** Content of the Our Story page — edited in Admin → Website Content → Our Story Page. */
export interface OurStoryContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  storyEyebrow: string;
  storyHeading: string;
  storyParagraphs: string[];
  storyImage: string;
  pillars: { icon: string; title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export const DEFAULT_OUR_STORY: OurStoryContent = {
  heroEyebrow: 'Maison Philosophy',
  heroTitle: 'The Soul of Ancient Resins',
  heroSubtitle:
    'Bridging the storied heritage of Arabian perfumery with the technical mastery of French haute perfumery.',
  heroImage: '/images/banner-oud-collection.jpg',
  storyEyebrow: 'The Genesis',
  storyHeading: 'Crafted with Soul, Bottled Without Compromise.',
  storyParagraphs: [
    'Scent Palace BD was founded on a singular conviction: that true luxury perfume is not merely a cosmetic accessory, but an intimate emotional sanctuary. A palace of exquisite, timeless fragrances designed to elevate daily life into an art.',
    'Frustrated by mass-market formulations that trade pure botanical essences for fleeting synthetic top notes, our founder set out on a three-year pilgrimage through the agarwood jungles of Pursat, Cambodia, the high rose terraces of Taif, and the historic copper distilleries of Grasse, France.',
  ],
  storyImage: '/images/banner-oud-collection.webp',
  pillars: [
    {
      icon: '✧',
      title: 'Extrait Concentration',
      text: 'Every Scent Palace BD creation is composed at an exceptional 25% to 30% pure perfume oil concentration, ensuring sovereign projection and over 14 hours of persistent sillage.',
    },
    {
      icon: '20',
      title: 'Twenty-Year Aged Oud',
      text: 'Our master distillers curate only heartwood from wild, naturally matured Aquilaria trees, patiently aged in dark oak casks to eliminate barnyard sharpness and release warm, medicinal golden resins.',
    },
    {
      icon: '✦',
      title: 'Sample First Guarantee',
      text: 'We believe a fragrance must choose you. Every full bottle order includes matching 2ml discovery vials to wear before breaking the wax and crystal seal.',
    },
  ],
  ctaTitle: 'Experience Our Sovereign Creations',
  ctaText:
    'Explore the complete collection of extraits de parfum, or visit our flagship atelier in Gulshan-2, Dhaka.',
  ctaButtonText: 'Explore Collection',
  ctaButtonLink: '/shop',
};
