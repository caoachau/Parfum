export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "Chờ xử lý", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Đã thanh toán", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  shipping: { label: "Đang giao", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  done: { label: "Hoàn thành", cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy", cls: "bg-red-50 text-red-600 border-red-200" },
  returned: { label: "Đã hoàn trả", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

export const PAY_STATUS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
  refund_pending: "Đang hoàn tiền",
  refunded: "Đã hoàn tiền",
};

export const PAY_METHOD: Record<string, string> = {
  cod: "COD (khi nhận hàng)",
  bank_qr: "Chuyển khoản QR",
};
