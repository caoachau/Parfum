import { describe, it, expect } from 'vitest';
import { escapeRegex } from '../src/utils/regex';

describe('escapeRegex', () => {
  it('escape cac ky tu dac biet cua regex', () => {
    expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
    expect(escapeRegex('(test)')).toBe('\\(test\\)');
  });

  it('giu nguyen chuoi thuong', () => {
    expect(escapeRegex('chanel no 5')).toBe('chanel no 5');
  });

  it('vo hieu hoa mau ReDoS pho bien', () => {
    const safe = escapeRegex('(a+)+');
    expect(safe).toBe('\\(a\\+\\)\\+');
    // Chuoi da escape khong con la quantifier long nhau nguy hiem
    expect(() => new RegExp(safe)).not.toThrow();
  });
});
