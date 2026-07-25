import { Heart, ShoppingBag, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../store/cart.store";
import { useWishlist } from "../store/wishlist.store";
import { toast } from "../store/toast.store";

const PLACEHOLDER = "https://placehold.co/500x600?text=Chua+co+anh";

export interface ProductVariantOption {
  variantId?: string | null;
  size?: string;
  volume?: string;
  price?: number | null;
  basePrice?: number | null;
  discountPercent?: number;
  promotionType?: string | null;
  promotionName?: string;
  stock?: number;
}

export interface ProductCardBaseData {
  _id?: string;
  id?: string;
  slug?: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  fragranceFamily?: string;
  price?: number | null;
  basePrice?: number | null;
  discountPercent?: number;
  promotionType?: string | null;
  promotionName?: string;
  priceText?: string;
  image?: string | null;
  images?: string[];
  variantId?: string | null;
  volume?: string;
  sizes?: string[];
  variants?: ProductVariantOption[];
  stock?: number;
}

interface ProductCardBaseProps {
  product: ProductCardBaseData;
  cartMode?: "always" | "hover";
  showDescription?: boolean;
  compact?: boolean;
  imageAspectClassName?: string;
}

function formatVnd(value?: number | null) {
  return value != null ? `${value.toLocaleString("vi-VN")}đ` : "";
}

export default function ProductCardBase({
  product,
  cartMode = "always",
  showDescription = false,
  compact = false,
  imageAspectClassName = "aspect-[4/5]",
}: ProductCardBaseProps) {
  const location = useLocation();
  const addItem = useCart((s) => s.addItem);
  const productId = product.id || product._id || "";

  const wishlisted = useWishlist((s) => s.ids.includes(productId));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const ensureWishlist = useWishlist((s) => s.ensureLoaded);

  useEffect(() => {
    ensureWishlist();
  }, [ensureWishlist]);

  const detailPath = `/products/${product.slug || productId}`;
  const detailState =
    location.pathname === "/shop"
      ? { fromShop: `${location.pathname}${location.search}` }
      : undefined;
  const image = product.images?.[0] || product.image || PLACEHOLDER;
  const brand = product.brand || product.fragranceFamily || product.category || "Eau De Parfum";

  // Danh sách dung tích kèm giá và biến thể riêng, sắp theo giá tăng dần.
  const options = useMemo<ProductVariantOption[]>(() => {
    if (product.variants && product.variants.length) {
      return [...product.variants]
        .filter((v) => v.size || v.volume)
        .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }
    const sizes =
      product.sizes && product.sizes.length
        ? product.sizes
        : product.volume
          ? [product.volume]
          : [];
    return sizes.map((size) => ({
      size,
      price: product.price ?? null,
      basePrice: product.basePrice ?? null,
      discountPercent: product.discountPercent || 0,
      promotionType: product.promotionType || null,
      promotionName: product.promotionName || "",
      variantId: product.variantId ?? null,
      stock: product.stock,
    }));
  }, [product]);

  const [selected, setSelected] = useState(0);
  const current = options[selected] ?? {
    size: product.volume,
    price: product.price ?? null,
    variantId: product.variantId ?? null,
    stock: product.stock,
  };

  const activePrice = current.price ?? product.price ?? null;
  const activeBasePrice = current.basePrice ?? product.basePrice ?? activePrice;
  const activeDiscountPercent = current.discountPercent ?? product.discountPercent ?? 0;
  const priceLabel = formatVnd(activePrice) || product.priceText || "Liên hệ";
  const currentVariantId = current.variantId ?? product.variantId ?? null;
  const currentStock = current.stock ?? product.stock;
  const currentSize = current.size || current.volume || product.volume || "";
  const outOfStock = !currentVariantId || (typeof currentStock === "number" && currentStock <= 0);

  async function handleAdd() {
    if (!currentVariantId) {
      toast.error("Sản phẩm chưa có phiên bản để bán");
      return;
    }
    if (typeof currentStock === "number" && currentStock <= 0) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    try {
      await addItem(
        {
          variant: currentVariantId,
          product: productId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          image,
          volume: currentSize,
          price: activePrice || 0,
          basePrice: activeBasePrice ?? undefined,
          discountPercent: activeDiscountPercent,
          promotionType: current.promotionType ?? product.promotionType,
          promotionName: current.promotionName ?? product.promotionName,
          stock: currentStock,
          quantity: 1,
        },
        1,
      );
      toast.success("Đã thêm vào giỏ");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Không thể thêm vào giỏ");
    }
  }

  return (
    <article className="group flex h-full flex-col">
      {/* Ảnh */}
      <div className={`relative overflow-hidden bg-[#F3EEE7] ${imageAspectClassName}`}>
        <Link to={detailPath} state={detailState} className="block h-full w-full">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={500}
            height={600}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
            }}
            className={
              "h-full w-full object-cover duration-500 group-hover:scale-105 " +
              (outOfStock ? "opacity-60 grayscale" : "")
            }
          />
        </Link>

        {outOfStock && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] px-3 py-1 uppercase tracking-widest">
            Hết hàng
          </span>
        )}
        {!outOfStock && activeDiscountPercent > 0 && (
          <span className="absolute left-3 top-3 bg-[#8B1E1E] px-2.5 py-1 text-[10px] font-semibold text-white">
            -{activeDiscountPercent}%
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(productId)}
          aria-label={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
          title={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
          className={
            "absolute top-3 right-3 rounded-full shadow flex items-center justify-center duration-300 " +
            (compact ? "w-8 h-8 " : "w-9 h-9 ") +
            (wishlisted
              ? "bg-[#735C00] text-white"
              : "bg-white/90 text-[#1C1C19] hover:bg-[#1C1C19] hover:text-white")
          }
        >
          <Heart size={compact ? 15 : 16} fill={wishlisted ? "currentColor" : "none"} />
        </button>

        {cartMode === "hover" && (
          <div className="absolute left-0 right-0 bottom-0 translate-y-full group-hover:translate-y-0 duration-300">
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-full h-12 bg-[#1C1C19] text-white uppercase tracking-[2px] text-[11px] flex items-center justify-center gap-2 hover:bg-[#735C00] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={15} />
              {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
            </button>
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className={"flex flex-1 flex-col " + (compact ? "pt-3.5" : "pt-4")}>
        <p
          className={
            "uppercase text-[#8A7B4F] " +
            (compact ? "tracking-[2px] text-[9px]" : "tracking-[2.5px] text-[10px]")
          }
        >
          {brand}
        </p>

        <Link to={detailPath} state={detailState}>
          <h3
            className={
              "mt-1.5 overflow-hidden font-serif text-[#1E1D1A] line-clamp-2 " +
              (compact
                ? "h-[40px] text-[15px] font-semibold uppercase leading-[1.3] tracking-[0.4px]"
                : "h-[46px] text-[17px] leading-[1.35]")
            }
          >
            {product.name}
          </h3>
        </Link>

        {showDescription && (
          <p className="mt-2 text-[13px] leading-6 text-[#5F5E5E] line-clamp-2">
            {product.description || "Chưa có mô tả."}
          </p>
        )}

        <div
          className={
            "flex items-start justify-between gap-3 " +
            (compact ? "mt-2 min-h-[34px]" : "mt-2.5 min-h-[38px]")
          }
        >
          <div className="min-w-0">
            <span
              className={
                "block whitespace-nowrap font-semibold " +
                (activeDiscountPercent > 0 ? "text-[#8B1E1E] " : "text-[#1C1C19] ") +
                (compact ? "text-[14px]" : "text-[16px]")
              }
            >
              {priceLabel}
            </span>
            {activeDiscountPercent > 0 && activeBasePrice != null && (
              <span className="block text-[11px] text-[#817B73] line-through">
                {formatVnd(activeBasePrice)}
              </span>
            )}
          </div>

          {options.length > 1 ? (
            <div className="relative shrink-0">
              <select
                value={selected}
                onChange={(e) => setSelected(Number(e.target.value))}
                aria-label="Chọn dung tích"
                className={
                  "appearance-none cursor-pointer rounded-[6px] border border-[#DAD3C6] bg-transparent focus:outline-none focus:border-[#8A7B4F] text-[#5F5E5E] " +
                  (compact ? "py-1 pl-2.5 pr-6 text-[12px]" : "py-1.5 pl-3 pr-7 text-[13px]")
                }
              >
                {options.map((opt, index) => (
                  <option key={opt.variantId || index} value={index}>
                    {opt.size || opt.volume}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={compact ? 13 : 14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8A7B4F]"
              />
            </div>
          ) : currentSize ? (
            <span
              className={"shrink-0 text-[#5F5E5E] " + (compact ? "text-[12px]" : "text-[13px]")}
            >
              {currentSize}
            </span>
          ) : null}
        </div>

        {cartMode === "always" && (
          <div className={"mt-auto " + (compact ? "pt-3.5" : "pt-4")}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className={
                "w-full rounded-[6px] border border-[#1E1D1A] font-medium uppercase text-[#1E1D1A] flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-[#1E1D1A] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 " +
                (compact
                  ? "h-[42px] text-[11px] tracking-[1.2px]"
                  : "h-[46px] text-[12px] tracking-[1.5px]")
              }
            >
              <ShoppingBag size={compact ? 14 : 15} />
              {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
