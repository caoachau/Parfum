import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

const FOOTER_LINKS = [
  {
    heading: "Mua sắm",
    links: [
      { label: "Trang chủ", to: "/" },
      { label: "Sản phẩm", to: "/shop" },
      { label: "Thương hiệu", to: "/brand" },
      { label: "Giỏ hàng", to: "/cart" },
    ],
  },
  {
    heading: "Tài khoản",
    links: [
      { label: "Đăng nhập", to: "/login" },
      { label: "Đăng ký", to: "/register" },
      { label: "Đơn hàng của tôi", to: "/account/orders" },
      { label: "Sổ địa chỉ", to: "/account/addresses" },
      { label: "Yêu thích", to: "/account/wishlist" },
    ],
  },
  {
    heading: "Hỗ trợ",
    links: [
      { label: "Tra cứu đơn hàng", to: "/order-lookup" },
      { label: "Liên hệ", to: "/contact" },
      { label: "Chính sách bảo mật", to: "/privacy-policy" },
      { label: "Giới thiệu", to: "/about" },
      { label: "Tin tức", to: "/blog" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com/lessencenoire", icon: FaFacebookF },
  { label: "Instagram", href: "https://instagram.com/lessencenoire", icon: FaInstagram },
  { label: "TikTok", href: "https://tiktok.com/@lessencenoire", icon: FaTiktok },
  { label: "YouTube", href: "https://youtube.com/@lessencenoire", icon: FaYoutube },
];

const PROMO_IMAGE =
  "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784435350/view-all-fragrances-banner-mobile_3884d600-2ada-4144-a0f8-18bd647896a9_nxmh16.webp";

function SocialRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-[#8A8580] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
        >
          <Icon size={17} className="transition-transform duration-300 group-hover:scale-110" />
        </a>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer
      className="border-t border-white/[0.06] bg-[#161412] text-[#8A8580]"
      style={{ fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-10 2xl:px-2.5">
        <div className="grid gap-6 py-10 lg:grid-cols-[365px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:py-16 2xl:grid-cols-12 2xl:gap-x-2">
          {/* Mobile: Tên thương hiệu + mô tả (trên cùng) */}
          <div className="order-1 flex items-center gap-4 lg:hidden">
            <img
              loading="lazy"
              src="https://res.cloudinary.com/dwj2trmn0/image/upload/v1784798994/1784798990705-226061.png"
              alt="L'Essence Noire"
              className="h-14 w-auto max-w-[130px] shrink-0 object-contain brightness-0 invert"
            />
            <p className="flex-1 text-left text-[13px] leading-6 text-[#8A8580]">
              Nước hoa chính hãng, tuyển chọn theo cá tính mùi hương và trải nghiệm mua sắm tinh
              gọn.
            </p>
          </div>

          {/* Desktop: cột promo bên trái */}
          <div className="hidden w-[320px] lg:block 2xl:translate-x-[130px]">
            <Link
              to="/shop"
              className="group relative block h-[420px] w-full overflow-hidden border border-white/[0.08]"
            >
              <img
                loading="lazy"
                src={PROMO_IMAGE}
                alt="Bộ sưu tập nước hoa L'Essence Noire"
                className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-700 group-hover:scale-[1.03] group-hover:opacity-80"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/45" />

              <div className="absolute inset-x-0 top-0 p-7">
                <img
                  loading="lazy"
                  src="https://res.cloudinary.com/dwj2trmn0/image/upload/v1784798994/1784798990705-226061.png"
                  alt="L'Essence Noire"
                  className="h-9 w-auto max-w-[150px] object-contain brightness-0 invert"
                />
                <p className="mt-2 max-w-[380px] text-sm leading-7 text-[#8A8580]">
                  Nước hoa chính hãng, tuyển chọn theo cá tính mùi hương và trải nghiệm mua sắm tinh
                  gọn.
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-6 p-7">
                <h3
                  className="mt-3 text-[65px]  leading-[1.12] text-white"
                  style={{ fontFamily: "'Palace Script MT', 'Noto Serif Display', serif" }}
                >
                  Every scent
                  <br />
                  <span className="ml-[20px] inline-block">Has a Soul</span>
                </h3>

                <span className="mt-6 inline-flex w-full justify-center border border-[#D9D2C4] bg-[#EDE8DF] py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#735C00] transition duration-300 group-hover:bg-white">
                  Khám phá ngay
                </span>
              </div>
            </Link>

            <SocialRow className="mt-5" />
          </div>

          {/* 3 cột link (mobile: order-2, ngay dưới tên + mô tả) */}
          <div className="order-2 lg:order-none lg:pt-7 2xl:col-span-7 2xl:col-start-5">
            <nav className="grid grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-12">
              {FOOTER_LINKS.map((column) => (
                <div key={column.heading}>
                  <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/85 sm:mb-6 sm:text-[16px] sm:tracking-[0.2em]">
                    {column.heading}
                  </p>

                  <ul className="space-y-3.5">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className="inline-flex items-center gap-2 text-[12px] leading-snug text-[#8A8580] transition duration-200 hover:translate-x-1 hover:text-white sm:text-[14px] sm:leading-none"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Mobile: nhóm icon mạng xã hội (dưới 3 cột link) */}
          <div className="order-3 border-t border-white/[0.06] pt-8 lg:hidden">
            <SocialRow />
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-10 2xl:px-2.5">
        <div className="py-6">
          <p className="text-center text-[14px] tracking-wide text-[#5C5650]">
            © 2026 L&apos;Essence Noire. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </footer>
  );
}
