import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

/**
 * Mỗi đơn chỉ có một Payment. Dừng migration nếu dữ liệu cũ đang bị trùng để
 * người vận hành đối soát, tuyệt đối không tự xóa bản ghi tài chính.
 */
export async function up(db: Db, _m: typeof mongoose) {
  const payments = db.collection('payments');
  const [duplicate] = await payments
    .aggregate([
      { $group: { _id: '$order', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
      { $limit: 1 },
    ])
    .toArray();

  if (duplicate) {
    throw new Error(
      `Order ${String(duplicate._id)} có ${duplicate.count} payment; cần đối soát trước khi chạy lại migration`,
    );
  }

  const indexes = await payments.listIndexes().toArray();
  const orderIndex = indexes.find((index) => index.key?.order === 1);
  if (orderIndex && !orderIndex.unique) await payments.dropIndex(orderIndex.name!);
  if (!orderIndex?.unique) {
    await payments.createIndex({ order: 1 }, { name: 'order_1', unique: true });
  }

  await db
    .collection('orders')
    .createIndex({ guestAccessTokenHash: 1 }, { name: 'guestAccessTokenHash_1', sparse: true });
}

export async function down(db: Db) {
  await db
    .collection('payments')
    .dropIndex('order_1')
    .catch(() => undefined);
  await db
    .collection('orders')
    .dropIndex('guestAccessTokenHash_1')
    .catch(() => undefined);
}
