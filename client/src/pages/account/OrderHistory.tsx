import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const vnd = (value: number) => `${(value || 0).toLocaleString("vi-VN")}đ`;

type OrderStatus = "pending" | "paid" | "shipping" | "done" | "cancelled" | "returned";
type OrderStatusFilter = "all" | OrderStatus;

type Order = {
  id: string;
  createdAt?: string;
  status: OrderStatus | string;
  displayStatus?: string;
  payment?: {
    method: "cod" | "bank_qr";
    status: "unpaid" | "paid";
    paidAt?: string | null;
  } | null;
  total: number;
  itemCount: number;
  firstItemName: string;
  items: Array<{
    name: string;
    image?: string | null;
    price: number;
    quantity: number;
    lineTotal: number;
  }>;
};

const STATUS_META: Record<OrderStatus, { label: string; dot: string; text: string }> = {
  pending: {
    label: "Chờ xác nhận",
    dot: "bg-[#A18400]",
    text: "text-[#796400]",
  },
  paid: {
    label: "Đã thanh toán",
    dot: "bg-[#687A31]",
    text: "text-[#536125]",
  },
  shipping: {
    label: "Đang giao",
    dot: "bg-[#3C6E88]",
    text: "text-[#315D73]",
  },
  done: {
    label: "Đã giao",
    dot: "bg-[#667A2C]",
    text: "text-[#536523]",
  },
  cancelled: {
    label: "Đã hủy",
    dot: "bg-[#A2473E]",
    text: "text-[#903C34]",
  },
  returned: {
    label: "Hoàn trả",
    dot: "bg-[#A26731]",
    text: "text-[#895528]",
  },
};

const TABS: Array<{ id: OrderStatusFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "shipping", label: "Đang giao" },
  { id: "done", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "returned", label: "Hoàn trả" },
];

const normalizeStatus = (status: string): OrderStatus =>
  status === "paid" ? "pending" : (status as OrderStatus);

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Đang cập nhật";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatusFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<Order[]>("/account/orders")
      .then(({ data }) => {
        if (mounted) setOrders(data);
      })
      .catch(() => {
        if (mounted) setOrders([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatusFilter, number>> = {
      all: orders.length,
    };

    for (const order of orders) {
      const status = normalizeStatus(order.status);
      counts[status] = (counts[status] || 0) + 1;
    }

    return counts;
  }, [orders]);

  const visibleOrders = useMemo(
    () =>
      activeTab === "all"
        ? orders
        : orders.filter((order) => normalizeStatus(order.status) === activeTab),
    [activeTab, orders],
  );

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#2D2925]">
      <section className="border-b border-[#E7E0D7] px-6 pb-7 pt-12 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9B9288]">
          Cổng thông tin cá nhân
        </p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h1 className="font-serif text-4xl lg:text-5xl">Lịch sử đơn hàng</h1>
          {!loading && (
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8B8177]">
              {orders.length} đơn hàng
            </p>
          )}
        </div>
      </section>

      <main className="px-6 py-9 lg:px-12">
        {!loading && orders.length > 0 && (
          <nav
            aria-label="Lọc đơn hàng theo trạng thái"
            className="mb-8 flex gap-1 overflow-x-auto border-b border-[#DED6CC]"
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-[9px] uppercase tracking-[0.16em] transition ${
                    selected
                      ? "border-[#806900] text-[#6F5B00]"
                      : "border-transparent text-[#928980] hover:text-[#4A433D]"
                  }`}
                  aria-pressed={selected}
                >
                  {tab.label}
                  <span
                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[8px] ${
                      selected ? "bg-[#877000] text-white" : "bg-[#EDE7DF] text-[#82796F]"
                    }`}
                  >
                    {statusCounts[tab.id] || 0}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {loading ? (
          <div className="space-y-5">
            {[0, 1].map((item) => (
              <div key={item} className="h-[300px] animate-pulse bg-[#F0EBE4]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center border border-[#E2DBD2] bg-[#FFFDF9] text-center">
            <ShoppingBag size={38} className="text-[#8B7200]" />
            <h2 className="mt-5 font-serif text-3xl">Chưa có đơn hàng</h2>
            <p className="mt-2 max-w-md text-sm text-[#7C746C]">
              Khi bạn đặt hàng thành công, đơn hàng sẽ xuất hiện ở đây.
            </p>
            <Link
              to="/shop"
              className="mt-6 border border-[#806900] px-6 py-3 text-[9px] uppercase tracking-[0.18em] text-[#6F5B00] transition hover:bg-[#806900] hover:text-white"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center border border-[#E2DBD2] bg-[#FFFDF9] px-6 text-center">
            <Package size={30} strokeWidth={1.3} className="text-[#9A8974]" />
            <h2 className="mt-4 font-serif text-2xl">Không có đơn ở trạng thái này</h2>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="mt-5 text-[9px] uppercase tracking-[0.16em] text-[#776100] underline underline-offset-4"
            >
              Xem tất cả đơn hàng
            </button>
          </div>
        ) : (
          <div className="space-y-7">
            {visibleOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const statusMeta = STATUS_META[status] || STATUS_META.pending;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden border border-[#E5DED5] bg-[#FFFDF9]"
                >
                  <div className="grid gap-6 bg-[#F3EFEA] px-6 py-6 sm:grid-cols-2 lg:grid-cols-[1.05fr_1fr_1fr_1fr_auto] lg:items-center lg:px-8">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-[#8E867E]">
                        Mã đơn hàng
                      </p>
                      <p className="mt-2 font-serif text-lg">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-[#8E867E]">
                        Ngày đặt
                      </p>
                      <p className="mt-2 font-serif text-lg">{formatDate(order.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-[#8E867E]">
                        Tổng tiền
                      </p>
                      <p className="mt-2 font-serif text-lg">{vnd(order.total)}</p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-[#8E867E]">
                        Trạng thái hiện tại
                      </p>
                      <p
                        className={`mt-2 flex items-center gap-2 font-serif text-lg italic ${statusMeta.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </p>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      state={{ from: "/account/orders" }}
                      className="w-fit border-b border-[#776100] pb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#776100] transition hover:text-[#3D3300]"
                    >
                      Xem chi tiết
                    </Link>
                  </div>

                  <div className="flex gap-5 overflow-x-auto px-6 py-8 lg:px-8">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="group relative h-[150px] w-[150px] shrink-0 border-8 border-[#F0ECE7] bg-[#F5F1EC]"
                        title={`${item.name} × ${item.quantity}`}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#B7AE9F]">
                            <Package size={22} strokeWidth={1.3} />
                          </div>
                        )}
                        <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#776100] px-1 text-[9px] text-white">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
