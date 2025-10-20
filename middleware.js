// middleware.js
import { NextResponse } from 'next/server';
import { verifyAccessToken } from './lib/jwt';
import { COOKIE } from './lib/cookies';

const PROTECTED_PATHS = ['/dashboard', '/profile']; // ใส่เพจที่ต้องล็อกอิน

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE.ACCESS)?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    verifyAccessToken(token);
    return NextResponse.next();
  } catch {
    // access หมดอายุ → (ตัวเลือก) ให้ client เรียก /api/auth/refresh ก่อน แล้วรีโหลด
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
