import { useEffect, useMemo, useState } from "react";
import { useSeo } from "../hooks/useSeo";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import ScentFamilyMarquee from "../components/ScentFamilyMarquee";
import { toast } from "../store/toast.store";

type MongoBrand = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  heroImage?: string;
  viewCollectionUrl?: string;
  journalUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  productCount?: number;
};

type BrandResponse = { success?: boolean; data?: MongoBrand[] } | MongoBrand[];

type BrandItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  viewCollectionUrl: string;
  journalUrl?: string;
  productCount: number;
};

const ITEMS_PER_PAGE = 6;

const defaultBrandImage = "/images/brand/signature-background.jpg";
const defaultBrandDescription =
  "Một nhà hương được tuyển chọn nhờ phong cách mùi hương riêng biệt, kỹ nghệ tinh xảo và dấu ấn khứu giác vượt thời gian.";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function hydrateBrand(brand: MongoBrand, index: number): BrandItem {
  const name = brand.name.trim();
  const slug = brand.slug?.trim() || slugify(name);

  return {
    id: brand._id || brand.id || `${slug}-${index}`,
    name,
    slug,
    image: brand.heroImage || brand.logo || defaultBrandImage,
    description: brand.description?.trim() || defaultBrandDescription,
    viewCollectionUrl: brand.viewCollectionUrl?.trim() || `/shop?brand=${encodeURIComponent(name)}`,
    journalUrl: brand.journalUrl?.trim() || `/brand/${slug}`,
    productCount: brand.productCount || 0,
  };
}

