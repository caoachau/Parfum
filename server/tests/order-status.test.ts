import { describe, expect, it } from 'vitest';
import { normalizeOrderStatus } from '../src/utils/orderStatus';

describe('Order status separation', () => {
  it('maps the legacy paid order status back to pending', () => {
    expect(normalizeOrderStatus('paid')).toBe('pending');
  });

  it.each(['pending', 'shipping', 'done', 'cancelled'])(
    'keeps the fulfillment status %s unchanged',
    (status) => {
      expect(normalizeOrderStatus(status)).toBe(status);
    },
  );
});
