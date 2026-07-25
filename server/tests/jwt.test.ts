import { describe, it, expect } from 'vitest';
import { signAccess, verifyAccess } from '../src/utils/jwt';

// PF-43: test co ban cho phan auth (ky va xac thuc JWT)
describe('JWT util (PF-43 - auth)', () => {
  it('signAccess roi verifyAccess ra dung payload', () => {
    const token = signAccess({ id: 'user-123', role: 'user' });
    expect(typeof token).toBe('string');

    const decoded = verifyAccess(token) as any;
    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('user');
  });

  it('verifyAccess nem loi voi token rac', () => {
    expect(() => verifyAccess('token-khong-hop-le')).toThrow();
  });
});

