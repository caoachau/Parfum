import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

// Nap tat ca model roi dong bo index (syncIndexes) khop voi schema hien tai.
export async function up(_db: Db, m: typeof mongoose) {
  const modelsDir = path.resolve(__dirname, '../models');
  const files = fs
    .readdirSync(modelsDir)
    .filter((f) => /\.(ts|js)$/.test(f) && !f.endsWith('.d.ts'));
  for (const f of files) {
    await import(pathToFileURL(path.join(modelsDir, f)).href);
  }
  for (const name of Object.keys(m.models)) {
    await m.models[name].syncIndexes();
    console.log(`   synced indexes: ${name}`);
  }
}

export async function down() {
  // Khong tu dong go index (tranh mat rang buoc quan trong).
}
