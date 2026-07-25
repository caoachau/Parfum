import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";

const vnd = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";
const fmtDate = (s: string) =>
  s
    ? new Date(s).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

type OrderRow = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  itemCount: number;
  firstItemName: string;
  payment: { method: string; status: string };
};

export const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Chờ xử lý",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  shipping: {
    label: "Đang giao",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  done: {
    label: "Hoàn thành",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: { label: "Đã hủy", cls: "bg-red-50 text-red-600 border-red-200" },
};
export const PAY_STATUS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
};
export const PAY_METHOD: Record<string, string> = {
  cod: "COD (khi nhận hàng)",
  bank_qr: "Chuyển khoản QR",
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || {
    label: status,
    cls: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={
        "inline-block border rounded-full px-3 py-1 text-[11px] font-sans font-semibold uppercase tracking-[0.5px] " +
        s.cls
      }
    >
      {s.label}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/orders")
      .then(({ data }) => {
        if (active) setOrders(Array.isArray(data.data) ? data.data : []);
      })
      .catch((e) => {
        if (active) setError(e?.response?.data?.message || "Không tải được danh sách đơn hàng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="max-w-5xl mx-auto px-6 py-12 bg-[#FDF9F4] min-h-[70vh]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[2px] text-[#5F5E5E] hover:text-[#735C00] mb-6"
        >
          <ArrowLeft size={14} /> Trang tài khoản
        </Link>

        <header className="mb-8">
          <h1 className="font-serif text-4xl text-[#1C1C19]">Đơn hàng của tôi</h1>
          <p className="font-sans uppercase tracking-[3px] text-xs text-[#5F5E5E] mt-3">
            Lịch sử mua hàng của bạn
          </p>
        </header>

        {loading && <p className="font-sans text-[#5F5E5E]">Đang tải…</p>}
        {!loading && error && <p className="font-sans text-red-600">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-[rgba(208,197,175,0.6)] bg-[#F7F3EE]">
            <Package size={54} className="text-[#735C00] mb-5" />
            <h3 className="font-serif text-2xl text-[#1C1C19]">Chưa có đơn hàng nào</h3>
            <p className="font-sans text-[#5F5E5E] mt-2 mb-6">
              Hãy khám phá các sản phẩm và đặt đơn đầu tiên.
            </p>
            <Link
              to="/shop"
              className="border border-[#735C00] text-[#735C00] px-8 py-3 font-sans uppercase tracking-[3px] text-sm hover:bg-[#735C00] hover:text-white duration-300"
            >
              Mua sắm ngay
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={"/orders/" + o.id}
                className="flex items-center gap-4 bg-white border border-[rgba(208,197,175,0.4)] p-5 hover:shadow-md hover:border-[#735C00]/40 duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-[#F7F3EE] text-[#735C00] flex items-center justify-center shrink-0">
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-sans font-semibold text-[#1C1C19]">
                      Đơn #{o.id.slice(-6).toUpperCase()}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="font-sans text-xs text-[#5F5E5E] mt-1 truncate">
                    {fmtDate(o.createdAt)} · {o.itemCount} sản phẩm
                    {o.firstItemName ? " · " + o.firstItemName : ""}
                  </p>
                  <p className="font-sans text-[11px] text-[#735C00] mt-0.5 uppercase tracking-[0.5px]">
                    {PAY_METHOD[o.payment?.method] || o.payment?.method} —{" "}
                    {PAY_STATUS[o.payment?.status] || o.payment?.status}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-serif text-lg text-[#1C1C19]">{vnd(o.total)}</div>
                  <span className="inline-flex items-center gap-1 font-sans text-xs text-[#735C00] mt-1">
                    Chi tiết <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
