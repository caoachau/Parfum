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
  type Paginated,
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

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromSearch = useRef(false);
  const [list, setList] = useState<Paginated<AdminOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const status = searchParams.get("status") || "";
  const paymentStatus = searchParams.get("payment") || "";
  const paymentMethod = searchParams.get("method") || "";
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await adminApi.get<Paginated<AdminOrder>>("/orders", {
        page,
        limit: 12,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
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
  }, [page, status, paymentStatus, paymentMethod]);

  function setFilters(next: { status?: string; payment?: string; method?: string }) {
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

  async function changeStatus(newStatus: string) {
    if (!detail) return;
    try {
      setBusy(true);
      const updated = await adminApi.patch<AdminOrder>(`/orders/${detail.id}/status`, {
        status: newStatus,
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

  return (
    <div>
      <PageHeader title="Quản lý đơn hàng" subtitle="Theo dõi và cập nhật trạng thái đơn hàng" />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilters({ status: "", payment: "", method: "" });
          }}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            status === "" && paymentStatus === "" && paymentMethod === ""
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          Tất cả
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilters({ status: s, payment: "", method: "" });
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              status === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white"
            }`}
          >
            {ORDER_STATUS_LABEL[s]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilters({ status: "", payment: "unpaid", method: "bank_qr" })}
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            paymentStatus === "unpaid" && paymentMethod === "bank_qr"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white"
          }`}
        >
          QR chưa thanh toán
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
                  onChange={(e) => changeStatus(e.target.value)}
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
                  <option value="paid">Đã thanh toán</option>
                  {detail.payment?.status === "refunded" && (
                    <option value="refunded" disabled>Đã hoàn tiền</option>
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
                      SePay đã ghi nhận giao dịch, đang chờ admin xác nhận.
                    </p>
                    <p className="mt-1 text-xs">
                      Số tiền nhận: {formatVnd(detail.payment.receivedAmount)}
                      {detail.payment.bankReference
                        ? ` · Mã tham chiếu: ${detail.payment.bankReference}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p>Chưa ghi nhận giao dịch chuyển khoản từ SePay.</p>
                )}
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
                  {[detail.address.line, detail.address.city]
                    .filter(Boolean)
                    .join(", ")}{" "}
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
                        <span className={it.productDiscountAmount ? "font-medium text-red-700" : ""}>{formatVnd(it.finalPrice ?? it.price)}</span>
                        {!!it.productDiscountAmount && <><span className="ml-2 text-xs text-gray-400 line-through">{formatVnd(it.basePrice)}</span><p className="text-[10px] text-red-600">{it.promotionName}</p></>}
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
    </div>
  );
}
