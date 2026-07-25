import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Clock3,
  CreditCard,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import {
  adminApi,
  apiMessage,
  formatDate,
  formatVnd,
  ORDER_STATUS_LABEL,
  ORDER_STATUSES,
  type Stats,
} from "../../lib/adminApi";
import { LoadingState } from "../../components/admin/ui";
import { toast } from "../../store/toast.store";

const STATUS_COLORS: Record<string, string> = {
  pending: "#7B6C30",
  paid: "#242321",
  shipping: "#A09C94",
  done: "#556B5A",
  cancelled: "#B63E3A",
};

const BRAND_COLORS = ["#181817", "#76682E", "#8F9A8C", "#D1CDC6"];

function compactMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex min-h-5 items-center justify-between gap-4">
      <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.17em] text-[#3E3D39]">
        {children}
      </h2>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "default",
  to,
}: {
  label: string;
  value: string | number;
  detail: ReactNode;
  tone?: "default" | "danger";
  to?: string;
}) {
  const content = (
    <div className="min-h-[132px] border-t border-[#C9C7C1] px-1 py-5 sm:px-3">
      <p
        className={`font-sans text-[9px] font-semibold uppercase tracking-[0.16em] ${
          tone === "danger" ? "text-[#C23E39]" : "text-[#5A5853]"
        }`}
      >
        {label}
      </p>
      <p className="mt-3 break-words font-numeric text-[30px] font-medium leading-none text-black">
        {value}
      </p>
      <div
        className={`mt-3 flex min-h-4 items-center gap-1.5 text-[9px] ${
          tone === "danger" ? "text-[#C23E39]" : "text-[#77736B]"
        }`}
      >
        {detail}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block transition-colors hover:bg-[#F5F0EA]">
      {content}
    </Link>
  ) : (
    content
  );
}

function createDonutGradient(parts: { value: number; color: string }[]) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return "conic-gradient(#E7E3DD 0 100%)";
  let cursor = 0;
  const stops = parts.map((part) => {
    const start = cursor;
    cursor += (part.value / total) * 100;
    return `${part.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function RevenueChart({ data }: { data: Stats["revenueTrend"] }) {
  const width = 760;
  const height = 230;
  const padX = 18;
  const padY = 20;
  const max = Math.max(...data.map((item) => item.revenue), 1);
  const points = data.map((item, index) => {
    const x =
      data.length === 1 ? width / 2 : padX + (index / (data.length - 1)) * (width - padX * 2);
    const y = height - padY - (item.revenue / max) * (height - padY * 2);
    return { x, y, ...item };
  });
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const area = points.length
    ? `${line} L${points[points.length - 1].x},${height - padY} L${points[0].x},${height - padY} Z`
    : "";

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block aspect-[3.15/1] min-h-[190px] w-full"
        role="img"
        aria-label="Biểu đồ doanh thu sáu tháng gần nhất"
      >
        <defs>
          <linearGradient id="adminRevenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6A6863" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6A6863" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio - 4}
            y2={height * ratio - 4}
            stroke="#E5E1DB"
            strokeWidth="1"
          />
        ))}
        {area && <path d={area} fill="url(#adminRevenueArea)" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="#66645F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {points.map((point, index) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 5 : 2.5}
              fill={index === points.length - 1 ? "#76682E" : "#66645F"}
            />
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-y-3 border-t border-[#E1DED8] pt-3 sm:grid-cols-6">
        {data.map((item) => (
          <div key={item.key} className="min-w-0 text-center">
            <p className="font-sans text-[8px] uppercase text-[#77736B]">{item.label}</p>
            <p className="mt-1 truncate text-[8px] text-[#A09C94]">{compactMoney(item.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("6");

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      setStats(await adminApi.get<Stats>("/stats"));
    } catch (error) {
      toast.error(apiMessage(error, "Không tải được thống kê"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTrend = useMemo(
    () => stats?.revenueTrend.slice(period === "3" ? -3 : -6) || [],
    [period, stats],
  );

  if (loading) return <LoadingState />;
  if (!stats) return null;

  const totalStatus = ORDER_STATUSES.reduce(
    (sum, status) => sum + (stats.ordersByStatus[status] || 0),
    0,
  );
  const paidOrders =
    (stats.ordersByStatus.paid || 0) +
    (stats.ordersByStatus.shipping || 0) +
    (stats.ordersByStatus.done || 0);
  const aov = paidOrders ? stats.revenue / paidOrders : 0;
  const topProductMax = Math.max(...stats.topProducts.map((item) => item.quantity), 1);
  const brandTotal = stats.revenueByBrand.reduce((sum, item) => sum + item.value, 0);
  const topBrand = stats.revenueByBrand[0];
  const brandGradient = createDonutGradient(
    stats.revenueByBrand.map((item, index) => ({
      value: item.value,
      color: BRAND_COLORS[index % BRAND_COLORS.length],
    })),
  );
  const statusGradient = createDonutGradient(
    ORDER_STATUSES.map((status) => ({
      value: stats.ordersByStatus[status] || 0,
      color: STATUS_COLORS[status],
    })),
  );

  return (
    <div className="font-sans">
      <section className="flex flex-col gap-7 border-b border-[#C9C7C1] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.23em] text-[#77736B]">
            Tổng quan điều hành
          </p>
          <h1 className="mt-3 font-title text-[38px] font-medium leading-none text-black sm:text-[48px]">
            Bảng hiệu suất
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-period">
            Khoảng thời gian
          </label>
          <select
            id="dashboard-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-9 border-0 bg-transparent px-2 text-[9px] font-medium text-[#44413C] outline-none"
          >
            <option value="6">6 tháng gần nhất</option>
            <option value="3">3 tháng gần nhất</option>
          </select>
          <span className="h-4 w-px bg-[#D6D2CB]" />
          <span className="px-2 text-[9px] font-medium text-[#44413C]">Tất cả kênh</span>
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center text-[#55514A] transition hover:bg-[#EFEBE5] disabled:opacity-50"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={1.6}
            />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-x-3 pt-12 md:grid-cols-3 xl:grid-cols-6">
        <Metric
          label="Tổng doanh thu"
          value={formatVnd(stats.revenue)}
          detail={
            <>
              <TrendingUp className="h-3 w-3" /> TB {formatVnd(aov)} / đơn
            </>
          }
        />
        <Metric
          label="Tổng đơn hàng"
          value={stats.orderCount.toLocaleString("vi-VN")}
          detail={
            <>
              <TrendingUp className="h-3 w-3" /> {paidOrders} đơn ghi nhận
            </>
          }
          to="/admin/orders"
        />
        <Metric
          label="Sản phẩm đã bán"
          value={stats.productsSold.toLocaleString("vi-VN")}
          detail={
            <>
              <TrendingUp className="h-3 w-3" /> {stats.activeProductCount} sản phẩm đang bán
            </>
          }
          to="/admin/products"
        />
        <Metric
          label="Khách hàng mới"
          value={stats.newCustomerCount.toLocaleString("vi-VN")}
          detail={
            <>
              <TrendingDown className="h-3 w-3" /> Trong 30 ngày qua
            </>
          }
          to="/admin/users"
        />
        <Metric
          label="Đơn chờ xử lý"
          value={stats.ordersByStatus.pending || 0}
          detail={
            <>
              <Clock3 className="h-3 w-3" /> Cần kiểm tra trạng thái
            </>
          }
          to="/admin/orders?status=pending"
        />
        <Metric
          label="Sắp hết hàng"
          value={stats.lowStockCount}
          tone="danger"
          detail={
            <>
              <TriangleAlert className="h-3 w-3" /> Cần bổ sung kho
            </>
          }
          to="/admin/variants?lowStock=true"
        />
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)]">
        <div className="border-t border-[#C9C7C1] pt-5">
          <SectionHeading>Xu hướng doanh thu</SectionHeading>
          <RevenueChart data={visibleTrend} />
        </div>
        <div className="border-t border-[#C9C7C1] pt-5">
          <SectionHeading>Trạng thái đơn hàng</SectionHeading>
          <div className="flex flex-col items-center">
            <div
              className="relative mt-2 h-40 w-40 rounded-full"
              style={{ background: statusGradient }}
              role="img"
              aria-label={`Phân bổ ${totalStatus} đơn hàng`}
            >
              <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-[#FCF9F5]">
                <span className="font-numeric text-2xl text-black">{totalStatus}</span>
                <span className="text-[9px] uppercase text-[#77736B]">Tổng đơn</span>
              </div>
            </div>
            <div className="mt-7 grid w-full grid-cols-2 gap-x-5 gap-y-3">
              {ORDER_STATUSES.map((status) => {
                const count = stats.ordersByStatus[status] || 0;
                const percent = totalStatus ? Math.round((count / totalStatus) * 100) : 0;
                return (
                  <div
                    key={status}
                    className="flex min-w-0 items-center gap-2 text-[8px] text-[#5D5A54]"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[status] }}
                    />
                    <span className="truncate">{ORDER_STATUS_LABEL[status]}</span>
                    <span className="ml-auto text-[#8D8982]">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-3">
        <div className="border-t border-[#C9C7C1] pt-5">
          <SectionHeading>Sản phẩm bán chạy</SectionHeading>
          {stats.topProducts.length ? (
            <div className="space-y-5">
              {stats.topProducts.map((product) => (
                <div
                  key={product.name}
                  className="grid grid-cols-[minmax(0,1fr)_88px_48px] items-center gap-3"
                >
                  <span className="truncate text-[9px] text-[#363430]" title={product.name}>
                    {product.name}
                  </span>
                  <div className="h-[3px] bg-[#E1DED8]">
                    <div
                      className="h-full bg-[#22211F]"
                      style={{ width: `${(product.quantity / topProductMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-[8px] text-[#6E6A63]">
                    {product.quantity} sp
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-[10px] text-[#918D86]">
              Chưa có dữ liệu bán hàng.
            </p>
          )}
        </div>

        <div className="border-t border-[#C9C7C1] pt-5">
          <SectionHeading>Doanh thu theo thương hiệu</SectionHeading>
          <div className="flex flex-col items-center">
            <div
              className="relative mt-2 h-32 w-32 rounded-full"
              style={{ background: brandGradient }}
            >
              <div className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full bg-[#FCF9F5] text-center">
                <span className="font-numeric text-xl text-black">
                  {brandTotal && topBrand ? Math.round((topBrand.value / brandTotal) * 100) : 0}%
                </span>
                <span className="max-w-20 truncate text-[8px] text-[#716D66]">
                  {topBrand?.name || "Chưa có"}
                </span>
              </div>
            </div>
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              {stats.revenueByBrand.map((brand, index) => (
                <div
                  key={brand.name}
                  className="flex min-w-0 items-center gap-2 text-[8px] text-[#5D5A54]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: BRAND_COLORS[index % BRAND_COLORS.length] }}
                  />
                  <span className="truncate">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#C9C7C1] pt-5">
          <SectionHeading>Doanh thu theo danh mục</SectionHeading>
          <div>
            {stats.revenueByCategory.length ? (
              stats.revenueByCategory.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between gap-4 border-b border-[#E5E1DB] py-4 text-[9px] last:border-0"
                >
                  <span className="truncate text-[#413F3A]">{category.name}</span>
                  <span className="shrink-0 font-medium text-black">
                    {formatVnd(category.value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-12 text-center text-[10px] text-[#918D86]">
                Chưa có dữ liệu danh mục.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16 border-t border-[#C9C7C1] pt-5">
        <SectionHeading
          action={
            <Link
              to="/admin/orders"
              className="flex items-center gap-1.5 text-[9px] font-medium text-[#75672F] hover:text-black"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          Đơn hàng gần đây
        </SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#C9C7C1] text-[8px] uppercase tracking-[0.15em] text-[#8A867F]">
                <th className="px-3 py-4 font-medium">Mã đơn</th>
                <th className="px-3 py-4 font-medium">Ngày</th>
                <th className="px-3 py-4 font-medium">Khách hàng</th>
                <th className="px-3 py-4 font-medium">Sản phẩm</th>
                <th className="px-3 py-4 font-medium">Giá trị</th>
                <th className="px-3 py-4 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#E3E0DA] text-[9px] text-[#4A4843] transition hover:bg-[#F6F1EB]"
                >
                  <td className="px-3 py-4 font-medium text-black">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-3 py-4 text-[#77736B]">{formatDate(order.createdAt)}</td>
                  <td className="max-w-52 truncate px-3 py-4">{order.customer}</td>
                  <td className="px-3 py-4">{order.itemCount} sản phẩm</td>
                  <td className="px-3 py-4 font-medium text-black">{formatVnd(order.total)}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_COLORS[order.status] || "#777" }}
                      />
                      {ORDER_STATUS_LABEL[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stats.recentOrders.length && (
            <p className="py-12 text-center text-[10px] text-[#918D86]">Chưa có đơn hàng nào.</p>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div className="space-y-12">
          <div className="border-t border-[#C9C7C1] pt-5">
            <SectionHeading
              action={
                <span className="bg-[#F7E8E5] px-2 py-1 text-[8px] text-[#C13C37]">
                  {stats.lowStockCount} mặt hàng
                </span>
              }
            >
              Cảnh báo tồn kho
            </SectionHeading>
            {stats.lowStockItems.map((item) => (
              <Link
                key={item.id}
                to="/admin/variants?lowStock=true"
                className="flex items-center justify-between gap-4 border-b border-[#E3E0DA] py-4 text-[9px] hover:bg-[#F6F1EB]"
              >
                <span className="min-w-0 truncate text-[#3C3A36]">
                  {item.name}
                  {item.volume ? `, ${item.volume}` : ""}
                </span>
                <span className="shrink-0 font-medium text-[#C13C37]">
                  {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                </span>
              </Link>
            ))}
            {!stats.lowStockItems.length && (
              <p className="py-8 text-[10px] text-[#77736B]">Tồn kho đang ở mức ổn định.</p>
            )}
          </div>

          <div className="border-t border-[#C9C7C1] pt-5">
            <SectionHeading
              action={
                <Link to="/admin/users" className="text-[8px] text-[#75672F] hover:text-black">
                  Xem tất cả
                </Link>
              }
            >
              Khách hàng mới
            </SectionHeading>
            <div className="space-y-4">
              {stats.newCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E5DF] text-[9px] font-medium text-[#45423D]">
                    {customer.name
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(-2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium text-[#292824]">
                      {customer.name}
                    </p>
                    <p className="mt-0.5 text-[8px] text-[#8A867F]">
                      Tham gia {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[8px] text-[#77736B]">
                    {customer.orderCount} đơn
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="border-t border-[#C9C7C1] pt-5">
            <SectionHeading
              action={
                <span className="flex items-center gap-1 text-[8px] text-[#75672F]">
                  <Star className="h-3 w-3" /> Gần đây
                </span>
              }
            >
              Đánh giá mới nhất
            </SectionHeading>
            {stats.recentReviews.map((review) => (
              <article key={review.id} className="border-b border-[#E3E0DA] py-4 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-0.5 text-[#76682E]">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className="h-3 w-3"
                        fill={index < review.rating ? "currentColor" : "none"}
                        strokeWidth={1.4}
                      />
                    ))}
                  </div>
                  <time className="shrink-0 text-[8px] text-[#99958E]">
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[#292824]">
                  “{review.comment}”
                </p>
                <p className="mt-2 text-[8px] text-[#77736B]">
                  — {review.userName}
                  {review.productName ? ` · ${review.productName}` : ""}
                </p>
              </article>
            ))}
            {!stats.recentReviews.length && (
              <p className="py-8 text-[10px] text-[#77736B]">Chưa có đánh giá đã duyệt.</p>
            )}
          </div>

          <div className="border-t border-[#C9C7C1] pt-5">
            <SectionHeading>Phương thức thanh toán</SectionHeading>
            <div className="space-y-5">
              {stats.paymentMethods.map((payment) => {
                const isBank = payment.method === "bank_qr";
                const PaymentIcon = isBank ? Banknote : CreditCard;
                return (
                  <div key={payment.method}>
                    <div className="mb-2 flex items-center gap-2 text-[9px] text-[#363430]">
                      <PaymentIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{isBank ? "Chuyển khoản QR" : "Thanh toán khi nhận hàng"}</span>
                      <span className="ml-auto text-[#77736B]">{payment.percentage}%</span>
                    </div>
                    <div className="h-[3px] bg-[#E1DED8]">
                      <div
                        className="h-full bg-[#232220]"
                        style={{ width: `${payment.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!stats.paymentMethods.length && (
                <p className="py-6 text-[10px] text-[#77736B]">Chưa có dữ liệu thanh toán.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-24 flex flex-col gap-5 border-t border-[#C9C7C1] py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-title text-2xl font-semibold text-black">{"L'Essence Noire"}</p>
        <p className="text-[8px] uppercase tracking-[0.16em] text-[#8B8780]">
          Bảng quản trị · Dữ liệu cập nhật theo thời gian thực
        </p>
      </footer>
    </div>
  );
}
