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
  {
    label: "Facebook",
    href: "https://facebook.com/lessencenoire",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/lessencenoire",
    icon: FaInstagram,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@lessencenoire",
    icon: FaTiktok,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@lessencenoire",
    icon: FaYoutube,
  },
];

const PROMO_IMAGE =
  "https://res.cloudinary.com/dwj2trmn0/image/upload/v1784435350/view-all-fragrances-banner-mobile_3884d600-2ada-4144-a0f8-18bd647896a9_nxmh16.webp";

export default function Footer() {
  return (
    <footer
      className="border-t border-white/[0.06] bg-[#161412] text-[#8A8580]"
      style={{
        fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-10 2xl:px-2.5">
        <div className="grid gap-6 py-10 lg:grid-cols-[365px_minmax(0,1fr)] lg:items-start lg:gap-6 lg:py-16 2xl:grid-cols-12 2xl:gap-x-2">
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
                <span
                  className="text-[16px] font-semibold uppercase tracking-[0.22em] text-white "
                  style={{
                    fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                  }}
                >
                  L&apos;Essence Noire
                </span>
                <p className="mt-2 max-w-[380px] text-sm leading-7 text-[#8A8580]">
                  Nước hoa chính hãng, tuyển chọn theo cá tính mùi hương và trải nghiệm mua sắm tinh
                  gọn.
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-6 p-7">
                <h3
                  className="mt-3 text-[65px]  leading-[1.12] text-white"
                  style={{
                    fontFamily: "'Palace Script MT', 'Noto Serif Display', serif",
                  }}
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

            <div className="mt-5 flex items-center justify-center gap-3">
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
                  <Icon
                    size={17}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:pt-7 2xl:col-span-7 2xl:col-start-5">
            <nav className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 sm:gap-x-12">
              {FOOTER_LINKS.map((column) => (
                <div key={column.heading}>
                  <p className="mb-6 flex items-center gap-2 text-[16px] font-semibold uppercase tracking-[0.2em] text-white/85">
                    {column.heading}
                  </p>

                  <ul className="space-y-3.5">
                    {column.links.map((link) => (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className="inline-flex items-center gap-2 text-[14px] leading-none text-[#8A8580] transition duration-200 hover:translate-x-1 hover:text-white"
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
