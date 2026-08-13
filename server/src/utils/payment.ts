type BankPayment = {
  method?: unknown;
  status?: unknown;
  providerTransactionId?: unknown;
  receivedAmount?: unknown;
  refundStatus?: unknown;
  refundAmount?: unknown;
};

/** Only recorded QR money with a positive amount is an actionable refund. */
export function actionableRefundFilter() {
  return {
    method: 'bank_qr',
    refundAmount: { $gt: 0 },
    $or: [{ status: 'refund_pending' }, { refundStatus: 'pending' }],
  };
}

export function hasActionableRefund(payment: BankPayment | null | undefined) {
  return Boolean(
    payment &&
    payment.method === 'bank_qr' &&
    Number(payment.refundAmount || 0) > 0 &&
    (payment.status === 'refund_pending' || payment.refundStatus === 'pending'),
  );
}

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
