// middleware.js
import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/cookie';
import { jwtVerify } from 'jose';

const PROTECTED_PATHS = ['/dashboard', '/profile'];
const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);

// verify บน Edge
async function verifyOnEdge(token) {
  await jwtVerify(token, secret); // โยน error ถ้า invalid/expired
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE.ACCESS)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await verifyOnEdge(token);
    return NextResponse.next();
  } catch {
    // แนะนำ: อาจเปลี่ยนไปเพจ /refresh เพื่อต่ออายุ แล้วค่อยกลับ
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
