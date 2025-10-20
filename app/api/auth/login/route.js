// app/api/auth/login/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Session } from '@/Models/Session';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import mongoConnect from '@/lib/mongodb';
import { verifyPassword } from '@/tools/hashpassword';
import { COOKIE, cookieOptions } from '@/lib/cookie';
import { User } from '@/Models';

export async function POST(req) {
  try {
    await mongoConnect();

    // ป้องกันเคส body ไม่ใช่ JSON
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ message: 'Content-Type must be application/json' }, { status: 415 });
    }

    const body = await req.json();
    const { identifier, username, email, password } = body || {};
    const iden = (identifier ?? username ?? email)?.trim();

    if (!iden || !password?.trim()) {
      return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
    }

    // หา user โดย username หรือ email
    const user = await User.findOne({ $or: [{ username: iden }, { email: iden }] });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    // ออก token
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    // เก็บ session (hash refresh token)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64').toString());
    const expiresAt = new Date(payload.exp * 1000);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || '',
      expiresAt,
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user._id, username: user.username, role: user.role },
    });

    // ตั้งคุกกี้
    res.cookies.set(COOKIE.ACCESS, accessToken, { ...cookieOptions, maxAge: 60 * 15 });            // 15 นาที
    res.cookies.set(COOKIE.REFRESH, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 }); // 30 วัน

    return res;
  } catch (e) {
    console.error('POST /auth/login error:', e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
