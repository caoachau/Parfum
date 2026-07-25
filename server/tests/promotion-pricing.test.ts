import { describe, expect, it } from 'vitest';
import { mayStackVoucher, productPromotionPrice, voucherDiscountAmount } from '../src/utils/promotionPricing';

describe('promotion pricing rules', () => {
  it('luon tinh product discount tren basePrice va khong sua basePrice', () => {
    const basePrice = 5_000_000;
    expect(productPromotionPrice(basePrice, 'PERCENTAGE', 20)).toEqual({ finalPrice: 4_000_000, discount: 1_000_000 });
    expect(basePrice).toBe(5_000_000);
  });

  it('cap discount san pham va khong cho gia am', () => {
    expect(productPromotionPrice(1_000_000, 'PERCENTAGE', 50, 200_000).finalPrice).toBe(800_000);
    expect(productPromotionPrice(1_000_000, 'FIXED', 2_000_000).finalPrice).toBe(0);
  });

  it('voucher tinh tren subtotal sau discount san pham', () => {
    expect(voucherDiscountAmount(800_000, 'percentage', 10)).toBe(80_000);
    expect(voucherDiscountAmount(800_000, 'percentage', 50, 100_000)).toBe(100_000);
    expect(voucherDiscountAmount(800_000, 'free_shipping', 0)).toBe(0);
  });

  it('voucher non-stackable bi chan neu da co uu dai san pham', () => {
    expect(mayStackVoucher(false, 1)).toBe(false);
    expect(mayStackVoucher(false, 0)).toBe(true);
    expect(mayStackVoucher(true, 1)).toBe(true);
  });
});
