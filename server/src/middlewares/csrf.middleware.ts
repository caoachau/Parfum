import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { parseCookies, CSRF_COOKIE } from '../utils/cookies';
import { env } from '../config/env';

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * CSRF double-submit cookie.
 * Áp dụng cho các endpoint dựa hoàn toàn vào cookie để xác thực (ví dụ /auth/refresh, /auth/logout).
 * Yêu cầu: cookie 'csrfToken' (JS đọc được) phải khớp header 'X-CSRF-Token' do client gửi lên.
 * Kẻ tấn công ở site khác không đọc được cookie nên không thể tạo header khớp.
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  if (!env.csrfEnabled) return next();
  const cookieToken = parseCookies(req)[CSRF_COOKIE] || '';
  const headerToken = (req.get('X-CSRF-Token') || '').trim();
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ message: 'Mã CSRF không hợp lệ' });
  }
  next();
}
