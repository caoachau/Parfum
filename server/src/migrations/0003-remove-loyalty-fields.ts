import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

// Loyalty chua duoc trien khai thanh tinh nang; xoa du lieu diem legacy khoi DB.
export async function up(db: Db, _m: typeof mongoose) {
  const [users, orders] = await Promise.all([
    db
      .collection('users')
      .updateMany({ loyaltyPoints: { $exists: true } }, { $unset: { loyaltyPoints: '' } }),
    db
      .collection('orders')
      .updateMany({ pointsEarned: { $exists: true } }, { $unset: { pointsEarned: '' } }),
  ]);

  console.log(`   removed loyaltyPoints from ${users.modifiedCount} user(s)`);
  console.log(`   removed pointsEarned from ${orders.modifiedCount} order(s)`);
}