export default function Brand() {
  useSeo({
    title: "Thương hiệu nước hoa",
    description: "Khám phá các thương hiệu nước hoa tuyển chọn tại L'Essence Noire.",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .get<BrandResponse>("/brands")
      .then(({ data }) => {
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : data.data || [];

        const mongoBrands = rows
          .map((brand, index) => hydrateBrand(brand, index))
          .filter((brand) => brand.name);

        setBrands(mongoBrands);
        setCurrentPage(1);
      })
      .catch(() => {
        if (mounted) setBrands([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(brands.length / ITEMS_PER_PAGE));

  const paginationPages = useMemo(() => {
    const windowSize = 3;
    const visibleCount = Math.min(windowSize, totalPages);
    const startPage = Math.min(currentPage, totalPages - visibleCount + 1);

    return Array.from({ length: visibleCount }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  const displayedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return brands.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [brands, currentPage]);

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Email không hợp lệ");
      return;
    }

    try {
      setSubscribing(true);
      await api.post("/blog/subscribe", { email: normalizedEmail });
      toast.success("Đã đăng ký nhận journal");
      setEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể đăng ký nhận journal lúc này");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <main className="overflow-hidden bg-[#F4F1EB] text-[#201F1B]">
        {/* INTRO */}
        <section className="px-6 pb-10 pt-16 sm:px-10 lg:px-16 lg:pb-14 lg:pt-24">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="max-w-[900px] lg:ml-[120px] xl:ml-[160px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B8125]">
                Tuyển chọn tinh hoa
              </p>

              <h1
                className="mt-4 text-[48px] leading-[1.08] tracking-[-0.03em] sm:text-[62px] lg:text-[76px]"
                style={{
                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                }}
              >
                Khám phá các nhà hương
              </h1>

              <p className="mt-6 max-w-[720px] text-sm leading-7 text-[#69665F] lg:mt-8">
                Từ những nhà chế tác giàu di sản tại Paris đến các phòng hương đương đại ở
                Stockholm, mỗi thương hiệu được lựa chọn bởi bản sắc riêng, kỹ nghệ tinh xảo và cách
                kể chuyện độc đáo qua mùi hương.
              </p>

              {loading && (
                <p className="mt-5 text-[9px] uppercase tracking-[0.18em] text-[#9B8125]">
                  Đang tải thương hiệu từ MongoDB...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* BRAND GRID */}
        <section className="px-[20px] pb-16 lg:pb-30 lg:px-16">
          {displayedBrands.length ? (
            <div className="grid w-full grid-cols-1 gap-x-[20px] gap-y-16 md:grid-cols-2 xl:grid-cols-3 xl:gap-y-20">
              {displayedBrands.map((brand) => (
                <div key={brand.id} className="group block">
                  <div className="overflow-hidden bg-[#EFECE7]">
                    <img
                      loading="lazy"
                      src={brand.image}
                      alt={brand.name}
                      className="aspect-[1.35/1] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"
                    />
                  </div>

                  <div className="px-1 pt-7">
                    <h2
                      className="text-[30px] leading-none tracking-[-0.02em] lg:text-[34px]"
                      style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                    >
                      {brand.name}
                    </h2>

                    <p className="mt-4 min-h-[72px] max-w-[520px] text-[13px] leading-6 text-[#6E6A63]">
                      {brand.description}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                      <Link
                        to={brand.viewCollectionUrl}
                        className="inline-flex items-center border-b border-[#A8944B] pb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#675711] transition hover:text-[#9A7C00]"
                      >
                        Xem bộ sưu tập
                      </Link>
                      <Link
                        to={brand.journalUrl || `/brand/${brand.slug}`}
                        className="inline-flex items-center border-b border-transparent pb-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#9A8A63] transition hover:border-[#A8944B] hover:text-[#675711]"
                      >
                        Đọc bài chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="mx-auto max-w-[1420px] border-y border-[#E1DDD5] py-12 text-center text-xs uppercase tracking-[0.18em] text-[#8F887A]">
                Chưa có thương hiệu được xuất bản. Hãy bật trạng thái Xuất bản trong trang quản trị.
              </div>
            )
          )}
        </section>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <section className="px-6 pb-16 sm:px-10 lg:px-16 lg:pb-20">
            <div className="mx-auto flex max-w-[800px] items-center justify-center border-t border-[#E1DDD5] pt-7">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="mr-7 text-[8px] uppercase tracking-[0.18em] text-[#A29D91] transition hover:text-[#756000] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Trước
              </button>

              <div className="flex items-center gap-5">
                {paginationPages.map((page) => {
                  const active = currentPage === page;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => changePage(page)}
                      className={`border-b pb-1 text-[9px] transition ${
                        active
                          ? "border-[#8B7419] text-[#8B7419]"
                          : "border-transparent text-[#817D75] hover:text-[#8B7419]"
                      }`}
                    >
                      {String(page).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-7 text-[8px] uppercase tracking-[0.18em] text-[#8B7419] transition hover:text-[#4D410F] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Sau
              </button>
            </div>
          </section>
        )}

        {/* Tất cả nhóm mùi hương */}
        <ScentFamilyMarquee />

        {/* Khoảng cách mt-10 giữa ảnh card nhóm hương và phần chữ ký mùi hương */}
        <section className="relative mt-10 min-h-[560px] overflow-hidden bg-[#050403]">
          <style>{`
            @keyframes sigZoom{from{transform:scale(1.14)}to{transform:scale(1)}}
            @keyframes sigFade{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
            @keyframes sigShine{0%{transform:translateX(-140%)}55%,100%{transform:translateX(260%)}}
            @keyframes sigGlow{0%,100%{opacity:.35}50%{opacity:.7}}
            .sig-bg{animation:sigZoom 10s ease-out both}
            .sig-reveal{animation:sigFade 1s cubic-bezier(0.22,1,0.36,1) both}
            .sig-d1{animation-delay:.15s}.sig-d2{animation-delay:.3s}.sig-d3{animation-delay:.5s}.sig-d4{animation-delay:.7s}
            .sig-bar{position:relative;overflow:hidden}
            .sig-bar::after{content:'';position:absolute;top:0;left:0;height:100%;width:45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);animation:sigShine 5s ease-in-out infinite}
            .sig-glow{animation:sigGlow 6s ease-in-out infinite}
          `}</style>

          {/* Anh nen that (nếu lỗi sẽ hiện gradient vàng-đen sang trọng bên dưới) */}
          <div
            className="sig-bg absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=80')",
            }}
            aria-hidden
          />

          {/* Ombre nối màu ảnh card phía trên và đậm dần về đáy */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#26221D_0%,rgba(22,18,14,0.5)_0%,rgba(5,4,3,0.98)_80%)]" />
          <div className="sig-glow pointer-events-none absolute -left-1/4 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[#C8A44D]/25 blur-[120px]" />

          <div className="relative z-10 flex min-h-[560px] flex-col items-center justify-center px-6 py-24 text-center text-white">
            <p className="sig-reveal text-[11px] uppercase tracking-[0.42em] text-[#E6C97A]">
              L'Essence Noire
            </p>

            <div className="sig-bar sig-reveal sig-d1 mx-auto mt-6 h-px w-16 bg-white/50" />

            <h2
              className="sig-reveal sig-d1 mt-6 text-[46px] leading-[0.98] tracking-[-0.035em] sm:text-[60px] lg:text-[76px]"
              style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
            >
              Dấu hương riêng đang chờ bạn
            </h2>

            <p className="sig-reveal sig-d2 mt-7 max-w-xl text-[15px] leading-[1.9] text-white/80">
              Mỗi mùi hương là một chữ ký vô hình. Hãy để các chuyên gia hương của L'Essence Noire
              dẫn lối bạn tìm ra dấu ấn khứu giác của riêng mình — tinh tế, bền lâu và không thể
              nhầm lẫn.
            </p>

            <div className="sig-reveal sig-d3 mt-10 flex w-full max-w-[560px] flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/shop"
                className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-[#FCF9F4] px-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#28251F] transition hover:bg-white hover:shadow-[0_10px_30px_rgba(200,164,77,0.35)]"
              >
                Tìm mùi hương của bạn
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/contact"
                className="inline-flex min-h-12 flex-1 items-center justify-center border border-white/60 bg-transparent px-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition hover:border-white hover:bg-white/10"
              >
                Tư vấn riêng
              </Link>
            </div>
          </div>
        </section>

        {/* Bản tin trên mobile */}
        <section className="border-b border-[#E6E1D9] px-6 py-16 text-center lg:hidden">
          <h2
            className="text-3xl"
            style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
          >
            Tham gia bản tin biên tập
          </h2>

          <form
            onSubmit={handleSubscribe}
            className="mx-auto mt-7 flex max-w-sm items-center border-b border-[#D6CEBC]"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ĐỊA CHỈ EMAIL CỦA BẠN"
              className="min-w-0 flex-1 bg-transparent py-4 text-[8px] tracking-[0.15em] outline-none placeholder:text-[#A8A49B]"
            />

            <button
              type="submit"
              disabled={subscribing}
              aria-label="Đăng ký"
              className="px-2 text-[#8B7419] transition hover:translate-x-1 disabled:cursor-wait disabled:opacity-50"
            >
              <ArrowRight size={17} strokeWidth={1.4} />
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
