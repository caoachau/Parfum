// =============================================================================
//  RESTORE - Khoi phuc database tu 1 thu muc backup do script backup.ts tao ra.
//  Chay:  npm run restore -- backups/<timestamp>          (chi them/ghi de theo _id)
//         npm run restore -- backups/<timestamp> --drop    (xoa collection truoc khi nap)
// =============================================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mongoose from 'mongoose';
import { EJSON } from 'bson';
import { env } from '../config/env';

async function main() {
  const dir = process.argv[2];
  const drop = process.argv.includes('--drop');
  if (!dir) {
    console.error('Cach dung: npm run restore -- <thu-muc-backup> [--drop]');
    process.exit(1);
  }
  const backupDir = path.resolve(process.cwd(), dir);
  const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'));

  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db!;

  for (const entry of manifest.collections as Array<{ collection: string; file: string }>) {
    const raw = zlib.gunzipSync(fs.readFileSync(path.join(backupDir, entry.file))).toString();
    const docs = EJSON.parse(raw) as any[];
    const coll = db.collection(entry.collection);
    if (drop) await coll.deleteMany({});
    if (docs.length) {
      // upsert theo _id de chay lai an toan (idempotent) khi khong --drop.
      const ops = docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      }));
      await coll.bulkWrite(ops, { ordered: false });
    }
    console.log(`  • ${entry.collection}: ${docs.length} docs`);
  }

  console.log(`\n✅ Restore xong tu: ${backupDir}`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('❌ Restore loi:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
