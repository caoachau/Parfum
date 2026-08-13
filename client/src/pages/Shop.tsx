import ShopSidebar from "../components/Shop/ShopSidebar";
import { useSeo } from "../hooks/useSeo";
import ProductGrid from "../components/Shop/ProductGrid";
import Pagination from "../components/Shop/Pagination";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import { api } from "../lib/api";
import { SlidersHorizontal, X } from "lucide-react";

type Product = {
  /* mô tả cấu trúc một sản phẩm mà frontend nhận từ server. ? = optional(rỗng)  */
  id: string; /*hỗ trợ cả id và _id vì dữ liệu MongoDB thường trả về _id, trong khi frontend có thể chuẩn hóa thành id. */
  _id?: string;
  name: string;
  description?: string;
  price?: number | null;
  images?: string[];
  image?: string | null;
  priceText?: string;
  variantId?: string | null;
  volume?: string;
  stock?: number;
  fragranceFamily?: string;
  notes?: {
    top?: string[];
    middle?: string[];
    base?: string[];
  };
  concentration?: string;
  gender?: string;
  season?: string[];
  sizes?: string[];
  brand?: string;
  category?: string;
  ratingAverage?: number;
  ratingCount?: number;
};

type ProductListResponse = {
  /*Kiểu dữ liệu phản hồi danh sách sản phẩm */
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ProductFilters = {
  /*Kiểu dữ liệu cho các bộ lọc sản phẩm */
  brands: string[];
  fragranceFamilies: string[];
  notes?: string[];
  concentrations: string[];
  genders: string[];
  seasons: string[];
  categories: string[];
  sizes: string[];
  maxPrice: number;
  minPrice?: number;
  brandCounts?: Record<string, number>;
  noteCounts?: Record<string, number>;
  priceBuckets?: number[];
  total: number;
};

const getSizeNumber = (size: string) => {
  /*Hàm lấy số dung tích */
  const match = size.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const normBrand = (value: string) =>
  /*Hàm chuẩn hóa tên thương hiệu */
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const normFilter = (value: string) => value.trim().toLowerCase(); /* Hàm chuẩn hóa giá trị filter */

// Desktop: 4 cot x 4 hang = 16 san pham / trang.
const PAGE_SIZE = 20; /* Số lượng sản phẩm hiển thị trên mỗi trang */

export default function Shop() {
  /* Component for the shop page */
  useSeo({
    /* Set SEO meta tags for the shop page */
    title: "Cửa hàng nước hoa",
    description:
      "Mua nước hoa cao cấp chính hãng: lọc theo thương hiệu, nhóm hương, giới tính và dung tích. Giao hàng toàn quốc.",
  });
  const [searchParams, setSearchParams] =
    useSearchParams(); /* Hook to manage URL search parameters */
  const initialList = (key: string) =>
    /* Hàm lấy danh sách giá trị từ search params */
    (searchParams.get(key) || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  const initialPrice = (key: string, fallback: number) => {
    /* Hàm lấy giá trị price từ search params */
    const rawValue = searchParams.get(key);
    if (rawValue == null || rawValue === "") return fallback;
    const value = Number(rawValue);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedScents, setSelectedScents] = useState<string[]>(() => initialList("scent"));
  const [selectedNotes, setSelectedNotes] = useState<string[]>(() => initialList("note"));
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => initialList("brand"));
  const [selectedGenders, setSelectedGenders] = useState<string[]>(() => initialList("gender"));
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => initialList("size"));
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(() => initialList("season"));
  const [selectedSeasons] = useState<string[]>([]);
  const [selectedConcentrations, setSelectedConcentrations] = useState<string[]>(() =>
    initialList("concentration"),
  );
  const [priceMin, setPriceMin] = useState(() => initialPrice("minPrice", 0));
  const [priceMax, setPriceMax] = useState(() => initialPrice("maxPrice", Number.MAX_SAFE_INTEGER));
  const [sort, setSort] = useState(() => searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const excludedNotes = searchParams.get("excludeNote") || "";
  const preferenceMatch = searchParams.get("match") === "any" ? "any" : undefined;

  const toggleSize = (value: string) => {
    setSelectedSizes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleOccasion = (value: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleConcentration = (value: string) => {
    setSelectedConcentrations((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleScent = (value: string) => {
    setSelectedScents((prev) =>
      prev.some((item) => normFilter(item) === normFilter(value))
        ? prev.filter((item) => normFilter(item) !== normFilter(value))
        : [...prev, value],
    );
  };
  const toggleNote = (value: string) => {
    setSelectedNotes((prev) =>
      prev.some((item) => normFilter(item) === normFilter(value))
        ? prev.filter((item) => normFilter(item) !== normFilter(value))
        : [...prev, value],
    );
  };

  // Tranh goi API sau moi phim bam; van giu input phan hoi ngay lap tuc.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Facet loc lay tu TOAN BO san pham trong MongoDB (khong bi gioi han 100)
  useEffect(() => {
    /*gọi api Load filter options when the component mounts */
    let active = true;
    async function loadFilterOptions() {
      try {
        const { data } = await api.get<ProductFilters>("/products/filters");
        if (active) setFilters(data);
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    }
    loadFilterOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    /*gọi api Load products  */
    let active = true;
    async function loadProducts() {
      try {
        setLoading(true);
        const { data } = await api.get<ProductListResponse>("/products", {
          params: {
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
            brand: selectedBrands.join(",") || undefined,
            gender: selectedGenders.join(",") || undefined,
            scent: selectedScents.join(",") || undefined,
            note: selectedNotes.join(",") || undefined,
            excludeNote: excludedNotes || undefined,
            match: preferenceMatch,
            size: selectedSizes.join(",") || undefined,
            season: [...selectedOccasions, ...selectedSeasons].join(",") || undefined,
            concentration: selectedConcentrations.join(",") || undefined,
            minPrice: priceMin > (filters?.minPrice ?? 0) ? priceMin : undefined,
            maxPrice:
              priceMax !== Number.MAX_SAFE_INTEGER &&
              priceMax < (filters?.maxPrice ?? Number.MAX_SAFE_INTEGER)
                ? priceMax
                : undefined,
            sort,
          },
        });
        if (active) {
          setProducts(data.data);
          setProductTotal(data.total);
          setTotalPages(Math.max(1, data.totalPages));
          if (page > data.totalPages) setPage(Math.max(1, data.totalPages));
        }
      } catch (error) {
        console.error("Failed to load products", error);
        if (active) {
          setProducts([]);
          setProductTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    selectedBrands,
    selectedGenders,
    selectedScents,
    selectedNotes,
    selectedSizes,
    selectedOccasions,
    selectedSeasons,
    selectedConcentrations,
    excludedNotes,
    preferenceMatch,
    priceMin,
    priceMax,
    filters?.minPrice,
    filters?.maxPrice,
    sort,
    page,
  ]);

  // Cac lua chon filter deu lay tu facet MongoDB de dong bo ten & so luong
  const brands = useMemo(() => filters?.brands ?? [], [filters]);
  // Scent Profile CHỈ hiển thị nhóm hương (fragrance families) của sản phẩm,
  // không trộn lẫn các nốt hương lẻ để tránh nhầm với bộ lọc nhóm hương.
  const scents = useMemo(
    () =>
      Array.from(new Set(filters?.fragranceFamilies ?? [])).sort((left, right) =>
        left.localeCompare(right),
      ),
    [filters],
  );
  const notes = useMemo(
    () =>
      Array.from(new Set(filters?.notes ?? [])).sort((left, right) =>
        left.localeCompare(right, "vi"),
      ),
    [filters],
  );
  const concentrations = useMemo(() => filters?.concentrations ?? [], [filters]);
  const sizes = useMemo(
    () =>
      [...(filters?.sizes ?? [])].sort(
        (left, right) => getSizeNumber(left) - getSizeNumber(right) || left.localeCompare(right),
      ),
    [filters],
  );
  const maxPrice = filters?.maxPrice ?? 0;
  const minPrice = filters?.minPrice ?? 0;
  const brandCounts = useMemo(() => filters?.brandCounts ?? {}, [filters]);
  const noteCounts = useMemo(() => filters?.noteCounts ?? {}, [filters]);
  const priceBuckets = useMemo(() => filters?.priceBuckets ?? [], [filters]);

  useEffect(() => {
    if (maxPrice > 0 && priceMax === Number.MAX_SAFE_INTEGER) {
      setPriceMin(minPrice);
      setPriceMax(maxPrice);
    }
  }, [maxPrice, minPrice, priceMax]);

  // Ghi toàn bộ bộ lọc vào URL để khi mở chi tiết rồi quay lại Shop
  // trình duyệt có thể khôi phục chính xác trạng thái khách đang xem.
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const setParam = (key: string, value: string) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    };

    setParam("search", search.trim());
    setParam("brand", selectedBrands.join(","));
    setParam("gender", selectedGenders.join(","));
    setParam("scent", selectedScents.join(","));
    setParam("note", selectedNotes.join(","));
    setParam("size", selectedSizes.join(","));
    setParam("season", Array.from(new Set([...selectedOccasions, ...selectedSeasons])).join(","));
    setParam("concentration", selectedConcentrations.join(","));
    setParam("sort", sort === "newest" ? "" : sort);

    if (filters) {
      setParam("minPrice", priceMin > (filters.minPrice ?? 0) ? String(priceMin) : "");
      setParam(
        "maxPrice",
        priceMax < (filters.maxPrice ?? Number.MAX_SAFE_INTEGER) ? String(priceMax) : "",
      );
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    search,
    selectedBrands,
    selectedGenders,
    selectedScents,
    selectedNotes,
    selectedSizes,
    selectedOccasions,
    selectedSeasons,
    selectedConcentrations,
    priceMin,
    priceMax,
    sort,
    filters,
    searchParams,
    setSearchParams,
  ]);

  // Reset ve trang 1 khi doi bo loc / tim kiem / sap xep
  useEffect(() => {
    setPage(1);
  }, [
    search,
    selectedBrands,
    selectedGenders,
    selectedScents,
    selectedNotes,
    selectedSizes,
    selectedOccasions,
    selectedSeasons,
    selectedConcentrations,
    priceMin,
    priceMax,
    sort,
  ]);

  const currentPage = Math.min(page, totalPages);

  const changePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBrand = (brand: string) => {
    /*Thương hiệu cho phép chọn nhiều */
    setSelectedBrands((prev) =>
      prev.some((item) => normBrand(item) === normBrand(brand))
        ? prev.filter((item) => normBrand(item) !== normBrand(brand))
        : [...prev, brand],
    );
  };
  const toggleGender = (gender: string) => {
    setSelectedGenders((prev) => (prev.includes(gender) ? [] : [gender]));
  };

  return (
    <>
      <main className="bg-[#FDF9F4]">
        {/* Hero */}
        <section className="mx-auto max-w-[1536px] px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-1">
            <div>
              <h1 className="font-heading text-[48px] leading-[1.2] text-[#1C1C19] sm:text-[64px] lg:text-[76px] xl:text-[88px]">
                Tuyển tập
                <br />
                <span className="inline-block ml-[120px] italic text-[#8A6D0E]">mùi hương</span>
              </h1>

              <p className="mt-6 max-w-[620px] text-[15px] leading-8 text-[#5F5E5E] sm:mt-8">
                Bộ sưu tập mùi hương được tuyển chọn, từ nhựa thơm phương Đông đầy khói đến những
                cánh hoa còn đẫm sương của buổi sáng Grasse.
              </p>
            </div>

            <div className="relative aspect-[16/10] min-h-[230px] overflow-hidden rounded-sm bg-[#0E0D0C] sm:h-[330px] sm:aspect-auto">
              <video
                src="https://res.cloudinary.com/dwj2trmn0/video/upload/v1784437561/t%E1%BA%A1o_cho_t_video_gi%E1%BB%9Bi_thi%E1%BB%87u_m_fk3taq.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-90"
              />

              <div className="absolute left-6 bottom-8 text-[#E8E3D8]">
                <p className="text-[11px] uppercase tracking-[0.18em] leading-tight">
                  Created in Vietname
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] leading-tight">
                  Since 2026
                </p>
              </div>

              <div className="absolute bottom-5 right-6 text-right">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#B9B4A8]">
                  L'ESSENCE NOIRE
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1536px] min-w-0 gap-10 px-5 pb-20 sm:px-8 lg:gap-12 lg:px-10 xl:gap-16">
          <div className="hidden lg:block">
            <ShopSidebar
              search={search}
              setSearch={setSearch}
              brands={brands}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              genders={["female", "male", "unisex"]}
              selectedGenders={selectedGenders}
              toggleGender={toggleGender}
              clearGender={() => setSelectedGenders([])}
              priceMin={priceMin}
              priceMax={priceMax}
              minPrice={minPrice}
              maxPrice={maxPrice}
              setPriceRange={(lo, hi) => {
                setPriceMin(lo);
                setPriceMax(hi);
              }}
              brandCounts={brandCounts}
              noteCounts={noteCounts}
              priceBuckets={priceBuckets}
              selectedScents={selectedScents}
              scents={scents}
              toggleScent={toggleScent}
              notes={notes}
              selectedNotes={selectedNotes}
              toggleNote={toggleNote}
              selectedSizes={selectedSizes}
              sizes={sizes}
              toggleSize={toggleSize}
              selectedOccasions={selectedOccasions}
              occasions={filters?.seasons ?? []}
              toggleOccasion={toggleOccasion}
              selectedConcentrations={selectedConcentrations}
              concentrations={concentrations}
              toggleConcentration={toggleConcentration}
            />
          </div>

          {filterOpen && (
            <div className="fixed inset-0 z-[70] lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-black/35"
                onClick={() => setFilterOpen(false)}
                aria-label="Đóng bộ lọc"
              />
              <div className="absolute inset-y-0 left-0 w-[min(340px,90vw)] overflow-y-auto bg-[#FDF9F4] px-5 pb-10 pt-5 shadow-2xl">
                <div className="mb-5 flex items-center justify-between border-b border-[#E4DACE] pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#554C42]">
                    Bộ lọc sản phẩm
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="flex h-10 w-10 items-center justify-center text-[#665D52]"
                    aria-label="Đóng bộ lọc"
                  >
                    <X size={19} />
                  </button>
                </div>
                <ShopSidebar
                  search={search}
                  setSearch={setSearch}
                  brands={brands}
                  selectedBrands={selectedBrands}
                  toggleBrand={toggleBrand}
                  genders={["female", "male", "unisex"]}
                  selectedGenders={selectedGenders}
                  toggleGender={toggleGender}
                  clearGender={() => setSelectedGenders([])}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  setPriceRange={(lo, hi) => {
                    setPriceMin(lo);
                    setPriceMax(hi);
                  }}
                  brandCounts={brandCounts}
                  noteCounts={noteCounts}
                  priceBuckets={priceBuckets}
                  selectedScents={selectedScents}
                  scents={scents}
                  toggleScent={toggleScent}
                  notes={notes}
                  selectedNotes={selectedNotes}
                  toggleNote={toggleNote}
                  selectedSizes={selectedSizes}
                  sizes={sizes}
                  toggleSize={toggleSize}
                  selectedOccasions={selectedOccasions}
                  occasions={filters?.seasons ?? []}
                  toggleOccasion={toggleOccasion}
                  selectedConcentrations={selectedConcentrations}
                  concentrations={concentrations}
                  toggleConcentration={toggleConcentration}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <section className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-[#e8deca] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-[10px] uppercase tracking-widest text-[#5F5E5E] sm:text-xs">
                  Hiển thị {products.length} trên {productTotal} sản phẩm
                </p>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="flex h-10 w-full shrink-0 items-center justify-center gap-2 border border-[#D8CDBE] px-3 text-[10px] uppercase tracking-[0.12em] text-[#655B50] sm:w-auto lg:hidden"
                >
                  <SlidersHorizontal size={15} /> Bộ lọc
                </button>
              </div>

              <label className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#8A8176]">
                  Sắp xếp
                </span>

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="min-w-0 flex-1 border border-[#e8deca] bg-[#FDF9F4] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[#4F4942] outline-none transition hover:border-[#735C00] focus:border-[#735C00] sm:w-[190px] sm:flex-none sm:px-4 sm:tracking-[0.16em]"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="best_selling">Bán chạy nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </label>
            </div>

            {/* Grid 4 x 3 */}
            <ProductGrid products={products} loading={loading} />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
            />
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
}
