type BankPayment = {
  method?: unknown;
  status?: unknown;
  providerTransactionId?: unknown;
  receivedAmount?: unknown;
};

/**
 * A bank transfer needs refund handling as soon as money has been recorded,
 * even when an administrator has not changed the payment status to `paid` yet.
 */
export function bankTransferNeedsRefund(payment: BankPayment | null | undefined) {
  if (!payment || payment.method !== 'bank_qr') return false;
  return (
    payment.status === 'paid' ||
    Boolean(String(payment.providerTransactionId || '').trim()) ||
    Number(payment.receivedAmount || 0) > 0
  );
}
