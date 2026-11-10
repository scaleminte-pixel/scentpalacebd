import { DailyDealConfig } from '@/types';

export const DAILY_DEAL: DailyDealConfig = {
  id: 'deal-hawas-ice-special',
  productId: 'prod-hawas-ice-freeze',
  variantId: 'var-hawas-ice-freeze-100ml',
  title: 'Hawas Ice Freeze — Eau de Parfum (100ml)',
  tagline: 'EXCLUSIVE 24-HOUR MAJESTIC OFFER',
  dealPrice: 3950,
  originalPrice: 4500,
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  stockTotal: 15,
  stockRemaining: 5,
  enabled: true,
};
