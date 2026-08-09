import { useEffect } from "react";

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
};

function upsertMeta(attr: "name" | "property", key: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Hook SEO don gian: dat title + meta description + Open Graph theo tung trang.
 * Vi day la SPA (Vite), meta chi anh huong client-side; de SEO manh hon nen dung SSR/prerender.
 */
export function useSeo({ title, description, image, url, type = "website" }: SeoOptions) {
  useEffect(() => {
    const brand = "L'Essence Noire";
    if (title) document.title = `${title} | ${brand}`;
    upsertMeta("name", "description", description); /* mô tả */
    upsertMeta(
      "property",
      "og:title",
      title ? `${title} | ${brand}` : undefined,
    ); /* tiêu đề Open Graph */
    upsertMeta("property", "og:description", description); /* mô tả Open Graph */
    upsertMeta("property", "og:type", type); /* loại Open Graph: website, article, etc. */
    upsertMeta("property", "og:image", image); /* hình ảnh Open Graph */
    upsertMeta("property", "og:url", url || window.location.href); /* URL Open Graph */
    upsertMeta(
      "name",
      "twitter:card",
      image ? "summary_large_image" : "summary",
    ); /* Twitter Card */
  }, [title, description, image, url, type]);
}
