// =============================================================================
//  CLOUDINARY CONFIG (dung chung toan he thong)
//  - Cau hinh 1 lan tu bien moi truong, tai su dung o upload middleware + media.
//  - isCloudinaryConfigured: kiem tra da co du 3 bien env chua de bao loi ro rang.
// =============================================================================
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinaryName,
  api_key: env.cloudinaryKey,
  api_secret: env.cloudinarySecret,
  secure: true,
});

export const isCloudinaryConfigured = Boolean(
  env.cloudinaryName && env.cloudinaryKey && env.cloudinarySecret,
);

// Thu muc tren Cloudinary dung lam thu vien anh cho web.
// Doi bang bien moi truong CLOUDINARY_FOLDER trong file .env (mac dinh 'parfum').
// Ho tro folder long nhau, vd: CLOUDINARY_FOLDER=lessence/products
export const CLOUDINARY_FOLDER = (env.cloudinaryFolder || 'parfumeshop')
  .trim()
  .replace(/^\/+|\/+$/g, '');

export const ADMIN_MEDIA_FOLDERS = [
  'products',
  'news',
  'brand',
  'home',
  'about',
  'feed back',
] as const;

export function isAdminMediaFolder(value: string) {
  return ADMIN_MEDIA_FOLDERS.includes(value as (typeof ADMIN_MEDIA_FOLDERS)[number]);
}

export { cloudinary };
