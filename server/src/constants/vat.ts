/**
 * Gia ban cua cua hang la gia da bao gom VAT.
 * Thuế suất được lưu dưới dạng thập phân: 0.1 tương ứng 10%.
 */
export const VAT_RATE = 0.1;
export const PRICES_INCLUDE_VAT = true;

/** Bóc ngược phần VAT đã nằm trong tổng tiền thực trả, không cộng thêm vào tổng. */
export function calculateVatIncluded(grossAmount: number, vatRate = VAT_RATE): number {
  const gross = Math.max(0, Number(grossAmount) || 0);
  const rate = Math.max(0, Number(vatRate) || 0);
  if (!gross || !rate) return 0;
  return Math.round((gross * rate) / (1 + rate));
}
