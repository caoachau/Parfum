import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, StickyNote, CreditCard, Printer } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import { StatusBadge, PAY_METHOD, PAY_STATUS } from "./Orders";

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

type Item = {
  variant: string;
  name: string;
  volume: string;
  price: number;
  quantity: number;
  lineTotal: number;
};
type Detail = {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  address: { line?: string; city?: string; phone?: string } | null;
  note: string;
  items: Item[];
  payment: { method: string; status: string; amount: number } | null;
};

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const locationState = location.state as { from?: unknown } | null;
  const returnPath = locationState?.from === "/account/orders" ? "/account/orders" : "/orders";
  const [order, setOrder] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function exportInvoice() {
    if (!order) return;
    const win = window.open("", "_blank", "width=820,height=1000");
    if (!win) return;
    const code = order.id.slice(-6).toUpperCase();
    const itemRows = order.items
      .map(
        (it) =>
          `<tr><td>${it.name}</td><td>${it.volume}</td><td style="text-align:right">${vnd(it.price)}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${vnd(it.lineTotal)}</td></tr>`,
      )
      .join("");
    const payMethod = order.payment
      ? PAY_METHOD[order.payment.method] || order.payment.method
      : "—";
    const payStatus = order.payment
      ? PAY_STATUS[order.payment.status] || order.payment.status
      : "—";
    const addr = order.address
      ? [
          order.address.line,
          order.address.city,
          order.address.phone ? "ĐT: " + order.address.phone : "",
        ]
          .filter(Boolean)
          .join("<br>")
      : "Không có địa chỉ";
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn #${code} — L'Essence Noire</title>
    <style>*{box-sizing:border-box}body{font-family:'Be Vietnam Pro',Manrope,'Segoe UI',Arial,sans-serif;color:#1C1C19;margin:0;padding:40px;background:#fff}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #735C00;padding-bottom:18px;margin-bottom:24px}.brand{font-size:26px;letter-spacing:3px;font-weight:600;color:#735C00}.tag{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8373;margin-top:4px}.meta{font-size:12px;color:#5F5E5E;text-align:right;line-height:1.7}.meta b{color:#1C1C19}h2{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#735C00;margin:24px 0 8px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:9px 8px;border-bottom:1px solid #eee;text-align:left}th{font-size:10px;text-transform:uppercase;color:#8a8373;border-bottom:1px solid #d8cfb8}.total{display:flex;justify-content:flex-end;margin-top:14px}.total .box{min-width:260px}.total .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.total .grand{border-top:2px solid #735C00;margin-top:6px;padding-top:10px;font-size:18px;font-weight:600}.cols{display:flex;gap:24px;margin-top:8px}.cols>div{flex:1;font-size:13px;line-height:1.7}.foot{margin-top:40px;text-align:center;font-size:11px;color:#9b958b;border-top:1px solid #e6e0d3;padding-top:14px}@media print{body{padding:16px}}</style></head><body>
    <div class="head"><div><div class="brand">L'ESSENCE NOIRE</div><div class="tag">Hóa đơn bán hàng</div></div>
    <div class="meta">Số hóa đơn: <b>#${code}</b><br>Ngày đặt: <b>${fmtDate(order.createdAt)}</b><br>Trạng thái: <b>${order.status}</b></div></div>
    <div class="cols"><div><h2>Giao tới</h2>${addr}</div><div><h2>Thanh toán</h2>Phương thức: ${payMethod}<br>Trạng thái: ${payStatus}</div></div>
    <h2>Chi tiết sản phẩm</h2>
    <table><thead><tr><th>Sản phẩm</th><th>Dung tích</th><th style="text-align:right">Đơn giá</th><th style="text-align:center">SL</th><th style="text-align:right">Thành tiền</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="total"><div class="box"><div class="row grand"><span>Tổng cộng</span><span>${vnd(order.total)}</span></div></div></div>
    ${order.note ? `<h2>Ghi chú</h2><p style="font-size:13px;color:#1C1C19">${order.note}</p>` : ""}
    <div class="foot">Cảm ơn quý khách đã mua sắm tại L'Essence Noire · Hóa đơn xuất lúc ${new Date().toLocaleString("vi-VN")}</div>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  useEffect(() => {
    let active = true;
    api
      .get("/orders/" + id)
      .then(({ data }) => {
        if (active) setOrder(data.data);
      })
      .catch((e) => {
        if (active) setError(e?.response?.data?.message || "Không tìm thấy đơn hàng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <section className="max-w-4xl mx-auto px-6 py-12 bg-[#FDF9F4] min-h-[70vh]">
        <Link
          to={returnPath}
          className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[2px] text-[#5F5E5E] hover:text-[#735C00] mb-6"
        >
          <ArrowLeft size={14} /> Danh sách đơn hàng
        </Link>

        {loading && <p className="font-sans text-[#5F5E5E]">Đang tải…</p>}
        {!loading && error && <p className="font-sans text-red-600">{error}</p>}

        {!loading && order && (
          <>
            <header className="flex items-start justify-between gap-4 flex-wrap mb-8">
              <div>
                <h1 className="font-serif text-3xl text-[#1C1C19]">
                  Đơn #{order.id.slice(-6).toUpperCase()}
                </h1>
                <p className="font-sans text-sm text-[#5F5E5E] mt-2">
                  Đặt lúc {fmtDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <button
                  type="button"
                  onClick={exportInvoice}
                  className="inline-flex items-center gap-2 border border-[#735C00] px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-[1.4px] text-[#735C00] transition hover:bg-[#735C00] hover:text-white"
                >
                  <Printer size={14} /> Xuất hóa đơn
                </button>
              </div>
            </header>

            {/* Danh sách sản phẩm */}
            <div className="bg-white border border-[rgba(208,197,175,0.4)] divide-y divide-[rgba(208,197,175,0.3)]">
              {order.items.map((it) => (
                <div key={it.variant} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg text-[#1C1C19] truncate">{it.name}</h3>
                    <p className="font-sans uppercase tracking-[1.2px] text-xs text-[#5F5E5E] mt-1">
                      {it.volume} · {vnd(it.price)} x {it.quantity}
                    </p>
                  </div>
                  <span className="font-serif text-lg text-[#1C1C19] whitespace-nowrap">
                    {vnd(it.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng tiền */}
            <div className="bg-[#F1EDE8] border border-t-0 border-[rgba(208,197,175,0.4)] p-5 flex justify-between items-center">
              <span className="font-serif text-lg text-[#1C1C19]">Tổng cộng</span>
              <span className="font-serif text-2xl text-[#1C1C19]">{vnd(order.total)}</span>
            </div>

            {/* Thanh toán + địa chỉ + ghi chú */}
            <div className="grid md:grid-cols-2 gap-5 mt-8 font-sans">
              <div className="bg-white border border-[rgba(208,197,175,0.4)] p-5">
                <div className="flex items-center gap-2 text-[#735C00] mb-3">
                  <CreditCard size={16} />
                  <span className="uppercase text-xs font-bold tracking-[1px]">Thanh toán</span>
                </div>
                {order.payment ? (
                  <div className="text-sm text-[#1C1C19] space-y-1">
                    <p>Phương thức: {PAY_METHOD[order.payment.method] || order.payment.method}</p>
                    <p>Trạng thái: {PAY_STATUS[order.payment.status] || order.payment.status}</p>
                    <p>Số tiền: {vnd(order.payment.amount)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#5F5E5E]">Chưa có thông tin</p>
                )}
              </div>

              <div className="bg-white border border-[rgba(208,197,175,0.4)] p-5">
                <div className="flex items-center gap-2 text-[#735C00] mb-3">
                  <MapPin size={16} />
                  <span className="uppercase text-xs font-bold tracking-[1px]">Giao tới</span>
                </div>
                {order.address &&
                (order.address.line || order.address.city || order.address.phone) ? (
                  <div className="text-sm text-[#1C1C19] space-y-1">
                    {order.address.line && <p>{order.address.line}</p>}
                    {order.address.city && <p>{order.address.city}</p>}
                    {order.address.phone && <p>ĐT: {order.address.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-[#5F5E5E]">Không có địa chỉ</p>
                )}
              </div>
            </div>

            {order.note && (
              <div className="bg-white border border-[rgba(208,197,175,0.4)] p-5 mt-5 font-sans">
                <div className="flex items-center gap-2 text-[#735C00] mb-2">
                  <StickyNote size={16} />
                  <span className="uppercase text-xs font-bold tracking-[1px]">Ghi chú</span>
                </div>
                <p className="text-sm text-[#1C1C19] whitespace-pre-line">{order.note}</p>
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
