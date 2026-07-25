import { Heart, ShoppingBag, Sun, Moon, Quote, ImagePlus, X, ChevronRight } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../store/cart.store";
import { toast } from "../store/toast.store";
import { useAuth } from "../store/auth.store";
import { useWishlist } from "../store/wishlist.store";
import { useSeo } from "../hooks/useSeo";
import { optimizeCloudinaryImage } from "../lib/image";
import { Skeleton } from "../components/Skeleton";
import Footer from "../components/Footer";

const PLACEHOLDER = "https://placehold.co/900x1100?text=Chua+co+anh";
const BUY_NOW_KEY = "buy_now_checkout_item";

type ProductVariant = {
  id: string;
  sku?: string;
  size: string;
  volume: string;
  price: number;
  basePrice?: number;
  discountPercent?: number;
  promotionType?: string | null;
  promotionName?: string;
  priceText: string;
  stock: number;
  images?: string[];
  isActive?: boolean;
};

type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  fragranceFamily?: string;
  concentration?: string;
  gender?: string;
  season?: string[];
  isActive?: boolean;
  gallery: string[];
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  variants: ProductVariant[];
  stock: number;
  soldCount?: number;
};

type ProductListItem = {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  category?: string;
  image?: string | null;
  images?: string[];
  price?: number | null;
  priceText?: string;
};

type ProductListResponse = {
  data: ProductListItem[];
};

type ReviewItem = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt?: string;
};

const vnd = (value: number) => `${(value || 0).toLocaleString("vi-VN")}đ`;

