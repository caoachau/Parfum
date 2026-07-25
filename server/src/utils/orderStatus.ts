export function normalizeOrderStatus(status: string) {
  // Du lieu cu tung dung `paid` lam trang thai don. Thanh toan nay duoc quan ly rieng.
  return status === 'paid' ? 'pending' : status;
}
