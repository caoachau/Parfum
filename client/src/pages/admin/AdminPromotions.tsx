import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  adminApi,
  apiMessage,
  formatDate,
  formatVnd,
  type AdminCategory,
  type AdminProduct,
  type AdminVariant,
  type Paginated,
} from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "../../components/admin/ui";

type Tab = "vouchers" | "discounts" | "flash-sales" | "price-history";
type Voucher = {
  _id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageLimitPerUser: number;
  usedCount: number;
  stackable: boolean;
  userSegment: string;
  appliesToNewMembers: boolean;
  isPrivate: boolean;
  isConcentratedPromotion: boolean;
  isActive: boolean;
};
type Discount = {
  _id: string;
  name: string;
  scope: "PRODUCT" | "CATEGORY";
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscountAmount: number;
  products: { _id: string; name: string }[];
  categories: { _id: string; name: string }[];
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isConcentratedPromotion: boolean;
  referencePriceConfirmed: boolean;
  referencePriceNote: string;
};
type FlashSale = {
  _id: string;
  name: string;
  variant: any;
  originalPrice: number;
  flashPrice: number;
  stockAllocated: number;
  soldCount: number;
  remaining: number;
  maxPerUser: number;
  startTime: string;
  endTime: string;
  status: string;
  statusReason?: string;
  isActive: boolean;
  isConcentratedPromotion: boolean;
  referencePriceConfirmed: boolean;
  referencePriceNote: string;
};
type History = {
  _id: string;
  variant: any;
  basePrice: number;
  validFrom: string;
  validTo: string | null;
  reason: string;
};
type HistoryGroup = { key: string; product: string; detail: string; rows: History[] };

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "vouchers", label: "Voucher" },
  { id: "discounts", label: "Giảm giá sản phẩm" },
  { id: "flash-sales", label: "Flash Sale" },
  { id: "price-history", label: "Lịch sử giá" },
];
const flashStatusLabel = (status: string) =>
  ({
    ACTIVE: "Đang chạy",
    UPCOMING: "Sắp diễn ra",
    ENDED: "Đã kết thúc",
    EXPIRED: "Đã hết hạn",
    INACTIVE: "Đã tắt",
  })[status] || status;
const localDateTime = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date();
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
};
const future = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateTime(date);
};
const ids = (values: any[] = []) => values.map((item) => String(item?._id || item));

const emptyVoucher = () => ({
  code: "",
  name: "",
  type: "percentage",
  value: "10",
  minOrderValue: "0",
  maxDiscountAmount: "0",
  startDate: localDateTime(),
  endDate: future(30),
  usageLimit: "0",
  usageLimitPerUser: "1",
  stackable: true,
  userSegment: "ALL",
  appliesToNewMembers: false,
  isPrivate: false,
  isActive: true,
});
const emptyDiscount = () => ({
  name: "",
  scope: "PRODUCT" as const,
  type: "PERCENTAGE" as const,
  value: "10",
  maxDiscountAmount: "0",
  products: [] as string[],
  categories: [] as string[],
  priority: "0",
  startDate: localDateTime(),
  endDate: future(30),
  isActive: true,
  isConcentratedPromotion: false,
  referencePriceConfirmed: false,
  referencePriceNote: "",
});
const emptyFlash = () => ({
  name: "",
  variant: "",
  flashPrice: "",
  stockAllocated: "1",
  maxPerUser: "1",
  startTime: localDateTime(),
  endTime: future(1),
  isActive: true,
  isConcentratedPromotion: false,
  referencePriceConfirmed: false,
  referencePriceNote: "",
});
const emptyVariant = () => ({
  product: "",
  sku: "",
  volume: "",
  price: "",
  costPrice: "0",
  stock: "0",
  reason: "Tạo biến thể mới",
});

// Chọn nhiều bằng ô tìm kiếm + checkbox + chip, thay cho Select multiple (Ctrl+click) khó dùng.
function SearchableMultiSelect({
  value,
  options,
  onChange,
  emptyLabel,
}: {
  value: string[];
  options: { id: string; name: string }[];
  onChange: (value: string[]) => void;
  emptyLabel: string;
}) {
  const [query, setQuery] = useState("");
  const selected = options.filter((option) => value.includes(option.id));
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.name.toLowerCase().includes(term)) : options;
  }, [query, options]);
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  return (
    <div className="rounded-lg border border-gray-300 p-3">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-xs text-gray-400">{emptyLabel}</span>
        ) : (
          selected.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white"
            >
              {option.name}
              <button
                type="button"
                className="text-white/70 hover:text-white"
                onClick={() => toggle(option.id)}
                aria-label="Bỏ chọn"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <Input
        placeholder="Tìm nhanh theo tên..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Đã chọn {selected.length} mục</span>
        {value.length > 0 && (
          <button type="button" className="hover:text-gray-700" onClick={() => onChange([])}>
            Bỏ chọn tất cả
          </button>
        )}
      </div>
      <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-3 text-center text-xs text-gray-400">Không tìm thấy kết quả</p>
        ) : (
          filtered.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={value.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span>{option.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function EvidenceFields({ form, set }: { form: any; set: (patch: any) => void }) {
  return (
    <details className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
      <summary className="cursor-pointer select-none text-sm font-medium text-gray-700">
        Tùy chọn nâng cao · Tuân thủ giá khuyến mại (không bắt buộc)
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs leading-5 text-gray-500">
          Các mục dưới đây chỉ phục vụ tuân thủ pháp lý (Nghị định 81) và{" "}
          <strong>không bắt buộc</strong> để tạo ưu đãi. Bạn có thể bỏ qua và tạo ngay.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isConcentratedPromotion}
            onChange={(e) => set({ isConcentratedPromotion: e.target.checked })}
          />
          <span>
            Chương trình khuyến mại tập trung (được phép giảm sâu hơn mức thông thường 50%)
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.referencePriceConfirmed}
            onChange={(e) => set({ referencePriceConfirmed: e.target.checked })}
          />
          <span>Có chứng từ giá đã bán thực tế ngoài hệ thống</span>
        </label>
        {form.referencePriceConfirmed && (
          <Field
            label="Ghi chú chứng cứ"
            hint="Ví dụ: số hóa đơn, thời gian bán, nguồn dữ liệu đối chiếu"
          >
            <Textarea
              rows={3}
              value={form.referencePriceNote}
              onChange={(e) => set({ referencePriceNote: e.target.value })}
            />
          </Field>
        )}
      </div>
    </details>
  );
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      {children}
    </div>
  );
}

