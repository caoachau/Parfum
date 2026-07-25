import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/\d/, 'Mật khẩu phải có ít nhất 1 chữ số')
  .regex(
    /[^A-Za-z0-9\s\u00C0-\u024F]/,
    'Mật khẩu phải có ít nhất 1 ký tự đặc biệt',
  );
