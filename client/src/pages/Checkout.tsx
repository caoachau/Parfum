import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Banknote, CheckCircle2, CreditCard, Lock, ShieldCheck, Truck, X } from "lucide-react";
import { useCart } from "../store/cart.store";
import type { CartItem } from "../store/cart.store";
import { useAuth } from "../store/auth.store";
import type { Address } from "../store/auth.store";
import { api } from "../lib/api";
import { toast } from "../store/toast.store";
import Footer from "../components/Footer";
import VietnamAddressFields from "../components/VietnamAddressFields";

const vnd = (n: number) => (n || 0).toLocaleString("vi-VN") + "₫";
const PLACEHOLDER = "https://placehold.co/120x150?text=Chua+co+anh";

type Method = "cod" | "bank_qr";
type ShippingMethod = "standard" | "express";
type PayInfo = {
  orderId: string;
  method: Method;
  status: "unpaid" | "paid";
  amount: number;
  bank: { bin?: string; accountNo?: string; accountName?: string };
  transferContent: string;
  qrUrl: string;
};
type QuoteItem = {
  variant: string;
  basePrice: number;
  finalPrice: number;
  discountPercent: number;
  promotionName: string;
  quantity: number;
  lineOriginal: number;
  lineTotal: number;
};
type PricingQuote = {
  items: QuoteItem[];
  count: number;
  originalTotal: number;
  productLevelDiscount: number;
  subtotal: number;
  voucherDiscount: number;
  shippingFeeBeforeDiscount: number;
  shippingDiscount: number;
  shippingFee: number;
  finalTotal: number;
  voucher: { code: string; name: string } | null;
};

const steps = ["Địa chỉ", "Vận chuyển", "Thanh toán", "Xác nhận"];
const shippingFees: Record<ShippingMethod, number> = {
  standard: 0,
  express: 35000,
};

