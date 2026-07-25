export const LOYAL_MIN_ORDERS = 3;
export const VIP_MIN_ORDERS = 20;
export const VIP_MIN_SPEND = 50_000_000;

export function isVipCustomer(orderCount: number, totalSpend: number) {
  return orderCount >= VIP_MIN_ORDERS || totalSpend >= VIP_MIN_SPEND;
}
