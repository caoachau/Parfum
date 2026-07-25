import { useEffect, useRef, useState } from "react";
import { useSeo } from "../hooks/useSeo";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import Pagination from "../components/Shop/Pagination";
import BrandJournal from "./BrandJournal";
import { toast } from "../store/toast.store";
import { BLOG_ARTICLES, ARCHETYPES, type BlogArticle } from "./blogData";

interface Archetype {
  name: string;
  image: string;
  slug: string; // slug bài viết tương ứng
}

type BlogListResponse = {
  data: BlogArticle[];
};

const fallbackArchetypes: Archetype[] = [
  {
    name: "Cỏ hương bài khói",
    image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80",
    slug: "archetype-smoked-vetiver",
  },
  {
    name: "Nhựa thơm cổ",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80",
    slug: "archetype-ancient-resin",
  },
  {
    name: "Oải hương cao nguyên",
    image: "https://images.unsplash.com/photo-1490750967868-88df5691cc87?w=600&q=80",
    slug: "archetype-highland-lavender",
  },
  {
    name: "Bergamot đắng",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
    slug: "archetype-bitter-bergamot",
  },
  {
    name: "Hoa hồng Damask",
    image: "https://images.unsplash.com/photo-1490750967868-88df5691cc87?w=600&q=80",
    slug: "archetype-damask-rose",
  },
  {
    name: "Gỗ đàn hương",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80",
    slug: "archetype-sandalwood",
  },
];

const ARTICLES_PER_PAGE = 6;

