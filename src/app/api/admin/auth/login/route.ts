import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAdminToken, isLeakedPassword, ADMIN_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user && normalizedEmail.includes('@scentpalacebd.com')) {
      user = await prisma.adminUser.findUnique({
        where: { email: normalizedEmail.replace('@scentpalacebd.com', '@rawdahperfumes.com') },
      });
    } else if (!user && normalizedEmail.includes('@rawdahperfumes.com')) {
      user = await prisma.adminUser.findUnique({
        where: { email: normalizedEmail.replace('@rawdahperfumes.com', '@scentpalacebd.com') },
      });
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login timestamp
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({ role: user.role, time: new Date().toISOString() }),
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    // Old default passwords were published — require a new one before entry.
    const mustChangePassword = isLeakedPassword(password);

    const token = signAdminToken(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        avatar: user.avatar,
      },
      { mustChangePassword }
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      mustChangePassword,
    });

    res.cookies.set('rawdah_admin_token', token, {
      ...ADMIN_COOKIE_OPTIONS,
      maxAge: mustChangePassword ? 60 * 30 : 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

