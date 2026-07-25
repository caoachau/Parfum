import crypto from 'crypto';
import { Request, Response } from 'express';

export const REFRESH_COOKIE = 'refreshToken';
export const CSRF_COOKIE = 'csrfToken';
const REFRESH_PATH = '/api/auth';

// Doc cookie tu header (khong can cookie-parser).
export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

// Luu refresh token vao httpOnly cookie -> JS phia client KHONG doc duoc (chong XSS danh cap token).
export function setRefreshCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: REFRESH_PATH,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}

// Sinh CSRF token ngau nhien (double-submit cookie pattern).
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF cookie CO CHU DICH cho JS doc duoc (httpOnly: false) de gui lai qua header X-CSRF-Token.
// Gia tri nay khong phai bi mat dang nhap; no chi de chung minh request xuat phat tu JS cung origin.
export function setCsrfCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}
