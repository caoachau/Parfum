// =============================================================================
//  CREATE ADMIN — tao (hoac nang quyen) tai khoan admin
//  Chay:  npm run create-admin -- <email> <password> [ten]
//  Neu khong truyen tham so -> dung env DEFAULT_ADMIN_EMAIL / ADMIN_BOOTSTRAP_PASSWORD
//  hoac mac dinh admin@lessencenoire.vn / Admin@123
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User } from '../models/user.model';

async function main() {
  const [, , argEmail, argPass, ...rest] = process.argv;
  const email = (argEmail || env.defaultAdminEmail || 'admin@lessencenoire.vn').toLowerCase();
  const password = argPass || env.adminBootstrapPassword || 'Admin@123';
  const name = rest.join(' ') || "Admin L'Essence Noire";

  await mongoose.connect(env.mongoUri);
  const hash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.set({ role: 'admin', password: hash, isEmailVerified: true, name });
    await existing.save();
    console.log(`✅ Da cap nhat admin: ${email} / ${password}`);
  } else {
    await User.create({ name, email, password: hash, role: 'admin', isEmailVerified: true });
    console.log(`✅ Da tao admin moi: ${email} / ${password}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Loi tao admin:', err);
  await mongoose.connection.close();
  process.exit(1);
});
