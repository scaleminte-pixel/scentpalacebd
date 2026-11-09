import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Signed out successfully' });
  res.cookies.delete('rawdah_admin_token');
  return res;
}

