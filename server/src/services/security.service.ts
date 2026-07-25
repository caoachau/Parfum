import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { User } from '../models/user.model';
import Brand from '../models/brand.model';
import Category from '../models/category.model';

// Tao slug tu ten (bo dau tieng Viet, ky tu dac biet -> gach ngang).
function slugify(input: string) {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Sua loi E11000 dup key { slug: null } tren brands/categories:
// 1) Xoa index cu 'slug_1' (unique, KHONG sparse) neu con sot lai tu schema cu.
// 2) Dien slug cho cac ban ghi dang thieu / null.
// 3) Dong bo lai index theo schema moi (unique + sparse).
export async function fixLegacySlugIndexes() {
  const models: Array<{ Model: any; label: string }> = [
    { Model: Brand, label: 'brands' },
    { Model: Category, label: 'categories' },
  ];

  for (const { Model, label } of models) {
    const coll = Model.collection;

    try {
      const indexes: any[] = await coll.indexes();
      const legacy = indexes.find((i) => i.name === 'slug_1' && !i.sparse);
      if (legacy) {
        await coll.dropIndex('slug_1');
        logger.info(`[migrate] Da xoa index cu slug_1 tren ${label}`);
      }
    } catch {
      // khong co index -> bo qua
    }

    const docs: any[] = await Model.find({
      $or: [{ slug: null }, { slug: { $exists: false } }, { slug: '' }],
    });
    for (const doc of docs) {
      const base = slugify(doc.name) || 'muc';
      let slug = base;
      let i = 1;
      // eslint-disable-next-line no-await-in-loop
      while (
        await Model.findOne({ slug, _id: { $ne: doc._id } })
          .select('_id')
          .lean()
      ) {
        slug = `${base}-${i++}`;
      }
      doc.slug = slug;
      // eslint-disable-next-line no-await-in-loop
      await doc.save();
    }
    if (docs.length) logger.info(`[migrate] Da dien slug cho ${docs.length} ban ghi ${label}`);

    try {
      await Model.syncIndexes();
    } catch (e) {
      logger.warn(`[migrate] syncIndexes ${label} loi (bo qua):`, (e as Error).message);
    }
  }
}

// Dam bao co it nhat 1 tai khoan admin.
// KHAC BAN CU: chi TAO khi CHUA co admin; KHONG reset mat khau tai khoan da ton tai;
// KHONG in credential ra log. Neu thieu bien moi truong -> bo qua & canh bao.
export async function ensureDefaultAdmin() {
  const email = (env.defaultAdminEmail || '').toLowerCase();

  // Neu da co admin (theo email cau hinh, hoac bat ky admin nao) -> khong lam gi.
  const existing = email ? await User.findOne({ email }) : await User.findOne({ role: 'admin' });
  if (existing) return;

  if (!email || !env.adminBootstrapPassword) {
    logger.warn(
      '[bootstrap] Chua co admin va thieu DEFAULT_ADMIN_EMAIL / ADMIN_BOOTSTRAP_PASSWORD. ' +
        'Bo qua tao admin tu dong. Hay set env roi khoi dong lai, hoac chay: npm run create-admin',
    );
    return;
  }

  const hash = await bcrypt.hash(env.adminBootstrapPassword, 12);
  await User.create({
    name: "Admin L'Essence Noire",
    email,
    password: hash,
    role: 'admin',
    isEmailVerified: true,
  });
  // Chi log email, KHONG log mat khau.
  logger.info(
    `[bootstrap] Da tao tai khoan admin: ${email} (mat khau lay tu ADMIN_BOOTSTRAP_PASSWORD)`,
  );
}

// Rotate mat khau admin tu "legacy" sang ADMIN_BOOTSTRAP_PASSWORD (opt-in qua env).
// Chi doi khi mat khau hien tai dung trung legacy; khong log gia tri mat khau.
export async function rotateDefaultAdminPassword() {
  if (!env.defaultAdminEmail || !env.adminBootstrapPassword) return;

  const admin = await User.findOne({
    email: env.defaultAdminEmail.toLowerCase(),
    role: 'admin',
  }).select('+password');

  if (!admin?.password) return;

  const usesLegacyPassword = await bcrypt.compare(
    env.legacyAdminPassword,
    admin.password as string,
  );
  if (!usesLegacyPassword) return;

  admin.password = await bcrypt.hash(env.adminBootstrapPassword, 12);
  await admin.save();
  logger.info('[security] Đã xoay mật khẩu admin mặc định');
}
