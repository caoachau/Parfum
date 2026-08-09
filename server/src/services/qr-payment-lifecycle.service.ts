import mongoose from 'mongoose';
import { env } from '../config/env';
import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { logger } from '../utils/logger';
import { releaseOrderPromotionReservations, restoreStock } from './order.service';
import { sendPaymentReconciliationNotification } from './notification.service';

function transactionUnsupported(error: any) {
  const message = String(error?.message || '');
  return (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    /Transaction numbers|replica set|not support|Transactions are not/i.test(message)
  );
}

function canExpire(payment: any) {
  if (!payment || payment.method !== 'bank_qr') return false;
  if (payment.status === 'paid') return false;
  return Number(payment.receivedAmount || 0) < Number(payment.amount || 0);
}

function refundUpdate(payment: any) {
  const received = Number(payment.receivedAmount || 0);
  if (received <= 0) {
    payment.status = 'unpaid';
    return;
  }
  payment.status = 'refund_pending';
  payment.refundStatus = 'pending';
  payment.refundAmount = received;
  payment.refundReason = 'payment_timeout';
}

async function expireWithoutTransaction(orderId: string, now: Date) {
  const payment: any = await Payment.findOne({ order: orderId });
  if (!canExpire(payment)) return null;
  const order: any = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: 'pending',
      inventoryReleasedAt: null,
      paymentCancellationAt: { $lte: now },
    },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledBy: 'system',
        cancelReason: 'Quá hạn thanh toán chuyển khoản QR',
        inventoryReleasedAt: now,
      },
      $push: { statusHistory: { status: 'cancelled', at: now } },
    },
    { new: false },
  );
  if (!order) return null;

  await releaseOrderPromotionReservations(order);
  await restoreStock(
    (order.items || []).map((item: any) => ({
      variant: String(item.variant),
      quantity: Number(item.quantity),
    })),
  );
  refundUpdate(payment);
  await payment.save();
  return order;
}

/** Huy mot don QR qua han. Transaction dam bao order, ton kho va quota uu dai cung commit. */
export async function expireQrOrder(orderId: string, now = new Date(), useTransaction = true) {
  let expiredOrder: any = null;
  if (!useTransaction) {
    expiredOrder = await expireWithoutTransaction(orderId, now);
  } else {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const payment: any = await Payment.findOne({ order: orderId }).session(session);
        if (!canExpire(payment)) return;
        const order: any = await Order.findOneAndUpdate(
          {
            _id: orderId,
            status: 'pending',
            inventoryReleasedAt: null,
            paymentCancellationAt: { $lte: now },
          },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              cancelledBy: 'system',
              cancelReason: 'Quá hạn thanh toán chuyển khoản QR',
              inventoryReleasedAt: now,
            },
            $push: { statusHistory: { status: 'cancelled', at: now } },
          },
          { new: false, session },
        );
        if (!order) return;
        await releaseOrderPromotionReservations(order, session);
        await restoreStock(
          (order.items || []).map((item: any) => ({
            variant: String(item.variant),
            quantity: Number(item.quantity),
          })),
          session,
        );
        refundUpdate(payment);
        await payment.save({ session });
        expiredOrder = order;
      });
    } catch (error) {
      if (!transactionUnsupported(error)) throw error;
      logger.warn('[qr-payment-job] Mongo khong ho tro transaction, dung atomic claim fallback');
      expiredOrder = await expireWithoutTransaction(orderId, now);
    } finally {
      await session.endSession();
    }
  }

  if (expiredOrder) {
    void sendPaymentReconciliationNotification(String(expiredOrder._id), 'expired').catch((error) =>
      logger.error('[qr-payment-job] Gui email huy qua han that bai', error),
    );
  }
  return expiredOrder;
}

async function sendClaimedReminder(
  order: any,
  marker: 'paymentReminderSentAt' | 'paymentExpiryWarningSentAt',
  kind: 'unpaid_reminder' | 'expiry_warning',
  now: Date,
) {
  const payment: any = await Payment.findOne({ order: order._id }).lean();
  if (!canExpire(payment)) return false;
  const claimed: any = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending', [marker]: null },
    { $set: { [marker]: now } },
    { new: false },
  );
  if (!claimed) return false;
  await sendPaymentReconciliationNotification(String(order._id), kind);
  return true;
}