// Thẻ lịch sử giá: giá hiện tại, xu hướng, mức thay đổi và timeline thu gọn.
function PriceHistoryCard({
  group,
  onAdjust,
}: {
  group: HistoryGroup;
  onAdjust: (target: { id: string; label: string; current: number }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const current = group.rows[0];
  const previous = group.rows[1];
  const delta = previous ? current.basePrice - previous.basePrice : 0;
  const percent = previous?.basePrice ? (delta / previous.basePrice) * 100 : 0;
  const visibleRows = expanded ? group.rows : group.rows.slice(0, 3);
  const sparkValues = group.rows
    .slice(0, 8)
    .map((row) => row.basePrice)
    .reverse();
  const max = Math.max(...sparkValues, 1);
  const min = Math.min(...sparkValues);
  const range = max - min || 1;

  return (
    <Card className="rounded-lg p-5 shadow-none transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{group.product}</p>
          <p className="text-xs text-gray-500">{group.detail}</p>
        </div>

        {sparkValues.length > 1 && (
          <div className="flex h-8 shrink-0 items-end gap-0.5" aria-hidden="true">
            {sparkValues.map((value, index) => (
              <span
                key={`${value}-${index}`}
                className={`w-1 rounded-sm ${
                  index === sparkValues.length - 1 ? "bg-gray-900" : "bg-gray-200"
                }`}
                style={{ height: 6 + ((value - min) / range) * 26 }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{formatVnd(current.basePrice)}</p>
          {previous ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge color={delta > 0 ? "red" : delta < 0 ? "green" : "gray"}>
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"} {formatVnd(Math.abs(delta))}
                {delta !== 0 && ` (${delta > 0 ? "+" : "-"}${Math.abs(percent).toFixed(1)}%)`}
              </Badge>
              <span className="text-gray-400">so với lần trước</span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Mốc giá khởi tạo</p>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            onAdjust({
              id: group.key,
              label: `${group.product} · ${group.detail}`,
              current: current.basePrice,
            })
          }
        >
          Điều chỉnh giá
        </Button>
      </div>

      <ol className="mt-4 space-y-3 border-l border-gray-200 pl-4">
        {visibleRows.map((row, index) => {
          const older = group.rows[index + 1];
          const rowDelta = older ? row.basePrice - older.basePrice : 0;

          return (
            <li key={row._id} className="relative">
              <span
                className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                  index === 0 ? "bg-emerald-500" : "bg-gray-300"
                }`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium tabular-nums">{formatVnd(row.basePrice)}</span>
                {rowDelta !== 0 && (
                  <Badge color={rowDelta > 0 ? "red" : "green"}>
                    {rowDelta > 0 ? "▲" : "▼"} {formatVnd(Math.abs(rowDelta))}
                  </Badge>
                )}
                {index === 0 && <Badge color="green">Hiện tại</Badge>}
              </div>
              <p className="text-xs text-gray-500">
                {formatDate(row.validFrom)} → {row.validTo ? formatDate(row.validTo) : "nay"}
              </p>
              <p className="text-xs text-gray-600">Lý do: {row.reason || "—"}</p>
            </li>
          );
        })}
      </ol>

      {group.rows.length > 3 && (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-900"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Thu gọn" : `Xem thêm ${group.rows.length - 3} lần điều chỉnh`}
        </button>
      )}
    </Card>
  );
}

export default function AdminPromotions() {
  const { tab: routeTab } = useParams();
  const tab = tabs.some((item) => item.id === routeTab) ? (routeTab as Tab) : "vouchers";
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [voucherForm, setVoucherForm] = useState(emptyVoucher());
  const [discountForm, setDiscountForm] = useState(emptyDiscount());
  const [flashForm, setFlashForm] = useState(emptyFlash());
  const [historyVariant, setHistoryVariant] = useState("");
  const [variantModal, setVariantModal] = useState(false);
  const [variantForm, setVariantForm] = useState(emptyVariant());
  const [savingVariant, setSavingVariant] = useState(false);
  const [priceTarget, setPriceTarget] = useState<{
    id: string;
    label: string;
    current: number;
  } | null>(null);
  const [priceForm, setPriceForm] = useState({ price: "", reason: "" });
  const [savingPrice, setSavingPrice] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState<"recent" | "change" | "name">("recent");

  async function allProducts() {
    const first = await adminApi.get<Paginated<AdminProduct>>("/products", { page: 1, limit: 100 });
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
        adminApi.get<Paginated<AdminProduct>>("/products", { page: index + 2, limit: 100 }),
      ),
    );
    return [first, ...rest].flatMap((page) => page.data);
  }
  async function load() {
    try {
      setLoading(true);
      const [v, d, f, h, p, c, vr] = await Promise.all([
        adminApi.get<Voucher[]>("/promotions/vouchers"),
        adminApi.get<Discount[]>("/promotions/discounts"),
        adminApi.get<FlashSale[]>("/promotions/flash-sales"),
        adminApi.get<History[]>("/promotions/price-history", {
          variant: historyVariant || undefined,
        }),
        allProducts(),
        adminApi.get<AdminCategory[]>("/categories"),
        adminApi.get<AdminVariant[]>("/variants"),
      ]);
      setVouchers(v);
      setDiscounts(d);
      setFlashSales(f);
      setHistory(h);
      setProducts(p);
      setCategories(c);
      setVariants(vr);
    } catch (error) {
      toast.error(apiMessage(error, "Không tải được chương trình ưu đãi"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [historyVariant]);

  const productOptions = products.map((item) => ({ id: item.id, name: item.name }));
  const categoryOptions = categories.map((item) => ({ id: item.id, name: item.name }));
  const variantName = (item: AdminVariant) =>
    `${item.product?.name || "Sản phẩm"} · ${item.volume || item.sku} · ${formatVnd(item.price)}`;
  const selectedFlashVariant = variants.find((item) => item.id === flashForm.variant);
  // Gom lịch sử giá theo từng biến thể để hiển thị dạng thẻ + timeline thân thiện.
  const historyGroups = useMemo(() => {
    const map = new Map<string, HistoryGroup>();
    for (const row of history) {
      const key = String(row.variant?._id || row.variant || "?");
      if (!map.has(key))
        map.set(key, {
          key,
          product: row.variant?.product?.name || "Biến thể",
          detail: row.variant?.volume || row.variant?.sku || "",
          rows: [],
        });
      map.get(key)!.rows.push(row);
    }
    for (const group of map.values())
      group.rows.sort((a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime());
    return Array.from(map.values()).sort((a, b) => a.product.localeCompare(b.product));
  }, [history]);

  const historyStats = useMemo(() => {
    let totalAdjustments = 0;
    let biggestUp: { group: HistoryGroup; delta: number } | null = null;
    let biggestDown: { group: HistoryGroup; delta: number } | null = null;

    for (const group of historyGroups) {
      totalAdjustments += group.rows.length;
      const [latest, previous] = group.rows;
      if (!previous) continue;

      const delta = latest.basePrice - previous.basePrice;
      if (delta > 0 && (!biggestUp || delta > biggestUp.delta)) {
        biggestUp = { group, delta };
      }
      if (delta < 0 && (!biggestDown || delta < biggestDown.delta)) {
        biggestDown = { group, delta };
      }
    }

    return {
      totalVariants: historyGroups.length,
      totalAdjustments,
      biggestUp,
      biggestDown,
    };
  }, [historyGroups]);

  const visibleHistoryGroups = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    const filtered = term
      ? historyGroups.filter(
          (group) =>
            group.product.toLowerCase().includes(term) || group.detail.toLowerCase().includes(term),
        )
      : historyGroups;
    const list = [...filtered];

    if (historySort === "name") {
      list.sort((left, right) => left.product.localeCompare(right.product));
    } else if (historySort === "change") {
      list.sort((left, right) => {
        const leftDelta = left.rows[1]
          ? Math.abs(left.rows[0].basePrice - left.rows[1].basePrice)
          : 0;
        const rightDelta = right.rows[1]
          ? Math.abs(right.rows[0].basePrice - right.rows[1].basePrice)
          : 0;
        return rightDelta - leftDelta;
      });
    } else {
      list.sort(
        (left, right) =>
          new Date(right.rows[0].validFrom).getTime() - new Date(left.rows[0].validFrom).getTime(),
      );
    }

    return list;
  }, [historyGroups, historySearch, historySort]);

  function openCreate() {
    setEditing(null);
    if (tab === "vouchers") setVoucherForm(emptyVoucher());
    if (tab === "discounts") setDiscountForm(emptyDiscount());
    if (tab === "flash-sales") setFlashForm(emptyFlash());
    setModal(true);
  }
  function openEdit(item: any) {
    setEditing(item);
    if (tab === "vouchers")
      setVoucherForm({
        code: item.code,
        name: item.name || "",
        type: item.type === "percent" ? "percentage" : item.type,
        value: String(item.value || 0),
        minOrderValue: String(item.minOrder || 0),
        maxDiscountAmount: String(item.maxDiscount || 0),
        startDate: localDateTime(item.startDate || item.createdAt),
        endDate: localDateTime(item.endDate || item.expiresAt),
        usageLimit: String(item.usageLimit || 0),
        usageLimitPerUser: String(item.usageLimitPerUser || 0),
        stackable: item.stackable !== false,
        userSegment: item.userSegment || "ALL",
        appliesToNewMembers: Boolean(item.appliesToNewMembers),
        isPrivate: Boolean(item.isPrivate),
        isActive: item.isActive !== false,
      });
    if (tab === "discounts")
      setDiscountForm({
        name: item.name,
        scope: item.scope,
        type: item.type,
        value: String(item.value),
        maxDiscountAmount: String(item.maxDiscountAmount || 0),
        products: ids(item.products),
        categories: ids(item.categories),
        priority: String(item.priority || 0),
        startDate: localDateTime(item.startDate),
        endDate: localDateTime(item.endDate),
        isActive: item.isActive !== false,
        isConcentratedPromotion: Boolean(item.isConcentratedPromotion),
        referencePriceConfirmed: Boolean(item.referencePriceConfirmed),
        referencePriceNote: item.referencePriceNote || "",
      });
    if (tab === "flash-sales")
      setFlashForm({
        name: item.name,
        variant: String(item.variant?._id || item.variant),
        flashPrice: String(item.flashPrice),
        stockAllocated: String(item.stockAllocated),
        maxPerUser: String(item.maxPerUser || 0),
        startTime: localDateTime(item.startTime),
        endTime: localDateTime(item.endTime),
        isActive: item.isActive !== false,
        isConcentratedPromotion: Boolean(item.isConcentratedPromotion),
        referencePriceConfirmed: Boolean(item.referencePriceConfirmed),
        referencePriceNote: item.referencePriceNote || "",
      });
    setModal(true);
  }

  async function save() {
    try {
      setSaving(true);
      const section =
        tab === "vouchers" ? "vouchers" : tab === "discounts" ? "discounts" : "flash-sales";
      const raw: any =
        tab === "vouchers" ? voucherForm : tab === "discounts" ? discountForm : flashForm;
      if (tab === "flash-sales") {
        if (!flashForm.variant) throw new Error("Vui lòng chọn biến thể");
        if (
          selectedFlashVariant &&
          Number(flashForm.flashPrice || 0) >= selectedFlashVariant.price
        ) {
          throw new Error("Giá Flash Sale phải thấp hơn giá niêm yết");
        }
        if (
          selectedFlashVariant &&
          Number(flashForm.stockAllocated || 0) > selectedFlashVariant.stock
        ) {
          throw new Error(
            `Tồn phân bổ không được vượt quá tồn kho hiện tại (${selectedFlashVariant.stock})`,
          );
        }
      }
      const payload: any = { ...raw };
      if (tab === "vouchers") {
        payload.userSegment = voucherForm.userSegment === "NEW" ? "NEW" : "ALL";
        payload.isPrivate = false;
      }
      for (const key of [
        "value",
        "minOrderValue",
        "maxDiscountAmount",
        "usageLimit",
        "usageLimitPerUser",
        "priority",
        "flashPrice",
        "stockAllocated",
        "maxPerUser",
      ]) {
        if (key in payload) payload[key] = Number(payload[key] || 0);
      }
      const saved: any = editing
        ? await adminApi.put(`/promotions/${section}/${editing._id}`, payload)
        : await adminApi.post(`/promotions/${section}`, payload);
      const delivery = saved?.notificationDelivery;
      if (delivery?.sentCount > 0) {
        toast.success(
          `${editing ? "Đã cập nhật" : "Đã tạo"} ưu đãi và gửi email cho ${delivery.sentCount}/${delivery.recipientCount} khách hàng`,
        );
      } else if (delivery?.reason === "smtp_not_configured") {
        toast.error(
          `${editing ? "Đã cập nhật" : "Đã tạo"} ưu đãi nhưng chưa gửi email: SMTP chưa được cấu hình.`,
        );
      } else if (delivery?.reason === "delivery_failed") {
        toast.error(
          `${editing ? "Đã cập nhật" : "Đã tạo"} ưu đãi nhưng máy chủ email từ chối gửi.`,
        );
      } else if (delivery?.reason === "no_recipients") {
        toast.success(
          `${editing ? "Đã cập nhật" : "Đã tạo"} ưu đãi. Chưa có khách hàng bật thông báo khuyến mãi.`,
        );
      } else {
        toast.success(editing ? "Đã cập nhật ưu đãi" : "Đã tạo ưu đãi");
      }
      setModal(false);
      await load();
    } catch (error) {
      toast.error(
        apiMessage(error, error instanceof Error ? error.message : "Không lưu được ưu đãi"),
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    try {
      const section =
        tab === "vouchers" ? "vouchers" : tab === "discounts" ? "discounts" : "flash-sales";
      await adminApi.del(`/promotions/${section}/${deleting._id}`);
      toast.success("Đã xóa ưu đãi");
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Không xóa được ưu đãi"));
    }
  }

  function openVariantCreate() {
    setVariantForm(emptyVariant());
    setVariantModal(true);
  }
  async function saveVariant() {
    if (!variantForm.product || !variantForm.sku || !variantForm.price) {
      toast.error("Vui lòng chọn sản phẩm, nhập SKU và giá");
      return;
    }
    try {
      setSavingVariant(true);
      await adminApi.post("/variants", {
        product: variantForm.product,
        sku: variantForm.sku.trim(),
        volume: variantForm.volume.trim() || undefined,
        price: Number(variantForm.price || 0),
        costPrice: Number(variantForm.costPrice || 0),
        stock: Number(variantForm.stock || 0),
        priceHistoryReason: variantForm.reason.trim() || undefined,
      });
      toast.success("Đã thêm biến thể mới");
      setVariantModal(false);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Không thêm được biến thể"));
    } finally {
      setSavingVariant(false);
    }
  }

  function openPriceAdjust(target: { id: string; label: string; current: number }) {
    setPriceTarget(target);
    setPriceForm({ price: String(target.current || ""), reason: "" });
  }
  async function savePrice() {
    if (!priceTarget) return;
    if (!priceForm.price || Number(priceForm.price) <= 0) {
      toast.error("Nhập giá mới hợp lệ");
      return;
    }
    if (!priceForm.reason.trim()) {
      toast.error("Vui lòng nhập lý do điều chỉnh giá");
      return;
    }
    try {
      setSavingPrice(true);
      await adminApi.put(`/variants/${priceTarget.id}`, {
        price: Number(priceForm.price),
        priceHistoryReason: priceForm.reason.trim(),
      });
      toast.success("Đã điều chỉnh giá & ghi vào lịch sử");
      setPriceTarget(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Không điều chỉnh được giá"));
    } finally {
      setSavingPrice(false);
    }
  }

  const headerActions =
    tab === "price-history" ? (
      <Button onClick={openVariantCreate}>+ Thêm biến thể</Button>
    ) : (
      <Button onClick={openCreate}>+ Tạo mới</Button>
    );

  return (
    <div>
      <PageHeader
        title="Ưu đãi & Voucher"
        subtitle="Giá niêm yết không bị ghi đè; mọi ưu đãi được resolve và snapshot khi đặt hàng"
        actions={headerActions}
      />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b">
        {tabs.map((item) => (
          <a
            key={item.id}
            href={`/admin/promotions/${item.id}`}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === item.id ? "border-black text-black" : "border-transparent text-gray-500"}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        <>
          {tab === "flash-sales" && (
            <InfoNote>
              <strong>Flash Sale hoạt động thế nào?</strong> Một flash sale chỉ tự động áp dụng
              ngoài cửa hàng khi hội đủ: (1) <em>Kích hoạt</em> đang bật, (2) thời điểm hiện tại nằm
              trong khoảng Bắt đầu–Kết thúc, (3) còn tồn phân bổ (Đã bán &lt; Tồn phân bổ). Khi đó
              giá Flash luôn được ưu tiên cao hơn mọi Discount. Nếu flash "không chạy", hãy kiểm tra
              lại 3 điều kiện trên và đảm bảo giá Flash thấp hơn giá gốc.
            </InfoNote>
          )}
          {tab === "discounts" && (
            <InfoNote>
              <strong>Độ ưu tiên:</strong> khi một sản phẩm thuộc nhiều chương trình giảm giá cùng
              lúc, hệ thống chọn chương trình có <em>độ ưu tiên lớn nhất</em> (số càng lớn càng ưu
              tiên; bằng nhau thì lấy chương trình tạo trước). Flash Sale luôn thắng giảm giá sản
              phẩm. <br />
              <strong>Áp dụng nhiều sản phẩm trong 1 mã:</strong> chọn phạm vi "Sản phẩm" rồi tick
              nhiều sản phẩm trong ô tìm kiếm bên dưới (hoặc chọn phạm vi "Danh mục" để áp cho cả
              danh mục).
            </InfoNote>
          )}

          {(tab === "vouchers" || tab === "discounts" || tab === "flash-sales") && (
            <Card className="overflow-hidden rounded-md shadow-none">
              <div className="overflow-x-auto">
                {tab === "vouchers" && (
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-gray-400">
                        <th className="p-4">Mã</th>
                        <th>Tên</th>
                        <th>Ưu đãi</th>
                        <th>Điều kiện</th>
                        <th>Lượt dùng</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((item) => (
                        <tr key={item._id} className="border-b">
                          <td className="p-4 font-mono font-semibold">{item.code}</td>
                          <td>
                            {item.name || "—"}
                            {item.isPrivate && <p className="text-xs text-gray-400">Riêng tư</p>}
                            {item.appliesToNewMembers && (
                              <p className="text-xs font-medium text-amber-700">Thành viên mới</p>
                            )}
                          </td>
                          <td>
                            {item.type === "free_shipping"
                              ? "Miễn phí ship"
                              : item.type === "fixed"
                                ? formatVnd(item.value)
                                : `${item.value}%`}
                          </td>
                          <td>
                            Từ {formatVnd(item.minOrder)}
                            <p className="text-xs text-gray-400">
                              {item.stackable ? "Dùng chung ưu đãi" : "Không cộng dồn"} ·{" "}
                              {item.userSegment}
                            </p>
                          </td>
                          <td>
                            {item.usedCount || 0}/{item.usageLimit || "∞"}
                            <p className="text-xs text-gray-400">
                              Mỗi khách {item.usageLimitPerUser || "∞"}
                            </p>
                          </td>
                          <td>
                            {formatDate(item.startDate)}
                            <br />
                            {formatDate(item.endDate)}
                          </td>
                          <td>
                            <Badge color={item.isActive ? "green" : "gray"}>
                              {item.isActive ? "Đang bật" : "Đã tắt"}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button variant="secondary" onClick={() => openEdit(item)}>
                                Sửa
                              </Button>
                              <Button variant="danger" onClick={() => setDeleting(item)}>
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {tab === "discounts" && (
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-gray-400">
                        <th className="p-4">Chương trình</th>
                        <th>Phạm vi</th>
                        <th>Mức giảm</th>
                        <th>Độ ưu tiên</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((item) => (
                        <tr key={item._id} className="border-b">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td>
                            {item.scope === "PRODUCT"
                              ? `${item.products?.length || 0} sản phẩm`
                              : `${item.categories?.length || 0} danh mục`}
                          </td>
                          <td>
                            {item.type === "PERCENTAGE" ? `${item.value}%` : formatVnd(item.value)}
                          </td>
                          <td>{item.priority}</td>
                          <td>
                            {formatDate(item.startDate)}
                            <br />
                            {formatDate(item.endDate)}
                          </td>
                          <td>
                            <Badge color={item.isActive ? "green" : "gray"}>
                              {item.isActive ? "Đang bật" : "Đã tắt"}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button variant="secondary" onClick={() => openEdit(item)}>
                                Sửa
                              </Button>
                              <Button variant="danger" onClick={() => setDeleting(item)}>
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {tab === "flash-sales" && (
                  <table className="w-full min-w-[960px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-gray-400">
                        <th className="p-4">Flash sale</th>
                        <th>Sản phẩm</th>
                        <th>Giá gốc / Flash</th>
                        <th>Phân bổ</th>
                        <th>Mỗi khách</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {flashSales.map((item) => (
                        <tr key={item._id} className="border-b">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td>
                            {item.variant?.product?.name || "—"}
                            <p className="text-xs text-gray-400">
                              {item.variant?.volume || item.variant?.sku}
                            </p>
                          </td>
                          <td>
                            <span className="text-gray-400 line-through">
                              {formatVnd(item.originalPrice)}
                            </span>
                            <br />
                            <strong className="text-red-700">{formatVnd(item.flashPrice)}</strong>
                          </td>
                          <td>
                            {item.soldCount}/{item.stockAllocated}
                            <p className="text-xs text-gray-400">Còn {item.remaining}</p>
                          </td>
                          <td>{item.maxPerUser || "∞"}</td>
                          <td>
                            {formatDate(item.startTime)}
                            <br />
                            {formatDate(item.endTime)}
                          </td>
                          <td>
                            <Badge
                              color={
                                item.status === "ACTIVE"
                                  ? "green"
                                  : item.status === "UPCOMING"
                                    ? "blue"
                                    : "gray"
                              }
                            >
                              {flashStatusLabel(item.status)}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Button variant="secondary" onClick={() => openEdit(item)}>
                                Sửa
                              </Button>
                              <Button variant="danger" onClick={() => setDeleting(item)}>
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {tab === "price-history" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="rounded-md p-4 shadow-none">
                  <p className="text-xs text-gray-500">Biến thể đang theo dõi</p>
                  <p className="mt-1 text-2xl font-semibold">{historyStats.totalVariants}</p>
                </Card>
                <Card className="rounded-md p-4 shadow-none">
                  <p className="text-xs text-gray-500">Tổng số lần điều chỉnh</p>
                  <p className="mt-1 text-2xl font-semibold">{historyStats.totalAdjustments}</p>
                </Card>
                <Card className="rounded-md p-4 shadow-none">
                  <p className="text-xs text-gray-500">Tăng giá gần nhất, mạnh nhất</p>
                  {historyStats.biggestUp ? (
                    <>
                      <p className="mt-1 text-lg font-semibold text-red-700">
                        +{formatVnd(historyStats.biggestUp.delta)}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {historyStats.biggestUp.group.product}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">Chưa có</p>
                  )}
                </Card>
                <Card className="rounded-md p-4 shadow-none">
                  <p className="text-xs text-gray-500">Giảm giá gần nhất, mạnh nhất</p>
                  {historyStats.biggestDown ? (
                    <>
                      <p className="mt-1 text-lg font-semibold text-emerald-700">
                        {formatVnd(historyStats.biggestDown.delta)}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {historyStats.biggestDown.group.product}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">Chưa có</p>
                  )}
                </Card>
              </div>

              <Card className="flex flex-col gap-3 rounded-md p-4 shadow-none lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium">Lịch sử giá theo biến thể</p>
                  <p className="text-xs text-gray-500">
                    Mỗi lần điều chỉnh giá đều được ghi kèm thời điểm & lý do.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Tìm theo tên sản phẩm..."
                    value={historySearch}
                    onChange={(event) => setHistorySearch(event.target.value)}
                    className="sm:w-56"
                  />
                  <Select
                    value={historyVariant}
                    onChange={(event) => setHistoryVariant(event.target.value)}
                    className="sm:w-56"
                  >
                    <option value="">Tất cả biến thể</option>
                    {variants.map((item) => (
                      <option key={item.id} value={item.id}>
                        {variantName(item)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={historySort}
                    onChange={(event) =>
                      setHistorySort(event.target.value as "recent" | "change" | "name")
                    }
                    className="sm:w-48"
                  >
                    <option value="recent">Mới điều chỉnh nhất</option>
                    <option value="change">Biến động nhiều nhất</option>
                    <option value="name">Tên A-Z</option>
                  </Select>
                </div>
              </Card>

              {visibleHistoryGroups.length === 0 ? (
                <Card className="rounded-md p-10 text-center shadow-none">
                  <p className="text-sm font-medium text-gray-600">
                    {historySearch
                      ? "Không tìm thấy sản phẩm phù hợp"
                      : "Chưa có dữ liệu lịch sử giá"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {historySearch
                      ? "Thử từ khóa khác hoặc xóa bộ lọc."
                      : "Thêm biến thể mới để bắt đầu theo dõi lịch sử giá."}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleHistoryGroups.map((group) => (
                    <PriceHistoryCard key={group.key} group={group} onAdjust={openPriceAdjust} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        wide
        title={editing ? "Chỉnh sửa ưu đãi" : "Tạo ưu đãi"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        {tab === "vouchers" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mã voucher"
              hint="Khách sẽ nhập mã này ở bước thanh toán (tự động viết hoa)"
            >
              <Input
                value={voucherForm.code}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field
              label="Tên chương trình"
              hint="Tên nội bộ để nhận biết, không hiển thị cho khách"
            >
              <Input
                value={voucherForm.name}
                onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })}
              />
            </Field>
            <Field label="Loại">
              <Select
                value={voucherForm.type}
                onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value })}
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
                <option value="free_shipping">Miễn phí vận chuyển</option>
              </Select>
            </Field>
            <Field
              label="Giá trị"
              hint={
                voucherForm.type === "percentage"
                  ? "Nhập % (ví dụ 10 = giảm 10%). Voucher % tối đa 50% nếu không phải KM tập trung."
                  : voucherForm.type === "fixed"
                    ? "Nhập số tiền giảm (đồng)"
                    : "Miễn phí ship - không cần nhập giá trị"
              }
            >
              <Input
                type="number"
                disabled={voucherForm.type === "free_shipping"}
                value={voucherForm.value}
                onChange={(e) => setVoucherForm({ ...voucherForm, value: e.target.value })}
              />
            </Field>
            <Field
              label="Đơn tối thiểu"
              hint="Giá trị đơn hàng tối thiểu để dùng mã (0 = không yêu cầu)"
            >
              <Input
                type="number"
                value={voucherForm.minOrderValue}
                onChange={(e) => setVoucherForm({ ...voucherForm, minOrderValue: e.target.value })}
              />
            </Field>
            <Field
              label="Giảm tối đa"
              hint="Trần số tiền được giảm với voucher %; 0 = không giới hạn"
            >
              <Input
                type="number"
                value={voucherForm.maxDiscountAmount}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, maxDiscountAmount: e.target.value })
                }
              />
            </Field>
            <Field label="Bắt đầu">
              <Input
                type="datetime-local"
                value={voucherForm.startDate}
                onChange={(e) => setVoucherForm({ ...voucherForm, startDate: e.target.value })}
              />
            </Field>
            <Field label="Kết thúc">
              <Input
                type="datetime-local"
                value={voucherForm.endDate}
                onChange={(e) => setVoucherForm({ ...voucherForm, endDate: e.target.value })}
              />
            </Field>
            <Field
              label="Giới hạn toàn hệ thống"
              hint="Tổng số lượt dùng tối đa; 0 = không giới hạn"
            >
              <Input
                type="number"
                value={voucherForm.usageLimit}
                onChange={(e) => setVoucherForm({ ...voucherForm, usageLimit: e.target.value })}
              />
            </Field>
            <Field label="Giới hạn mỗi khách" hint="Số lần mỗi khách được dùng; 0 = không giới hạn">
              <Input
                type="number"
                value={voucherForm.usageLimitPerUser}
                onChange={(e) =>
                  setVoucherForm({ ...voucherForm, usageLimitPerUser: e.target.value })
                }
              />
            </Field>
            <Field
              label="Phân khúc khách"
              hint="Mới: chỉ khách chưa có đơn. Tất cả: áp dụng cho cả khách mới và khách đã có đơn."
            >
              <Select
                value={voucherForm.userSegment === "NEW" ? "NEW" : "ALL"}
                onChange={(e) => setVoucherForm({ ...voucherForm, userSegment: e.target.value })}
              >
                <option value="ALL">Tất cả khách hàng</option>
                <option value="NEW">Khách hàng mới</option>
              </Select>
            </Field>
            <div className="space-y-2 pt-6 sm:col-span-2">
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={voucherForm.stackable}
                  onChange={(e) => setVoucherForm({ ...voucherForm, stackable: e.target.checked })}
                />
                Cho dùng chung ưu đãi sản phẩm
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={voucherForm.appliesToNewMembers}
                  onChange={(e) =>
                    setVoucherForm({
                      ...voucherForm,
                      appliesToNewMembers: e.target.checked,
                    })
                  }
                />
                <span>
                  <strong>Áp dụng cho thành viên mới</strong>
                  <span className="block text-xs text-gray-500">
                    Tài khoản khách hàng chưa có đơn sẽ nhận mã khi cập nhật hồ sơ.
                  </span>
                </span>
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={voucherForm.isActive}
                  onChange={(e) => setVoucherForm({ ...voucherForm, isActive: e.target.checked })}
                />
                Kích hoạt
              </label>
            </div>
          </div>
        )}
        {tab === "discounts" && (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              1. Thông tin & giá trị
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên chương trình">
                <Input
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                />
              </Field>
              <Field
                label="Độ ưu tiên"
                hint="Số càng lớn càng ưu tiên khi 1 sản phẩm trúng nhiều chương trình giảm giá. Flash Sale luôn ưu tiên hơn."
              >
                <Input
                  type="number"
                  value={discountForm.priority}
                  onChange={(e) => setDiscountForm({ ...discountForm, priority: e.target.value })}
                />
              </Field>
              <Field
                label="Phạm vi"
                hint="Chọn Sản phẩm để áp cho các sản phẩm cụ thể, hoặc Danh mục để áp cả nhóm"
              >
                <Select
                  value={discountForm.scope}
                  onChange={(e) =>
                    setDiscountForm({
                      ...discountForm,
                      scope: e.target.value as any,
                      products: [],
                      categories: [],
                    })
                  }
                >
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="CATEGORY">Danh mục</option>
                </Select>
              </Field>
              <Field label="Loại giảm">
                <Select
                  value={discountForm.type}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, type: e.target.value as any })
                  }
                >
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (đ)</option>
                </Select>
              </Field>
              <Field
                label="Giá trị"
                hint={
                  discountForm.type === "PERCENTAGE"
                    ? "Nhập % (ví dụ 20 = giảm 20%). Tối đa 50% nếu không phải KM tập trung."
                    : "Nhập số tiền giảm (đồng)"
                }
              >
                <Input
                  type="number"
                  value={discountForm.value}
                  onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                />
              </Field>
              <Field
                label="Giảm tối đa"
                hint="Trần số tiền giảm cho giảm giá theo phần trăm; 0 = không giới hạn"
              >
                <Input
                  type="number"
                  value={discountForm.maxDiscountAmount}
                  onChange={(e) =>
                    setDiscountForm({ ...discountForm, maxDiscountAmount: e.target.value })
                  }
                />
              </Field>
              <Field label="Bắt đầu">
                <Input
                  type="datetime-local"
                  value={discountForm.startDate}
                  onChange={(e) => setDiscountForm({ ...discountForm, startDate: e.target.value })}
                />
              </Field>
              <Field label="Kết thúc">
                <Input
                  type="datetime-local"
                  value={discountForm.endDate}
                  onChange={(e) => setDiscountForm({ ...discountForm, endDate: e.target.value })}
                />
              </Field>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              2. Phạm vi áp dụng
            </p>
            <Field
              label={discountForm.scope === "PRODUCT" ? "Sản phẩm áp dụng" : "Danh mục áp dụng"}
              hint="Tìm và tick chọn nhiều mục; các mục đã chọn hiển thị dạng thẻ phía trên"
            >
              {discountForm.scope === "PRODUCT" ? (
                <SearchableMultiSelect
                  value={discountForm.products}
                  options={productOptions}
                  emptyLabel="Chưa chọn sản phẩm nào"
                  onChange={(value) => setDiscountForm({ ...discountForm, products: value })}
                />
              ) : (
                <SearchableMultiSelect
                  value={discountForm.categories}
                  options={categoryOptions}
                  emptyLabel="Chưa chọn danh mục nào"
                  onChange={(value) => setDiscountForm({ ...discountForm, categories: value })}
                />
              )}
            </Field>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={discountForm.isActive}
                onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
              />
              Kích hoạt
            </label>
            <EvidenceFields
              form={discountForm}
              set={(patch) => setDiscountForm({ ...discountForm, ...patch })}
            />
          </div>
        )}
        {tab === "flash-sales" && (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              1. Thông tin flash sale
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên Flash Sale">
                <Input
                  value={flashForm.name}
                  onChange={(e) => setFlashForm({ ...flashForm, name: e.target.value })}
                />
              </Field>
              <Field label="Biến thể" hint="Chọn biến thể sản phẩm sẽ chạy flash sale">
                <Select
                  value={flashForm.variant}
                  onChange={(e) => setFlashForm({ ...flashForm, variant: e.target.value })}
                >
                  <option value="">Chọn biến thể</option>
                  {variants.map((item) => (
                    <option key={item.id} value={item.id}>
                      {variantName(item)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Giá Flash Sale"
                hint="Phải thấp hơn giá gốc; không dưới 50% giá gốc nếu không phải KM tập trung"
              >
                <Input
                  type="number"
                  value={flashForm.flashPrice}
                  onChange={(e) => setFlashForm({ ...flashForm, flashPrice: e.target.value })}
                />
              </Field>
              <Field label="Tồn phân bổ" hint="Số lượng dành cho flash; bán hết là flash tự dừng">
                <Input
                  type="number"
                  value={flashForm.stockAllocated}
                  onChange={(e) => setFlashForm({ ...flashForm, stockAllocated: e.target.value })}
                />
              </Field>
              <Field
                label="Tối đa mỗi khách"
                hint="Số lượng tối đa 1 khách mua được; 0 = không giới hạn"
              >
                <Input
                  type="number"
                  value={flashForm.maxPerUser}
                  onChange={(e) => setFlashForm({ ...flashForm, maxPerUser: e.target.value })}
                />
              </Field>
              <Field label="Bắt đầu">
                <Input
                  type="datetime-local"
                  value={flashForm.startTime}
                  onChange={(e) => setFlashForm({ ...flashForm, startTime: e.target.value })}
                />
              </Field>
              <Field label="Kết thúc">
                <Input
                  type="datetime-local"
                  value={flashForm.endTime}
                  onChange={(e) => setFlashForm({ ...flashForm, endTime: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={flashForm.isActive}
                onChange={(e) => setFlashForm({ ...flashForm, isActive: e.target.checked })}
              />
              Kích hoạt (bắt buộc bật để flash chạy)
            </label>
            <EvidenceFields
              form={flashForm}
              set={(patch) => setFlashForm({ ...flashForm, ...patch })}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={variantModal}
        onClose={() => setVariantModal(false)}
        title="Thêm biến thể mới"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVariantModal(false)}>
              Hủy
            </Button>
            <Button onClick={saveVariant} disabled={savingVariant}>
              {savingVariant ? "Đang lưu..." : "Thêm biến thể"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sản phẩm" hint="Biến thể sẽ thuộc về sản phẩm này">
            <Select
              value={variantForm.product}
              onChange={(e) => setVariantForm({ ...variantForm, product: e.target.value })}
            >
              <option value="">Chọn sản phẩm</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="SKU" hint="Mã biến thể, phải là duy nhất">
            <Input
              value={variantForm.sku}
              onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
            />
          </Field>
          <Field label="Dung tích / Phân loại" hint="Ví dụ: 50ml, 100ml (có thể để trống)">
            <Input
              value={variantForm.volume}
              onChange={(e) => setVariantForm({ ...variantForm, volume: e.target.value })}
            />
          </Field>
          <Field label="Giá niêm yết (đ)">
            <Input
              type="number"
              value={variantForm.price}
              onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
            />
          </Field>
          <Field label="Giá vốn (đ)" hint="Dùng để tính lợi nhuận trong báo cáo">
            <Input
              type="number"
              value={variantForm.costPrice}
              onChange={(e) => setVariantForm({ ...variantForm, costPrice: e.target.value })}
            />
          </Field>
          <Field label="Tồn kho">
            <Input
              type="number"
              value={variantForm.stock}
              onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label="Lý do (ghi vào lịch sử giá)"
          hint="Mốc giá khởi tạo sẽ được lưu kèm lý do này"
        >
          <Input
            value={variantForm.reason}
            onChange={(e) => setVariantForm({ ...variantForm, reason: e.target.value })}
          />
        </Field>
      </Modal>

      <Modal
        open={!!priceTarget}
        onClose={() => setPriceTarget(null)}
        title="Điều chỉnh giá biến thể"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPriceTarget(null)}>
              Hủy
            </Button>
            <Button onClick={savePrice} disabled={savingPrice}>
              {savingPrice ? "Đang lưu..." : "Lưu điều chỉnh"}
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-gray-600">
          {priceTarget?.label} — giá hiện tại{" "}
          <strong>{formatVnd(priceTarget?.current || 0)}</strong>
        </p>
        <div className="space-y-4">
          <Field label="Giá mới (đ)">
            <Input
              type="number"
              value={priceForm.price}
              onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
            />
          </Field>
          <Field
            label="Lý do điều chỉnh"
            hint="Bắt buộc — sẽ được ghi vào lịch sử giá tại thời điểm này"
          >
            <Textarea
              rows={3}
              value={priceForm.reason}
              onChange={(e) => setPriceForm({ ...priceForm, reason: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Xóa ưu đãi"
        message="Đơn hàng cũ vẫn giữ snapshot giá và ưu đãi. Bạn có chắc muốn xóa?"
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
