import { Order } from '../models/order.model';
import { Payment } from '../models/payment.model';
import { env } from '../config/env';

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
  const text = [payload.code, payload.content, payload.description]
    .filter(Boolean)
    .join(' ');
  return text.match(/HOC([A-F\d]{24})/i)?.[1]?.toLowerCase() || '';
}

/** Ghi nhan giao dich de admin doi soat. Webhook khong tu xac nhan thanh toan. */
export async function processSePayWebhook(payload: SePayWebhookPayload) {
  const transactionId = String(payload.id || '').trim();
  if (!transactionId) return { matched: false, reason: 'missing_transaction_id' };

  const duplicate: any = await Payment.findOne({
    provider: 'sepay',
    providerTransactionId: transactionId,
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
  if (!order || order.status === 'cancelled') {
    return { matched: false, reason: 'order_not_payable' };
  }

  const payment: any = await Payment.findOne({ order: order._id });
  if (!payment || payment.method !== 'bank_qr') {
    return { matched: false, reason: 'payment_not_found' };
  }

  const receivedAmount = Number(payload.transferAmount || 0);
  if (!Number.isSafeInteger(receivedAmount) || receivedAmount !== Number(payment.amount)) {
    return {
      matched: false,
      reason: 'amount_mismatch',
      expectedAmount: Number(payment.amount),
    };
  }

  if (payment.status === 'paid') {
    return { matched: true, alreadyPaid: true, orderId };
  }

  try {
    const updated: any = await Payment.findOneAndUpdate(
      { _id: payment._id, status: 'unpaid', providerTransactionId: null },
      {
        $set: {
          provider: 'sepay',
          providerTransactionId: transactionId,
          bankReference: String(payload.referenceCode || ''),
          receivedAmount,
        },
      },
      { new: true },
    );

    if (!updated) return { matched: true, duplicate: true, orderId };
    return { matched: true, orderId, status: 'awaiting_admin_confirmation' };
  } catch (error: any) {
    if (error?.code === 11000) {
      const existing: any = await Payment.findOne({
        provider: 'sepay',
        providerTransactionId: transactionId,
      });
      return { matched: true, duplicate: true, orderId: String(existing?.order || orderId) };
    }
    throw error;
  }
}
