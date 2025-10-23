export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { COOKIE, cookieOptions, getCookieFromRequest } from '@/lib/cookie';
import { verifyRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import mongoConnect from '@/lib/mongodb';
import { Session } from '@/Models';

function decodeJwt(token) {
  if (!token) return null;
  const segments = token.split('.');
  if (segments.length < 2) return null;

  try {
    const json = Buffer.from(segments[1], 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const refreshToken = getCookieFromRequest(req, COOKIE.REFRESH);

    if (refreshToken) {
      await mongoConnect();

      let payload = null;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        payload = decodeJwt(refreshToken);
      }

      const filter = { isRevoked: false };
      if (payload?.sub) {
        filter.userId = payload.sub;
      }

      const sessions = await Session.find(filter).sort({ createdAt: -1 });
      for (const session of sessions) {
        const ok = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (ok) {
          if (!session.isRevoked) {
            session.isRevoked = true;
            await session.save();
          }
          break;
        }
      }
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE.ACCESS, '', { ...cookieOptions, maxAge: 0 });
    res.cookies.set(COOKIE.REFRESH, '', { ...cookieOptions, maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
