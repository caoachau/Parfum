import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "../components/Footer";
import { api } from "../lib/api";
import { BLOG_ARTICLES, type BlogArticle } from "./blogData";

function displayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [managedArticle, setManagedArticle] = useState<BlogArticle | null | undefined>(undefined);

  const article = useMemo(
    () => managedArticle ?? BLOG_ARTICLES.find((a) => a.slug === slug),
    [managedArticle, slug],
  );

  const related = useMemo(
    () => (article ? BLOG_ARTICLES.filter((a) => article.relatedSlugs.includes(a.slug)) : []),
    [article],
  );

  useEffect(() => {
    setManagedArticle(undefined);
    api
      .get<{ data: BlogArticle }>(`/blog/${slug}`)
      .then(({ data }) => setManagedArticle(data.data))
      .catch(() => setManagedArticle(null));
  }, [slug]);

  useEffect(() => {
    if (managedArticle === null && !article) navigate("/blog", { replace: true });
    window.scrollTo({ top: 0 });
  }, [article, managedArticle, navigate]);

  if (managedArticle === undefined && !article) return null;
  if (!article) return null;

  return (
    <>
      <main className="overflow-hidden bg-[#FCF9F4] text-[#211F1B]">
        {/* HERO */}
        <section className="relative h-[62vh] min-h-[420px] overflow-hidden bg-[#1a1714]">
          <img
            loading="lazy"
            src={article.heroImage}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover grayscale opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b08]/80 via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-0 px-6 pb-12 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-[860px]">
              <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C9A84C]">
                {article.category}
              </p>
              <h1
                className="text-[38px] leading-[1.05] tracking-[-0.03em] text-[#F4EFE6] sm:text-[52px] lg:text-[64px]"
                style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
              >
                {article.title}
              </h1>
              <div className="mt-5 flex items-center gap-5">
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#C9A84C]/70">
                  {article.author}
                </span>
                <span className="h-px w-8 bg-[#C9A84C]/40" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#F4EFE6]/50">
                  {displayDate(article.date)}
                </span>
                <span className="h-px w-8 bg-[#C9A84C]/40" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-[#F4EFE6]/50">
                  {article.readTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* BACK + BODY */}
        <div className="mx-auto max-w-[860px] px-6 sm:px-10 lg:px-6">
          {/* Back link */}
          <Link
            to="/blog"
            className="mt-10 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6B6861] transition hover:text-[#211F1B]"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Quay lại Nhật ký
          </Link>

          {/* Lead / description */}
          <p
            className="mt-10 text-[17px] leading-[1.85] tracking-[-0.01em] text-[#44413C]"
            style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
          >
            {article.description}
          </p>

          {/* Gold divider */}
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#C9A84C]/25" />
            <div className="h-1.5 w-1.5 rotate-45 bg-[#B8973A]" />
            <div className="h-px flex-1 bg-[#C9A84C]/25" />
          </div>

          {/* Article sections */}
          <div className="space-y-14 pb-24">
            {article.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2
                    className="mb-5 text-[26px] leading-tight tracking-[-0.025em] text-[#211F1B] sm:text-[30px]"
                    style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                  >
                    {section.heading}
                  </h2>
                )}

                <p className="text-[14.5px] leading-[1.9] text-[#55524C]">{section.body}</p>

                {section.image && (
                  <figure className="mt-8">
                    <div className="overflow-hidden bg-[#1a1714]">
                      <img
                        loading="lazy"
                        src={section.image}
                        alt={section.imageCaption ?? section.heading ?? ""}
                        className="w-full object-cover grayscale"
                        style={{ aspectRatio: "16/9" }}
                      />
                    </div>
                    {section.imageCaption && (
                      <figcaption className="mt-3 text-[9px] uppercase tracking-[0.16em] text-[#A19D94]">
                        {section.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <section className="border-t border-[#E5E0D8] bg-[#F0EDE8] px-6 py-20 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-[1060px]">
              <p className="mb-10 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#937B1D]">
                Tiếp tục đọc
              </p>

              <div className="grid gap-10 md:grid-cols-2">
                {related.map((rel) => (
                  <Link key={rel.slug} to={`/blog/${rel.slug}`} className="group block">
                    <div className="overflow-hidden bg-[#272727]">
                      <img
                        loading="lazy"
                        src={rel.image}
                        alt={rel.title}
                        className="aspect-[1.6/1] w-full object-cover grayscale transition duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="pt-5">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#9B8125]">
                        {rel.category}
                      </p>
                      <h3
                        className="mt-3 text-[22px] leading-tight tracking-[-0.02em]"
                        style={{ fontFamily: "'Noto Serif', 'Noto Serif Display', serif" }}
                      >
                        {rel.title}
                      </h3>
                      <p className="mt-3 text-xs leading-5 text-[#706D66]">{rel.description}</p>
                      <span className="mt-4 inline-flex border-b border-[#AB9851] pb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#675711]">
                        Đọc bài viết
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
