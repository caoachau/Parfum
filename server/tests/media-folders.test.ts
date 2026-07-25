import { describe, expect, it } from 'vitest';
import { isAdminMediaFolder } from '../src/config/cloudinary';

describe('Admin Cloudinary folders', () => {
  it.each(['products', 'news', 'brand', 'home', 'about', 'feed back'])(
    'allows the managed folder %s',
    (folder) => {
      expect(isAdminMediaFolder(folder)).toBe(true);
    },
  );

  it.each(['../news', 'unknown', 'perfumeshop/news', ''])('rejects %s', (folder) => {
    expect(isAdminMediaFolder(folder)).toBe(false);
  });
});
