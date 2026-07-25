import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock3, Package, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";

const vnd = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";

type OrderInfo = {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
};

export default function ThankYou() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/orders/" + id);
        if (!active) return;
        setOrder({
          id: data.data.id,
          total: data.data.total,
          status: data.data.status,
          paymentMethod: data.data.payment?.method || "cod",
          paymentStatus: data.data.payment?.status || "unpaid",
        });
      } catch (e: any) {
        if (active) setError(e?.response?.data?.message || "Không tìm thấy đơn hàng");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <section className="mx-auto min-h-[70vh] max-w-3xl bg-[#FDF9F4] px-6 py-16 text-center">
        {loading && <p className="font-sans text-[#5F5E5E]">Đang tải…</p>}
        {!loading && error && <p className="font-sans text-red-600">{error}</p>}

        {!loading && order && (
          <>
            <CheckCircle2 size={64} className="mx-auto mb-6 text-[#637144]" strokeWidth={1.5} />
            <h1 className="font-serif text-4xl text-[#1C1C19] md:text-5xl">
              Đơn hàng đã được ghi nhận
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-6 text-[#5F5E5E]">
              Cảm ơn bạn đã tin chọn L'Essence Noire. Chúng tôi đã nhận thông tin đặt hàng và sẽ
              chuẩn bị đơn trong thời gian sớm nhất.
            </p>

            <div className="mt-8 border border-[rgba(208,197,175,0.5)] bg-white p-6 text-left font-sans">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Mã đơn" value={`#${order.id.slice(-6).toUpperCase()}`} />
                <InfoRow label="Tổng thanh toán" value={vnd(order.total)} />
                <InfoRow
                  label="Phương thức"
                  value={order.paymentMethod === "bank_qr" ? "Chuyển khoản QR" : "COD"}
                />
                <InfoRow
                  label="Thanh toán"
                  value={order.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ xác nhận"}
                />
              </div>
            </div>

            <div className="mt-6 border border-[#E2D8C9] bg-[#F7F3EE] p-5 text-left">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#735C00]">
                  <Clock3 size={18} strokeWidth={1.6} />
                </span>
                <div>
                  <h2 className="font-serif text-xl text-[#1C1C19]">
                    {order.paymentMethod === "bank_qr"
                      ? "Thanh toán đang chờ đối soát"
                      : "Thanh toán khi nhận hàng"}
                  </h2>
                  <p className="mt-2 font-sans text-sm leading-6 text-[#5F5E5E]">
                    {order.paymentMethod === "bank_qr"
                      ? "Nếu bạn đã chuyển khoản, admin sẽ kiểm tra giao dịch và cập nhật trạng thái thanh toán sau khi nhận tiền."
                      : "Bạn sẽ thanh toán trực tiếp cho nhân viên giao hàng khi đơn được giao đến địa chỉ đã cung cấp."}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 font-sans text-sm text-[#5F5E5E]">
              Bạn có thể tra cứu lại đơn bằng mã{" "}
              <span className="font-semibold text-[#735C00]">
                #{order.id.slice(-6).toUpperCase()}
              </span>{" "}
              hoặc số điện thoại/email đã đặt hàng.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mt-10">
              <Link
                to={"/orders/" + order.id}
                className="inline-flex items-center gap-2 bg-[#735C00] text-white px-8 py-3 font-sans uppercase tracking-[2px] text-sm hover:bg-[#5c4a00] duration-300"
              >
                <Package size={16} /> Xem chi tiết đơn
              </Link>
              <Link
                to="/shop"
                className="border border-[#735C00] text-[#735C00] px-8 py-3 font-sans uppercase tracking-[2px] text-sm hover:bg-[#735C00] hover:text-white duration-300"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag size={16} /> Tiếp tục mua sắm
                </span>
              </Link>
            </div>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[1.5px] text-[#8A8178]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#1C1C19]">{value}</p>
    </div>
  );
}