/** Gan deadline cho cac don QR cu duoc tao truoc khi tinh nang expiry duoc trien khai. */
export async function backfillQrPaymentDeadlines() {
  const paymentOrderIds = await Payment.distinct('order', {
    method: 'bank_qr',
    status: { $in: ['unpaid', 'partial'] },
  });
  if (!paymentOrderIds.length) return 0;
  const ttlMs = env.qrPayment.ttlMinutes * 60_000;
  const cancellationMs =
    (env.qrPayment.ttlMinutes + env.qrPayment.reconciliationGraceMinutes) * 60_000;
  const result: any = await Order.updateMany(
    {
      _id: { $in: paymentOrderIds },
      status: 'pending',
      $or: [{ paymentExpiresAt: null }, { paymentCancellationAt: null }],
    },
    [
      {
        $set: {
          paymentExpiresAt: { $ifNull: ['$paymentExpiresAt', { $add: ['$createdAt', ttlMs] }] },
          paymentCancellationAt: {
            $ifNull: ['$paymentCancellationAt', { $add: ['$createdAt', cancellationMs] }],
          },
        },
      },
    ],
  );
  return Number(result?.modifiedCount || 0);
}

let deadlinesBackfilled = false;

export async function processQrPaymentLifecycle(now = new Date()) {
  if (!deadlinesBackfilled) {
    await backfillQrPaymentDeadlines();
    deadlinesBackfilled = true;
  }
  const batchSize = Math.max(1, Math.floor(env.qrPayment.batchSize));
  const reminderThreshold = new Date(
    now.getTime() + env.qrPayment.reminderMinutesBeforeCancellation * 60_000,
  );
  const warningThreshold = new Date(
    now.getTime() + env.qrPayment.warningMinutesBeforeCancellation * 60_000,
  );

  const [reminders, warnings, expirations]: any[][] = await Promise.all([
    Order.find({
      status: 'pending',
      paymentCancellationAt: { $gt: warningThreshold, $lte: reminderThreshold },
      paymentReminderSentAt: null,
    })
      .select('_id')
      .limit(batchSize)
      .lean(),
    Order.find({
      status: 'pending',
      paymentCancellationAt: { $gt: now, $lte: warningThreshold },
      paymentExpiryWarningSentAt: null,
    })
      .select('_id')
      .limit(batchSize)
      .lean(),
    Order.find({
      status: 'pending',
      paymentCancellationAt: { $lte: now },
      inventoryReleasedAt: null,
    })
      .select('_id')
      .limit(batchSize)
      .lean(),
  ]);

  let reminderCount = 0;
  let warningCount = 0;
  let expiredCount = 0;
  for (const order of reminders) {
    if (await sendClaimedReminder(order, 'paymentReminderSentAt', 'unpaid_reminder', now)) {
      reminderCount += 1;
    }
  }
  for (const order of warnings) {
    if (await sendClaimedReminder(order, 'paymentExpiryWarningSentAt', 'expiry_warning', now)) {
      warningCount += 1;
    }
  }
  for (const order of expirations) {
    if (await expireQrOrder(String(order._id), now)) expiredCount += 1;
  }
  return { reminderCount, warningCount, expiredCount };
}

let timer: NodeJS.Timeout | null = null;
let running = false;

export function startQrPaymentLifecycleJob() {
  if (timer || env.nodeEnv === 'test') return;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await processQrPaymentLifecycle();
      if (result.reminderCount || result.warningCount || result.expiredCount) {
        logger.info('[qr-payment-job] Da xu ly vong doi thanh toan QR', result);
      }
    } catch (error) {
      logger.error('[qr-payment-job] Xu ly that bai', error);
    } finally {
      running = false;
    }
  };
  void run();
  timer = setInterval(() => void run(), env.qrPayment.jobIntervalMs);
  timer.unref();
}

export function stopQrPaymentLifecycleJob() {
  if (timer) clearInterval(timer);
  timer = null;
}
