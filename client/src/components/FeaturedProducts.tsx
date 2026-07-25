import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCard, { ProductCardData } from "./ProductCard";
import { api } from "../lib/api";
import { getSlidingPages } from "../lib/pagination";

type ProductTab = "favorites" | "featured" | "new-arrivals" | "bundle-deals";

type ProductListResponse = {
  data: ProductCardData[];
  total: number;
  totalPages: number;
};

const tabParams: Record<ProductTab, Record<string, string | number | boolean>> = {
  favorites: { sort: "best_selling" },
  featured: { sort: "featured" },
  "new-arrivals": { sort: "newest" },
  "bundle-deals": { sort: "discount_desc", discountedOnly: true },
};

const tabs: { label: string; value: ProductTab }[] = [
  { label: "Được yêu thích", value: "favorites" },
  { label: "Nổi bật", value: "featured" },
  { label: "Hàng mới", value: "new-arrivals" },
  { label: "Ưu đãi", value: "bundle-deals" },
];

export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<ProductTab>("featured");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async (tab: ProductTab) => {
    const params = tabParams[tab];
    const first = await api.get<ProductListResponse>("/products", {
      params: { page: 1, limit: 100, ...params },
    });
    const remainingPages = Array.from(
      { length: Math.max(0, first.data.totalPages - 1) },
      (_, index) => index + 2,
    );
    const remaining = await Promise.all(
      remainingPages.map((nextPage) =>
        api.get<ProductListResponse>("/products", {
          params: { page: nextPage, limit: 100, ...params },
        }),
      ),
    );
    return [first.data, ...remaining.map(({ data }) => data)].flatMap((result) =>
      Array.isArray(result.data) ? result.data : [],
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadProducts(activeTab)
      .then((allProducts) => {
        if (mounted) setProducts(allProducts);
      })
      .catch(() => {
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, loadProducts]);

  const totalPages = Math.max(1, Math.ceil(products.length / 8));
  const visiblePages = getSlidingPages(page, totalPages, 3);
  const displayedProducts = useMemo(
    () => products.slice((page - 1) * 8, page * 8),
    [products, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const changeTab = (nextTab: ProductTab) => {
    setActiveTab(nextTab);
    setPage(1);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={sectionRef}
      id="featured-products"
      className="scroll-mt-24 bg-[#FCF9F4] px-5 py-16 md:px-10 lg:px-16 xl:px-20"
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-serif text-4xl font-semibold text-[#1B1B18] md:text-5xl">
              Nước hoa nổi bật
            </h2>

            <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#706D68]">
              Những sáng tạo mùi hương giàu cảm xúc, được tuyển chọn từ nguyên liệu quý và hoàn
              thiện bằng kỹ nghệ thủ công tinh tế.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => changeTab(tab.value)}
                className={`rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] shadow-[0_8px_25px_rgba(0,0,0,0.08)] transition ${
                  activeTab === tab.value
                    ? "bg-[#1B1B18] text-white"
                    : "bg-[#FFFDF9] text-[#1B1B18] hover:bg-[#F1ECE3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {loading &&
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[470px] animate-pulse bg-[#F3EEE7]" />
            ))}

          {!loading &&
            displayedProducts.map((product) => {
              const productId = product.id || product._id || "";

              return <ProductCard key={productId} item={product} />;
            })}
        </div>

        {!loading && displayedProducts.length === 0 && (
          <p className="mt-12 text-center text-sm text-[#706D68]">Chưa có sản phẩm để hiển thị.</p>
        )}

        <div className="mt-14 flex items-center justify-center gap-5 text-[9px] uppercase tracking-[0.15em] text-[#77736C]">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          >
            Trước
          </button>

          {visiblePages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changePage(item)}
              className={item === page ? "border-b border-[#817000] pb-1 text-[#817000]" : ""}
            >
              {String(item).padStart(2, "0")}
            </button>
          ))}

          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className="disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </section>
  );
}
