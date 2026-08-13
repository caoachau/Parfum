import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlogArticle } from '../src/models/blogArticle.model';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { Review } from '../src/models/review.model';
import { SupportRequest } from '../src/models/supportRequest.model';
import { Variant } from '../src/models/variant.model';
import { getNotifications } from '../src/services/admin.service';

afterEach(() => vi.restoreAllMocks());

describe('admin refund notifications', () => {
  it('shows refund_pending bank transfers in the admin notification center', async () => {
    vi.spyOn(Order, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(Variant, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(Review, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(BlogArticle, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(SupportRequest, 'countDocuments').mockResolvedValue(0 as any);
    vi.spyOn(Payment, 'countDocuments').mockImplementation(
      (filter: any) => Promise.resolve(Array.isArray(filter?.$or) ? 2 : 0) as any,
    );

    const result = await getNotifications();

    expect(Payment.countDocuments).toHaveBeenCalledWith({
      method: 'bank_qr',
      refundAmount: { $gt: 0 },
      $or: [{ status: 'refund_pending' }, { refundStatus: 'pending' }],
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        id: 'refund-pending',
        count: 2,
        severity: 'danger',
        to: '/admin/orders?case=refund_pending&method=bank_qr',
      }),
    ]);
    expect(result.total).toBe(2);
  });
});
