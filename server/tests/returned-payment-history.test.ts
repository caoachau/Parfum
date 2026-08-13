import { afterEach, describe, expect, it, vi } from 'vitest';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { Variant } from '../src/models/variant.model';
import * as notificationService from '../src/services/notification.service';
import { getOrder, updateStatus } from '../src/services/admin-order.service';

const orderId = '507f1f77bcf86cd799439011';

afterEach(() => vi.restoreAllMocks());

describe('manual returned status', () => {
  it('does not expose a legacy zero-dong COD refund as pending', async () => {
    vi.spyOn(Order, 'findById').mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: orderId,
          status: 'returned',
          total: 1_000,
          items: [],
          address: {},
        }),
      }),
    } as any);
    vi.spyOn(Payment, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        order: orderId,
        method: 'cod',
        status: 'refund_pending',
        amount: 1_000,
        refundAmount: 0,
        refundStatus: 'none',
      }),
    } as any);

    await expect(getOrder(orderId)).resolves.toMatchObject({
      status: 'returned',
      payment: { method: 'cod', status: 'paid', refundStatus: 'none', refundAmount: 0 },
    });
  });

  it('restores accepted goods but preserves the original paid COD/QR transaction', async () => {
    const order = {
      _id: orderId,
      status: 'done',
      total: 500_000,
      items: [
        { variant: '507f1f77bcf86cd799439013', name: 'Nuoc hoa', quantity: 1, price: 500_000 },
      ],
      address: {},
      statusHistory: [],
    };
    const returnedOrder = { ...order, status: 'returned' };
    const paidPayment = { method: 'cod', status: 'paid', amount: 500_000 };

    vi.spyOn(Order, 'findById')
      .mockReturnValueOnce(Promise.resolve(order) as any)
      .mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(returnedOrder),
        }),
      } as any);
    vi.spyOn(Order, 'findOneAndUpdate').mockResolvedValue(order as any);
    const stock = vi.spyOn(Variant, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as any);
    const paymentUpdate = vi.spyOn(Payment, 'updateOne');
    vi.spyOn(Payment, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(paidPayment),
    } as any);
    vi.spyOn(notificationService, 'sendOrderNotification').mockResolvedValue({
      sent: false,
      reason: 'smtp_not_configured',
      email: 'buyer@example.com',
    });

    const result = await updateStatus(orderId, 'returned');

    expect(stock).toHaveBeenCalledTimes(1);
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(result.payment).toMatchObject({ method: 'cod', status: 'paid' });
  });
});
