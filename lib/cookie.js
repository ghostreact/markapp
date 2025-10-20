// lib/cookies.js
const isProd = process.env.NODE_ENV === 'production';

// อย่าเปลี่ยนชื่อ cookie บ่อย ๆ
export const COOKIE = {
  ACCESS:  'access_token',
  REFRESH: 'refresh_token',
};

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',   // ปลอดภัยสำหรับคุยข้ามเส้นทางปกติ
  secure: isProd,    // ต้องเป็น true บนโปรดักชัน (HTTPS)
  path: '/',         // ใช้ทั้งไซต์
};
