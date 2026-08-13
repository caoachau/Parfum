import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  adminApi,
  apiMessage,
  formatDate,
  formatVnd,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type AdminOrder,
  type AdminOrderList,
} from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingState,
  Modal,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  Select,
} from "../../components/admin/ui";

const EMPTY_TAB_COUNTS: AdminOrderList["tabCounts"] = {
  all: 0,
  pending: 0,
  shipping: 0,
  done: 0,
  cancelled: 0,
  returned: 0,
  qrUnpaid: 0,
  qrPartial: 0,
  qrOverpaid: 0,
  refundPending: 0,
};

function TabCount({
  value,
  active,
  alert = false,
}: {
  value: number;
  active: boolean;
  alert?: boolean;
}) {
  return (
    <span
      className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        active
          ? "bg-white/20 text-inherit"
          : alert && value > 0
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-600"
      }`}
    >
      {value}
    </span>
  );
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromSearch = useRef(false);
  const [list, setList] = useState<AdminOrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const status = searchParams.get("status") || "";
  const paymentStatus = searchParams.get("payment") || "";
  const paymentMethod = searchParams.get("method") || "";
  const paymentCase = searchParams.get("case") || "";
  const tabCounts = list?.tabCounts ?? EMPTY_TAB_COUNTS;
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const actionableRefund = Boolean(
    detail?.payment?.method === "bank_qr" &&
    Number(detail.payment.refundAmount || 0) > 0 &&
    (detail.payment.status === "refund_pending" || detail.payment.refundStatus === "pending"),
  );

  async function load() {
    try {
      setLoading(true);
      const data = await adminApi.get<AdminOrderList>("/orders", {
        page,
        limit: 12,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        paymentCase: paymentCase || undefined,
      });
      setList(data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được đơn hàng"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paymentStatus, paymentMethod, paymentCase]);

  function setFilters(next: { status?: string; payment?: string; method?: string; case?: string }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("open");
    setPage(1);
    setSearchParams(params, { replace: true });
  }

  useEffect(() => {
    const orderId = searchParams.get("open");
    if (!orderId || openedFromSearch.current) return;
    openedFromSearch.current = true;
    openDetail(orderId).finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("open");
      setSearchParams(next, { replace: true });
    });
    // Chi mo mot lan khi dieu huong tu Super Search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function openDetail(id: string) {
    try {
      setDetail(await adminApi.get<AdminOrder>(`/orders/${id}`));
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được chi tiết"));
    }
  }

  async function changeStatus(newStatus: string, reason?: string) {
    if (!detail) return;
    try {
      setBusy(true);
      const updated = await adminApi.patch<AdminOrder>(`/orders/${detail.id}/status`, {
        status: newStatus,
        reason: reason || undefined,
      });
      setDetail(updated);
      if (updated.notificationDelivery?.sent) {
        toast.success(
          `Đã cập nhật trạng thái và gửi email tới ${updated.notificationDelivery.email}`,
        );
      } else if (updated.notificationDelivery?.reason === "disabled_by_customer") {
        toast.success("Đã cập nhật trạng thái. Khách hàng đang tắt thông báo đơn hàng.");
      } else if (updated.notificationDelivery?.reason === "smtp_not_configured") {
        toast.error("Đã cập nhật trạng thái nhưng chưa gửi email: SMTP chưa được cấu hình.");
      } else {
        toast.error("Đã cập nhật trạng thái nhưng email chưa gửi được.");
      }
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Cập nhật thất bại"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    setCancelPromptOpen(false);
    await changeStatus("cancelled", cancelReason.trim());
  }

  async function changePayment(newStatus: string) {
    if (!detail) return;
    try {
      setBusy(true);
      const updated = await adminApi.patch<AdminOrder>(`/orders/${detail.id}/payment`, {
        status: newStatus,
      });
      setDetail(updated);
      toast.success("Đã cập nhật thanh toán");
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Cập nhật thất bại"));
    } finally {
      setBusy(false);
    }
  }

  async function markRefunded() {
    if (!detail) return;
    try {
      setBusy(true);
      const updated = await adminApi.post<AdminOrder>(`/orders/${detail.id}/refund`);
      setDetail(updated);
      if (updated.notificationDelivery?.sent) {
        toast.success(
          `Đã xác nhận hoàn tiền và gửi email tới ${updated.notificationDelivery.email}`,
        );
      } else {
        toast.success("Đã đánh dấu đã hoàn tiền cho khách.");
      }
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Không thể cập nhật hoàn tiền"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Quản lý đơn hàng" subtitle="Theo dõi và cập nhật trạng thái đơn hàng" />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilters({ status: "", payment: "", method: "", case: "" });
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            status === "" && paymentStatus === "" && paymentMethod === "" && paymentCase === ""
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          Tất cả
          <TabCount
            value={tabCounts.all}
            active={
              status === "" && paymentStatus === "" && paymentMethod === "" && paymentCase === ""
            }
          />
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilters({ status: s, payment: "", method: "", case: "" });
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              status === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white"
            }`}
          >
            {ORDER_STATUS_LABEL[s]}
            <TabCount value={tabCounts[s]} active={status === s} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilters({ status: "", payment: "unpaid", method: "bank_qr", case: "" })}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            paymentStatus === "unpaid" && paymentMethod === "bank_qr"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          QR chưa thanh toán
          <TabCount
            value={tabCounts.qrUnpaid}
            active={paymentStatus === "unpaid" && paymentMethod === "bank_qr"}
          />
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters({ status: "", payment: "partial", method: "bank_qr", case: "" })
          }
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            paymentStatus === "partial"
              ? "border-red-700 bg-red-700 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          QR chuyển thiếu
          <TabCount value={tabCounts.qrPartial} active={paymentStatus === "partial"} alert />
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters({ status: "", payment: "", method: "bank_qr", case: "overpaid" })
          }
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            paymentCase === "overpaid"
              ? "border-red-700 bg-red-700 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          QR chuyển dư
          <TabCount value={tabCounts.qrOverpaid} active={paymentCase === "overpaid"} alert />
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters({ status: "", payment: "", method: "", case: "refund_pending" })
          }
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            paymentCase === "refund_pending"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          Cần hoàn tiền
          <TabCount
            value={tabCounts.refundPending}
            active={paymentCase === "refund_pending"}
            alert
          />
        </button>
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : !list || !list.data || list.data.length === 0 ? (
          <EmptyState message="Không có đơn hàng nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">SL</th>
                  <th className="p-4">Tổng</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày đặt</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">
                        {o.customer?.name || o.address?.fullName || "Khách vãng lai"}
                      </p>
                      <p className="text-xs text-gray-400">{o.customer?.email || ""}</p>
                    </td>
                    <td className="p-4">{o.itemCount}</td>
                    <td className="p-4">{formatVnd(o.total)}</td>
                    <td className="p-4">
                      {o.payment?.status === "paid" ? (
                        <Badge color="green">Đã trả</Badge>
                      ) : o.payment?.status === "partial" ? (
                        <Badge color="red">Chuyển thiếu</Badge>
                      ) : o.payment?.status === "refund_pending" ? (
                        <Badge color="yellow">Chờ hoàn tiền</Badge>
                      ) : o.payment?.status === "refunded" ? (
                        <Badge color="red">Đã hoàn tiền</Badge>
                      ) : (
                        <Badge color="yellow">Chưa trả</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="p-4 text-xs text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="p-4 text-right">
                      <Button variant="secondary" onClick={() => openDetail(o.id)}>
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {list && <Pagination page={list.page} totalPages={list.totalPages} onChange={setPage} />}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        wide
        title={detail ? `Đơn #${detail.id.slice(-6).toUpperCase()}` : ""}
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Trạng thái đơn">
                <Select
                  value={detail.status}
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.value === "cancelled") {
                      setCancelReason("");
                      setCancelPromptOpen(true);
                    } else {
                      changeStatus(e.target.value);
                    }
                  }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Thanh toán">
                <Select
                  value={detail.payment?.status || "unpaid"}
                  disabled={busy}
                  onChange={(e) => changePayment(e.target.value)}
                >
                  <option value="unpaid">Chưa thanh toán</option>
                  {detail.payment?.status === "partial" && (
                    <option value="partial" disabled>
                      Chuyển thiếu
                    </option>
                  )}
                  <option value="paid">Đã thanh toán</option>
                  {detail.payment?.status === "refund_pending" && (
                    <option value="refund_pending" disabled>
                      Chờ hoàn tiền
                    </option>
                  )}
                  {detail.payment?.status === "refunded" && (
                    <option value="refunded" disabled>
                      Đã hoàn tiền
                    </option>
                  )}
                </Select>
              </Field>
            </div>

            {detail.payment?.method === "bank_qr" && (
              <div
                className={`border p-4 text-sm ${
                  detail.payment.providerTransactionId
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {detail.payment.providerTransactionId ? (
                  <>
                    <p className="font-medium">
                      {detail.payment.reconciliationStatus === "partial"
                        ? "SePay đã ghi nhận chuyển thiếu; chưa được phép giao hàng."
                        : detail.payment.reconciliationStatus === "overpaid"
                          ? "SePay đã ghi nhận chuyển dư; cần xác nhận và hoàn phần chênh."
                          : "SePay đã ghi nhận giao dịch, đang chờ admin xác nhận."}
                    </p>
                    <p className="mt-1 text-xs">
                      Số tiền nhận: {formatVnd(detail.payment.receivedAmount)}
                      {detail.payment.excessAmount
                        ? ` · Chuyển dư: ${formatVnd(detail.payment.excessAmount)}`
                        : ""}
                      {detail.payment.bankReference
                        ? ` · Mã tham chiếu: ${detail.payment.bankReference}`
                        : ""}
                    </p>
                    {detail.paymentCancellationAt && (
                      <p className="mt-1 text-xs">
                        Tự hủy nếu chưa đủ tiền: {formatDate(detail.paymentCancellationAt)}
                      </p>
                    )}
                  </>
                ) : (
                  <p>Chưa ghi nhận giao dịch chuyển khoản từ SePay.</p>
                )}
              </div>
            )}

            {actionableRefund && detail.payment && (
              <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">⚠️ Đơn này cần hoàn tiền cho khách</p>
                <p className="mt-1 text-xs">
                  Cần hoàn {formatVnd(detail.payment.refundAmount)} cho khách. Sau khi đã chuyển
                  khoản trả lại, bấm nút bên dưới để xác nhận và gửi email thông báo.
                </p>
                <div className="mt-3">
                  <Button onClick={markRefunded} disabled={busy}>
                    {busy ? "Đang xử lý…" : "Đánh dấu đã hoàn tiền"}
                  </Button>
                </div>
              </div>
            )}

            {detail.payment?.status === "refunded" && (
              <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">✓ Đã hoàn tiền cho khách hàng.</p>
              </div>
            )}

            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p>
                <span className="text-gray-500">Khách hàng: </span>
                <b>{detail.customer?.name || detail.address?.fullName || "Khách vãng lai"}</b>
              </p>
              {detail.customer?.email && (
                <p>
                  <span className="text-gray-500">Email: </span>
                  {detail.customer.email}
                </p>
              )}
              {detail.address && (
                <p>
                  <span className="text-gray-500">Địa chỉ: </span>
                  {[detail.address.line, detail.address.city].filter(Boolean).join(", ")}{" "}
                  {detail.address.phone ? `– ${detail.address.phone}` : ""}
                </p>
              )}
              <p>
                <span className="text-gray-500">Phương thức: </span>
                {detail.payment?.method === "bank_qr" ? "Chuyển khoản QR" : "COD"}
              </p>
              {detail.note && (
                <p>
                  <span className="text-gray-500">Ghi chú: </span>
                  {detail.note}
                </p>
              )}
              {detail.cancelReason && (
                <p>
                  <span className="text-gray-500">Lý do hủy: </span>
                  {detail.cancelReason}
                  {detail.cancelledBy
                    ? ` (${detail.cancelledBy === "admin" ? "cửa hàng" : detail.cancelledBy === "system" ? "hệ thống" : "khách hàng"})`
                    : ""}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                    <th className="py-2">Sản phẩm</th>
                    <th className="py-2">Dung tích</th>
                    <th className="py-2">Giá</th>
                    <th className="py-2">SL</th>
                    <th className="py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((it, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2">{it.name}</td>
                      <td className="py-2">{it.volume || "—"}</td>
                      <td className="py-2">
                        <span
                          className={it.productDiscountAmount ? "font-medium text-red-700" : ""}
                        >
                          {formatVnd(it.finalPrice ?? it.price)}
                        </span>
                        {!!it.productDiscountAmount && (
                          <>
                            <span className="ml-2 text-xs text-gray-400 line-through">
                              {formatVnd(it.basePrice)}
                            </span>
                            <p className="text-[10px] text-red-600">{it.promotionName}</p>
                          </>
                        )}
                      </td>
                      <td className="py-2">{it.quantity}</td>
                      <td className="py-2 text-right">{formatVnd(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-3 text-right font-semibold">
                      Tổng cộng
                    </td>
                    <td className="py-3 text-right text-lg font-bold text-gray-900">
                      {formatVnd(detail.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={cancelPromptOpen}
        onClose={() => setCancelPromptOpen(false)}
        title="Hủy đơn hàng"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Nhập lý do hủy đơn (không bắt buộc). Khách hàng sẽ nhận email thông báo đơn đã hủy.
          </p>
          <Field label="Lý do hủy">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-gray-900"
              placeholder="Ví dụ: Khách yêu cầu hủy, hết hàng…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelPromptOpen(false)}>
              Quay lại
            </Button>
            <Button onClick={confirmCancel} disabled={busy}>
              {busy ? "Đang hủy…" : "Xác nhận hủy"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
