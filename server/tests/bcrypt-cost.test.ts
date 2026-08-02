import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { BCRYPT_COST, REFRESH_TOKEN_BCRYPT_COST } from '../src/constants/security';

const LEGACY_PASSWORD_COST = 10;

describe('bcrypt costs', () => {
  it('uses a stronger cost for user passwords than for random refresh tokens', () => {
    expect(BCRYPT_COST).toBe(12);
    expect(REFRESH_TOKEN_BCRYPT_COST).toBe(10);
  });

  it('continues to verify legacy password hashes and detects that they need upgrading', async () => {
    const password = 'Password@1';
    const legacyHash = await bcrypt.hash(password, LEGACY_PASSWORD_COST);

    await expect(bcrypt.compare(password, legacyHash)).resolves.toBe(true);
    expect(bcrypt.getRounds(legacyHash)).toBeLessThan(BCRYPT_COST);
  });
});
