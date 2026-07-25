import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

// Backfill basePrice = price cho cac variant chua co basePrice (du lieu cu).
export async function up(db: Db, _m: typeof mongoose) {
  const res = await db
    .collection('variants')
    .updateMany({ $or: [{ basePrice: { $exists: false } }, { basePrice: null }] }, [
      { $set: { basePrice: '$price' } },
    ]);
  console.log(`   basePrice backfilled: ${res.modifiedCount} variant`);
}

export async function down(db: Db, _m: typeof mongoose) {
  await db.collection('variants').updateMany({}, { $unset: { basePrice: '' } });
}
