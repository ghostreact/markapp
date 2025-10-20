// app/api/auth/logout/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { COOKIE, cookieOptions } from '@/lib/cookie';
import bcrypt from 'bcryptjs';
import mongoConnect from '@/lib/mongodb';
import { Session } from '@/Models';

export async function POST(req) {
  try {
    const refreshToken = req.cookies.get(COOKIE.REFRESH)?.value;

    // เพิกถอน session ที่ตรงกับ refresh token นี้ (ถ้ามี)
    if (refreshToken) {
      await mongoConnect();
      const sessions = await Session.find({ isRevoked: false });
      for (const s of sessions) {
        const ok = await bcrypt.compare(refreshToken, s.refreshTokenHash);
        if (ok) { s.isRevoked = true; await s.save(); break; }
      }
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE.ACCESS, '',  { ...cookieOptions, maxAge: 0 });
    res.cookies.set(COOKIE.REFRESH, '', { ...cookieOptions, maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
