import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { getPendingOrFullSession, isLeakedPassword, signAdminToken, ADMIN_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getPendingOrFullSession(req);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Please log in again.' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json({ success: false, error: 'Current and new password are required.' }, { status: 400 });
  }
  if (newPassword.length < 10) {
    return NextResponse.json({ success: false, error: 'New password must be at least 10 characters.' }, { status: 400 });
  }
  if (isLeakedPassword(newPassword)) {
    return NextResponse.json({ success: false, error: 'This password is publicly known. Choose a different one.' }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ success: false, error: 'New password must be different from the current one.' }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.id } });
  if (!user || !user.isActive) {
    return NextResponse.json({ success: false, error: 'Account not found or inactive.' }, { status: 401 });
  }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ forced: session.mustChangePassword }),
    },
  });

  const token = signAdminToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    avatar: user.avatar,
  });
  const res = NextResponse.json({ success: true });
  res.cookies.set('rawdah_admin_token', token, { ...ADMIN_COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 7 });
  return res;
}
