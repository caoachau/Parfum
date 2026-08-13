import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { PRICES_INCLUDE_VAT, VAT_RATE } from '../constants/vat';
import { env } from '../config/env';
import { Order } from '../models/order.model';
import { deriveVatBackfillSnapshot } from '../utils/orderVatBackfill';

const APPLY_CHANGES = process.argv.includes('--apply');
const rateArgument = process.argv.find((argument) => argument.startsWith('--rate='));
const requestedRate = rateArgument ? Number(rateArgument.split('=')[1]) : VAT_RATE;

const MISSING_VAT_SNAPSHOT = {
  $or: [
    { vatRate: { $exists: false } },
    { vatRate: null },
    { vatIncluded: { $exists: false } },
    { vatIncluded: null },
    { pricesIncludeVat: { $ne: true } },
  ],
};

type BackupEntry = {
  orderId: string;
  before: {
    vatRate: { present: boolean; value?: unknown };
    vatIncluded: { present: boolean; value?: unknown };
    pricesIncludeVat: { present: boolean; value?: unknown };
  };
  after: { vatRate: number; vatIncluded: number; pricesIncludeVat: true };
};

function fieldSnapshot(order: any, field: string) {
  const present = Object.prototype.hasOwnProperty.call(order, field);
  return { present, ...(present ? { value: order[field] } : {}) };
}

function backupPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(__dirname, `../../backups/order-vat-backfill-${timestamp}.json`);
}

async function main() {
  if (!Number.isFinite(requestedRate) || requestedRate < 0 || requestedRate > 1) {
    throw new Error('--rate phai la so tu 0 den 1; vi du --rate=0.1 cho VAT 10%.');
  }
  if (!PRICES_INCLUDE_VAT) {
    throw new Error('Script chi ho tro chinh sach gia da bao gom VAT.');
  }

  await mongoose.connect(env.mongoUri);
  const orders: any[] = await Order.find(MISSING_VAT_SNAPSHOT)
    .select(
      '_id createdAt status subtotal items.price items.quantity vatRate vatIncluded pricesIncludeVat',
    )
    .lean();

  const operations: any[] = [];
  const backups: BackupEntry[] = [];
  const preview: Array<Record<string, unknown>> = [];
  let skipped = 0;
  let productTotal = 0;
  let vatTotal = 0;

  for (const order of orders) {
    const snapshot = deriveVatBackfillSnapshot(order, requestedRate);
    if (!snapshot) {
      skipped += 1;
      continue;
    }

    const after = {
      vatRate: snapshot.vatRate,
      vatIncluded: snapshot.vatIncluded,
      pricesIncludeVat: snapshot.pricesIncludeVat,
    };
    productTotal += snapshot.productTotal;
    vatTotal += snapshot.vatIncluded;
    operations.push({
      updateOne: {
        filter: { _id: order._id, ...MISSING_VAT_SNAPSHOT },
        update: { $set: after },
      },
    });
    backups.push({
      orderId: String(order._id),
      before: {
        vatRate: fieldSnapshot(order, 'vatRate'),
        vatIncluded: fieldSnapshot(order, 'vatIncluded'),
        pricesIncludeVat: fieldSnapshot(order, 'pricesIncludeVat'),
      },
      after,
    });
    if (preview.length < 20) {
      preview.push({
        Don: `#${String(order._id).slice(-8).toUpperCase()}`,
        Ngay: order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '',
        TrangThai: order.status,
        Nguon: snapshot.source,
        GiaSanPham: snapshot.productTotal,
        VAT: snapshot.vatIncluded,
      });
    }
  }

  console.log(`Chinh sach gia da gom VAT. Thue suat dung de dong bo: ${requestedRate * 100}%.`);
  console.log(`Don thieu snapshot VAT: ${orders.length}. Du dieu kien: ${operations.length}.`);
  if (preview.length) console.table(preview);
  console.log(
    `Tong gia san pham duoc doi chieu: ${Math.round(productTotal).toLocaleString('vi-VN')}d.`,
  );
  console.log(`Tong VAT se duoc ghi: ${Math.round(vatTotal).toLocaleString('vi-VN')}d.`);

  if (skipped) {
    console.warn(`Bo qua ${skipped} don vi khong co subtotal hoac dong hang hop le.`);
  }
  if (!APPLY_CHANGES) {
    console.log('DRY RUN: database chua thay doi. Chay npm run backfill-order-vat:apply de ghi.');
    return;
  }
  if (!operations.length) {
    console.log('Khong co don nao can cap nhat.');
    return;
  }

  const savedBackupPath = backupPath();
  fs.mkdirSync(path.dirname(savedBackupPath), { recursive: true });
  fs.writeFileSync(
    savedBackupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        vatRate: requestedRate,
        pricesIncludeVat: PRICES_INCLUDE_VAT,
        orders: backups,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`Da sao luu gia tri cu tai: ${savedBackupPath}`);

  const result = await Order.bulkWrite(operations, { ordered: false });
  console.log(`Da dong bo snapshot VAT cho ${result.modifiedCount}/${operations.length} don.`);
}

main()
  .catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
