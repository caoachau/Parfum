import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { SupportRequest } from '../models/supportRequest.model';

const APPLY_CHANGES = process.argv.includes('--apply');
const TARGETS = [
  { id: '6a5ad24ec300b6124b696402', amount: 6_400_000 },
  { id: '6a5ad24ec300b6124b69640e', amount: 2_840_000 },
  { id: '6a5ad24ec300b6124b69641a', amount: 3_590_000 },
] as const;

function backupPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(__dirname, `../../backups/legacy-momo-orders-${timestamp}.json`);
}

async function main() {
  await mongoose.connect(env.mongoUri);
  const ids = TARGETS.map((target) => new mongoose.Types.ObjectId(target.id));
  const [orders, payments, supportRequests] = await Promise.all([
    Order.find({ _id: { $in: ids } }).lean(),
    Payment.find({ order: { $in: ids } }).lean(),
    SupportRequest.find({ order: { $in: ids } }).lean(),
  ]);

  if (orders.length !== TARGETS.length) {
    throw new Error(
      `Can tim thay ${TARGETS.length} don, thuc te tim thay ${orders.length}. Dung lai.`,
    );
  }
  if (payments.length !== TARGETS.length) {
    throw new Error(
      `Can tim thay ${TARGETS.length} payment, thuc te tim thay ${payments.length}. Dung lai.`,
    );
  }

  for (const target of TARGETS) {
    const order: any = orders.find((item: any) => String(item._id) === target.id);
    const payment: any = payments.find((item: any) => String(item.order) === target.id);
    if (!order || Number(order.total) !== target.amount) {
      throw new Error(`Tong tien don ${target.id} khong khop dieu kien an toan. Dung lai.`);
    }
    if (
      !payment ||
      payment.method !== 'momo' ||
      payment.status !== 'paid' ||
      Number(payment.amount) !== target.amount
    ) {
      throw new Error(`Payment don ${target.id} khong con la momo/paid dung so tien. Dung lai.`);
    }
  }

  console.table(
    orders.map((order: any) => {
      const payment: any = payments.find((item: any) => String(item.order) === String(order._id));
      return {
        Don: `#${String(order._id).slice(-8).toUpperCase()}`,
        TrangThai: order.status,
        PhuongThuc: payment.method,
        ThanhToan: payment.status,
        SoTien: payment.amount,
      };
    }),
  );

  if (!APPLY_CHANGES) {
    console.log('DRY RUN: chua xoa du lieu. Chay lai voi --apply de sao luu va xoa.');
    return;
  }

  const savedBackupPath = backupPath();
  fs.mkdirSync(path.dirname(savedBackupPath), { recursive: true });
  fs.writeFileSync(
    savedBackupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        reason: 'Remove three confirmed legacy seed orders using unsupported momo payments',
        stockRestored: false,
        orders,
        payments,
        supportRequests,
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log(`Da sao luu tai: ${savedBackupPath}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await SupportRequest.deleteMany({ order: { $in: ids } }, { session });
      const paymentResult = await Payment.deleteMany({ order: { $in: ids } }, { session });
      const orderResult = await Order.deleteMany({ _id: { $in: ids } }, { session });
      if (
        paymentResult.deletedCount !== TARGETS.length ||
        orderResult.deletedCount !== TARGETS.length
      ) {
        throw new Error('So ban ghi da xoa khong khop; transaction se duoc rollback.');
      }
    });
  } finally {
    await session.endSession();
  }

  console.log(`Da xoa ${TARGETS.length} don momo cu va ${TARGETS.length} payment lien quan.`);
  console.log('Khong cong ton kho theo chu y da xac nhan truoc khi xoa.');
}

main()
  .catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
