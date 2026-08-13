import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { Variant } from '../src/models/variant.model';
import * as notificationService from '../src/services/notification.service';
import * as adminOrderService from '../src/services/admin-order.service';
import * as orderService from '../src/services/order.service';
import { processSePayWebhook } from '../src/services/payment-webhook.service';

const orderId = '507f1f77bcf86cd799439011';

function mockPayableOrder() {
  vi.spyOn(Order, 'findById').mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: orderId, status: 'pending' }),
    }),
  } as any);
}

function webhookPayload(amount: number, transactionId = 'sepay-tx-1') {
  return {
    id: transactionId,
    accountNumber: env.vietqr.accountNo,
    content: `Thanh toan HOC${orderId}`,
    transferType: 'in',
    transferAmount: amount,
    referenceCode: 'BANK-REF-1',
  };
}

afterEach(() => vi.restoreAllMocks());

describe('Bank transfer reconciliation', () => {
  it('records an underpayment and reports the remaining amount', async () => {
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
    };
    vi.spyOn(Payment, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment as any);
    mockPayableOrder();
    const updated = {
      ...payment,
      receivedAmount: 450_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    const update = vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(updated as any);

    await expect(processSePayWebhook(webhookPayload(450_000))).resolves.toEqual({
      matched: true,
      orderId,
      status: 'partial',
      expectedAmount: 500_000,
      receivedAmount: 450_000,
      remainingAmount: 50_000,
      excessAmount: 0,
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(updated.status).toBe('partial');
    expect(updated.save).toHaveBeenCalledTimes(1);
  });

  it('records an exact payment but waits for admin confirmation', async () => {
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
    };
    vi.spyOn(Payment, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment as any);
    mockPayableOrder();
    const updated = {
      ...payment,
      receivedAmount: 500_000,
      providerTransactionId: 'sepay-tx-1',
      save: vi.fn().mockResolvedValue(undefined),
    };
    const update = vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(updated as any);

    await expect(processSePayWebhook(webhookPayload(500_000))).resolves.toEqual({
      matched: true,
      orderId,
      status: 'awaiting_confirmation',
      expectedAmount: 500_000,
      receivedAmount: 500_000,
      remainingAmount: 0,
      excessAmount: 0,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ _id: payment._id }),
      expect.objectContaining({
        $inc: { receivedAmount: 500_000 },
        $push: expect.any(Object),
      }),
      { new: true },
    );
    expect(updated.reconciliationStatus).toBe('awaiting_confirmation');
  });

  it('treats a repeated SePay transaction as a duplicate', async () => {
    vi.spyOn(Payment, 'findOne').mockResolvedValue({
      order: orderId,
      provider: 'sepay',
      providerTransactionId: 'sepay-tx-1',
    } as any);
    const orderLookup = vi.spyOn(Order, 'findById');
    const update = vi.spyOn(Payment, 'findOneAndUpdate');

    await expect(processSePayWebhook(webhookPayload(500_000))).resolves.toEqual({
      matched: true,
      duplicate: true,
      orderId,
    });
    expect(orderLookup).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('marks only the excess as pending refund when customer transfers too much', async () => {
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
    };
    vi.spyOn(Payment, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment as any);
    mockPayableOrder();
    const updated = {
      ...payment,
      receivedAmount: 550_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(updated as any);
    vi.spyOn(notificationService, 'sendPaymentReconciliationNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    await expect(processSePayWebhook(webhookPayload(550_000))).resolves.toMatchObject({
      matched: true,
      status: 'overpaid',
      receivedAmount: 550_000,
      excessAmount: 50_000,
      remainingAmount: 0,
    });
    expect(updated.refundStatus).toBe('pending');
    expect(updated.refundAmount).toBe(50_000);
    expect(updated.status).toBe('unpaid');
  });

  it('records money arriving after cancellation and queues the actual amount for refund', async () => {
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
    };
    vi.spyOn(Payment, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment as any);
    vi.spyOn(Order, 'findById').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: orderId, status: 'cancelled' }),
      }),
    } as any);
    const updated = {
      ...payment,
      receivedAmount: 200_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue(updated as any);

    await expect(processSePayWebhook(webhookPayload(200_000))).resolves.toMatchObject({
      matched: true,
      status: 'late_payment',
      receivedAmount: 200_000,
    });
    expect(updated.status).toBe('refund_pending');
    expect(updated.refundAmount).toBe(200_000);
    expect(updated.refundReason).toBe('late_payment_after_cancellation');
  });
});

