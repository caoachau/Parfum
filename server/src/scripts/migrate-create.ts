// =============================================================================
//  MIGRATE:CREATE - Tao nhanh 1 file migration moi tu template.
//  Chay:  npm run migrate:create -- them-truong-xyz
// =============================================================================
import fs from 'fs';
import path from 'path';

const name = process.argv.slice(2).join(' ').trim();
if (!name) {
  console.error('Cach dung: npm run migrate:create -- <ten-migration>');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');
const dir = path.resolve(__dirname, '../migrations');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${stamp}-${slug}.ts`);

const tpl = `import type { Db } from 'mongodb';\nimport type mongoose from 'mongoose';\n\n// ${name}\nexport async function up(db: Db, _m: typeof mongoose) {\n  // TODO: thay doi tien (forward)\n}\n\nexport async function down(db: Db, _m: typeof mongoose) {\n  // TODO: thay doi lui (rollback) - tuy chon\n}\n`;

fs.writeFileSync(file, tpl);
console.log('✅ Da tao migration:', path.relative(process.cwd(), file));