const NEW_ADDRESS_ID = "__new_address__";
const BUY_NOW_KEY = "buy_now_checkout_item";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function formatSavedAddress(item: Address) {
  return [item.line || item.detail, item.ward, item.province].filter(Boolean).join(", ");
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items: cartItems,
    total: cartTotal,
    count: cartCount,
    loadCart,
    clear,
    addItem,
    updateItem,
  } = useCart();
  const user = useAuth((state) => state.user);
  const setUser = useAuth((state) => state.setUser);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");
  const [phone, setPhone] = useState("");
  const [shipping, setShipping] = useState<ShippingMethod>("standard");
  const [method, setMethod] = useState<Method>("cod");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingQr, setPendingQr] = useState<PayInfo | null>(null);
  const [qrCartSnapshot, setQrCartSnapshot] = useState<CartItem[]>([]);
  const [cancellingQr, setCancellingQr] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(NEW_ADDRESS_ID);
  const [saveCustomerInfo, setSaveCustomerInfo] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState<CartItem[]>([]);
  const isBuyNow = new URLSearchParams(location.search).get("mode") === "buy-now";
  const buyNowSummary = useMemo(
    () => ({
      total: buyNowItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      count: buyNowItems.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [buyNowItems],
  );
  const items = isBuyNow ? buyNowItems : cartItems;
  const total = isBuyNow ? buyNowSummary.total : cartTotal;
  const count = isBuyNow ? buyNowSummary.count : cartCount;

  useEffect(() => {
    if (!isBuyNow) {
      loadCart();
      return;
    }

    try {
      const raw = sessionStorage.getItem(BUY_NOW_KEY);
      const parsed = raw ? (JSON.parse(raw) as CartItem) : null;
      if (!parsed?.variant || !parsed.quantity) throw new Error("missing-buy-now-item");
      setBuyNowItems([{ ...parsed, quantity: Math.max(1, Number(parsed.quantity) || 1) }]);
    } catch {
      sessionStorage.removeItem(BUY_NOW_KEY);
      toast.error("Không tìm thấy sản phẩm mua ngay.");
      navigate("/shop", { replace: true });
    }
  }, [isBuyNow, loadCart, navigate]);

  useEffect(() => {
    if (!user) return;

    const defaultAddress = user.addresses?.find((item) => item.isDefault) || user.addresses?.[0];
    const fallbackName = splitName(defaultAddress?.fullName || user.name || "");

    setEmail(user.email || "");
    setPhone(defaultAddress?.phone || user.phone || "");
    setFirstName(fallbackName.firstName);
    setLastName(fallbackName.lastName);
    setAddress(defaultAddress?.line || defaultAddress?.detail || "");
    setCity(defaultAddress?.province || "");
    setWard(defaultAddress?.ward || "");
    setSelectedAddressId(defaultAddress?._id || NEW_ADDRESS_ID);
    setSaveCustomerInfo(!(user.phone && user.addresses?.length));
  }, [user]);

  const shippingFee = quote?.shippingFee ?? shippingFees[shipping];
  const grandTotal = quote?.finalTotal ?? total + shippingFee;
  const fullName = (firstName.trim() + " " + lastName.trim()).trim();
  const addressLine = address.trim();
  const addressCity = [ward.trim(), city.trim()].filter(Boolean).join(", ");
  const emailValue = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const quotedByVariant = useMemo(
    () => new Map((quote?.items || []).map((item) => [item.variant, item])),
    [quote],
  );
  const savedAddresses = user?.addresses || [];
  const currentAddressIsSaved = useMemo(
    () =>
      savedAddresses.some(
        (item) =>
          normalizeText(item.fullName) === normalizeText(fullName) &&
          normalizeText(item.phone) === normalizeText(phone) &&
          normalizeText(item.line || item.detail) === normalizeText(addressLine) &&
          normalizeText(item.ward) === normalizeText(ward) &&
          normalizeText(item.province) === normalizeText(city),
      ),
    [savedAddresses, fullName, phone, addressLine, ward, city],
  );

  const loadQuote = useCallback(
    async (code = voucherCode, showError = false) => {
      if (!items.length) return;
      try {
        setQuoteLoading(true);
        const { data } = await api.post<{ success: boolean; data: PricingQuote }>(
          "/orders/price-preview",
          {
            items: items.map((item) => ({ variant: item.variant, quantity: item.quantity })),
            shippingMethod: shipping,
            voucherCode: code || undefined,
            email: emailValid ? emailValue : undefined,
          },
        );
        setQuote(data.data);
        return data.data;
      } catch (error: any) {
        if (showError)
          toast.error(error?.response?.data?.message || "Không áp dụng được mã ưu đãi");
        else if (code) {
          setVoucherCode("");
          setVoucherInput("");
          setQuote(null);
          toast.error(error?.response?.data?.message || "Mã ưu đãi không còn phù hợp với giỏ hàng");
        }
        if (code) throw error;
      } finally {
        setQuoteLoading(false);
      }
    },
    [items, shipping, voucherCode, emailValid, emailValue],
  );

  useEffect(() => {
    loadQuote(voucherCode).catch(() => undefined);
  }, [loadQuote, voucherCode]);

  async function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return toast.error("Nhập mã ưu đãi");
    try {
      const next = await loadQuote(code, true);
      if (next) {
        setVoucherCode(code);
        toast.success("Đã áp dụng mã ưu đãi");
      }
    } catch {
      /* thong bao tai loadQuote */
    }
  }

  function removeVoucher() {
    setVoucherCode("");
    setVoucherInput("");
  }

  async function updateCheckoutQuantity(item: CartItem, nextQuantity: number) {
    const quantity = Math.max(0, Math.min(nextQuantity, item.stock ?? Number.MAX_SAFE_INTEGER));
    try {
      if (isBuyNow) {
        const nextItems =
          quantity <= 0
            ? buyNowItems.filter((line) => line.variant !== item.variant)
            : buyNowItems.map((line) =>
                line.variant === item.variant ? { ...line, quantity } : line,
              );
        setBuyNowItems(nextItems);
        if (nextItems[0]) sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(nextItems[0]));
        else sessionStorage.removeItem(BUY_NOW_KEY);
        return;
      }
      await updateItem(item.variant, quantity);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Không cập nhật được số lượng",
      );
    }
  }

  function applySavedAddress(item: Address) {
    const name = splitName(item.fullName || user?.name || "");
    setSelectedAddressId(item._id);
    setFirstName(name.firstName);
    setLastName(name.lastName);
    setPhone(item.phone || user?.phone || "");
    setAddress(item.line || item.detail || "");
    setWard(item.ward || "");
    setCity(item.province || "");
    setEmail(user?.email || email);
  }

  function markManualAddress() {
    setSelectedAddressId(NEW_ADDRESS_ID);
  }

  const addressValid = useMemo(
    () =>
      !!email.trim() &&
      emailValid &&
      !!firstName.trim() &&
      !!address.trim() &&
      !!city.trim() &&
      !!ward.trim() &&
      /^0\d{9}$/.test(phone.trim()) &&
      items.length > 0,
    [email, emailValid, firstName, address, city, ward, phone, items.length],
  );
  const shouldAskToSaveInfo =
    !!user && addressValid && (!user.phone || !savedAddresses.length || !currentAddressIsSaved);

  function nextStep() {
    if (step === 1 && !addressValid) {
      toast.error("Vui lòng nhập đủ email, địa chỉ và số điện thoại 10 số bắt đầu bằng 0.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function buildOrderPayload() {
    const fullNote = [
      fullName && "Người nhận: " + fullName,
      emailValue && "Email: " + emailValue,
      "Vận chuyển: " + (shipping === "standard" ? "Tiêu chuẩn" : "Nhanh"),
      shippingFee > 0 && "Phí vận chuyển: " + vnd(shippingFee),
      note.trim() && "Ghi chú: " + note.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    return {
      method,
      shippingMethod: shipping,
      address: {
        fullName,
        email: emailValue,
        line: addressLine,
        ward: ward.trim(),
        city: city.trim(),
        province: city.trim(),
        phone: phone.trim(),
      },
      note: fullNote,
      voucherCode: voucherCode || undefined,
      items:
        isBuyNow || !user
          ? items.map((item) => ({
              variant: item.variant,
              quantity: item.quantity,
            }))
          : undefined,
    };
  }

  async function saveCheckoutInfoToDashboard() {
    if (!user || !saveCustomerInfo || !shouldAskToSaveInfo) return;

    let nextUser = user;
    if (!user.phone && phone.trim()) {
      const { data } = await api.put("/auth/me", {
        name: user.name || fullName || emailValue,
        email: user.email || emailValue,
        phone: phone.trim(),
      });
      nextUser = {
        ...user,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.createdAt || user.createdAt,
        isEmailVerified: data.isEmailVerified,
        addresses: data.addresses || user.addresses || [],
      };
      setUser(nextUser);
    }

    if (!currentAddressIsSaved) {
      const { data } = await api.post<Address[]>("/auth/me/addresses", {
        label: savedAddresses.length ? "Địa chỉ mới" : "Nhà",
        fullName,
        phone: phone.trim(),
        line: addressLine,
        ward: ward.trim(),
        province: city.trim(),
        isDefault: !savedAddresses.length,
      });
      setUser({ ...nextUser, addresses: data });
    }

    toast.success("Đã lưu thông tin khách hàng vào dashboard");
  }

  async function placeOrder() {
    if (!items.length) {
      toast.error("Giỏ hàng đang trống.");
      navigate("/cart");
      return;
    }

    if (!addressValid) {
      toast.error("Vui lòng kiểm tra lại thông tin giao hàng.");
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const snapshot = items.map((item) => ({ ...item }));
      const { data } = await api.post("/orders", buildOrderPayload());
      try {
        await saveCheckoutInfoToDashboard();
      } catch (saveError: any) {
        toast.error(
          saveError?.response?.data?.message ||
            "Đơn đã tạo, nhưng chưa lưu được thông tin vào trang tài khoản",
        );
      }

      if (method === "bank_qr") {
        const payment = await api.get<{ success: boolean; data: PayInfo }>(
          "/orders/" + data.data.orderId + "/payment",
        );
        setQrCartSnapshot(snapshot);
        setPendingQr(payment.data.data);
        setStep(3);
        toast.success("Đã tạo mã QR thanh toán");
        return;
      }

      if (isBuyNow) sessionStorage.removeItem(BUY_NOW_KEY);
      else await clear();
      toast.success("Đặt hàng thành công!");
      navigate("/thank-you/" + data.data.orderId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể tạo đơn, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmQrPaid() {
    if (!pendingQr) return;
    if (isBuyNow) sessionStorage.removeItem(BUY_NOW_KEY);
    else await clear();
    toast.success("Cảm ơn bạn. Đơn hàng đang chờ hệ thống xác nhận giao dịch.");
    navigate("/thank-you/" + pendingQr.orderId);
  }

  async function cancelPendingQr() {
    if (!pendingQr) return;

    try {
      setCancellingQr(true);
      await api.post("/orders/" + pendingQr.orderId + "/cancel-pending-qr");
      if (!isBuyNow && user) {
        for (const item of qrCartSnapshot) {
          await addItem(item, item.quantity);
        }
        await loadCart();
      }
      setPendingQr(null);
      setStep(3);
      toast.success("Đã hủy thanh toán QR");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Không thể hủy giao dịch QR");
    } finally {
      setCancellingQr(false);
    }
  }

  const inputCls =
    "w-full border border-[rgba(208,197,175,0.6)] bg-white px-4 py-3 font-sans text-sm text-[#1C1C19] outline-none focus:border-[#735C00] duration-200";
  const labelCls = "block font-sans text-xs uppercase tracking-[1.5px] text-[#5F5E5E] mb-2";

  if (!items.length) {
    return (
      <>
        <section className="min-h-[60vh] bg-[#FDF9F4] px-6 py-20 text-center">
          <h1 className="font-serif text-4xl text-[#1C1C19]">Giỏ hàng trống</h1>
          <p className="mt-3 font-sans text-[#5F5E5E]">
            Thêm sản phẩm vào giỏ trước khi thanh toán.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex border border-[#735C00] px-8 py-3 font-sans text-sm uppercase tracking-[2px] text-[#735C00] hover:bg-[#735C00] hover:text-white"
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
      <section className="mx-auto max-w-6xl bg-[#FDF9F4] px-4 py-10 sm:px-6 sm:py-12">
        <header className="mb-10">
          <h1 className="font-serif text-4xl tracking-[-1.5px] text-[#1C1C19] md:text-5xl">
            Thanh toán
          </h1>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {steps.map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const done = step > number;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => number < step && setStep(number)}
                  className={
                    "flex items-center gap-3 border px-4 py-3 text-left font-sans text-xs uppercase tracking-[1.5px] " +
                    (active
                      ? "border-[#735C00] bg-[#F7F3EE] text-[#1C1C19]"
                      : "border-[rgba(208,197,175,0.45)] text-[#5F5E5E]")
                  }
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[11px]">
                    {done ? <CheckCircle2 size={14} /> : number}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            {step === 1 && (
              <Panel title="1. Địa chỉ giao hàng">
                {!!savedAddresses.length && (
                  <div className="mb-6">
                    <label className={labelCls}>Chọn địa chỉ đã lưu</label>
                    <div className="grid gap-3">
                      {savedAddresses.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => applySavedAddress(item)}
                          className={
                            "border px-4 py-3 text-left font-sans duration-200 " +
                            (selectedAddressId === item._id
                              ? "border-[#735C00] bg-[#F7F3EE]"
                              : "border-[rgba(208,197,175,0.6)] bg-white hover:border-[#735C00]/60")
                          }
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#1C1C19]">
                              {item.label || "Địa chỉ"}
                            </span>
                            {item.isDefault && (
                              <span className="border border-[#D8CBB7] px-2 py-0.5 text-[10px] uppercase tracking-[1px] text-[#735C00]">
                                Mặc định
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm text-[#5F5E5E]">
                            {[item.fullName, item.phone].filter(Boolean).join(" · ")}
                          </span>
                          <span className="mt-1 block text-xs text-[#7A7168]">
                            {formatSavedAddress(item)}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(NEW_ADDRESS_ID);
                          setAddress("");
                          setWard("");
                          setCity("");
                          setPhone(user?.phone || "");
                          const name = splitName(user?.name || "");
                          setFirstName(name.firstName);
                          setLastName(name.lastName);
                          setSaveCustomerInfo(true);
                        }}
                        className={
                          "border px-4 py-3 text-left font-sans text-sm duration-200 " +
                          (selectedAddressId === NEW_ADDRESS_ID
                            ? "border-[#735C00] bg-[#F7F3EE] text-[#1C1C19]"
                            : "border-dashed border-[rgba(208,197,175,0.8)] text-[#735C00] hover:border-[#735C00]")
                        }
                      >
                        Nhập địa chỉ mới
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="email@vidu.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Họ</label>
                    <input
                      className={inputCls}
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        markManualAddress();
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tên</label>
                    <input
                      className={inputCls}
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        markManualAddress();
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={labelCls}>Địa chỉ</label>
                  <input
                    className={inputCls}
                    placeholder="Số nhà, tên đường"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      markManualAddress();
                    }}
                  />
                </div>

                <VietnamAddressFields
                  province={city}
                  ward={ward}
                  onProvinceChange={(value) => {
                    setCity(value);
                    markManualAddress();
                  }}
                  onWardChange={(value) => {
                    setWard(value);
                    markManualAddress();
                  }}
                  inputClassName={inputCls}
                  labelClassName={labelCls}
                  wrapperClassName="mt-4 grid gap-4 sm:grid-cols-2"
                  required
                />

                <div className="mt-4">
                  <label className={labelCls}>Số điện thoại</label>
                  <input
                    className={inputCls}
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      markManualAddress();
                    }}
                  />
                </div>

                {shouldAskToSaveInfo && (
                  <label className="mt-5 flex items-start gap-3 border border-[#E6DCCF] bg-[#F7F3EE] p-4 font-sans text-sm text-[#4E4842]">
                    <input
                      type="checkbox"
                      checked={saveCustomerInfo}
                      onChange={(event) => setSaveCustomerInfo(event.target.checked)}
                      className="mt-1"
                    />
                    <span>Lưu thông tin giao hàng.</span>
                  </label>
                )}
              </Panel>
            )}

            {step === 2 && (
              <Panel title="2. Vận chuyển">
                <Choice
                  active={shipping === "standard"}
                  icon={<Truck size={22} />}
                  title="Giao hàng tiêu chuẩn"
                  detail="2-3 ngày làm việc"
                  price="Miễn phí"
                  onClick={() => setShipping("standard")}
                />
                <Choice
                  active={shipping === "express"}
                  icon={<Truck size={22} />}
                  title="Giao hàng nhanh"
                  detail="Trong 24 giờ nội thành"
                  price={vnd(shippingFees.express)}
                  onClick={() => setShipping("express")}
                />
              </Panel>
            )}

            {step === 3 && (
              <Panel title="3. Thanh toán">
                <Choice
                  active={method === "cod"}
                  icon={<Banknote size={22} />}
                  title="Thanh toán khi nhận hàng (COD)"
                  detail="Trả tiền mặt khi nhận sản phẩm"
                  onClick={() => setMethod("cod")}
                />
                <Choice
                  active={method === "bank_qr"}
                  icon={<CreditCard size={22} />}
                  title="Chuyển khoản QR (VietQR)"
                  detail="Quét mã QR sau khi đặt đơn"
                  onClick={() => setMethod("bank_qr")}
                />
                <div className="mt-6">
                  <label className={labelCls}>Ghi chú đơn hàng (tùy chọn)</label>
                  <textarea
                    className={inputCls + " min-h-[90px] resize-y"}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </Panel>
            )}

            {step === 4 && (
              <Panel title="4. Xác nhận đơn hàng">
                <div className="space-y-4 font-sans text-sm text-[#1C1C19]">
                  <SummaryRow label="Người nhận" value={fullName} />
                  <SummaryRow label="Email" value={email} />
                  <SummaryRow label="Điện thoại" value={phone} />
                  <SummaryRow
                    label="Địa chỉ"
                    value={[addressLine, addressCity].filter(Boolean).join(" - ")}
                  />
                  <SummaryRow
                    label="Vận chuyển"
                    value={shipping === "standard" ? "Tiêu chuẩn" : "Giao nhanh"}
                  />
                  <SummaryRow label="Thanh toán" value={method === "cod" ? "COD" : "VietQR"} />
                </div>
              </Panel>
            )}

            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={() => (step === 1 ? navigate("/cart") : setStep((current) => current - 1))}
                className="border border-[#735C00] px-7 py-3 font-sans text-xs uppercase tracking-[2px] text-[#735C00]"
              >
                {step === 1 ? "Quay lại giỏ" : "Quay lại"}
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={step === 3 && method === "bank_qr" ? placeOrder : nextStep}
                  disabled={submitting}
                  className="bg-[#735C00] px-7 py-3 font-sans text-xs uppercase tracking-[2px] text-white disabled:opacity-60"
                >
                  {submitting
                    ? "Đang xử lý..."
                    : step === 3 && method === "bank_qr"
                      ? "Tạo mã QR"
                      : "Tiếp tục"}
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#735C00] px-7 py-3 font-sans text-xs uppercase tracking-[2px] text-white disabled:opacity-60"
                >
                  <Lock size={15} />
                  {submitting ? "Đang xử lý..." : "Đặt hàng"}
                </button>
              )}
            </div>
          </div>

          <aside className="min-w-0 lg:col-span-2">
            <div className="bg-[#F7F3EE] border border-[rgba(208,197,175,0.4)] p-6 lg:sticky lg:top-6">
              <h2 className="font-serif text-2xl text-[#1C1C19] mb-6">Đơn hàng của bạn</h2>

              <div className="space-y-4 max-h-[320px] overflow-auto pr-1">
                {items.map((it) => {
                  const priced = quotedByVariant.get(it.variant);
                  return (
                    <div key={it.variant} className="flex gap-4">
                      <div className="w-16 h-20 bg-white flex items-center justify-center shrink-0">
                        <img
                          loading="lazy"
                          src={it.image || PLACEHOLDER}
                          alt={it.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                          }}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base text-[#1C1C19] truncate">{it.name}</h3>
                        <p className="font-sans uppercase tracking-[1px] text-[11px] text-[#5F5E5E] mt-0.5">
                          {it.volume}
                        </p>
                        <div className="mt-2 inline-flex h-8 items-center border border-[#D8CBB7] bg-white">
                          <button
                            type="button"
                            onClick={() => void updateCheckoutQuantity(it, it.quantity - 1)}
                            className="flex h-full w-8 items-center justify-center text-[#735C00] transition hover:bg-[#F7F3EE]"
                            aria-label="Giảm số lượng"
                          >
                            -
                          </button>
                          <span className="flex h-full min-w-9 items-center justify-center border-x border-[#E6DCCF] px-2 font-sans text-xs text-[#1C1C19]">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateCheckoutQuantity(it, it.quantity + 1)}
                            disabled={typeof it.stock === "number" && it.quantity >= it.stock}
                            className="flex h-full w-8 items-center justify-center text-[#735C00] transition hover:bg-[#F7F3EE] disabled:cursor-not-allowed disabled:text-[#C7BCA9]"
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                        {priced?.promotionName && (
                          <p className="mt-1 text-[10px] text-[#8B1E1E]">{priced.promotionName}</p>
                        )}
                      </div>
                      <div className="text-right font-sans text-sm whitespace-nowrap">
                        <span
                          className={priced?.discountPercent ? "text-[#8B1E1E]" : "text-[#1C1C19]"}
                        >
                          {vnd(priced?.lineTotal ?? it.price * it.quantity)}
                        </span>
                        {!!priced?.discountPercent && (
                          <span className="block text-[10px] text-[#8D887F] line-through">
                            {vnd(priced.lineOriginal)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 border-t border-[rgba(208,197,175,0.5)] pt-5">
                <div className="flex gap-2">
                  <input
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyVoucher()}
                    disabled={!!voucherCode}
                    placeholder="Mã ưu đãi"
                    className="min-w-0 flex-1 border border-[#D8CBB7] bg-white px-3 py-2.5 font-sans text-xs uppercase outline-none focus:border-[#735C00]"
                  />
                  {voucherCode ? (
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="border border-[#8B1E1E] px-3 text-xs text-[#8B1E1E]"
                    >
                      Bỏ mã
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyVoucher}
                      disabled={quoteLoading}
                      className="bg-[#1C1C19] px-4 text-xs uppercase text-white disabled:opacity-50"
                    >
                      Áp dụng
                    </button>
                  )}
                </div>
                {quote?.voucher && (
                  <p className="mt-2 text-xs text-[#735C00]">
                    {quote.voucher.name} · {quote.voucher.code}
                  </p>
                )}
              </div>

              <div className="border-t border-[rgba(208,197,175,0.5)] mt-6 pt-5 space-y-3 font-sans text-sm">
                <SummaryRow
                  label={`Giá niêm yết (${quote?.count ?? count} sản phẩm)`}
                  value={vnd(quote?.originalTotal ?? total)}
                />
                {!!quote?.productLevelDiscount && (
                  <SummaryRow
                    label="Ưu đãi sản phẩm"
                    value={`-${vnd(quote.productLevelDiscount)}`}
                  />
                )}
                {!!quote?.voucherDiscount && (
                  <SummaryRow
                    label={`Voucher ${quote.voucher?.code || ""}`}
                    value={`-${vnd(quote.voucherDiscount)}`}
                  />
                )}
                <SummaryRow
                  label="Phí vận chuyển"
                  value={shippingFee ? vnd(shippingFee) : "Miễn phí"}
                />
                {!!quote?.shippingDiscount && (
                  <SummaryRow label="Ưu đãi vận chuyển" value={`-${vnd(quote.shippingDiscount)}`} />
                )}
                <div className="flex justify-between items-center border-t border-[rgba(208,197,175,0.5)] pt-4 mt-1">
                  <span className="font-serif text-lg text-[#1C1C19]">Tổng cộng</span>
                  <span className="font-serif text-2xl text-[#1C1C19]">{vnd(grandTotal)}</span>
                </div>
              </div>

              <p className="flex items-center justify-center gap-2 font-sans text-[11px] text-[#5F5E5E] mt-5">
                <ShieldCheck size={14} /> Thanh toán an toàn & bảo mật
              </p>
            </div>
          </aside>
        </div>
      </section>
      {pendingQr && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-[520px] overflow-auto border border-[#D8CBB7] bg-[#FDF9F4] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-[#E6DCCF] pb-4">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[2px] text-[#8B7200]">
                  Bước 3 · Chuyển khoản QR
                </p>
                <h2 className="mt-2 font-serif text-2xl text-[#1C1C19]">Quét mã để thanh toán</h2>
              </div>
              <button
                type="button"
                onClick={cancelPendingQr}
                disabled={cancellingQr}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#D9D0C3] text-[#5F5E5E] disabled:opacity-50"
                aria-label="Hủy thanh toán QR"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[210px_1fr]">
              <div className="bg-white p-3">
                {pendingQr.qrUrl ? (
                  <img
                    loading="lazy"
                    src={pendingQr.qrUrl}
                    alt="VietQR"
                    className="aspect-square w-full object-contain"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-[#F3EEE8] text-center text-xs text-[#7A7168]">
                    Chưa tải được mã QR
                  </div>
                )}
              </div>

              <div className="space-y-3 font-sans text-sm">
                <QrRow label="Số tiền" value={vnd(pendingQr.amount)} strong />
                <QrRow label="Số tài khoản" value={pendingQr.bank.accountNo || "Chưa cấu hình"} />
                <QrRow
                  label="Chủ tài khoản"
                  value={pendingQr.bank.accountName || "Chưa cấu hình"}
                />
                <QrRow label="Nội dung CK" value={pendingQr.transferContent} />
              </div>
            </div>

            <p className="mt-5 bg-[#F3EEE8] px-4 py-3 font-sans text-xs leading-5 text-[#675F57]">
              SePay sẽ ghi nhận giao dịch. Trạng thái chỉ chuyển thành đã thanh toán sau khi quản
              trị viên đối soát và xác nhận.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={cancelPendingQr}
                disabled={cancellingQr}
                className="border border-[#735C00] px-5 py-3 font-sans text-xs uppercase tracking-[2px] text-[#735C00] disabled:opacity-60"
              >
                {cancellingQr ? "Đang hủy..." : "Hủy"}
              </button>
              <button
                type="button"
                onClick={confirmQrPaid}
                className="bg-[#735C00] px-5 py-3 font-sans text-xs uppercase tracking-[2px] text-white"
              >
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 border border-[rgba(208,197,175,0.4)] bg-white p-4 sm:p-6">
      <h2 className="mb-6 font-serif text-2xl text-[#1C1C19]">{title}</h2>
      {children}
    </section>
  );
}

function Choice({
  active,
  icon,
  title,
  detail,
  price,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  detail: string;
  price?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "mb-3 flex min-w-0 w-full items-center gap-3 border px-4 py-4 text-left duration-200 sm:gap-4 sm:px-5 " +
        (active
          ? "border-[#735C00] bg-[#F7F3EE]"
          : "border-[rgba(208,197,175,0.6)] bg-white hover:border-[#735C00]/50")
      }
    >
      <span className="text-[#735C00] shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans font-semibold text-[#1C1C19]">{title}</span>
        <span className="block font-sans text-xs text-[#5F5E5E] mt-0.5">{detail}</span>
      </span>
      {price && <span className="font-sans text-sm text-[#735C00]">{price}</span>}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-1 text-[#5F5E5E] sm:flex-row sm:gap-5">
      <span>{label}</span>
      <span className="break-words text-[#1C1C19] sm:text-right">{value}</span>
    </div>
  );
}

function QrRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="border-b border-[#E6DCCF] pb-3">
      <p className="text-[10px] uppercase tracking-[1.4px] text-[#8A8178]">{label}</p>
      <p className={`mt-1 break-words text-[#1C1C19] ${strong ? "font-semibold" : ""}`}>{value}</p>
    </div>
  );
}
