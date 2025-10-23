// app/api/auth/refresh/route.js
export const runtime = 'nodejs';

import mongoConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';
import { COOKIE, cookieOptions, getCookieFromRequest } from '@/lib/cookie';
import bcrypt from 'bcryptjs';
import { Session } from '@/Models';

export async function POST(req) {
  try {
    const refreshToken = getCookieFromRequest(req, COOKIE.REFRESH);
    if (!refreshToken) return NextResponse.json({ message: 'No refresh token' }, { status: 401 });

    let payload;
    try { payload = verifyRefreshToken(refreshToken); }
    catch { return NextResponse.json({ message: 'Invalid refresh' }, { status: 401 }); }

    await mongoConnect();

    // หา session ที่จับคู่ (ด้วยการเทียบ hash)
    const sessions = await Session.find({ userId: payload.sub, isRevoked: false }).sort({ createdAt: -1 });
    const matched = await (async () => {
      for (const s of sessions) {
        const ok = await bcrypt.compare(refreshToken, s.refreshTokenHash);
        if (ok) return s;
      }
      return null;
    })();

    if (!matched || matched.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Refresh expired or revoked' }, { status: 401 });
    }

    // ROTATE: เพิกถอนของเดิม + ออก refresh ใหม่
    matched.isRevoked = true;
    await matched.save();

    const newAccess  = signAccessToken({ sub: payload.sub });
    const newRefresh = signRefreshToken({ sub: payload.sub });

    const refreshHash = await bcrypt.hash(newRefresh, 12);
    const rp = JSON.parse(Buffer.from(newRefresh.split('.')[1], 'base64').toString());
    const expiresAt = new Date(rp.exp * 1000);

    await Session.create({
      userId: payload.sub,
      refreshTokenHash: refreshHash,
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for') || '',
      expiresAt,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE.ACCESS, newAccess,  { ...cookieOptions, maxAge: 60 * 15 });
    res.cookies.set(COOKIE.REFRESH, newRefresh, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
