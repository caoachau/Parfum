import { describe, expect, it } from 'vitest';
import { strongPasswordSchema } from '../src/validators/password.schema';

describe('Strong password validation', () => {
  it('accepts a password that meets every requirement', () => {
    expect(strongPasswordSchema.safeParse('Password@1').success).toBe(true);
  });

  it('returns every missing requirement instead of only the first one', () => {
    const result = strongPasswordSchema.safeParse('abc');
    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'Mật khẩu phải có ít nhất 8 ký tự',
        'Mật khẩu phải có ít nhất 1 chữ hoa',
        'Mật khẩu phải có ít nhất 1 chữ số',
        'Mật khẩu phải có ít nhất 1 ký tự đặc biệt',
      ]),
    );
  });

  it.each([
    ['không có chữ thường', 'PASSWORD@1'],
    ['không có chữ hoa', 'password@1'],
    ['không có chữ số', 'Password@'],
    ['không có ký tự đặc biệt', 'Password1'],
  ])('rejects a password that %s', (_label, password) => {
    expect(strongPasswordSchema.safeParse(password).success).toBe(false);
  });
});
