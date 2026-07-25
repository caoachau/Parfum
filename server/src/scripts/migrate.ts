// =============================================================================
//  MIGRATE - Trinh chay migration co ban, theo doi trong collection `_migrations`.
//  Chay:  npm run migrate                (chay tat ca migration dang cho -> up)
//         npm run migrate:down            (revert migration moi nhat -> down)
//         npm run migrate down 3          (revert 3 migration gan nhat)
//  File migration nam trong server/src/migrations/ dat ten: <so-thu-tu>-<ten>.ts
//  Moi file export: up(db, mongoose) va (tuy chon) down(db, mongoose).
// =============================================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import mongoose from 'mongoose';
import type { Db } from 'mongodb';
import { env } from '../config/env';

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const COLLECTION = '_migrations';

type MigrationModule = {
  up: (db: Db, m: typeof mongoose) => Promise<void>;
  down?: (db: Db, m: typeof mongoose) => Promise<void>;
};

async function loadMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+.*\.(ts|js)$/.test(f) && !f.endsWith('.d.ts'))
    .sort();
  const list: Array<{ name: string; mod: MigrationModule }> = [];
  for (const f of files) {
    const mod = (await import(pathToFileURL(path.join(MIGRATIONS_DIR, f)).href)) as MigrationModule;
    list.push({ name: f.replace(/\.(ts|js)$/, ''), mod });
  }
  return list;
}

async function main() {
  const direction = (process.argv[2] === 'down' ? 'down' : 'up') as 'up' | 'down';
  const stepsArg = Number(process.argv[3]);
  const steps = Number.isFinite(stepsArg) ? stepsArg : direction === 'down' ? 1 : Infinity;

  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db!;
  const store = db.collection<{ name: string; appliedAt: Date }>(COLLECTION);
  const applied = new Set((await store.find().toArray()).map((d) => d.name));
  const all = await loadMigrations();

  let count = 0;
  if (direction === 'up') {
    const pending = all.filter((m) => !applied.has(m.name));
    if (!pending.length) console.log('✅ Khong co migration nao can chay.');
    for (const m of pending) {
      if (count >= steps) break;
      console.log(`⬆️  up: ${m.name}`);
      await m.mod.up(db, mongoose);
      await store.insertOne({ name: m.name, appliedAt: new Date() });
      count++;
    }
    console.log(`✅ Da chay ${count} migration.`);
  } else {
    const appliedList = all.filter((m) => applied.has(m.name)).reverse();
    for (const m of appliedList) {
      if (count >= steps) break;
      console.log(`⬇️  down: ${m.name}`);
      if (m.mod.down) await m.mod.down(db, mongoose);
      else console.warn('   (khong co ham down, chi go ban ghi theo doi)');
      await store.deleteOne({ name: m.name });
      count++;
    }
    console.log(`✅ Da revert ${count} migration.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Migration loi:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
