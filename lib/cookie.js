const isProd = process.env.NODE_ENV === 'production';

export const COOKIE = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
};

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
};

export function getCookieFromRequest(req, name) {
  if (!req || !name) return null;

  const nextValue = req.cookies?.get?.(name)?.value;
  if (nextValue) return nextValue;

  const header =
    typeof req.headers?.get === 'function'
      ? req.headers.get('cookie')
      : req.headers?.cookie;

  if (!header) return null;

  for (const segment of header.split(';')) {
    const [rawKey, ...rest] = segment.split('=');
    if (!rawKey) continue;
    if (rawKey.trim() === name) {
      const rawValue = rest.join('=').trim();
      return rawValue.length ? rawValue : null;
    }
  }

  return null;
}