export default function ProductDetail() {
  const { idOrSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { fromShop?: unknown } | null;
  const shopReturnPath =
    typeof locationState?.fromShop === "string" &&
    (locationState.fromShop === "/shop" || locationState.fromShop.startsWith("/shop?"))
      ? locationState.fromShop
      : "/shop";
  const addItem = useCart((state) => state.addItem);
  const user = useAuth((state) => state.user);
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const toggleWishlist = useWishlist((state) => state.toggle);
  const ensureWishlist = useWishlist((state) => state.ensureLoaded);
  const wishlisted = useWishlist((state) => (product ? state.ids.includes(product.id) : false));
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    guestName: "",
    guestEmail: "",
    rating: 5,
    comment: "",
  });
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Trạng thái thanh "Thêm vào giỏ" dính khi cuộn.
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureWishlist();
  }, [ensureWishlist]);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        const { data } = await api.get<ProductDetailData>(`/products/${idOrSlug}`);
        if (!active) return;

        const firstVariant =
          data.variants.find((variant) => variant.isActive !== false && variant.stock > 0) ||
          data.variants[0];

        setProduct(data);
        setSelectedVariantId(firstVariant?.id || "");
        setSelectedImage(data.gallery?.[0] || firstVariant?.images?.[0] || PLACEHOLDER);
        setError("");
      } catch (e: any) {
        if (!active) return;
        setError(e?.response?.data?.message || "Không tải được chi tiết sản phẩm");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (idOrSlug) loadProduct();

    return () => {
      active = false;
    };
  }, [idOrSlug]);

  useEffect(() => {
    let active = true;

    api
      .get<ProductListResponse>("/products", {
        params: { limit: 4, sort: "newest" },
      })
      .then(({ data }) => {
        if (!active) return;
        setRelatedProducts(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {
        if (active) setRelatedProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!product?.id) return;

    let active = true;

    api
      .get<ReviewItem[]>(`/reviews/product/${product.id}`)
      .then(({ data }) => {
        if (active) setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      });

    return () => {
      active = false;
    };
  }, [product?.id]);

  const selectedVariant = useMemo(
    () =>
      product?.variants.find((variant) => variant.id === selectedVariantId) || product?.variants[0],
    [product, selectedVariantId],
  );

  const gallery = useMemo(() => {
    const variantImages = selectedVariant?.images || [];
    return Array.from(new Set([...(product?.gallery || []), ...variantImages])).filter(Boolean);
  }, [product, selectedVariant]);

  const currentImage = selectedImage || gallery[0] || PLACEHOLDER;
  const insetImage = gallery.find((image) => image !== currentImage) || currentImage;
  const availableStock = selectedVariant?.stock ?? 0;
  const soldCount = product?.soldCount ?? 0;
  const canAdd =
    Boolean(selectedVariant?.id) &&
    product?.isActive !== false &&
    selectedVariant?.isActive !== false &&
    availableStock > 0;

  const notes = [
    {
      icon: <Sun size={18} strokeWidth={1.4} />,
      title: "HƯƠNG ĐẦU",
      description: "Ấn tượng đầu tiên — tươi mát, bay bổng và đầy cuốn hút.",
      items: product?.notes.top || [],
    },
    {
      icon: <Heart size={17} strokeWidth={1.4} />,
      title: "HƯƠNG GIỮA",
      description: "Trái tim của mùi hương — nồng nàn, tròn đầy và rạng rỡ.",
      items: product?.notes.middle || [],
    },
    {
      icon: <Moon size={17} strokeWidth={1.4} />,
      title: "HƯƠNG CUỐI",
      description: "Dư hương lưu lại — sâu lắng, ấm áp và quyến rũ.",
      items: product?.notes.base || [],
    },
  ];
  const scentFacts = [
    { label: "Nhóm hương", value: product?.fragranceFamily },
    { label: "Nồng độ", value: product?.concentration },
    { label: "Giới tính", value: product?.gender },
    { label: "Mùa / dịp", value: product?.season?.join(", ") },
  ].filter((item) => item.value && String(item.value).trim());

  async function handleAddToCart() {
    if (!product || !selectedVariant) return;

    if (!canAdd) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    try {
      await addItem(
        {
          variant: selectedVariant.id,
          product: product.id,
          name: product.name,
          slug: product.slug,
          image: currentImage === PLACEHOLDER ? null : currentImage,
          volume: selectedVariant.volume || selectedVariant.size,
          price: selectedVariant.price,
          basePrice: selectedVariant.basePrice,
          discountPercent: selectedVariant.discountPercent,
          promotionType: selectedVariant.promotionType,
          promotionName: selectedVariant.promotionName,
          stock: selectedVariant.stock,
          quantity: 1,
        },
        1,
      );
      toast.success("Đã thêm vào giỏ");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Không thể thêm vào giỏ");
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    if (!user && (!reviewForm.guestName.trim() || !reviewForm.guestEmail.trim())) {
      toast.error("Vui lòng nhập tên và email để gửi đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);
      let imageUrl = "";

      if (reviewImage) {
        const formData = new FormData();
        formData.append("image", reviewImage);
        const { data } = await api.post<{ url: string }>("/upload/review", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = data.url;
      }

      await api.post("/reviews", {
        product: product.id,
        guestName: user ? undefined : reviewForm.guestName.trim(),
        guestEmail: user ? undefined : reviewForm.guestEmail.trim(),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        images: imageUrl ? [imageUrl] : [],
      });
      setReviewForm({ guestName: "", guestEmail: "", rating: 5, comment: "" });
      setReviewImage(null);
      setReviewImagePreview("");
      setReviewMessage("Đã gửi đánh giá. Review sẽ hiển thị sau khi admin duyệt.");
      setShowReviewForm(false);
      toast.success("Đã gửi đánh giá");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleReviewImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      event.target.value = "";
      return;
    }

    setReviewImage(file);
    setReviewImagePreview(URL.createObjectURL(file));
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const featuredReview = reviews[0];
  const sideReviews = reviews.slice(1, 3);

  // Doan mo ta mang tinh "storytelling" - cam hung sang tao ra mui huong.
  // Uu tien mo ta that; neu qua ngan thi dung not huong de ke cau chuyen.
  const storytelling = useMemo(() => {
    if (!product) return "";
    if (product.description && product.description.trim().length > 200) {
      return product.description.trim();
    }
    const top = product.notes?.top?.[0];
    const heart = product.notes?.middle?.[0];
    const base = product.notes?.base?.[0];
    const family = (product.fragranceFamily || "").toLowerCase();
    const house = product.brand ? `nhà ${product.brand}` : "người nghệ nhân";
    const opening = top
      ? `Mở đầu bằng ${top.toLowerCase()} tươi sáng như tia nắng đầu ngày`
      : "Mở đầu bằng những nốt hương tươi sáng như tia nắng đầu ngày";
    const middle = heart
      ? `, ${product.name} dần hé lộ trái tim ${heart.toLowerCase()} nồng nàn`
      : `, ${product.name} dần hé lộ một trái tim nồng nàn`;
    const end = base
      ? ` rồi lắng lại trên tầng hương ${base.toLowerCase()} ấm áp, lưu dấu suốt hành trình.`
      : ` rồi lắng lại trên tầng hương trầm ấm, lưu dấu suốt hành trình.`;
    const closing = ` Được ${house} chăm chút từng nốt hương${family ? ` theo phong cách ${family}` : ""}, đây là bản giao hưởng kể câu chuyện của riêng người đeo.`;
    return `${opening}${middle}${end}${closing}`;
  }, [product]);

  const metaDescription = useMemo(() => {
    if (!product) return "";
    const brand = product.brand ? `${product.brand} — ` : "";
    const base = product.description?.trim() || storytelling;
    return `${brand}${product.name}. ${base}`.replace(/\s+/g, " ").trim().slice(0, 160);
  }, [product, storytelling]);

  // SEO: title + meta description + Open Graph theo tung san pham.
  useSeo({
    title: product?.name,
    description: metaDescription || undefined,
    image: gallery[0] ? optimizeCloudinaryImage(gallery[0], 1200) : undefined,
    type: "product",
  });

  // SEO nang cao: structured data schema.org/Product (JSON-LD) cho Google.
  useEffect(() => {
    if (!product) return;

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: gallery.length ? gallery : undefined,
      description: metaDescription,
      sku: selectedVariant?.sku || selectedVariant?.id,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      category: product.category || undefined,
      offers: selectedVariant
        ? {
            "@type": "Offer",
            priceCurrency: "VND",
            price: selectedVariant.price,
            availability:
              availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: window.location.href,
          }
        : undefined,
      aggregateRating:
        reviews.length > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: averageRating.toFixed(1),
              reviewCount: reviews.length,
            }
          : undefined,
    };

    let script = document.getElementById("product-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "product-jsonld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.getElementById("product-jsonld")?.remove();
    };
  }, [product, gallery, selectedVariant, availableStock, reviews, averageRating, metaDescription]);

  // Thanh "Thêm vào giỏ" dính: hiện khi nút chính đã cuộn qua khỏi màn hình, nhất là mobile.
  useEffect(() => {
    const el = addToCartRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  // Skeleton loading trong khi fetch du lieu tu API -> tranh cam giac trang & layout shift.
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fbf8f2] text-[#292824]">
        <div className="mx-auto max-w-[1240px] px-6 pt-8 md:px-10 lg:px-14">
          <Skeleton className="h-3 w-64" />
        </div>
        <section className="bg-[#fbf8f2]">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-6 py-12 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-14 lg:py-16">
            <Skeleton className="min-h-[570px] w-full" />
            <div className="flex flex-col justify-center py-6">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-6 h-12 w-3/4" />
              <Skeleton className="mt-4 h-4 w-1/3" />
              <Skeleton className="mt-8 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
              <Skeleton className="mt-8 h-8 w-1/3" />
              <div className="mt-6 flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
              <Skeleton className="mt-6 h-[50px] w-full max-w-[410px]" />
              <Skeleton className="mt-3 h-[48px] w-full max-w-[410px]" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fbf8f2] px-6 py-24 text-[#615e57]">
        <div className="mx-auto max-w-[1240px]">
          <Link to={shopReturnPath} className="text-[#8b7100] underline">
            Quay lại Shop
          </Link>
          <p className="mt-6 text-red-600">{error || "Không tìm thấy sản phẩm"}</p>
        </div>
      </div>
    );
  }

  async function handleBuyNow() {
    if (!product || !selectedVariant) return;

    if (!canAdd) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }

    sessionStorage.setItem(
      BUY_NOW_KEY,
      JSON.stringify({
        variant: selectedVariant.id,
        product: product.id,
        name: product.name,
        slug: product.slug,
        image: currentImage === PLACEHOLDER ? null : currentImage,
        volume: selectedVariant.volume || selectedVariant.size,
        price: selectedVariant.price,
        basePrice: selectedVariant.basePrice,
        discountPercent: selectedVariant.discountPercent,
        promotionType: selectedVariant.promotionType,
        promotionName: selectedVariant.promotionName,
        stock: selectedVariant.stock,
        quantity: 1,
      }),
    );
    navigate("/checkout?mode=buy-now");
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#fbf8f2] text-[#292824]">
      <main>
        {/* Breadcrumb: Trang chủ > Shop > Thương hiệu > Giới tính > Sản phẩm */}
        <nav aria-label="Đường dẫn" className="mx-auto max-w-[1240px] px-6 pt-8 md:px-10 lg:px-14">
          <ol className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[1.5px] text-[#aaa69e]">
            <li>
              <Link to="/" className="transition hover:text-[#8b7100]">
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              <ChevronRight size={12} />
            </li>
            <li>
              <Link to={shopReturnPath} className="transition hover:text-[#8b7100]">
                Sản phẩm
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              <ChevronRight size={12} />
            </li>
            {product.brand && (
              <>
                <li>
                  <Link
                    to={`/shop?brand=${encodeURIComponent(product.brand)}`}
                    className="transition hover:text-[#8b7100]"
                  >
                    {product.brand}
                  </Link>
                </li>
                <li aria-hidden="true" className="flex items-center">
                  <ChevronRight size={12} />
                </li>
              </>
            )}
            {product.gender && (
              <>
                <li>
                  <Link
                    to={`/shop?${new URLSearchParams({
                      ...(product.brand ? { brand: product.brand } : {}),
                      gender: product.gender,
                    }).toString()}`}
                    className="transition hover:text-[#8b7100]"
                  >
                    {product.gender}
                  </Link>
                </li>
                <li aria-hidden="true" className="flex items-center">
                  <ChevronRight size={12} />
                </li>
              </>
            )}
            <li aria-current="page" className="max-w-[220px] truncate text-[#615e57]">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Hero */}
        <section className="bg-[#fbf8f2]">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-6 py-12 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-14 lg:py-16">
            {/* Hai anh san pham tinh, khong zoom khi hover. */}
            <div className="relative isolate min-h-[570px] overflow-hidden bg-[#f5f1eb]">
              <img
                loading="lazy"
                src={optimizeCloudinaryImage(currentImage, 900)}
                alt={product.name}
                width={900}
                height={1100}
                decoding="async"
                className="h-full min-h-[570px] w-full object-contain p-8 sm:p-10 lg:p-12"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER;
                }}
              />

              {gallery.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(insetImage)}
                  aria-label={`Xem ảnh phụ của ${product.name}`}
                  className="absolute bottom-4 right-4 z-20 hidden h-[215px] w-[210px] overflow-hidden border-4 border-white bg-white shadow-[0_12px_32px_rgba(50,42,32,0.12)] md:block"
                >
                  <img
                    src={optimizeCloudinaryImage(insetImage, 400)}
                    alt={`Ảnh chi tiết ${product.name}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                </button>
              )}
            </div>

            {/* Information */}
            <div className="flex flex-col justify-center py-6 lg:pl-2">
              <h1 className="font-serif text-[44px] leading-[1.05] tracking-[0] md:text-[58px]">
                {product.name}
              </h1>

              {/* Thuong hieu + Trang thai ton kho (con hang / da ban) */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[#615e57]">
                {product.brand && (
                  <span className="flex items-center gap-1.5">
                    <span className="uppercase tracking-[1.5px] text-[#aaa69e]">Thương hiệu:</span>
                    <span className="font-semibold text-[#292824]">{product.brand}</span>
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      availableStock > 0 ? "bg-green-600" : "bg-red-500"
                    }`}
                  />
                  {availableStock > 0 ? (
                    <span className="font-semibold text-green-700">
                      Còn hàng · {availableStock.toLocaleString("vi-VN")} sản phẩm
                    </span>
                  ) : (
                    <span className="font-semibold text-red-600">Tạm hết hàng</span>
                  )}
                </span>

                {soldCount > 0 && (
                  <span className="text-[#8e8980]">Đã bán {soldCount.toLocaleString("vi-VN")}</span>
                )}
              </div>

              <p className="mt-7 max-w-[475px] text-[13px] leading-[1.85] text-[#615e57]">
                {product.description ||
                  "Mùi hương tinh tế, sang trọng và phù hợp cho nhiều dịp sử dụng."}
              </p>

              {scentFacts.length > 0 && (
                <div className="mt-6 grid max-w-[475px] gap-2 sm:grid-cols-2">
                  {scentFacts.map((item) => (
                    <div
                      key={item.label}
                      className="border border-[#e7dfd1] bg-[#f7f2ea] px-4 py-3"
                    >
                      <p className="text-[8px] uppercase tracking-[1.6px] text-[#9b958c]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[12px] font-semibold text-[#292824]">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <p className="font-serif text-[23px] font-semibold text-[#927600]">
                  {selectedVariant
                    ? selectedVariant.priceText || vnd(selectedVariant.price)
                    : "Liên hệ"}
                </p>
                {!!selectedVariant?.discountPercent && selectedVariant.basePrice != null && (
                  <>
                    <span className="text-sm text-[#8D887F] line-through">
                      {vnd(selectedVariant.basePrice)}
                    </span>
                    <span className="bg-[#8B1E1E] px-2 py-1 text-[10px] font-semibold text-white">
                      -{selectedVariant.discountPercent}%
                    </span>
                  </>
                )}
              </div>
              {product.variants.length > 0 && (
                <div className="mt-6 max-w-[410px]">
                  <p className="mb-3 text-[8px] font-semibold uppercase tracking-[1.5px] text-[#8D887F]">
                    Dung tích
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const active = variant.id === selectedVariant?.id;
                      const disabled = variant.stock <= 0 || variant.isActive === false;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            if (variant.images?.[0]) setSelectedImage(variant.images[0]);
                          }}
                          className={`min-w-16 border px-4 py-2 text-[9px] font-semibold uppercase tracking-[1.4px] transition ${
                            active
                              ? "border-[#8b7100] bg-[#8b7100] text-white"
                              : "border-[#e7dfd1] text-[#615e57] hover:border-[#8b7100]"
                          } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                        >
                          {variant.size || variant.volume || "Chưa rõ"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div ref={addToCartRef} className="w-full max-w-[410px]">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAdd}
                  className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 bg-[#8b7100] text-[10px] font-semibold uppercase tracking-[2px] text-white transition hover:bg-[#715c00] disabled:cursor-not-allowed disabled:bg-[#d6d3d1]"
                >
                  <ShoppingBag size={14} />
                  {canAdd ? "Thêm vào giỏ" : "Hết hàng"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => product && toggleWishlist(product.id)}
                className={`mt-3 flex h-[48px] w-full max-w-[410px] items-center justify-center gap-2 border text-[9px] font-semibold uppercase tracking-[1.8px] transition ${
                  wishlisted
                    ? "border-[#8b7100] bg-[#8b7100]/5 text-[#8b7100]"
                    : "border-[#e7dfd1] bg-transparent text-[#615e57] hover:border-[#8b7100] hover:text-[#8b7100]"
                }`}
              >
                <Heart size={14} strokeWidth={1.6} fill={wishlisted ? "currentColor" : "none"} />
                {wishlisted ? "Đã lưu vào danh sách yêu thích" : "Thêm vào yêu thích"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAdd}
                className="mt-3 h-[48px] w-full max-w-[410px] border border-[#8b7100] bg-transparent text-[9px] font-semibold uppercase tracking-[1.8px] text-[#8b7100] transition hover:bg-[#8b7100] hover:text-white disabled:cursor-not-allowed disabled:border-[#d6d3d1] disabled:text-[#aaa59c]"
              >
                Mua ngay
              </button>
            </div>
          </div>
        </section>

        {/* Olfactory Pyramid */}
        <section className="mt-10 bg-[#efebe5] py-20">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10 lg:px-14">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-serif text-[31px]">Tháp hương</h2>

                <p className="mt-4 max-w-[480px] text-[11px] leading-[1.65] text-[#77736b]">
                  Cấu trúc mùi hương biến chuyển nhiều giờ, từ tầng mở đầu trong trẻo đến phần nền
                  sâu, ấm và lưu luyến.
                </p>
              </div>

              <p className="text-[8px] font-semibold uppercase tracking-[3px] text-[#8b7100]">
                Cấu trúc nốt hương
              </p>
            </div>

            <div className="mt-12 grid bg-[#fbf9f5] md:grid-cols-3">
              {notes.map((note, index) => (
                <article
                  key={note.title}
                  className={`px-9 py-10 md:px-10 ${
                    index !== notes.length - 1
                      ? "border-b border-[#ebe5da] md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center bg-[#efebe3] text-[#9a830e]">
                    {note.icon}
                  </div>

                  <h3 className="mt-7 font-serif text-[16px] tracking-[1px]">{note.title}</h3>

                  <p className="mt-4 max-w-[225px] text-[10px] leading-[1.6] text-[#77736d]">
                    {note.description}
                  </p>

                  <div className="mt-6 space-y-2">
                    {note.items.length ? (
                      note.items.map((item) => (
                        <Link
                          key={item}
                          to={`/shop?${new URLSearchParams({ note: item }).toString()}`}
                          className="block w-max max-w-full text-[10px] text-[#3c3a35] underline decoration-[#b8aa89] underline-offset-4 transition hover:text-[#8b7100]"
                          title={`Xem sản phẩm có note ${item}`}
                        >
                          {item}
                        </Link>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#3c3a35]">Đang cập nhật</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Related products */}
        <section className="bg-[#fbf8f2] py-24">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10 lg:px-14">
            <h2 className="text-center font-serif text-[25px] italic">Có thể bạn sẽ thích</h2>

            <div className="mt-14 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/products/${item.slug || item.id}`} className="group">
                  <div className="aspect-square overflow-hidden bg-[#f2eee7]">
                    <img
                      src={optimizeCloudinaryImage(
                        item.images?.[0] || item.image || PLACEHOLDER,
                        500,
                      )}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </div>

                  <p className="mt-5 text-[8px] uppercase text-[#969189]">
                    {item.category || item.brand || "Nước hoa"}
                  </p>

                  <h3 className="mt-2 font-serif text-[14px]">{item.name}</h3>

                  <p className="mt-2 text-[11px] text-[#8b7100]">
                    {item.priceText || (item.price ? vnd(item.price) : "Liên hệ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="bg-[#e9e5df] py-28">
          <div className="mx-auto max-w-[1240px] px-6 md:px-10 lg:px-14">
            <div className="text-center">
              <h2 className="font-serif text-[34px] md:text-[42px]">Cảm nhận từ khách hàng</h2>

              <div className="mt-7 flex items-center justify-center gap-3">
                <span className="text-[17px] tracking-[3px] text-[#8b7100]">
                  {reviews.length ? "★★★★★".slice(0, Math.round(averageRating)) : "☆☆☆☆☆"}
                </span>
                <span className="text-[9px] font-semibold tracking-[0.5px] text-[#45433e]">
                  {averageRating ? averageRating.toFixed(1) : "0.0"} / 5.0
                </span>
              </div>
            </div>

            {reviewMessage && (
              <p className="mx-auto mt-8 max-w-xl bg-[#f4f0e8] px-4 py-3 text-center text-[11px] text-green-700">
                {reviewMessage}
              </p>
            )}

            <div className="mt-20 grid gap-12 md:grid-cols-[1fr_0.9fr] md:gap-16">
              <article className="relative md:pl-10">
                <Quote
                  size={42}
                  strokeWidth={1}
                  className="absolute -left-1 -top-8 text-[#ddd6c8]"
                />

                {featuredReview ? (
                  <>
                    <p className="max-w-[650px] font-serif text-[26px] leading-[1.5] md:text-[30px]">
                      {featuredReview.comment}
                    </p>

                    {featuredReview.images?.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-4">
                        {featuredReview.images.map((image) => (
                          <a
                            key={image}
                            href={image}
                            target="_blank"
                            rel="noreferrer"
                            className="block h-28 w-28 overflow-hidden border border-[#d8d2c8] bg-[#f4f0e8] md:h-36 md:w-36"
                          >
                            <img
                              src={image}
                              alt="Ảnh đánh giá"
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    <p className="mt-10 text-[9px] font-semibold uppercase tracking-[2.4px]">
                      — {featuredReview.userName}, Khách hàng đã xác thực
                    </p>
                  </>
                ) : (
                  <>
                    <p className="max-w-[650px] font-serif text-[26px] leading-[1.5] md:text-[30px]">
                      Chưa có đánh giá nào được duyệt cho sản phẩm này.
                    </p>

                    <p className="mt-10 text-[9px] font-semibold uppercase tracking-[2.4px]">
                      — Hãy là người đầu tiên chia sẻ
                    </p>
                  </>
                )}
              </article>

              <div className="space-y-10 border-[#d8d2c8] md:border-l md:pl-12">
                {sideReviews.length > 0 ? (
                  sideReviews.map((review) => (
                    <article
                      key={review.id}
                      className="border-b border-[#d8d2c8] pb-10 last:border-b-0"
                    >
                      <h3 className="font-serif text-[22px]">
                        {review.comment.split(".")[0] || "Một cảm nhận đẹp"}.
                      </h3>

                      <p className="mt-7 max-w-[520px] text-[11px] leading-[1.8] text-[#625e57]">
                        {review.comment}
                      </p>

                      {review.images?.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          {review.images.map((image) => (
                            <a
                              key={image}
                              href={image}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-20 w-20 overflow-hidden border border-[#d8d2c8] bg-[#f4f0e8]"
                            >
                              <img
                                src={image}
                                alt="Ảnh đánh giá"
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <p className="mt-7 text-[8px] font-semibold uppercase tracking-[1.8px]">
                        — {review.userName}
                      </p>
                    </article>
                  ))
                ) : (
                  <article className="border-b border-[#d8d2c8] pb-10">
                    <h3 className="font-serif text-[22px]">Chia sẻ cảm nhận của bạn.</h3>

                    <p className="mt-7 max-w-[520px] text-[11px] leading-[1.8] text-[#625e57]">
                      Những đánh giá sau khi admin duyệt sẽ xuất hiện tại đây.
                    </p>
                  </article>
                )}
              </div>
            </div>

            <div className="mt-24 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <button className="border-b border-[#8b7100] pb-2 text-[9px] font-semibold uppercase tracking-[2.4px]">
                Xem tất cả {reviews.length} đánh giá
              </button>

              <button
                type="button"
                onClick={() => setShowReviewForm((value) => !value)}
                className="bg-[#8b7100] px-7 py-4 text-[9px] font-semibold uppercase tracking-[2.2px] text-white transition hover:bg-[#715c00]"
              >
                {showReviewForm ? "Đóng form" : "Viết đánh giá"}
              </button>
            </div>

            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="mx-auto mt-12 max-w-2xl border border-[#d9d4cb] bg-[#fbf8f2] p-8"
              >
                <h3 className="font-serif text-[26px]">Viết đánh giá</h3>
                <p className="mt-3 text-[11px] leading-[1.7] text-[#6e6a63]">
                  {user
                    ? `Đang gửi bằng tài khoản ${user.name || user.email || "của bạn"}. Đánh giá sẽ được hiển thị sau khi admin duyệt.`
                    : "Bạn chưa đăng nhập, vui lòng nhập tên/email. Đánh giá sẽ được hiển thị sau khi admin duyệt."}
                </p>

                {!user && (
                  <div className="mt-7 grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[8px] uppercase tracking-[1.5px] text-[#8b7100]">
                        Tên
                      </span>
                      <input
                        value={reviewForm.guestName}
                        onChange={(e) =>
                          setReviewForm((prev) => ({ ...prev, guestName: e.target.value }))
                        }
                        className="mt-2 h-11 w-full border border-[#d9d4cb] bg-transparent px-3 text-sm outline-none focus:border-[#8b7100]"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-[8px] uppercase tracking-[1.5px] text-[#8b7100]">
                        Email
                      </span>
                      <input
                        type="email"
                        value={reviewForm.guestEmail}
                        onChange={(e) =>
                          setReviewForm((prev) => ({ ...prev, guestEmail: e.target.value }))
                        }
                        className="mt-2 h-11 w-full border border-[#d9d4cb] bg-transparent px-3 text-sm outline-none focus:border-[#8b7100]"
                        required
                      />
                    </label>
                  </div>
                )}

                <label className="mt-5 block">
                  <span className="text-[8px] uppercase tracking-[1.5px] text-[#8b7100]">
                    Điểm đánh giá
                  </span>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                    }
                    className="mt-2 h-11 w-full border border-[#d9d4cb] bg-transparent px-3 text-sm outline-none focus:border-[#8b7100]"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} sao
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-[8px] uppercase tracking-[1.5px] text-[#8b7100]">
                    Bình luận
                  </span>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    className="mt-2 min-h-32 w-full border border-[#d9d4cb] bg-transparent px-3 py-3 text-sm outline-none focus:border-[#8b7100]"
                    required
                  />
                </label>

                <div className="mt-5">
                  <p className="text-[8px] uppercase tracking-[1.5px] text-[#8b7100]">
                    Ảnh đánh giá
                  </p>

                  {reviewImagePreview ? (
                    <div className="relative mt-2 overflow-hidden border border-[#d9d4cb] bg-[#f4f0e8]">
                      <img
                        loading="lazy"
                        src={reviewImagePreview}
                        alt="Xem trước ảnh đánh giá"
                        className="h-52 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setReviewImage(null);
                          setReviewImagePreview("");
                        }}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white text-[#4d4740] shadow-sm transition hover:bg-[#1c1c19] hover:text-white"
                        aria-label="Xóa ảnh đã chọn"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-[#cfc6bb] bg-[#f4f0e8] px-6 py-8 text-center transition hover:border-[#8b7100] hover:bg-[#f0eadf]">
                      <ImagePlus size={24} strokeWidth={1.4} className="text-[#8b7100]" />

                      <span className="mt-3 text-[10px] font-semibold uppercase tracking-[1.8px] text-[#4f4942]">
                        Chọn ảnh từ thư viện
                      </span>

                      <span className="mt-2 text-[11px] text-[#7a736b]">
                        JPG, PNG hoặc WEBP, tối đa 5MB
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewImageChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <button
                  disabled={submittingReview}
                  className="mt-6 h-12 w-full bg-[#8b7100] text-[9px] font-semibold uppercase tracking-[2px] text-white transition hover:bg-[#715c00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Thanh "Thêm vào giỏ" dính khi cuộn xuống, đặc biệt trên mobile */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#e7dfd1] bg-[#fbf8f2]/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-3">
          <img
            loading="lazy"
            src={optimizeCloudinaryImage(currentImage, 120)}
            alt={product.name}
            className="hidden h-12 w-12 shrink-0 bg-[#f5f1eb] object-contain sm:block"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER;
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[14px] text-[#292824]">{product.name}</p>
            <p className="text-[13px] font-semibold text-[#927600]">
              {selectedVariant
                ? selectedVariant.priceText || vnd(selectedVariant.price)
                : "Liên hệ"}
              {selectedVariant?.volume ? ` · ${selectedVariant.volume}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => product && toggleWishlist(product.id)}
              aria-label={wishlisted ? "Đã lưu vào danh sách yêu thích" : "Thêm vào yêu thích"}
              title={wishlisted ? "Đã lưu vào danh sách yêu thích" : "Thêm vào yêu thích"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center border transition ${
                wishlisted
                  ? "border-[#8b7100] bg-[#8b7100]/5 text-[#8b7100]"
                  : "border-[#e7dfd1] text-[#615e57] hover:border-[#8b7100] hover:text-[#8b7100]"
              }`}
            >
              <Heart size={16} strokeWidth={1.6} fill={wishlisted ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canAdd}
              className="flex h-11 shrink-0 items-center justify-center border border-[#8b7100] px-4 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#8b7100] transition hover:bg-[#8b7100] hover:text-white disabled:cursor-not-allowed disabled:border-[#d6d3d1] disabled:text-[#aaa59c]"
            >
              Mua ngay
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!canAdd}
              className="flex h-11 shrink-0 items-center justify-center gap-2 bg-[#8b7100] px-4 text-[10px] font-semibold uppercase tracking-[1.2px] text-white transition hover:bg-[#715c00] disabled:cursor-not-allowed disabled:bg-[#d6d3d1] sm:px-6"
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">{canAdd ? "Thêm vào giỏ" : "Hết hàng"}</span>
              <span className="sm:hidden">{canAdd ? "Giỏ" : "Hết"}</span>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
