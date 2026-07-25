// PF-43: thiet lap bien moi truong toi thieu cho moi truong test.
// Chay truoc moi file test (setupFiles trong vitest.config.ts) de tranh loi
// "Thieu bien moi truong" khi import src/config/env.ts.
// Chi dat gia tri mac dinh khi bien chua ton tai -> khong ghi de .env that (neu co).
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parfum-shop-test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
