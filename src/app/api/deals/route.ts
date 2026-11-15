import { NextResponse } from 'next/server';
import { getActiveDailyDeal } from '@/lib/daily-deal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Active Daily Deal from Admin → Website Content → Deal of the Day. */
export async function GET() {
  const deal = await getActiveDailyDeal();
  return NextResponse.json(
    { success: true, deal },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
