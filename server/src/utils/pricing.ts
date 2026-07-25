// Các hàm THUẦN (pure) để tính tiền đơn hàng: voucher, phí ship, thuế, điểm thưởng.
// Tách riêng để dễ viết unit test (Vitest) và tái sử dụng.
export interface Voucherish {
  type: 'percent' | 'fixed';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
}

export const FREE_SHIP_THRESHOLD = 1_000_000; // Miễn phí ship cho đơn từ 1.000.000đ
export const SHIPPING_FEE = 30_000; // Phí ship mặc định
export const TAX_RATE = 0; // VAT demo (đặt 0 để không đội giá; đổi thành 0.08 nếu cần)

export function computeDiscount(subtotal: number, voucher?: Voucherish | null): number {
  if (!voucher) return 0;
  if (voucher.minOrder && subtotal < voucher.minOrder) return 0;
  let d = voucher.type === 'percent' ? Math.round((subtotal * voucher.value) / 100) : voucher.value;
  if (voucher.maxDiscount && voucher.maxDiscount > 0) d = Math.min(d, voucher.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

export function computeShipping(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function computeTax(base: number): number {
  return Math.round(base * TAX_RATE);
}

export function computeLoyaltyPoints(total: number): number {
  return Math.floor(total / 10000); // 1 điểm cho mỗi 10.000đ
}

export interface Totals {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  pointsEarned: number;
}

export function computeTotals(subtotal: number, voucher?: Voucherish | null): Totals {
  const discount = computeDiscount(subtotal, voucher);
  const afterDiscount = subtotal - discount;
  const shippingFee = computeShipping(afterDiscount);
  const tax = computeTax(afterDiscount);
  const total = afterDiscount + shippingFee + tax;
  return { subtotal, discount, shippingFee, tax, total, pointsEarned: computeLoyaltyPoints(total) };
}