describe('Cancellation, inventory and refund notification', () => {
  it('blocks shipping and admin confirmation while a QR payment is still short', async () => {
    const order = { _id: orderId, status: 'pending' };
    const partialPayment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'partial',
      amount: 500_000,
      receivedAmount: 200_000,
    };
    vi.spyOn(Order, 'findById').mockResolvedValue(order as any);
    vi.spyOn(Payment, 'findOne').mockResolvedValue(partialPayment as any);
    const updateOrder = vi.spyOn(Order, 'findOneAndUpdate');

    await expect(adminOrderService.updateStatus(orderId, 'shipping')).rejects.toMatchObject({
      status: 409,
    });
    await expect(adminOrderService.confirmPayment(orderId)).rejects.toMatchObject({
      status: 409,
    });
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it('confirms an overpayment as paid while keeping only the excess in the refund queue', async () => {
    const payment = {
      _id: '507f1f77bcf86cd799439012',
      order: orderId,
      method: 'bank_qr',
      status: 'unpaid',
      amount: 500_000,
      receivedAmount: 550_000,
    };
    const order = { _id: orderId, status: 'pending', items: [], total: 500_000 };
    vi.spyOn(Payment, 'findOne')
      .mockReturnValueOnce(Promise.resolve(payment) as any)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(payment) } as any);
    const update = vi.spyOn(Payment, 'findOneAndUpdate').mockResolvedValue({
      ...payment,
      status: 'paid',
    } as any);
    vi.spyOn(Order, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(order) }),
    } as any);

    await adminOrderService.confirmPayment(orderId);

    expect(update).toHaveBeenCalledWith(
      { _id: payment._id },
      {
        $set: expect.objectContaining({
          status: 'paid',
          excessAmount: 50_000,
          refundStatus: 'pending',
          refundAmount: 50_000,
          refundReason: 'overpayment',
        }),
      },
      { new: true },
    );
  });

  it('restores stock and requests a refund when SePay recorded money before admin confirmation', async () => {
    const order = {
      _id: orderId,
      user: 'user-1',
      status: 'pending',
      items: [{ variant: 'variant-1', quantity: 2 }],
      address: {},
    };
    const payment = {
      method: 'bank_qr',
      status: 'unpaid',
      providerTransactionId: 'sepay-tx-1',
      receivedAmount: 500_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Order, 'findOneAndUpdate').mockResolvedValue(order as any);
    const stockUpdate = vi
      .spyOn(Variant, 'updateOne')
      .mockResolvedValue({ acknowledged: true, modifiedCount: 1 } as any);
    vi.spyOn(Payment, 'findOne').mockResolvedValue(payment as any);
    vi.spyOn(notificationService, 'sendOrderNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    await orderService.cancelOrder('user-1', orderId);

    expect(stockUpdate).toHaveBeenCalledWith(
      { _id: 'variant-1' },
      { $inc: { stock: 2 } },
      { session: undefined },
    );
    expect(payment.status).toBe('refund_pending');
    expect(payment.save).toHaveBeenCalledTimes(1);
  });

  it('requests a refund when the QR popup cancellation follows a recorded transfer', async () => {
    const order = {
      _id: orderId,
      user: 'user-1',
      status: 'pending',
      items: [{ variant: 'variant-1', quantity: 1 }],
      address: {},
    };
    const payment = {
      method: 'bank_qr',
      status: 'unpaid',
      providerTransactionId: 'sepay-tx-popup',
      receivedAmount: 500_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Order, 'findOne').mockResolvedValue(order as any);
    vi.spyOn(Order, 'findOneAndUpdate').mockResolvedValue(order as any);
    vi.spyOn(Payment, 'findOne').mockResolvedValue(payment as any);
    vi.spyOn(Variant, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
    vi.spyOn(notificationService, 'sendOrderNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    await expect(orderService.cancelPendingQrOrder(orderId, 'user-1')).resolves.toEqual({
      orderId,
      status: 'cancelled',
    });
    expect(payment.status).toBe('refund_pending');
    expect(payment.save).toHaveBeenCalledTimes(1);
  });

  it('requests a refund when admin cancels an order with a recorded transfer', async () => {
    const order = {
      _id: orderId,
      status: 'pending',
      total: 500_000,
      items: [{ variant: 'variant-1', quantity: 1 }],
      address: { email: 'buyer@example.com' },
      statusHistory: [],
    };
    const payment = {
      method: 'bank_qr',
      status: 'unpaid',
      providerTransactionId: 'sepay-tx-admin',
      receivedAmount: 500_000,
      save: vi.fn().mockResolvedValue(undefined),
    };
    const populatedOrderQuery = {
      populate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(order) }),
    };
    vi.spyOn(Order, 'findById')
      .mockReturnValueOnce(Promise.resolve(order) as any)
      .mockReturnValueOnce(populatedOrderQuery as any);
    vi.spyOn(Order, 'findOneAndUpdate').mockResolvedValue(order as any);
    vi.spyOn(Payment, 'findOne')
      .mockReturnValueOnce(Promise.resolve(payment) as any)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(payment) } as any);
    vi.spyOn(Variant, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
    vi.spyOn(notificationService, 'sendOrderNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    await adminOrderService.updateStatus(orderId, 'cancelled', 'Khách yêu cầu hủy');

    expect(payment.status).toBe('refund_pending');
    expect(payment.save).toHaveBeenCalledTimes(1);
  });

  it('restores stock at cancellation and only once for repeated cancellation attempts', async () => {
    const order = {
      _id: orderId,
      user: 'user-1',
      status: 'paid',
      items: [{ variant: 'variant-1', quantity: 2 }],
      address: {},
    };
    const payment = {
      method: 'bank_qr',
      status: 'paid',
      paidAt: new Date(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(Order, 'findOneAndUpdate')
      .mockResolvedValueOnce(order as any)
      .mockResolvedValueOnce(null);
    const stockUpdate = vi
      .spyOn(Variant, 'updateOne')
      .mockResolvedValue({ acknowledged: true, modifiedCount: 1 } as any);
    vi.spyOn(Payment, 'findOne').mockResolvedValue(payment as any);
    vi.spyOn(notificationService, 'sendOrderNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    await expect(orderService.cancelOrder('user-1', orderId)).resolves.toEqual({
      orderId,
      status: 'cancelled',
    });
    expect(stockUpdate).toHaveBeenCalledTimes(1);
    expect(stockUpdate).toHaveBeenCalledWith(
      { _id: 'variant-1' },
      { $inc: { stock: 2 } },
      { session: undefined },
    );
    expect(payment.status).toBe('refund_pending');

    await expect(orderService.cancelOrder('user-1', orderId)).rejects.toMatchObject({
      status: 404,
    });
    expect(stockUpdate).toHaveBeenCalledTimes(1);
  });

  it('sends the refund email once for two sequential refund attempts', async () => {
    const payment = {
      method: 'bank_qr',
      status: 'refund_pending',
      refundStatus: 'pending',
      refundAmount: 500_000,
      refundedAt: undefined as Date | undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    const populatedOrder = {
      _id: orderId,
      status: 'cancelled',
      total: 500_000,
      items: [],
      address: { email: 'buyer@example.com' },
    };
    const orderQuery = {
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(populatedOrder),
      }),
    };
    vi.spyOn(Order, 'findById')
      .mockReturnValueOnce(Promise.resolve({ _id: orderId }) as any)
      .mockReturnValueOnce(orderQuery as any)
      .mockReturnValueOnce(Promise.resolve({ _id: orderId }) as any);
    vi.spyOn(Payment, 'findOne')
      .mockReturnValueOnce(Promise.resolve(payment) as any)
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(payment) } as any)
      .mockReturnValueOnce(Promise.resolve(payment) as any);
    const notify = vi
      .spyOn(notificationService, 'sendOrderNotification')
      .mockResolvedValue({ sent: true, email: 'buyer@example.com' });

    await expect(adminOrderService.markRefunded(orderId)).resolves.toMatchObject({
      id: orderId,
      notificationDelivery: { sent: true, email: 'buyer@example.com' },
    });
    await expect(adminOrderService.markRefunded(orderId)).rejects.toMatchObject({ status: 400 });
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
