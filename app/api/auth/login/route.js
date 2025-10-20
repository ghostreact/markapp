// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import User from '@/Models/User';
import { Session } from '@/Models/Session';

import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import { COOKIE, cookieOptions } from '@/lib/cookies';
import bcrypt from 'bcryptjs';
import mongoConnect from '@/lib/mongodb';
import { verifyPassword } from '@/tools/hashpassword';

export async function POST(req) {
  try {
    await mongoConnect()
    const { identifier, password } = await req.json(); // identifier = username หรือ email

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
    }

    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    // สร้างโทเค็น
    const accessToken  = signAccessToken({ sub: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ sub: user._id.toString() });

    // เก็บ session (แฮช refresh) เพื่อควบคุม revoke/rotate
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

    const res = NextResponse.json({ ok: true, user: { id: user._id, username: user.username, role: user.role } });

    // ตั้งคุกกี้
    res.cookies.set(COOKIE.ACCESS, accessToken, { ...cookieOptions, maxAge: 60 * 15 });           // 15 นาที
    res.cookies.set(COOKIE.REFRESH, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 }); // 30 วัน

    return res;
  } catch (e) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
