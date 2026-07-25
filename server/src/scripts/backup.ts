// =============================================================================
//  BACKUP - Sao luu toan bo database ra file .json.gz (Extended JSON, giu nguyen
//  kieu ObjectId/Date). Portable, khong can cai mongodump.
//  Chay:  npm run backup            (luu vao server/backups/<timestamp>/)
// =============================================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';
import { EJSON } from 'bson';
import { env } from '../config/env';

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(process.cwd(), 'backups', stamp);
  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  const manifest: Array<{ collection: string; count: number; file: string }> = [];

  for (const info of collections) {
    const name = info.name;
    if (name.startsWith('system.')) continue;
    const docs = await db.collection(name).find({}).toArray();
    const file = `${name}.json.gz`;
    fs.writeFileSync(path.join(outDir, file), zlib.gzipSync(Buffer.from(EJSON.stringify(docs))));
    manifest.push({ collection: name, count: docs.length, file });
    console.log(`  • ${name}: ${docs.length} docs`);
  }

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(
      { createdAt: new Date().toISOString(), database: db.databaseName, collections: manifest },
      null,
      2,
    ),
  );
  console.log(`\n✅ Backup xong: ${outDir}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Backup loi:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
