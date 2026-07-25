import { FormEvent, useState } from "react";
import { CalendarDays, Mail, PackageSearch, Phone, Search, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import { PAY_METHOD, PAY_STATUS, StatusBadge } from "./Orders";

const vnd = (value: number) => `${(value || 0).toLocaleString("vi-VN")}₫`;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type LookupOrder = {
  id: string;
  code: string;
  createdAt: string;
  status: string;
  total: number;
  itemCount: number;
  items: Array<{
    name: string;
    volume: string;
    quantity: number;
  }>;
  payment: {
    method: string;
    status: string;
  };
};

export default function OrderLookup() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<LookupOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/orders/lookup", {
        params: { q: value },
      });

      setOrders(Array.isArray(data.data) ? data.data : []);
      setSearched(true);
    } catch (requestError: any) {
      setOrders([]);
      setSearched(true);
      setError(requestError?.response?.data?.message || "Không thể tra cứu đơn hàng lúc này.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className="min-h-[75vh] bg-[#F7F3ED] text-[#201F1B]">
        {/* HERO */}
        <section className="border-b border-[#E1D9CD] px-6 pb-14 pt-16 sm:px-10 lg:px-16 lg:pb-20 lg:pt-24">
          <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <h1
                className="mt-0 max-w-[620px] text-[48px] leading-[1.02] tracking-[-0.035em] sm:text-[60px] lg:text-[72px]"
                style={{
                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                }}
              >
                <br />
                <span className="italic text-[#7D6719]">Tra cứu đơn hàng</span>
              </h1>

              <p className="mt-7 max-w-[530px] text-sm leading-7 text-[#6E6961]">
                Kiểm tra trạng thái đơn hàng, phương thức thanh toán và các sản phẩm đã đặt bằng mã
                đơn, số điện thoại hoặc địa chỉ email.
              </p>
            </div>

            <div className="border-l border-[#D8CFC3] pl-0 lg:pl-12">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <PackageSearch
                    size={19}
                    strokeWidth={1.4}
                    className="mt-1 shrink-0 text-[#8C7420]"
                  />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Mã đơn hàng
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#787169]">
                      Nhập mã được gửi sau khi hoàn tất đặt hàng.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail size={19} strokeWidth={1.4} className="mt-1 shrink-0 text-[#8C7420]" />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Email hoặc điện thoại
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#787169]">
                      Sử dụng đúng thông tin đã nhập khi đặt hàng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOOKUP FORM */}
        <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-[1100px]">
            <div className="border border-[#DDD4C8] bg-[#FCF9F4] p-6 shadow-[0_20px_55px_rgba(55,45,30,0.06)] sm:p-8 lg:p-10">
              <form onSubmit={lookup}>
                <div className="flex flex-col gap-7">
                  <div>
                    <label
                      htmlFor="order-lookup"
                      className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#7A736A]"
                    >
                      Thông tin tra cứu
                    </label>

                    <p className="mt-3 text-sm leading-6 text-[#777068]">
                      Nhập một trong các thông tin sau để tìm đơn hàng của bạn.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                      <Search
                        size={18}
                        strokeWidth={1.5}
                        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#978E82]"
                      />

                      <input
                        id="order-lookup"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Mã đơn, số điện thoại hoặc email"
                        autoComplete="off"
                        className="h-[58px] w-full border border-[#D8D0C5] bg-white py-3 pl-14 pr-5 text-sm text-[#2D2925] outline-none transition duration-300 placeholder:text-[#A7A097] focus:border-[#917A28] focus:shadow-[0_0_0_3px_rgba(145,122,40,0.08)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="group inline-flex h-[58px] min-w-[190px] items-center justify-center gap-3 bg-[#28251F] px-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition duration-300 hover:bg-[#8A731A] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border border-white/40 border-t-white" />
                          Đang tra cứu
                        </>
                      ) : (
                        <>
                          <PackageSearch size={17} strokeWidth={1.5} />
                          Tra cứu đơn
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-[#E8E1D8] pt-5">
                    <div className="flex items-center gap-2 text-[11px] text-[#837B72]">
                      <PackageSearch size={14} strokeWidth={1.4} />
                      Mã đơn hàng
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#837B72]">
                      <Phone size={14} strokeWidth={1.4} />
                      Số điện thoại
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#837B72]">
                      <Mail size={14} strokeWidth={1.4} />
                      Địa chỉ email
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mt-7 border border-[#D8B9B5] bg-[#F8ECEA] px-6 py-5">
                <p className="text-sm leading-6 text-[#743E38]">{error}</p>
              </div>
            )}

            {/* EMPTY */}
            {!error && searched && !loading && orders.length === 0 && (
              <div className="mt-8 border border-dashed border-[#CFC5B9] bg-[#F9F6F1] px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D8CCB4]">
                  <PackageSearch size={24} strokeWidth={1.3} className="text-[#8F7828]" />
                </div>

                <h2
                  className="mt-6 text-[28px] text-[#29251F]"
                  style={{
                    fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                  }}
                >
                  Không tìm thấy đơn hàng
                </h2>

                <p className="mx-auto mt-3 max-w-[460px] text-sm leading-6 text-[#777067]">
                  Vui lòng kiểm tra lại mã đơn, số điện thoại hoặc địa chỉ email đã sử dụng khi đặt
                  hàng.
                </p>
              </div>
            )}

            {/* RESULTS */}
            {orders.length > 0 && (
              <section className="mt-10 space-y-6 pb-14" aria-label="Kết quả tra cứu">
                <div className="flex items-end justify-between border-b border-[#DCD3C7] pb-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#917A28]">
                      Kết quả tra cứu
                    </p>

                    <h2
                      className="mt-2 text-[30px]"
                      style={{
                        fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                      }}
                    >
                      Đơn hàng của bạn
                    </h2>
                  </div>

                  <p className="text-xs text-[#817A72]">{orders.length} kết quả</p>
                </div>

                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="overflow-hidden border border-[#DDD4C8] bg-[#FCF9F4]"
                  >
                    <div className="grid lg:grid-cols-[1fr_auto]">
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9A8127]">
                              Mã đơn hàng
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <h3
                                className="text-[28px] tracking-[-0.02em]"
                                style={{
                                  fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                                }}
                              >
                                #{order.code}
                              </h3>

                              <StatusBadge status={order.status} />
                            </div>

                            <p className="mt-3 flex items-center gap-2 text-xs text-[#777068]">
                              <CalendarDays size={14} strokeWidth={1.4} />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-[#928A80]">
                              Tổng thanh toán
                            </p>

                            <p
                              className="mt-2 text-[28px]"
                              style={{
                                fontFamily: "'Noto Serif', 'Noto Serif Display', serif",
                              }}
                            >
                              {vnd(order.total)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-7 border-t border-[#E5DED5] pt-6">
                          <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#80776D]">
                            Sản phẩm đã đặt
                          </p>

                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div
                                key={`${item.name}-${index}`}
                                className="flex items-start justify-between gap-5"
                              >
                                <div className="flex items-start gap-3">
                                  <ShoppingBag
                                    size={15}
                                    strokeWidth={1.4}
                                    className="mt-1 shrink-0 text-[#907A2C]"
                                  />

                                  <div>
                                    <p className="text-sm text-[#403A35]">{item.name}</p>

                                    {item.volume && (
                                      <p className="mt-1 text-xs text-[#8B837A]">{item.volume}</p>
                                    )}
                                  </div>
                                </div>

                                <p className="shrink-0 text-xs text-[#746D65]">
                                  Số lượng: {item.quantity}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#DDD4C8] bg-[#F2EEE8] p-6 lg:w-[260px] lg:border-l lg:border-t-0 lg:p-8">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#81786E]">
                          Thanh toán
                        </p>

                        <div className="mt-6 space-y-5">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[#9A9288]">
                              Phương thức
                            </p>

                            <p className="mt-2 text-sm text-[#403B35]">
                              {PAY_METHOD[order.payment.method] || order.payment.method}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[#9A9288]">
                              Trạng thái
                            </p>

                            <p className="mt-2 text-sm text-[#806900]">
                              {PAY_STATUS[order.payment.status] || order.payment.status}
                            </p>
                          </div>

                          <div className="border-t border-[#DCD3C8] pt-5">
                            <p className="text-xs leading-5 text-[#817A72]">
                              {order.itemCount} sản phẩm trong đơn hàng
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
