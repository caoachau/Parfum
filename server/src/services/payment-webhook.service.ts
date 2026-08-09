import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { env } from '../config/env';
import { sendPaymentReconciliationNotification } from './notification.service';

export type SePayWebhookPayload = {
  id?: number | string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  description?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
  transactionDate?: string;
};

function compactAccount(value: unknown) {
  return String(value || '').replace(/\s/g, '');
}

function findOrderId(payload: SePayWebhookPayload) {
  const text = [payload.code, payload.content, payload.description].filter(Boolean).join(' ');
  return text.match(/HOC([A-F\d]{24})/i)?.[1]?.toLowerCase() || '';
}

function transactionDate(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Ghi nhan moi giao dich den theo ma giao dich ngan hang. Mot don co the nhan
 * nhieu lan chuyen (chuyen thieu roi chuyen bo sung); ma giao dich trong mang
 * `transactions` va index unique ngan webhook retry cong tien lan hai.
 */
export async function processSePayWebhook(payload: SePayWebhookPayload) {
  const transactionId = String(payload.id || '').trim();
  if (!transactionId) return { matched: false, reason: 'missing_transaction_id' };

  const duplicate: any = await Payment.findOne({
    $or: [
      { provider: 'sepay', providerTransactionId: transactionId },
      { 'transactions.providerTransactionId': transactionId },
    ],
  });
  if (duplicate) {
    return { matched: true, duplicate: true, orderId: String(duplicate.order) };
  }

  if (String(payload.transferType || '').toLowerCase() !== 'in') {
    return { matched: false, reason: 'not_incoming' };
  }
  if (compactAccount(payload.accountNumber) !== compactAccount(env.vietqr.accountNo)) {
    return { matched: false, reason: 'wrong_account' };
  }

  const orderId = findOrderId(payload);
  if (!orderId) return { matched: false, reason: 'order_code_not_found' };

  const order: any = await Order.findById(orderId).select('_id status').lean();
  if (!order) return { matched: false, reason: 'order_not_found' };

  const payment: any = await Payment.findOne({ order: order._id });
  if (!payment || payment.method !== 'bank_qr') {
    return { matched: false, reason: 'payment_not_found' };
  }

  const incomingAmount = Number(payload.transferAmount || 0);
  if (!Number.isSafeInteger(incomingAmount) || incomingAmount <= 0) {
    return { matched: false, reason: 'invalid_amount' };
  }

  const receivedAt = transactionDate(payload.transactionDate);
  try {
    const updated: any = await Payment.findOneAndUpdate(
      {
        _id: payment._id,
        providerTransactionId: { $ne: transactionId },
        'transactions.providerTransactionId': { $ne: transactionId },
      },
      {
        $inc: { receivedAmount: incomingAmount },
        $push: {
          transactions: {
            provider: 'sepay',
            providerTransactionId: transactionId,
            bankReference: String(payload.referenceCode || ''),
            amount: incomingAmount,
            receivedAt,
          },
        },
        $set: {
          provider: 'sepay',
          providerTransactionId: transactionId,
          bankReference: String(payload.referenceCode || ''),
          lastReceivedAt: receivedAt,
        },
      },
      { new: true },
    );

    if (!updated) return { matched: true, duplicate: true, orderId };

    const expectedAmount = Number(updated.amount || payment.amount || 0);
    const receivedAmount = Number(updated.receivedAmount || 0);
    const excessAmount = Math.max(0, receivedAmount - expectedAmount);
    const isCancelled = order.status === 'cancelled';
    const isPartial = receivedAmount < expectedAmount;
    const reconciliationStatus = isCancelled
      ? 'late_payment'
      : isPartial
        ? 'partial'
        : excessAmount > 0
          ? 'overpaid'
          : 'awaiting_confirmation';

    if (isCancelled) {
      updated.status = 'refund_pending';
      updated.refundStatus = 'pending';
      updated.refundAmount = receivedAmount;
      updated.refundReason = 'late_payment_after_cancellation';
    } else if (isPartial) {
      updated.status = 'partial';
    } else if (updated.status !== 'paid') {
      // Webhook ghi nhan tien; admin van la buoc xac nhan doi soat cuoi cung.
      updated.status = 'unpaid';
    }
    updated.reconciliationStatus = reconciliationStatus;
    updated.excessAmount = excessAmount;
    if (!isCancelled && excessAmount > 0) {
      updated.refundStatus = 'pending';
      updated.refundAmount = excessAmount;
      updated.refundReason = 'overpayment';
    }
    await updated.save();

    const notificationKind = isCancelled
      ? 'late_payment'
      : isPartial
        ? 'partial'
        : excessAmount > 0
          ? 'overpaid'
          : null;
    if (notificationKind) {
      void sendPaymentReconciliationNotification(orderId, notificationKind).catch(() => null);
    }

    return {
      matched: true,
      orderId,
      status: reconciliationStatus,
      expectedAmount,
      receivedAmount,
      remainingAmount: Math.max(0, expectedAmount - receivedAmount),
      excessAmount,
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing: any = await Payment.findOne({
        $or: [
          { provider: 'sepay', providerTransactionId: transactionId },
          { 'transactions.providerTransactionId': transactionId },
        ],
      });
      return { matched: true, duplicate: true, orderId: String(existing?.order || orderId) };
    }
    throw error;
  }
}
