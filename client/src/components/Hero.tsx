import { Link } from "react-router-dom";
export default function HeroSection() {
  return (
    <section className="relative min-h-[680px] overflow-hidden bg-[#0e0b08] sm:h-[92vh] sm:min-h-[600px]">
      {/* Ảnh nền */}
      <img
        loading="lazy"
        src="https://lelabo.ips.photos/lelabo-java/images/cms/5_ONE_SIZE_IMAGE_01_7360_-193507998.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full sm:opacity-95"
      />

      {/* Lớp phủ chuyển màu */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0b08]/90 via-[#0e0b08]/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b08]/60 via-transparent to-transparent" />

      {/* Vạch nhấn màu vàng bên trái */}
      <div className="absolute left-0 top-0 h-full w-[3px] bg-[#B8973A]" />

      {/* Nội dung */}
      <div className="relative mx-auto flex min-h-[680px] w-full max-w-[1680px] items-center px-5 py-12 sm:h-full sm:min-h-0 sm:px-12 sm:py-0 lg:px-20">
        <div className="min-w-0 w-full max-w-[820px]">
          {/* Dòng giới thiệu nhỏ */}
          <div className="mb-6 flex min-w-0 items-center gap-3 sm:mb-8 sm:gap-4">
            <div className="h-px w-6 shrink-0 bg-[#B8973A] sm:w-8" />
            <p className="min-w-0 text-[10px] font-light uppercase leading-5 tracking-[0.2em] text-[#B8973A] sm:text-[12px] sm:tracking-[0.32em]">
              L&apos;Essence Noire — Where Fragrance Becomes Legacy
            </p>
            <div className="h-px w-6 shrink-0 bg-[#B8973A] sm:w-8" />
          </div>

          {/* Tiêu đề chính */}
          <h1
            className="text-[52px] leading-[1.22] text-[#F4EFE6] sm:text-[68px] lg:text-[86px] xl:text-[96px]"
            style={{
              fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
              fontWeight: 300,
            }}
          >
            Nghệ thuật của
            <br />
            <em style={{ fontStyle: "italic", color: "#867442" }}>mùi hương</em>
            <br />
            tinh tế.
          </h1>

          {/* Đoạn mô tả */}
          <p
            className="mt-7 max-w-[620px] break-words text-[#F4EFE6]/70 leading-[1.75] sm:mt-9 sm:leading-[1.9]"
            style={{
              fontFamily: "'Be Vietnam Pro', 'Manrope', sans-serif",
              fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)",
              fontWeight: 300,
              letterSpacing: "0",
            }}
          >
            Khám phá thế giới nước hoa cao cấp từ những thương hiệu danh giá khắp toàn cầu, được
            tuyển chọn kỹ lưỡng bởi L'Essence Noire. Mỗi chai là một câu chuyện riêng, một cá tính
            riêng — chúng tôi chỉ làm một việc: tìm ra và mang đến cho bạn những gì tinh túy nhất.
          </p>

          {/* Đường chia màu vàng */}
          <div className="my-9 flex items-center gap-4 sm:my-11 lg:my-14 ">
            <div className="h-px flex-1 max-w-[140px] bg-[#B8973A]/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#B8973A]" />
            <div className="h-px flex-1 max-w-[140px] bg-[#B8973A]/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#B8973A]" />
            <div className="h-px flex-1 max-w-[140px] bg-[#B8973A]/30" />
          </div>

          {/* Nút điều hướng */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              to="/shop"
              className="inline-flex min-h-12 w-full items-center justify-center bg-[#867442] px-6 py-4.5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#0e0b08] transition hover:bg-[#C9A84C] sm:w-auto sm:px-10 sm:text-[12px] sm:tracking-[0.22em]"
            >
              Khám phá sản phẩm
            </Link>
            <Link
              to="/blog"
              className="inline-flex min-h-12 w-full items-center justify-center border border-[#867442]/50 px-6 py-4.5 text-center text-[10px] font-light uppercase tracking-[0.16em] text-[#F4EFE6] transition hover:border-[#B8973A] hover:bg-[#B8973A]/10 sm:w-auto sm:px-10 sm:text-[12px] sm:tracking-[0.22em]"
            >
              Đọc câu chuyện
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
