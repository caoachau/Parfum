import { ArrowRight, Gift, MapPin, Package, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../store/auth.store";

interface OrderItem {
  fullId: string;
  id: string;
  name: string;
  date: string;
  price: string;
  status: string;
  paymentStatus: string;
}

interface RecommendationItem {
  id?: string;
  slug?: string;
  category: string;
  name: string;
  description: string;
  image: string;
  stock?: number;
  soldCount?: number;
  price?: number | null;
  gender?: string;
}

interface ScentProfileData {
  families: string[];
  preferredNotes?: string[];
  dislikedNotes?: string[];
}

function formatMemberSince(value?: string | null): string {
  if (!value) return "Thành viên từ khi tạo tài khoản";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Thành viên từ khi tạo tài khoản";
  return `Thành viên của L'Essence Noire từ ngày ${date.toLocaleDateString("vi-VN")}`;
}

const GENDER_LABELS: Record<string, string> = {
  female: "Nữ",
  male: "Nam",
  unisex: "Unisex",
  Women: "Nữ",
  Men: "Nam",
  Nữ: "Nữ",
  Nam: "Nam",
};

function formatGender(value?: string): string {
  if (!value) return "";
  return GENDER_LABELS[value] ?? value;
}

function formatVnd(value?: number | null): string {
  return value != null ? `${value.toLocaleString("vi-VN")}đ` : "Liên hệ";
}

export default function AccountOverview() {
  const user = useAuth((state) => state.user);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [recommendationOffset, setRecommendationOffset] = useState(0);
  const [recommendationAnimationKey, setRecommendationAnimationKey] = useState(0);
  const [refillProduct, setRefillProduct] = useState<RecommendationItem | null>(null);
  const [scentProfile, setScentProfile] = useState<ScentProfileData | null>(null);
  const [scentProfileLoading, setScentProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<any[]>("/account/orders")
      .then(({ data }) => {
        if (!mounted) return;
        setOrders(
          data.slice(0, 2).map((order) => ({
            fullId: order.id,
            id: order.id.slice(-6).toUpperCase(),
            name: order.firstItemName || "Đơn hàng",
            date: order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("vi-VN")
              : "Đang cập nhật",
            price: `${(order.total || 0).toLocaleString("vi-VN")}đ`,
            status: order.displayStatus || order.status,
            paymentStatus: order.payment?.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
          })),
        );
      })
      .catch(() => {
        if (mounted) setOrders([]);
      });

    api
      .get<ScentProfileData>("/account/scent-profile")
      .then(({ data }) => {
        if (mounted) setScentProfile(data);
      })
      .catch(() => {
        if (mounted) {
          setScentProfile({
            families: [],
            preferredNotes: [],
            dislikedNotes: [],
          });
        }
      })
      .finally(() => {
        if (mounted) setScentProfileLoading(false);
      });

    api
      .get<{ data: any[] }>("/products", {
        params: { limit: 100, sort: "best_selling" },
      })
      .then(({ data }) => {
        if (!mounted || !Array.isArray(data.data) || data.data.length === 0) return;
        const products: RecommendationItem[] = data.data.map((product) => ({
          id: product.id,
          slug: product.slug,
          category: product.category || product.brand || "Nước hoa",
          name: product.name,
          description: product.description || "Mùi hương tinh tế, sang trọng.",
          image:
            product.images?.[0] || product.image || "https://placehold.co/800x600?text=Chua+co+anh",
          stock: product.stock || 0,
          soldCount: product.soldCount || 0,
          price: product.price ?? null,
          gender: product.gender,
        }));

        setItems(products.filter((product) => (product.soldCount || 0) > 0));
        setRecommendationOffset(0);
        setRefillProduct(
          products
            .filter((product) => (product.stock || 0) > 0)
            .sort((left, right) => (left.stock || 0) - (right.stock || 0))[0] ||
            products[0] ||
            null,
        );
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setBestSellersLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const defaultAddress =
    user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0];
  const defaultAddressText = defaultAddress
    ? [
        defaultAddress.line || defaultAddress.detail,
        defaultAddress.ward,
        defaultAddress.district,
        defaultAddress.province,
      ]
        .filter(Boolean)
        .join(", ")
    : "Chưa có địa chỉ";
  const memberSince = formatMemberSince(user?.createdAt);
  // Xac dinh cac muc con thieu trong ho so (KHONG tinh mat khau).
  const missingProfile: string[] = [];
  if (!user?.name) missingProfile.push("Họ và tên");
  if (!user?.phone) missingProfile.push("Số điện thoại");
  if (!user?.addresses?.length) missingProfile.push("Địa chỉ nhận hàng");
  const profileComplete = missingProfile.length === 0;
  const refillProductPath = refillProduct
    ? `/products/${refillProduct.slug || refillProduct.id}`
    : "/shop";
  const scentFamilies = scentProfile?.families || [];
  const preferredNotes = scentProfile?.preferredNotes || [];
  const scentTags = Array.from(
    new Set([...scentFamilies, ...preferredNotes].map((item) => item.trim()).filter(Boolean)),
  );
  const hasScentProfile = scentTags.length > 0;
  const formatScentLabel = (value: string) =>
    value ? `${value.charAt(0).toLocaleUpperCase("vi-VN")}${value.slice(1)}` : value;
  const scentProfileDescription = scentProfileLoading
    ? "Đang tải hồ sơ mùi hương của bạn..."
    : hasScentProfile
      ? [
          scentFamilies.length
            ? `Nhóm hương yêu thích: ${scentFamilies.map(formatScentLabel).join(", ")}.`
            : "",
          preferredNotes.length
            ? `Note hương yêu thích: ${preferredNotes.map(formatScentLabel).join(", ")}.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "Bạn chưa thiết lập hồ sơ mùi hương. Hãy chọn nhóm hương và note yêu thích để nhận gợi ý sản phẩm phù hợp hơn.";
  const visibleRecommendations = Array.from(
    { length: Math.min(3, items.length) },
    (_, index) => items[(recommendationOffset + index) % items.length],
  );
  useEffect(() => {
    if (!items.length) return;

    const timeoutId = window.setTimeout(() => {
      setRecommendationOffset((current) => (current + 3) % items.length);
      setRecommendationAnimationKey((current) => current + 1);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [items.length, recommendationAnimationKey]);

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#27231F]">
      <section className="border-b border-[#E8E1D8] px-6 pb-6 pt-12 lg:px-12">
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#9A9186]">
          Cổng thông tin cá nhân
        </p>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h1 className="font-serif text-4xl font-normal lg:text-5xl">
            Xin chào, {user?.name || "bạn"}.
          </h1>

          <div className="md:text-right">
            <p className="text-[10px] italic text-[#8B837A]">{memberSince}</p>
          </div>
        </div>
      </section>

      <main className="space-y-14 px-6 py-10 lg:px-12">
        {!profileComplete ? (
          <section className="flex flex-col gap-4 border border-[#E0D6C6] bg-[#FBF5EA] p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#887000] text-white">
                <Gift size={20} />
              </span>
              <div>
                <h2 className="font-serif text-xl">Hoàn thiện hồ sơ của bạn</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#746C63]">
                  Hồ sơ của bạn còn thiếu một số thông tin. Cập nhật đầy đủ để đặt hàng nhanh hơn và
                  nhận trọn ưu đãi dành cho thành viên.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {missingProfile.map((field) => (
                    <li
                      key={field}
                      className="flex items-center gap-2 text-xs font-medium text-[#8A5A00]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B08900]" />
                      Cần cập nhật: {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                to="/account/settings"
                className="flex items-center justify-center gap-2 bg-[#27231F] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-black"
              >
                Cập nhật thông tin
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/account/addresses"
                className="flex items-center justify-center gap-2 border border-[#27231F] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-[#27231F] transition hover:bg-[#27231F] hover:text-white"
              >
                Thêm địa chỉ
              </Link>
            </div>
          </section>
        ) : null}
        <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="grid gap-6 bg-[#F3EFEA] p-6 sm:grid-cols-[1fr_220px] lg:p-8">
            <div className="flex flex-col justify-center">
              <h2 className="font-serif text-2xl">Hồ sơ mùi hương</h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#746C63]">
                {scentProfileDescription}
              </p>

              {hasScentProfile && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {scentTags.map((item) => (
                    <span
                      key={item}
                      className="border border-[#D6CFC5] bg-[#FCF9F4] px-3 py-1 text-[9px] uppercase tracking-widest"
                    >
                      {formatScentLabel(item)}
                    </span>
                  ))}
                </div>
              )}

              <Link
                to="/account/scent-profile"
                className="mt-6 flex w-fit items-center gap-3 bg-[#887000] px-6 py-3 text-[10px] uppercase tracking-[0.14em] text-white transition hover:bg-[#6D5900]"
              >
                {hasScentProfile ? "Chỉnh sửa hồ sơ" : "Thiết lập hồ sơ"}
                <ArrowRight size={13} />
              </Link>
            </div>

            <img
              loading="lazy"
              src="https://cdn.elle.vn/01BVmho-zHzABJ4MIrV4AfcuMpslWRH7E3suv8nY22M/rs:fit:1024:0/sharpen:0.5/quality:82/2022/07/24/489047/mui-huong-Histoires.jpg@webp?q=80&w=800&auto=format&fit=crop"
              alt="Hồ sơ mùi hương"
              className="h-64 w-full object-cover sm:h-full"
            />
          </div>

          <div className="flex flex-col justify-between bg-[#FFD65B] p-7 lg:p-8">
            <div>
              <h2 className="font-serif text-xl text-[#7E6700]">Sắp hết sản phẩm</h2>

              <p className="mt-4 text-sm leading-6 text-[#907A21]">
                {refillProduct ? (
                  <>
                    <Link
                      to={refillProductPath}
                      className="font-semibold text-[#6D5900] underline-offset-4 hover:underline"
                    >
                      {refillProduct.name}
                    </Link>{" "}
                    đang còn {refillProduct.stock || 0} sản phẩm trong kho.
                  </>
                ) : (
                  "Chưa có sản phẩm nào cần theo dõi tồn kho."
                )}
              </p>
            </div>

            <Link
              to={refillProductPath}
              className="mt-8 flex items-center justify-center gap-3 bg-[#816900] px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[#685400]"
            >
              Xem chi tiết
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        <section className="grid gap-10 xl:grid-cols-2">
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl">Đơn hàng gần đây</h2>

              <Link
                to="/account/orders"
                className="text-[9px] uppercase tracking-[0.15em] text-[#9A9186]"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.fullId}`}
                  state={{ from: "/account" }}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-l-2 border-[#B49A26] bg-[#F4F0EA] p-4 transition hover:bg-[#EEE8DF]"
                >
                  <div className="flex h-14 w-14 items-center justify-center bg-[#EAE5DE]">
                    <Package size={17} strokeWidth={1.3} />
                  </div>

                  <div>
                    <h3 className="font-serif text-base">{order.name}</h3>

                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[#91887E]">
                      Đơn hàng #{order.id} · {order.date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-serif text-sm">{order.price}</p>

                    <p className="mt-1 text-[9px] uppercase tracking-widest text-[#9B8415]">
                      {order.status}
                    </p>
                    <p className="mt-1 text-[9px] text-[#81786F]">{order.paymentStatus}</p>
                  </div>
                </Link>
              ))}

              {orders.length === 0 && (
                <div className="border border-[#E4DDD4] bg-[#FCF9F4] p-6 text-sm text-[#7D746B]">
                  Bạn chưa có đơn hàng nào.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl">Địa chỉ đã lưu</h2>

              <Link
                to="/account/addresses"
                className="text-[9px] uppercase tracking-[0.15em] text-[#9A9186]"
              >
                Quản lý địa chỉ
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[#E4DDD4] bg-[#FCF9F4] p-6">
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#9A7F00]">
                  Địa chỉ mặc định
                </p>

                <div className="mt-5 flex gap-3">
                  <MapPin size={16} strokeWidth={1.3} className="mt-1 shrink-0" />

                  <div className="font-serif text-sm leading-6">
                    <p>{user?.name || "Chưa cập nhật"}</p>
                    <p>{defaultAddressText}</p>
                    <p>{defaultAddress?.phone || ""}</p>
                  </div>
                </div>

                <div className="mt-8 flex gap-5">
                  <Link to="/account/addresses" className="text-[9px] uppercase tracking-widest">
                    Chỉnh sửa hoặc xóa
                  </Link>
                </div>
              </div>

              <Link
                to="/account/addresses"
                className="flex min-h-[190px] flex-col items-center justify-center border border-dashed border-[#D9D1C7] bg-[#F2EEE9] transition hover:bg-[#EAE5DE]"
              >
                <Plus size={24} strokeWidth={1.2} />

                <span className="mt-3 text-[9px] uppercase tracking-[0.15em] text-[#827A71]">
                  Thêm địa chỉ mới
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-8 flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
            <div>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Sparkles size={13} strokeWidth={1.2} />

                <p className="text-[9px] uppercase tracking-[0.35em] text-[#9A9186]">
                  Được yêu thích nhất
                </p>
              </div>

              <h2 className="mt-3 font-serif text-3xl italic lg:text-4xl">Sản phẩm bán chạy</h2>
            </div>
          </div>

          {bestSellersLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="aspect-[3/4] animate-pulse bg-[#ECE7E0]" />
              ))}
            </div>
          ) : visibleRecommendations.length > 0 ? (
            <div key={recommendationAnimationKey} className="grid grid-cols-3 gap-3 sm:gap-5">
              {visibleRecommendations.map((item, index) => (
                <Link
                  key={`${recommendationAnimationKey}-${item.id || item.name}`}
                  to={item.id || item.slug ? `/products/${item.slug || item.id}` : "/shop"}
                  className="account-best-seller-float-up group flex flex-col"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="overflow-hidden bg-[#ECE7E0]">
                    <img
                      loading="lazy"
                      src={item.image}
                      alt={item.name}
                      className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] uppercase tracking-[0.15em] text-[#9A9186] sm:text-[9px]">
                    {item.gender ? <span>{formatGender(item.gender)}</span> : null}
                    <span>· Đã bán {(item.soldCount || 0).toLocaleString("vi-VN")}</span>
                  </div>

                  <h3 className="mt-1 line-clamp-2 font-serif text-[13px] leading-snug sm:text-[15px]">
                    {item.name}
                  </h3>

                  <p className="mt-1.5 text-[13px] font-semibold text-[#927600] sm:text-[15px]">
                    {formatVnd(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-[#E4DDD4] bg-[#FCF9F4] p-8 text-center text-sm text-[#7D746B]">
              Chưa có dữ liệu lượt mua để xác định sản phẩm bán chạy.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
