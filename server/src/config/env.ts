import path from 'path';
import dotenv from 'dotenv';

// Luon nap server/.env, ke ca khi lenh npm duoc chay tu workspace goc.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Doc 1 bien moi truong bat buoc. Neu thieu -> bao loi ro ngay luc khoi dong.
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Thieu bien moi truong: ${key} (kiem tra file .env)`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required('MONGO_URI'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // pf52: danh sach origin duoc phep (CORS allowlist)
  allowedOrigins: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // pf54: Cloudinary (upload anh)
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'parfum',
  // VietQR va webhook xac nhan giao dich ngan hang.
  vietqr: {
    bankBin: (process.env.VIETQR_BANK_BIN || '').trim(),
    accountNo: (process.env.VIETQR_ACCOUNT_NO || '').trim(),
    accountName: (process.env.VIETQR_ACCOUNT_NAME || '').trim(),
  },
  sepay: {
    webhookSecret: (process.env.SEPAY_WEBHOOK_SECRET || '').trim(),
  },
  // pf52: bootstrap doi mat khau admin mac dinh
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || '',
  legacyAdminPassword: process.env.LEGACY_ADMIN_PASSWORD || 'admin123456',
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
  // --- Bo sung: ha tang & bao mat ---
  // Redis dung cho rate limit phan tan khi chay nhieu instance (tuy chon).
  redisUrl: process.env.REDIS_URL || '',
  // Sentry error tracking (tuy chon). Chi bat khi da cai @sentry/node + set DSN.
  sentryDsn: process.env.SENTRY_DSN || '',
  // Bat/tat bao ve CSRF double-submit (mac dinh BAT). Chi tat khi that su can.
  csrfEnabled: process.env.CSRF_ENABLED !== 'false',
  // So proxy tin cay dung truoc app (nginx / load balancer) -> req.ip chinh xac + secure cookie.
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
};
