export function productPromotionPrice(
  basePrice: number,
  type: 'PERCENTAGE' | 'FIXED',
  value: number,
  maxDiscountAmount = 0,
) {
  let discount = type === 'PERCENTAGE' ? Math.round(basePrice * value / 100) : value;
  if (maxDiscountAmount > 0) discount = Math.min(discount, maxDiscountAmount);
  discount = Math.max(0, Math.min(basePrice, discount));
  return { finalPrice: basePrice - discount, discount };
}

export function voucherDiscountAmount(
  subtotalAfterProductDiscount: number,
  type: 'percentage' | 'fixed' | 'free_shipping',
  value: number,
  maxDiscountAmount = 0,
) {
  if (type === 'free_shipping') return 0;
  let discount = type === 'percentage' ? Math.round(subtotalAfterProductDiscount * value / 100) : value;
  if (maxDiscountAmount > 0) discount = Math.min(discount, maxDiscountAmount);
  return Math.max(0, Math.min(subtotalAfterProductDiscount, discount));
}

export function mayStackVoucher(stackable: boolean, productLevelDiscount: number) {
  return stackable || productLevelDiscount <= 0;
}
