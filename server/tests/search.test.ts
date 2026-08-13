import { describe, expect, it } from 'vitest';
import {
  createSearchRegex,
  matchesAllSearchTokens,
  normalizeSearchText,
  scoreSearchFields,
  tokenizeProductSearchQuery,
  tokenizeSearchQuery,
} from '../src/utils/search';

describe('search helpers', () => {
  it('chuan hoa tieng Viet co dau va ky tu phan cach', () => {
    expect(normalizeSearchText('  Nước Hoa ĐỎ -- Chính hãng  ')).toBe('nuoc hoa do chinh hang');
  });

  it('tach tu khoa, loai cum tu chung va anh xa gioi tinh', () => {
    expect(tokenizeProductSearchQuery('nước hoa nam chính hãng')).toEqual(['nam']);
    expect(tokenizeProductSearchQuery('Perfume for Women Dior')).toEqual(['nu', 'dior']);
    expect(tokenizeSearchQuery('Dior Sauvage Dior')).toEqual(['dior', 'sauvage']);
  });

  it('khop tu khoa tren nhieu truong va ho tro nam/male', () => {
    expect(matchesAllSearchTokens(['Dior Sauvage', 'male'], ['dior', 'nam'])).toBe(true);
    expect(matchesAllSearchTokens(['Dior Sauvage', 'female'], ['dior', 'nam'])).toBe(false);
  });

  it('tao regex khong phan biet dau tieng Viet', () => {
    const regex = createSearchRegex('nuoc');
    expect(regex.test('Nước hoa')).toBe(true);
    expect(regex.test('nuoc hoa')).toBe(true);

    const genderRegex = createSearchRegex('nam', true);
    expect(genderRegex.test('male')).toBe(true);
    expect(genderRegex.test('female')).toBe(false);
  });

  it('uu tien ket qua khop trong ten hon mo ta', () => {
    const tokens = ['dior', 'sauvage'];
    const nameScore = scoreSearchFields(tokens, [{ value: 'Dior Sauvage', weight: 10 }]);
    const descriptionScore = scoreSearchFields(tokens, [
      { value: 'Nước hoa Dior Sauvage chính hãng', weight: 2 },
    ]);
    expect(nameScore).toBeGreaterThan(descriptionScore);
  });
});
