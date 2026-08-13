import { afterEach, describe, expect, it, vi } from 'vitest';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { getOrderTabCounts } from '../src/services/admin-order.service';

afterEach(() => vi.restoreAllMocks());

describe('admin order tab counts', () => {
  it('dem trang thai don va cac truong hop thanh toan dung voi bo loc tab', async () => {
    vi.spyOn(Order, 'aggregate').mockResolvedValue([
      { _id: 'pending', count: 3 },
      { _id: 'paid', count: 2 },
      { _id: 'shipping', count: 4 },
      { _id: 'done', count: 5 },
      { _id: 'cancelled', count: 6 },
      { _id: 'returned', count: 1 },
    ] as any);
    const paymentAggregate = vi.spyOn(Payment, 'aggregate').mockResolvedValue([
      {
        qrUnpaid: [{ count: 7 }],
        qrPartial: [{ count: 2 }],
        qrOverpaid: [{ count: 1 }],
        refundPending: [{ count: 3 }],
      },
    ] as any);

    await expect(getOrderTabCounts()).resolves.toEqual({
      all: 21,
      pending: 5,
      shipping: 4,
      done: 5,
      cancelled: 6,
      returned: 1,
      qrUnpaid: 7,
      qrPartial: 2,
      qrOverpaid: 1,
      refundPending: 3,
    });

    const pipeline = paymentAggregate.mock.calls[0][0] as any[];
    const refundMatch = pipeline.find((stage) => stage.$facet).$facet.refundPending[0].$match;
    expect(refundMatch).toEqual({
      method: 'bank_qr',
      refundAmount: { $gt: 0 },
      $or: [{ status: 'refund_pending' }, { refundStatus: 'pending' }],
    });
  });

  it('tra ve 0 khi chua co du lieu', async () => {
    vi.spyOn(Order, 'aggregate').mockResolvedValue([] as any);
    vi.spyOn(Payment, 'aggregate').mockResolvedValue([{ refundPending: [] }] as any);

    await expect(getOrderTabCounts()).resolves.toEqual({
      all: 0,
      pending: 0,
      shipping: 0,
      done: 0,
      cancelled: 0,
      returned: 0,
      qrUnpaid: 0,
      qrPartial: 0,
      qrOverpaid: 0,
      refundPending: 0,
    });
  });
});