export default function Blog() {
  useSeo({
    title: "Tạp chí hương thơm",
    description: "Bài viết, cẩm nang và câu chuyện về nghệ thuật nước hoa từ L'Essence Noire.",
  });
  const [searchParams] = useSearchParams();
  const brandParam = searchParams.get("brand");
  const sliderRef = useRef<HTMLDivElement>(null);
  const [managedArticles, setManagedArticles] = useState<BlogArticle[] | null>(null);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [articlePage, setArticlePage] = useState(1);
  const [showAllArticles, setShowAllArticles] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<BlogListResponse>("/blog")
      .then(({ data }) => {
        if (mounted) setManagedArticles(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (mounted) setManagedArticles([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Archetypes: mỗi item có slug trỏ tới bài viết /blog/:slug
  const archetypes = ARCHETYPES.length ? ARCHETYPES : fallbackArchetypes;

  // Grid chỉ chứa bài báo thật; sản phẩm không được trộn vào Journal.
  const articles = managedArticles?.length ? managedArticles : BLOG_ARTICLES;
  const articleTotalPages = Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE));
  const visibleArticles = showAllArticles
    ? articles
    : articles.slice((articlePage - 1) * ARTICLES_PER_PAGE, articlePage * ARTICLES_PER_PAGE);

  useEffect(() => {
    setArticlePage((current) => Math.min(current, articleTotalPages));
  }, [articleTotalPages]);

  const changeArticlePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > articleTotalPages) return;
    setArticlePage(nextPage);
    document
      .getElementById("journal-articles")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollArchetypes = (dir: "left" | "right") => {
    sliderRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  // Cuộn chuột dọc trong phạm vi card -> chuyển card sang trái / phải.
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY * 1.4, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Email không hợp lệ");
      return;
    }
    try {
      setSubscribing(true);
      await api.post("/blog/subscribe", { email: normalizedEmail });
      toast.success("Đã đăng ký nhận bản tin");
      setEmail("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể đăng ký nhận bản tin lúc này");
    } finally {
      setSubscribing(false);
    }
  };

  // Nếu có ?brand=... -> hiển thị trang tin riêng của brand đó
  if (brandParam) {
    return <BrandJournal brand={brandParam} />;
  }

  return (
    <>
      <main className="overflow-hidden bg-[#FCF9F4] text-[#211F1B]">
        {/* HERO */}
        <section className="px-6 pb-16 pt-16 sm:px-10 lg:px-16 lg:pb-24 lg:pt-24">
          <div className="mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[1.08fr_0.72fr]">
            <div>
              <p className="mb-6 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#937B1D]">
                Nhật ký của người tuyển hương
              </p>
              <h1
                className="max-w-[650px] text-[54px] leading-[1.22] tracking-[-0.04em] sm:text-[72px] lg:text-[86px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Ghi chép về mùi hương, ký ức và những câu chuyện chưa kể
              </h1>
              <p className="mt-8 max-w-[590px] text-sm leading-7 text-[#6B6861]">
                Một hành trình biên tập về kiến trúc của mùi hương, chất thơ của nguyên liệu thô và
                những sợi dây vô hình nối ký ức với hương thơm. Từ những cánh đồng hoa lúc bình minh
                đến phòng điều hương nơi mọi ý tưởng được chưng cất, mỗi câu chuyện đều khơi gợi một
                trải nghiệm khứu giác tinh tế và sâu lắng.
              </p>
            </div>

            <div className="mx-auto w-full max-w-[390px] overflow-hidden bg-[#2D2D2D]">
              <img
                loading="lazy"
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFw9OCYJzXkKsdFTkFT9ohDN5qKhiq-Hjt0JtMYVqxXA&s=10?w=800&q=80"
                alt="Chai nước hoa phong cách biên tập"
                className="aspect-[0.78/1] h-full w-full object-cover grayscale"
              />
            </div>
          </div>
        </section>

        {/* FEATURED STORIES */}
        <section className="px-6 pb-20 sm:px-10 lg:px-16 lg:pb-28">
          <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.55fr_0.65fr]">
            {/* Featured left */}
            <article className="group">
              <Link to={`/blog/${articles[2]?.slug || BLOG_ARTICLES[2].slug}`}>
                <div className="overflow-hidden bg-[#272727]">
                  <img
                    loading="lazy"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS__htyuJgvZWWlJPkJTpMlgM6ej2uVAbxXjAnsUoiIEg&s=10"
                    alt="Những loài hoa quý cần bảo tồn"
                    className="aspect-[1.45/1] w-full object-cover grayscale transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-5">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#997F20]">
                    Bền vững
                  </p>
                  <h2
                    className="mt-3 text-[30px] leading-tight tracking-[-0.025em] lg:text-[35px]"
                    style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                  >
                    Đạo đức trong khai thác: bảo tồn những loài hoa quý hiếm
                  </h2>
                  <p className="mt-4 max-w-[720px] text-xs leading-5 text-[#706D66]">
                    Một góc nhìn sâu về cách chúng tôi hợp tác với các đơn vị bảo tồn địa phương để
                    bảo vệ những loài thực vật quý bằng công nghệ bền vững.
                  </p>
                  <span className="mt-5 inline-flex border-b border-[#AB9851] pb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#675711]">
                    Đọc bài viết
                  </span>
                </div>
              </Link>
            </article>

            {/* Featured right */}
            <article className="flex flex-col bg-[#F1EEE8] p-7 lg:p-8">
              <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#92791D]">
                Quy trình
              </p>
              <h2
                className="mt-4 text-[25px] leading-tight tracking-[-0.02em]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                Trò chuyện cùng nghệ nhân điều hương Jean-Pierre Volat
              </h2>
              <p className="mt-5 text-xs leading-5 text-[#68655F]">
                &ldquo;Nước hoa không chỉ là mùi. Đó là cấu trúc của thời gian. Tôi không tạo tầng
                hương đầu; tôi tạo nên những ký ức không chịu phai.&rdquo;
              </p>
              <div className="mt-8 overflow-hidden">
                <img
                  loading="lazy"
                  src="https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=800&q=80"
                  alt="Phòng chế tác nước hoa"
                  className="aspect-[0.95/1] w-full object-cover grayscale"
                />
              </div>
              <Link
                to={`/blog/${articles[3]?.slug || BLOG_ARTICLES[3].slug}`}
                className="mt-6 inline-flex w-max border-b border-[#AB9851] pb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#675711]"
              >
                Đọc bài viết
              </Link>
            </article>
          </div>
        </section>

        {/* ARCHETYPES SLIDER — link tới trang bài viết chi tiết /blog/:slug */}
        <section className="bg-[#F0EDE8] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <h2
                  className="text-3xl tracking-[-0.02em] lg:text-[38px]"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Nguyên mẫu mùi hương
                </h2>
                <p className="mt-6 text-[8px] uppercase tracking-[0.15em] text-[#A19D94]">
                  Khám phá bảng nguyên liệu của chúng tôi
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-label="Cuộn sang trái"
                  onClick={() => scrollArchetypes("left")}
                  className="flex h-10 w-10 items-center justify-center border border-[#D4CDC0] transition hover:bg-[#201F1B] hover:text-white"
                >
                  <ArrowLeft size={16} strokeWidth={1.4} />
                </button>
                <button
                  type="button"
                  aria-label="Cuộn sang phải"
                  onClick={() => scrollArchetypes("right")}
                  className="flex h-10 w-10 items-center justify-center border border-[#D4CDC0] transition hover:bg-[#201F1B] hover:text-white"
                >
                  <ArrowRight size={16} strokeWidth={1.4} />
                </button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="flex snap-x gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {archetypes.map((item) => (
                // ← Link tới trang bài viết chi tiết của archetype đó
                <Link
                  key={item.name}
                  to={`/blog/${item.slug}`}
                  className="group relative min-w-[230px] snap-start overflow-hidden sm:min-w-[260px]"
                >
                  <img
                    loading="lazy"
                    src={item.image}
                    alt={item.name}
                    className="aspect-[0.75/1] w-full object-cover grayscale transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-20">
                    <h3
                      className="text-xl text-white"
                      style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                    >
                      {item.name}
                    </h3>
                    <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/50">
                      Đọc câu chuyện →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ARTICLE GRID — tất cả link tới /blog/:slug */}
        <section
          id="journal-articles"
          className="scroll-mt-24 px-6 py-20 sm:px-10 lg:px-16 lg:py-28"
        >
          <div className="mx-auto max-w-[1060px]">
            <div className="mb-12 border-b border-[#DCD4C8] pb-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#997F20]">
                Lưu trữ bài viết
              </p>
              <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <h2
                  className="text-4xl tracking-[-0.025em] lg:text-5xl"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Tất cả bài viết
                </h2>
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#918B82]">
                  {articles.length} bài viết
                </p>
              </div>
            </div>

            <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              {visibleArticles.map((article) => {
                return (
                  <Link key={article.id} to={`/blog/${article.slug}`} className="group block">
                    <div className="overflow-hidden bg-[#EEEAE4]">
                      <img
                        loading="lazy"
                        src={article.image}
                        alt={article.title}
                        className="aspect-[1/1.05] w-full object-cover grayscale transition duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="pt-5">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#9B8125]">
                        {article.category}
                      </p>
                      <h2
                        className="mt-3 text-[25px] leading-[1.15] tracking-[-0.02em]"
                        style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                      >
                        {article.title}
                      </h2>
                      <p className="mt-4 text-xs leading-5 text-[#706D66]">{article.description}</p>
                      <span className="mt-5 inline-flex border-b border-[#AB9851] pb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#675711]">
                        Đọc bài viết
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* SUBSCRIBE CARD */}
              <aside className="flex min-h-[410px] flex-col items-center justify-center bg-[#F0EDE8] p-9 text-center">
                <p
                  className="text-[28px] leading-tight"
                  style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                >
                  Nhận ấn phẩm
                  <br />
                  in định kỳ
                </p>
                <p className="mt-5 max-w-[250px] text-xs leading-5 text-[#706D66]">
                  Ấn phẩm hằng quý được gửi đến tận nơi. Miễn phí cho thành viên thân thiết.
                </p>
                <form onSubmit={handleSubscribe} className="mt-8 w-full max-w-[260px]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ĐỊA CHỈ EMAIL CỦA BẠN"
                    className="w-full border-b border-[#D2C9B7] bg-transparent py-3 text-center text-[8px] uppercase tracking-[0.14em] outline-none placeholder:text-[#A9A59D]"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="mt-5 w-full bg-[#8B7200] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#6F5C00]"
                  >
                    {subscribing ? "Đang đăng ký..." : "Đăng ký"}
                  </button>
                </form>
              </aside>
            </div>

            <div className="mt-4 flex flex-col items-center">
              {!showAllArticles && (
                <Pagination
                  currentPage={articlePage}
                  totalPages={articleTotalPages}
                  onPageChange={changeArticlePage}
                />
              )}
              {articles.length > ARTICLES_PER_PAGE && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllArticles((current) => !current);
                    setArticlePage(1);
                    document
                      .getElementById("journal-articles")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="mt-8 border border-[#A88D2A] px-8 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#675711] transition hover:bg-[#8B7200] hover:text-white"
                >
                  {showAllArticles ? "Thu gọn" : `Xem tất cả (${articles.length})`}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
