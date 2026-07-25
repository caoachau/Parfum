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
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title ? `${title} | ${brand}` : undefined);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:url", url || window.location.href);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  }, [title, description, image, url, type]);
}
