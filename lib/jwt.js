// lib/jwt.js
import jwt from 'jsonwebtoken';

const accessSecret  = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

export function signAccessToken(payload, expiresIn = process.env.ACCESS_TOKEN_EXPIRES || '15m') {
  return jwt.sign(payload, accessSecret, { expiresIn });
}

export function signRefreshToken(payload, expiresIn = process.env.REFRESH_TOKEN_EXPIRES || '30d') {
  return jwt.sign(payload, refreshSecret, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}
