import { Coupon } from '@/types';

export interface WelcomePromoConfig {
  enabled: boolean;
  discountPercentage: number;
  couponCode: string;
  tagline: string;
  title: string;
  subtitle: string;
  perks: string[];
  minSpendBDT: number;
  buttonText: string;
  floatingPillText: string;
  image: string;
}

/**
 * Global Promotional Discount Configuration
 * Adjust discountPercentage or couponCode here.
 * In Phase 2, this will be dynamically populated from the admin panel / backend API.
 */
export const WELCOME_PROMO: WelcomePromoConfig = {
  enabled: true,
  discountPercentage: 15,
  couponCode: 'WELCOME15',
  tagline: 'CELEBRATE YOUR SIGNATURE SCENT',
  title: 'Complimentary 15% Privilege',
  subtitle:
    'Step into the sovereign world of Rāwdah Haute Parfumerie with an exclusive welcome privilege on your maiden flacon.',
  perks: [
    '15% instant reduction on any extrait or coffret',
    'Two complimentary 2ml luxury extrait samples included',
    'Free express delivery nationwide across Bangladesh',
  ],
  minSpendBDT: 0,
  buttonText: 'Claim 15% Privilege & Shop',
  floatingPillText: 'Special 15% Off Privilege',
  image: '/images/products/royal-saffron.webp',
};

