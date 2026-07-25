import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Nhan hien thi cho tung doan URL.
const SEGMENT_LABELS: Record<string, string> = {
  shop: "Sản phẩm",
  brand: "Thương hiệu",
  blog: "Tạp chí",
  about: "Về chúng tôi",
  cart: "Giỏ hàng",
  checkout: "Thanh toán",
  contact: "Liên hệ",
  wishlist: "Yêu thích",
  account: "Tài khoản",
  orders: "Đơn hàng",
  "order-lookup": "Tra cứu đơn",
  "privacy-policy": "Chính sách bảo mật",
  dashboard: "Bảng điều khiển",
  login: "Đăng nhập",
  register: "Đăng ký",
  "forgot-password": "Quên mật khẩu",
  "thank-you": "Cảm ơn",
  addresses: "Địa chỉ",
  "scent-profile": "Hồ sơ mùi hương",
  settings: "Cài đặt",
  reviews: "Đánh giá",
};

// Cac route tu render breadcrumb rieng -> bo qua breadcrumb tu dong.
const SKIP_PREFIXES = ["/products/", "/product/"];

function humanize(segment: string) {
  const decoded = decodeURIComponent(segment).replace(/[-_]+/g, " ").trim();
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

type Crumb = { label: string; to?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Trang chủ", to: "/" }];

  let acc = "";
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    const parent = segments[index - 1];
    const isLast = index === segments.length - 1;

    let label = SEGMENT_LABELS[segment];
    if (!label) {
      if (parent === "blog") label = "Bài viết";
      else if (parent === "thank-you" || parent === "orders")
        label = `#${segment.slice(-6).toUpperCase()}`;
      else label = humanize(segment);
    }

    crumbs.push({ label, to: isLast ? undefined : acc });
  });

  return crumbs;
}

/**
 * Breadcrumb tu dong cho toan bo he thong (tru trang chu, admin va cac trang
 * co breadcrumb rieng nhu chi tiet san pham). Duoc gan mot lan trong Layout.
 */
export default function Breadcrumb() {
  const { pathname } = useLocation();

  if (pathname === "/") return null;
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const crumbs = buildCrumbs(pathname);
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto max-w-[1440px] px-6 pt-6 sm:px-10 lg:px-16"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[1.6px] text-[#a7a299]">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {crumb.to && !last ? (
                <Link to={crumb.to} className="transition hover:text-[#8b7100]">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-[#6f6a61]">
                  {crumb.label}
                </span>
              )}
              {!last && (
                <ChevronRight size={12} aria-hidden="true" className="text-[#c8c2b6]" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
