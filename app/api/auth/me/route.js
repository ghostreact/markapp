export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/cookie';
import { verifyAccessToken } from '@/lib/jwt';
// (ถ้าต้องดึงชื่อจริงจาก DB ก็ import User แล้ว query ด้วย sub ได้)

export async function GET(req) {
    try {
        const token = req.cookies.get(COOKIE.ACCESS)?.value;
        if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

        const payload = verifyAccessToken(token); // { sub, role, iat, exp }
        // ตัวอย่าง: ใส่ username แบบง่ายจาก token/DB ตามที่คุณต้องการ
        return NextResponse.json({
            authenticated: true,
            user: { id: payload.sub, role: payload.role }
        });
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
