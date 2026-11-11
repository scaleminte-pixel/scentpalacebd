import { Coupon } from '@/types';

export const COUPONS: Coupon[] = [
  {
    code: 'ROYAL15',
    type: 'percentage',
    value: 15,
    minSpend: 2000,
    description: '15% privilege discount across royal perfume selections',
  },
  {
    code: 'WELCOME15',
    type: 'percentage',
    value: 15,
    minSpend: 0,
    description: '15% welcome discount on your artisanal fragrance purchase',
  },
  {
    code: 'LUXURY10',
    type: 'percentage',
    value: 10,
    minSpend: 0,
    description: '10% off your entire luxury purchase',
  },
  {
    code: 'SCENT500',
    type: 'fixed',
    value: 500,
    minSpend: 5000,
    description: '৳500 off on orders over ৳5,000',
  },
  {
    code: 'RAWDAH500',
    type: 'fixed',
    value: 500,
    minSpend: 5000,
    description: '৳500 off on orders over ৳5,000',
  },
  {
    code: 'ROYAL20',
    type: 'percentage',
    value: 20,
    minSpend: 15000,
    description: '20% off on royal orders exceeding ৳15,000',
  },
];

