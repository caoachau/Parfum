import { afterEach, describe, expect, it, vi } from 'vitest';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { Variant } from '../src/models/variant.model';
import * as notificationService from '../src/services/notification.service';
import {
  expireQrOrder,
  processQrPaymentLifecycle,
} from '../src/services/qr-payment-lifecycle.service';

const orderId = '507f1f77bcf86cd799439011';

afterEach(() => vi.restoreAllMocks());

describe('QR payment expiration', () => {
  it('cancels an unpaid order, restores stock and does it only once', async () => {
    const now = new Date('2026-08-09T10:00:00.000Z');
    const order = {
      _id: orderId,
      items: [{ variant: 'variant-1', quantity: 2 }],
      address: {},
    };
    const payment = {
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
      receivedAmount: 0,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Payment, 'findOne').mockResolvedValue(payment as any);
    vi.spyOn(Order, 'findOneAndUpdate')
      .mockResolvedValueOnce(order as any)
      .mockResolvedValueOnce(null);
    const stock = vi.spyOn(Variant, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
    vi.spyOn(notificationService, 'sendPaymentReconciliationNotification').mockResolvedValue({
      sent: true,
      email: 'buyer@example.com',
    });

    await expect(expireQrOrder(orderId, now, false)).resolves.toBe(order);
    await expect(expireQrOrder(orderId, now, false)).resolves.toBeNull();
    expect(stock).toHaveBeenCalledTimes(1);
    expect(stock).toHaveBeenCalledWith(
      { _id: 'variant-1' },
      { $inc: { stock: 2 } },
      { session: undefined },
    );
  });

  it('queues exactly the partial amount for refund when a partial order expires', async () => {
    const order = { _id: orderId, items: [], address: {} };
    const payment = {
      method: 'bank_qr',
      status: 'partial',
      amount: 500_000,
      receivedAmount: 200_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Payment, 'findOne').mockResolvedValue(payment as any);
    vi.spyOn(Order, 'findOneAndUpdate').mockResolvedValue(order as any);

    await expireQrOrder(orderId, new Date(), false);

    expect(payment.status).toBe('refund_pending');
    expect(payment.refundStatus).toBe('pending');
    expect(payment.refundAmount).toBe(200_000);
    expect(payment.refundReason).toBe('payment_timeout');
  });

  it('never expires an order when the bank has already reported enough money', async () => {
    vi.spyOn(Payment, 'findOne').mockResolvedValue({
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
      receivedAmount: 500_000,
    } as any);
    const claim = vi.spyOn(Order, 'findOneAndUpdate');

    await expect(expireQrOrder(orderId, new Date(), false)).resolves.toBeNull();
    expect(claim).not.toHaveBeenCalled();
  });

  it('claims an email reminder marker so a repeated job does not send it twice', async () => {
    const order = { _id: orderId };
    vi.spyOn(Payment, 'distinct').mockResolvedValue([] as any);
    const query = (items: any[]) => ({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(items) }),
      }),
    });
    vi.spyOn(Order, 'find')
      .mockReturnValueOnce(query([order]) as any)
      .mockReturnValueOnce(query([]) as any)
      .mockReturnValueOnce(query([]) as any)
      .mockReturnValueOnce(query([order]) as any)
      .mockReturnValueOnce(query([]) as any)
      .mockReturnValueOnce(query([]) as any);
    vi.spyOn(Payment, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        method: 'bank_qr',
        status: 'unpaid',
        amount: 500_000,
        receivedAmount: 0,
      }),
    } as any);
    vi.spyOn(Order, 'findOneAndUpdate')
      .mockResolvedValueOnce(order as any)
      .mockResolvedValueOnce(null);
    const send = vi
      .spyOn(notificationService, 'sendPaymentReconciliationNotification')
      .mockResolvedValue({ sent: true, email: 'buyer@example.com' });

    await processQrPaymentLifecycle(new Date('2026-08-09T10:00:00.000Z'));
    await processQrPaymentLifecycle(new Date('2026-08-09T10:01:00.000Z'));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(orderId, 'unpaid_reminder');
  });
});
