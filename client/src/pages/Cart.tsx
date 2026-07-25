import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, ShoppingBag, Lock, Truck, X, RefreshCw } from "lucide-react";
import { useCart } from "../store/cart.store";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";
import ProductCard, { ProductCardData } from "../components/ProductCard";
import Footer from "../components/Footer";

const vnd = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";
const PLACEHOLDER = "https://placehold.co/256x342?text=Chua+co+anh";

function similarLoopWidth(scroller: HTMLElement) {
  const groups = scroller.querySelectorAll<HTMLElement>("[data-similar-loop]");
  return groups.length > 1 ? groups[1].offsetLeft - groups[0].offsetLeft : 0;
}

export default function Cart() {
  const { items, count, loadCart, updateItem, removeItem, clear } = useCart();
  const navigate = useNavigate();
  // variantId -> số lượng CÒN LẠI thực tế trong kho (kiểm tra realtime)
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [pricing, setPricing] = useState<
    Record<
      string,
      {
        basePrice: number;
        finalPrice: number;
        discountPercent: number;
        promotionName: string;
        lineTotal: number;
      }
    >
  >({});
  // Danh sách sản phẩm tương tự (load từ API)
  const [similar, setSimilar] = useState<ProductCardData[]>([]);
  const [similarOffset, setSimilarOffset] = useState(0);
  const [similarAnimationKey, setSimilarAnimationKey] = useState(0);
  const [similarWheelActive, setSimilarWheelActive] = useState(false);
  const similarScrollerRef = useRef<HTMLDivElement | null>(null);
  const similarWheelTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  // Load "Sản phẩm tương tự" từ API sản phẩm thật
  useEffect(() => {
    let active = true;
    api
      .get("/products", { params: { limit: 100 } })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.data;
        if (active) setSimilar(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        // bỏ qua nếu lỗi, chỉ là gợi ý
      });
    return () => {
      active = false;
    };
  }, []);

  // Kiểm tra tồn kho THỰC TẾ mỗi khi giỏ thay đổi
  const verifyStock = useCallback(async () => {
    if (!items.length) {
      setAvailable({});
      return;
    }
    try {
      const { data } = await api.post("/orders/check-stock", {
        items: items.map((i) => ({ variant: i.variant, quantity: i.quantity })),
      });
      const map: Record<string, number> = {};
      const priceMap: typeof pricing = {};
      for (const d of data.data.items) {
        map[d.variant] = d.available;
        priceMap[d.variant] = {
          basePrice: d.basePrice,
          finalPrice: d.finalPrice,
          discountPercent: d.discountPercent,
          promotionName: d.promotionName,
          lineTotal: d.lineTotal,
        };
      }
      setAvailable(map);
      setPricing(priceMap);
    } catch {
      // Nếu kiểm tra lỗi thì không chặn hiển thị giỏ
    }
  }, [items]);

  useEffect(() => {
    verifyStock();
  }, [verifyStock]);

  // Có item nào không đủ tồn kho không?
  const hasOutOfStock = items.some((it) => {
    const av = available[it.variant];
    return typeof av === "number" && av < it.quantity;
  });
  const displayTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (pricing[item.variant]?.lineTotal ?? item.price * item.quantity),
        0,
      ),
    [items, pricing],
  );
  const originalTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (pricing[item.variant]?.basePrice ?? item.basePrice ?? item.price) * item.quantity,
        0,
      ),
    [items, pricing],
  );

  function checkout() {
    if (hasOutOfStock) {
      toast.error("Một số sản phẩm đã hết hàng, vui lòng cập nhật giỏ trước khi thanh toán.");
      return;
    }
    // PF-36: chuyển sang trang thanh toán (chọn COD hoặc chuyển khoản QR)
    navigate("/checkout");
  }

  // Loại bỏ sản phẩm đã có trong giỏ và giữ nhiều lựa chọn cho carousel ngang.
  const inCart = new Set(items.map((i) => i.variant));
  const suggestionPool = similar
    .filter((p) => p.variantId && !inCart.has(p.variantId))
    .slice(0, 16);
  const normalizedSimilarOffset = suggestionPool.length ? similarOffset % suggestionPool.length : 0;
  const suggestions = [
    ...suggestionPool.slice(normalizedSimilarOffset),
    ...suggestionPool.slice(0, normalizedSimilarOffset),
  ];

  const refreshSuggestions = () => {
    if (!suggestionPool.length) return;
    setSimilarOffset((current) => (current + 4) % suggestionPool.length);
    setSimilarAnimationKey((current) => current + 1);
    similarScrollerRef.current?.scrollTo({ left: 0 });
  };

  useEffect(() => {
    const scroller = similarScrollerRef.current;
    if (!scroller) return;

    const handleWheel = (event: WheelEvent) => {
      const rawDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const pixelRatio =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1;
      const pixelDelta = rawDelta * pixelRatio;
      const cycleWidth = similarLoopWidth(scroller);

      if (cycleWidth <= 1) return;
      event.preventDefault();
      const nextPosition = scroller.scrollLeft + pixelDelta;
      scroller.scrollLeft = ((nextPosition % cycleWidth) + cycleWidth) % cycleWidth;
      setSimilarWheelActive(true);

      if (similarWheelTimerRef.current != null) {
        window.clearTimeout(similarWheelTimerRef.current);
      }
      similarWheelTimerRef.current = window.setTimeout(() => {
        setSimilarWheelActive(false);
      }, 180);
    };

    scroller.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scroller.removeEventListener("wheel", handleWheel);
      if (similarWheelTimerRef.current != null) {
        window.clearTimeout(similarWheelTimerRef.current);
      }
    };
  }, [suggestions.length, items.length]);

  useEffect(() => {
    const scroller = similarScrollerRef.current;
    if (!scroller || suggestions.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let frameId = 0;
    let previousTime = performance.now();
    const pixelsPerSecond = 38;

    const moveContinuously = (currentTime: number) => {
      const elapsed = Math.min(currentTime - previousTime, 50);
      previousTime = currentTime;

      if (!document.hidden) {
        const cycleWidth = similarLoopWidth(scroller);
        if (cycleWidth > 1) {
          const nextPosition = scroller.scrollLeft + (pixelsPerSecond * elapsed) / 1000;
          scroller.scrollLeft =
            nextPosition >= cycleWidth ? nextPosition - cycleWidth : nextPosition;
        }
      }

      frameId = window.requestAnimationFrame(moveContinuously);
    };

    frameId = window.requestAnimationFrame(moveContinuously);
    return () => window.cancelAnimationFrame(frameId);
  }, [suggestions.length, items.length]);

  if (!items.length) {
    return (
      <>
        <section className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDF9F4] px-[20px] text-center">
          <ShoppingBag size={60} className="text-[#735C00] mb-6" />
          <h1 className="font-serif text-4xl text-[#1C1C19] mb-3">Giỏ hàng trống</h1>
          <p className="font-sans text-[#5F5E5E] mb-8">Hãy thêm sản phẩm yêu thích vào giỏ.</p>
          <Link
            to="/shop"
            className="border border-[#735C00] text-[#735C00] px-8 py-3 font-sans uppercase tracking-[3px] text-sm hover:bg-[#735C00] hover:text-white duration-300"
          >
            Tiếp tục mua sắm
          </Link>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <section className="w-full bg-[#FDF9F4] px-[20px] py-[50px] lg:px-[40px] xl:px-[80px]">
        <header className="mb-10">
          <h1 className="font-serif text-5xl text-[#1C1C19] tracking-[-1.8px]">Giỏ hàng của bạn</h1>
          <p className="font-sans uppercase tracking-[3px] text-xs text-[#5F5E5E] mt-3">
            Tuyển chọn cho trải nghiệm của bạn
          </p>
        </header>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-x-16">
          <div className="min-w-0">
            {/* Danh sách sản phẩm và giá nằm gọn trong cột trái. */}
            <div className="min-w-0 divide-y divide-[rgba(208,197,175,0.35)]">
              {items.map((it) => {
                const av = available[it.variant];
                const priced = pricing[it.variant];
                const productInfo = similar.find(
                  (product) => product.id === it.product || (it.slug && product.slug === it.slug),
                );
                const description = it.description || productInfo?.description;
                const detailId = it.slug || productInfo?.slug || it.product || productInfo?.id;
                const detailPath = detailId ? `/products/${detailId}` : "/shop";
                const soldOut = typeof av === "number" && av <= 0;
                const notEnough = typeof av === "number" && av > 0 && av < it.quantity;
                return (
                  <article
                    key={it.variant}
                    className="grid min-w-0 gap-7 py-[50px] first:pt-0 md:grid-cols-[256px_minmax(0,1fr)] md:gap-x-8 lg:gap-x-10"
                  >
                    <Link
                      to={detailPath}
                      aria-label={`Xem chi tiết ${it.name || "sản phẩm"}`}
                      className="flex h-[342px] w-64 max-w-full items-center justify-center justify-self-center overflow-hidden bg-[#F1EDE8] md:justify-self-start"
                    >
                      <img
                        loading="lazy"
                        src={it.image || PLACEHOLDER}
                        alt={it.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                        }}
                        className={
                          "h-full w-full object-cover mix-blend-multiply " +
                          (soldOut ? "opacity-60 grayscale" : "opacity-90")
                        }
                      />
                    </Link>

                    <div className="flex min-w-0 flex-col py-2">
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                          <Link to={detailPath} className="group/title inline-block">
                            <h3 className="font-serif text-[27px] leading-tight text-[#1C1C19] transition-colors group-hover/title:text-[#887000]">
                              {it.name}
                            </h3>
                          </Link>
                          <p className="mt-2 font-sans text-xs uppercase tracking-[1.5px] text-[#68635D]">
                            {it.volume}
                          </p>
                        </div>

                        <div className="shrink-0 whitespace-nowrap text-right">
                          <span
                            className={
                              "block font-serif text-xl " +
                              (priced?.discountPercent ? "text-[#8B1E1E]" : "text-[#1C1C19]")
                            }
                          >
                            {vnd(priced?.finalPrice ?? it.price)}
                          </span>
                          {!!priced?.discountPercent && (
                            <span className="block text-xs text-[#8D887F] line-through">
                              {vnd(priced.basePrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {description && (
                        <p className="mt-5 max-w-2xl font-sans text-sm leading-6 text-[#615A52]">
                          {description}
                        </p>
                      )}

                      {soldOut && (
                        <p className="mt-3 text-sm font-semibold text-red-600">Đã hết hàng</p>
                      )}
                      {notEnough && (
                        <p className="mt-3 text-sm font-semibold text-red-600">
                          Chỉ còn {av} sản phẩm
                        </p>
                      )}
                      {priced?.promotionName && (
                        <p className="mt-3 text-xs uppercase tracking-[1px] text-[#8B1E1E]">
                          {priced.promotionName} · -{priced.discountPercent}%
                        </p>
                      )}

                      <div className="mt-9 flex flex-wrap items-center justify-between gap-5">
                        <div className="flex w-fit items-center border border-[rgba(208,197,175,0.5)] font-sans text-[#1C1C19]">
                          <button
                            type="button"
                            aria-label={`Giảm số lượng ${it.name}`}
                            className="flex h-10 w-10 items-center justify-center hover:bg-[#F1EDE8]"
                            onClick={() => updateItem(it.variant, it.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-10 text-center text-sm">{it.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Tăng số lượng ${it.name}`}
                            className="flex h-10 w-10 items-center justify-center hover:bg-[#F1EDE8]"
                            onClick={() => updateItem(it.variant, it.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="flex items-center gap-2 whitespace-nowrap font-sans text-[10px] uppercase tracking-[1.2px] text-[#6C665F] hover:text-red-500"
                          onClick={() => removeItem(it.variant)}
                        >
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              onClick={clear}
              className="mt-8 w-fit font-sans text-sm text-[#5F5E5E] underline underline-offset-4 hover:text-red-500"
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>

          {/* Tóm tắt đơn hàng luôn ở đầu cột phải trên desktop. */}
          <aside className="w-full border border-[rgba(208,197,175,0.4)] bg-[#F1EDE8] p-6 font-sans sm:p-8 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl text-[#1C1C19] mb-6 pb-6 border-b border-[rgba(208,197,175,0.2)]">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-4 text-sm border-b border-[rgba(208,197,175,0.2)] pb-6">
              <div className="flex justify-between">
                <span className="text-[#5F5E5E] tracking-[0.35px]">
                  Tạm tính ({count} sản phẩm)
                </span>
                <span className="text-[#1C1C19]">{vnd(originalTotal)}</span>
              </div>
              {originalTotal > displayTotal && (
                <div className="flex justify-between text-[#8B1E1E]">
                  <span>Ưu đãi sản phẩm</span>
                  <span>-{vnd(originalTotal - displayTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#5F5E5E] tracking-[0.35px]">Vận chuyển</span>
                <span className="uppercase text-[10px] font-bold tracking-[1px] text-[#735C00]">
                  Miễn phí
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F5E5E] tracking-[0.35px]">Thuế</span>
                <span className="text-[#1C1C19]">{vnd(0)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-6 border-t border-[rgba(208,197,175,0.4)] mt-0">
              <span className="font-serif text-lg text-[#1C1C19]">Tổng cộng</span>
              <span className="font-serif text-3xl text-[#1C1C19]">{vnd(displayTotal)}</span>
            </div>

            {hasOutOfStock && (
              <p className="text-red-600 text-sm mb-3">
                Một số sản phẩm đã hết hàng, vui lòng cập nhật giỏ.
              </p>
            )}

            <button
              onClick={checkout}
              disabled={hasOutOfStock}
              className={
                "w-full py-5 font-sans uppercase tracking-[3.5px] text-sm duration-300 " +
                (hasOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#735C00] text-white hover:bg-black")
              }
            >
              Tiến hành thanh toán →
            </button>

            <div className="mt-6 space-y-4 text-xs text-[#4D4635]">
              <div className="flex gap-3">
                <Lock size={16} className="text-[#735C00] shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-[1px] text-[10px] font-bold text-[#1C1C19]">
                    Thanh toán an toàn
                  </p>
                  <p>Giao dịch của bạn được mã hóa và bảo vệ.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck size={16} className="text-[#735C00] shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-[1px] text-[10px] font-bold text-[#1C1C19]">
                    Giao hàng tận nơi
                  </p>
                  <p>2-3 ngày làm việc, có xác nhận khi giao.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Sản phẩm tương tự (thay cho Complimentary Samples) */}
        {suggestions.length > 0 && (
          <div className="mt-20">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-3xl text-[#1C1C19]">Sản phẩm tương tự</h2>
                <p className="mt-2 font-sans text-sm tracking-[0.35px] text-[#5F5E5E]">
                  Đặt con trỏ trong dải sản phẩm và lăn để xem theo chiều ngang
                </p>
              </div>

              <button
                type="button"
                onClick={refreshSuggestions}
                className="inline-flex min-h-11 w-fit items-center justify-center gap-2 border border-[#CFC5B9] px-5 font-sans text-[9px] uppercase tracking-[0.17em] text-[#665E56] transition hover:border-[#887000] hover:text-[#887000]"
              >
                <RefreshCw size={14} />
                Làm mới
              </button>
            </div>

            <div
              ref={similarScrollerRef}
              className="flex gap-8 overflow-x-auto overscroll-x-contain pb-6 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {[0, 1, 2].map((copyIndex) => (
                <div
                  key={`${similarAnimationKey}-loop-${copyIndex}`}
                  data-similar-loop
                  className="flex shrink-0 gap-8"
                >
                  {suggestions.map((product, index) => (
                    <div
                      key={`${copyIndex}-${product.id}`}
                      className="cart-similar-float-up flex w-64 max-w-full shrink-0"
                      style={{
                        animationDelay: `${Math.min(index, 7) * 70}ms`,
                      }}
                    >
                      <div
                        className={`h-full w-full transition-transform duration-300 ease-out hover:-translate-y-2 ${
                          similarWheelActive ? "-translate-y-1" : ""
                        }`}
                      >
                        <ProductCard item={product} imageAspectClassName="aspect-[256/342]" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
