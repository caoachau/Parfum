import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

/**
 * Xoa field tax legacy mo ho. Co y khong ghi vatRate/vatIncluded/pricesIncludeVat
 * cho don cu vi thue suat lich su can duoc doi chieu bang chung tu chinh xac.
 */
export async function up(db: Db, _m: typeof mongoose) {
  const result = await db
    .collection('orders')
    .updateMany({ tax: { $exists: true } }, { $unset: { tax: '' } });

  console.log(
    `   removed legacy tax from ${result.modifiedCount} order(s); VAT was not backfilled`,
  );
}
