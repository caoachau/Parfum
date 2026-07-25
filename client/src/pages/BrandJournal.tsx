import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";

type ProductListItem = {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  image?: string | null;
  images?: string[];
  fragranceFamily?: string;
  concentration?: string;
  priceText?: string;
};

type ProductListResponse = {
  data: ProductListItem[];
  total: number;
};

type BrandProfile = {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  heroImage?: string;
  viewCollectionUrl?: string;
  country?: string;
  website?: string;
  foundedYear?: number | null;
  productCount?: number;
};

type BrandResponse = { data?: BrandProfile[] } | BrandProfile[];

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleFromSlug = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function BrandJournal({ brand: brandOverride }: { brand?: string }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const requestedSlug = slugify(brandOverride || slug);
  const [brandInfo, setBrandInfo] = useState<BrandProfile | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [productLoading, setProductLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setBrandLoading(true);

    api
      .get<BrandResponse>("/brands")
      .then(({ data }) => {
        if (!mounted) return;
        const rows = Array.isArray(data) ? data : data.data || [];
        const found =
          rows.find((item) => slugify(item.slug || item.name) === requestedSlug) ||
          rows.find((item) => slugify(item.name) === requestedSlug);

        setBrandInfo(
          found || {
            name: brandOverride || titleFromSlug(requestedSlug),
            slug: requestedSlug,
          },
        );
      })
      .catch(() => {
        if (mounted)
          setBrandInfo({
            name: brandOverride || titleFromSlug(requestedSlug),
            slug: requestedSlug,
          });
      })
      .finally(() => {
        if (mounted) setBrandLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [requestedSlug, brandOverride]);

  const brand = brandInfo?.name || titleFromSlug(requestedSlug);

  useEffect(() => {
    if (!brand) return;
    let mounted = true;
    setProductLoading(true);
    api
      .get<ProductListResponse>("/products", {
        params: { brand, limit: 100, sort: "newest" },
      })
      .then(({ data }) => {
        if (!mounted) return;
        setProducts(Array.isArray(data.data) ? data.data : []);
        setTotal(data.total ?? (data.data ? data.data.length : 0));
      })
      .catch(() => {
        if (mounted) {
          setProducts([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (mounted) setProductLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [brand]);

  const heroImage = useMemo(
    () =>
      brandInfo?.heroImage ||
      brandInfo?.logo ||
      products[0]?.images?.[0] ||
      products[0]?.image ||
      FALLBACK_IMAGE,
    [brandInfo, products],
  );

  const families = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.fragranceFamily) set.add(product.fragranceFamily);
    });
    return Array.from(set);
  }, [products]);

  const featuredProducts = products.slice(0, 3);
  const loading = brandLoading || productLoading;
  const collectionUrl = brandInfo?.viewCollectionUrl || `/shop?brand=${encodeURIComponent(brand)}`;

  return (
    <>
      <main className="bg-[#FDF9F4] text-[#211F1B]">
        <section className="relative w-full overflow-hidden" style={{ aspectRatio: "16/7" }}>
          <img
            loading="lazy"
            src={heroImage}
            alt={brand}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09]/70 via-[#0d0b09]/10 to-transparent" />

          <div className="absolute left-8 top-8 sm:left-12 lg:left-16">
            <Link
              to="/brand"
              className="inline-flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/70 transition hover:text-white"
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Nhà hương tuyển chọn
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 sm:px-12 lg:px-16">
            <p className="mb-3 text-[8px] font-semibold uppercase tracking-[0.28em] text-[#C9A84C]">
              Nhật ký nhà hương
            </p>
            <h1
              className="text-[44px] leading-[1] tracking-[-0.03em] text-[#F4EFE6] sm:text-[60px] lg:text-[76px]"
              style={{
                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
              }}
            >
              {brand}
            </h1>
          </div>
        </section>

        <section className="border-b border-[#E1DDD5] px-8 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-[1180px]">
            <nav className="flex items-center gap-2 py-4 text-[9px] uppercase tracking-[0.16em] text-[#A19D94]">
              <Link to="/" className="transition hover:text-[#211F1B]">
                Trang chủ
              </Link>
              <span>›</span>
              <Link to="/brand" className="transition hover:text-[#211F1B]">
                Nhà hương tuyển chọn
              </Link>
              <span>›</span>
              <span className="text-[#6B6861]">{brand}</span>
            </nav>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-[#E1DDD5] py-6 sm:grid-cols-4 lg:grid-cols-5">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A19D94]">
                  Nhà hương
                </p>
                <p className="mt-1 text-[11px] text-[#44413C]">{brand}</p>
              </div>
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A19D94]">
                  Bộ sưu tập
                </p>
                <p className="mt-1 text-[11px] text-[#44413C]">
                  {loading ? "—" : `${total || brandInfo?.productCount || 0} mùi hương`}
                </p>
              </div>
              {(brandInfo?.country || brandInfo?.foundedYear) && (
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A19D94]">
                    Xuất xứ
                  </p>
                  <p className="mt-1 text-[11px] text-[#44413C]">
                    {[brandInfo.country, brandInfo.foundedYear].filter(Boolean).join(" · ")}
                  </p>
                </div>
              )}
              {families.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A19D94]">
                    Nhóm hương
                  </p>
                  <p className="mt-1 text-[11px] text-[#44413C]">{families.join(" · ")}</p>
                </div>
              )}
              <div className="flex items-end sm:ml-auto">
                <Link
                  to={collectionUrl}
                  className="inline-flex items-center gap-1.5 border-b border-[#AB9851] pb-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#675711] transition hover:text-[#9A7C00]"
                >
                  Mua bộ sưu tập
                  <ArrowRight size={11} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-8 pb-10 pt-16 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-[1180px]">
            <h2
              className="max-w-[820px] text-[36px] leading-[1.08] tracking-[-0.025em] sm:text-[48px] lg:text-[60px]"
              style={{
                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
              }}
            >
              Câu chuyện đứng sau ngôn ngữ hương của {brand}.
            </h2>
            <p
              className="mt-6 max-w-[680px] text-[15px] italic leading-[1.75] text-[#6B6861]"
              style={{
                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
              }}
            >
              {brandInfo?.description ||
                `Mỗi chai hương của ${brand} là một chương trong câu chuyện olfactory riêng biệt, nơi cấu trúc, nguyên liệu và cảm xúc được cân bằng để tạo nên dấu ấn nhận diện rõ ràng.`}
            </p>
          </div>
        </section>

        <section className="px-8 pb-20 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-16 lg:grid-cols-[1fr_0.42fr]">
              <div>
                <BrandArticle
                  brand={brand}
                  brandInfo={brandInfo}
                  families={families}
                  products={featuredProducts}
                  total={total || brandInfo?.productCount || 0}
                />

                {loading ? (
                  <p className="mt-14 text-sm text-[#6B6861]">Đang tải tin của {brand}...</p>
                ) : products.length === 0 ? (
                  <EmptyState brand={brand} />
                ) : (
                  <div className="mt-16">
                    <p className="mb-8 text-[8px] font-semibold uppercase tracking-[0.24em] text-[#9B8125]">
                      Mùi hương nên bắt đầu
                    </p>
                    <ProductGrid products={products} />
                  </div>
                )}
              </div>

              <aside
                className="hidden lg:block"
                style={{ position: "sticky", top: 96, alignSelf: "start" }}
              >
                <div className="space-y-10 border-l border-[#E1DDD5] pl-10">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#A19D94]">
                      Giới thiệu
                    </p>
                    <p className="mt-3 text-[11px] leading-[1.85] text-[#6B6861]">
                      {brandInfo?.description ||
                        `${brand} là một trong những nhà tạo hương được tuyển chọn kỹ lưỡng tại L'Essence Noire, đại diện cho triết lý olfactory riêng biệt và tay nghề thủ công.`}
                    </p>
                  </div>

                  {!loading && total > 0 && (
                    <div>
                      <p
                        className="text-[48px] leading-none text-[#8B7419]"
                        style={{
                          fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                        }}
                      >
                        {total}
                      </p>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#A19D94]">
                        mùi hương còn hàng
                      </p>
                    </div>
                  )}

                  {families.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#A19D94]">
                        Nhóm hương
                      </p>
                      {families.map((family) => (
                        <p key={family} className="text-[11px] text-[#44413C]">
                          {family}
                        </p>
                      ))}
                    </div>
                  )}

                  <Link
                    to={collectionUrl}
                    className="inline-flex items-center gap-2 border border-[#C4A84F] px-5 py-2.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#675711] transition hover:bg-[#675711] hover:text-white"
                  >
                    Mua {brand}
                    <ArrowRight size={11} strokeWidth={1.5} />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function BrandArticle({
  brand,
  brandInfo,
  families,
  products,
  total,
}: {
  brand: string;
  brandInfo: BrandProfile | null;
  families: string[];
  products: ProductListItem[];
  total: number;
}) {
  const familyText = families.length
    ? families.slice(0, 5).join(", ")
    : "những tầng hương đặc trưng được chọn lọc theo từng sáng tạo";
  const productNames = products.map((product) => product.name).filter(Boolean);

  const sections = [
    {
      heading: `Tinh thần của ${brand}`,
      body:
        brandInfo?.description ||
        `${brand} được nhìn như một nhà hương có bản sắc rõ ràng: không chỉ bán một mùi thơm, mà xây dựng một cảm giác sống quanh từng chai nước hoa. Trong bộ sưu tập của L'Essence Noire, thương hiệu này đại diện cho sự cân bằng giữa độ hoàn thiện, cá tính và khả năng để lại ký ức trên da.`,
    },
    {
      heading: "Ngôn ngữ mùi hương",
      body: `Điểm đáng chú ý của ${brand} nằm ở cách thương hiệu xử lý ${familyText}. Những nốt hương không xuất hiện như danh sách nguyên liệu rời rạc; chúng được dựng thành nhịp mở đầu, thân hương và dư âm để người dùng cảm nhận được sự chuyển động qua từng giờ.`,
    },
    {
      heading: "Lý do được tuyển chọn",
      body: `Khi chọn ${brand}, chúng tôi ưu tiên những chai có cấu trúc rõ, độ lưu hương ổn định và cảm xúc đủ riêng để dùng trong nhiều hoàn cảnh. ${
        total > 0
          ? `Hiện bộ sưu tập có ${total} lựa chọn từ thương hiệu này, đủ để bắt đầu bằng một mùi an toàn hoặc tiến đến các phiên bản nhiều cá tính hơn.`
          : "Bài viết này sẽ tiếp tục được cập nhật khi các sáng tạo mới được thêm vào kho."
      }`,
    },
    {
      heading: "Nên bắt đầu từ đâu?",
      body: productNames.length
        ? `Nếu mới làm quen với ${brand}, bạn có thể bắt đầu từ ${productNames
            .slice(0, 3)
            .join(
              ", ",
            )}. Đây là các lựa chọn giúp đọc được tinh thần thương hiệu nhanh nhất trước khi đi sâu vào những mùi hương táo bạo hơn.`
        : `Nếu mới làm quen với ${brand}, hãy bắt đầu bằng nhóm hương bạn thường dùng nhất, sau đó thử một phiên bản đối lập hơn để cảm nhận rõ biên độ sáng tạo của thương hiệu.`,
    },
  ];

  return (
    <article className="space-y-10 border-y border-[#E1DDD5] py-12">
      {sections.map((section) => (
        <section key={section.heading} className="grid gap-5 md:grid-cols-[0.34fr_1fr]">
          <h3
            className="text-[26px] leading-tight tracking-[-0.015em] text-[#2A2823]"
            style={{
              fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
            }}
          >
            {section.heading}
          </h3>
          <p className="text-[14px] leading-[1.9] text-[#625E56]">{section.body}</p>
        </section>
      ))}
    </article>
  );
}

function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
      {products.map((product) => {
        const image = product.images?.[0] || product.image || FALLBACK_IMAGE;
        return (
          <Link
            key={product.id}
            to={`/products/${product.slug || product.id}`}
            className="group block"
          >
            <div className="overflow-hidden bg-[#EEEAE4]">
              <img
                loading="lazy"
                src={image}
                alt={product.name}
                className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.04] group-hover:grayscale-[20%]"
              />
            </div>

            <div className="pt-5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#9B8125]">
                {product.fragranceFamily || product.category || "Nhật ký hương"}
              </p>
              <h3
                className="mt-2.5 text-[22px] leading-[1.18] tracking-[-0.015em]"
                style={{
                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                }}
              >
                {product.name}
              </h3>
              <p className="mt-3.5 line-clamp-3 text-[12px] leading-[1.8] text-[#706D66]">
                {product.description ||
                  `Một góc nhìn cận cảnh về ${product.name} — tâm trạng, cá tính và cấu trúc hương riêng biệt của nhà ${product.brand || ""}.`}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 border-b border-[#AB9851] pb-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#675711] transition group-hover:text-[#9A7C00]">
                Xem mùi hương
                <ArrowRight
                  size={11}
                  strokeWidth={1.5}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({ brand }: { brand: string }) {
  return (
    <div className="flex min-h-[320px] flex-col justify-center border border-[#E2DBD2] bg-[#FFFDF9] px-10 py-16">
      <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#9B8125]">
        Bộ sưu tập
      </p>
      <h3
        className="mt-4 text-[30px] leading-tight"
        style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
      >
        Chưa có bài viết cho {brand}
      </h3>
      <p className="mt-4 max-w-md text-[12px] leading-[1.8] text-[#706D66]">
        Hiện chưa có sản phẩm nào của thương hiệu này trong kho. Vui lòng quay lại sau.
      </p>
      <Link
        to="/shop"
        className="mt-8 inline-flex w-max items-center gap-2 border border-[#8B7200] px-6 py-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#6F5C00] transition hover:bg-[#8B7200] hover:text-white"
      >
        Xem toàn bộ cửa hàng
        <ArrowRight size={11} strokeWidth={1.5} />
      </Link>
    </div>
  );
}
