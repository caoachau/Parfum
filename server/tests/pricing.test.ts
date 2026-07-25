import { describe, it, expect } from 'vitest';
import {
  computeDiscount,
  computeShipping,
  computeTotals,
  computeLoyaltyPoints,
  FREE_SHIP_THRESHOLD,
  SHIPPING_FEE,
} from '../src/utils/pricing';

describe('pricing', () => {
  it('khong giam khi khong co voucher', () => {
    expect(computeDiscount(500_000, null)).toBe(0);
  });

  it('giam theo phan tram va gioi han maxDiscount', () => {
    expect(computeDiscount(1_000_000, { type: 'percent', value: 10 })).toBe(100_000);
    expect(
      computeDiscount(1_000_000, { type: 'percent', value: 50, maxDiscount: 200_000 }),
    ).toBe(200_000);
  });

  it('bo qua voucher neu chua dat minOrder', () => {
    expect(computeDiscount(100_000, { type: 'fixed', value: 50_000, minOrder: 500_000 })).toBe(0);
  });

  it('mien phi ship khi dat nguong', () => {
    expect(computeShipping(FREE_SHIP_THRESHOLD)).toBe(0);
    expect(computeShipping(FREE_SHIP_THRESHOLD - 1)).toBe(SHIPPING_FEE);
    expect(computeShipping(0)).toBe(0);
  });

  it('cong diem thuong theo tong tien', () => {
    expect(computeLoyaltyPoints(250_000)).toBe(25);
  });

  it('tinh tong dung: subtotal -> discount -> ship -> total', () => {
    const t = computeTotals(600_000, { type: 'fixed', value: 100_000 });
    expect(t.subtotal).toBe(600_000);
    expect(t.discount).toBe(100_000);
    expect(t.shippingFee).toBe(SHIPPING_FEE);
    expect(t.total).toBe(500_000 + SHIPPING_FEE);
  });
});
