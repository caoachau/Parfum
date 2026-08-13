import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Order } from '../src/models/order.model';
import { Payment } from '../src/models/payment.model';
import { SupportRequest } from '../src/models/supportRequest.model';
import { createSupportRequest } from '../src/services/report.service';
import { hashGuestOrderToken } from '../src/utils/guestOrderAccess';

const orderId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const now = new Date('2026-08-10T10:00:00.000Z');

function leanResult(value: unknown) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

function mockReturnOrder(completedAt: Date) {
  vi.spyOn(Order, 'findOne').mockReturnValue(
    leanResult({ _id: orderId, user: userId, status: 'done', completedAt }) as any,
  );
}

function mockPayment(method: 'cod' | 'bank_qr', status = 'paid') {
  vi.spyOn(Payment, 'findOne').mockReturnValue(
    leanResult({ order: orderId, method, status }) as any,
  );
}

function mockNoExistingRequest() {
  vi.spyOn(SupportRequest, 'findOne').mockReturnValue({
    select: vi.fn().mockReturnValue(leanResult(null)),
  } as any);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('return support requests', () => {
  it.each(['cod', 'bank_qr'] as const)(
    'accepts a paid %s order during the three-day window',
    async (method) => {
      mockReturnOrder(new Date('2026-08-08T10:00:00.000Z'));
      mockPayment(method);
      mockNoExistingRequest();
      const create = vi
        .spyOn(SupportRequest, 'create')
        .mockResolvedValue({ _id: 'support-1' } as any);

      await expect(
        createSupportRequest(
          {
            type: 'returns',
            orderId,
            name: 'Khach hang',
            email: 'buyer@example.com',
            subject: 'Doi / hoan tra san pham',
            message: 'San pham con nguyen ven.',
          },
          userId,
        ),
      ).resolves.toMatchObject({ _id: 'support-1' });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          order: orderId,
          type: 'returns',
          subject: expect.stringContaining('#99439011'),
        }),
      );
    },
  );

  it('rejects a request after three days from confirmed delivery', async () => {
    mockReturnOrder(new Date('2026-08-07T09:59:59.000Z'));
    mockPayment('cod');
    const existingRequestLookup = vi.spyOn(SupportRequest, 'findOne');

    await expect(
      createSupportRequest(
        {
          type: 'returns',
          orderId,
          name: 'Khach hang',
          email: 'buyer@example.com',
          subject: 'Doi tra',
          message: 'Can duoc ho tro doi tra.',
        },
        userId,
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect(existingRequestLookup).not.toHaveBeenCalled();
  });

  it('accepts a guest order when its private access token is provided', async () => {
    const guestToken = 'private-guest-order-token';
    const orderLookup = vi.spyOn(Order, 'findOne').mockReturnValue(
      leanResult({
        _id: orderId,
        status: 'done',
        completedAt: new Date('2026-08-09T10:00:00.000Z'),
      }) as any,
    );
    mockPayment('cod');
    mockNoExistingRequest();
    const create = vi
      .spyOn(SupportRequest, 'create')
      .mockResolvedValue({ _id: 'support-guest' } as any);

    await createSupportRequest(
      {
        type: 'returns',
        orderId,
        name: 'Khach vang lai',
        email: 'guest@example.com',
        subject: 'Doi tra',
        message: 'Can duoc ho tro doi tra.',
      },
      undefined,
      guestToken,
    );

    expect(orderLookup).toHaveBeenCalledWith({
      _id: orderId,
      guestAccessTokenHash: hashGuestOrderToken(guestToken),
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ user: undefined, order: orderId }),
    );
  });

  it('requires the return request to belong to an authenticated customer', async () => {
    const orderLookup = vi.spyOn(Order, 'findOne');

    await expect(
      createSupportRequest({
        type: 'returns',
        orderId,
        name: 'Khach hang',
        email: 'buyer@example.com',
        subject: 'Doi tra',
        message: 'Can duoc ho tro doi tra.',
      }),
    ).rejects.toMatchObject({ status: 401 });

    expect(orderLookup).not.toHaveBeenCalled();
  });
});
