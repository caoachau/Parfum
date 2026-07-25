import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  adminApi,
  apiMessage,
  formatVnd,
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
import ImageUploader from "../../components/admin/ImageUploader";

type FormState = {
  product: string;
  sku: string;
  volume: string;
  price: string;
  costPrice: string;
  priceHistoryReason: string;
  stock: string;
  images: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  product: "",
  sku: "",
  volume: "",
  price: "",
  costPrice: "0",
  priceHistoryReason: "",
  stock: "0",
  images: "",
  isActive: true,
};

export default function AdminVariants() {
  const [params, setParams] = useSearchParams();
  const productFilter = params.get("product") || "";

  const [variants, setVariants] = useState<AdminVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const lowStock = params.get("lowStock") === "true";
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminVariant | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await adminApi.get<AdminVariant[]>("/variants", {
        product: productFilter || undefined,
        lowStock: lowStock || undefined,
      });
      setVariants(data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được biến thể"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter, lowStock]);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get<Paginated<AdminProduct>>("/products", { limit: 100 });
        setProducts(data.data);
      } catch {
        /* im lặng */
      }
    })();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, product: productFilter });
    setModalOpen(true);
  }

  function openEdit(v: AdminVariant) {
    setEditing(v);
    setForm({
      product: v.product?.id || "",
      sku: v.sku,
      volume: v.volume,
      price: String(v.price),
      costPrice: String(v.costPrice || 0),
      priceHistoryReason: "",
      stock: String(v.stock),
      images: (v.images || []).join("\n"),
      isActive: v.isActive,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.product) return toast.error("Chọn sản phẩm");
    if (!form.sku.trim()) return toast.error("Nhập SKU");
    if (form.price === "") return toast.error("Nhập giá");
    const payload = {
      product: form.product,
      sku: form.sku.trim(),
      volume: form.volume.trim(),
      price: Number(form.price),
      costPrice: Number(form.costPrice || 0),
      priceHistoryReason: form.priceHistoryReason.trim(),
      stock: Number(form.stock || 0),
      images: form.images.split(/[,\n]/).map((x) => x.trim()).filter(Boolean),
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      if (editing) {
        await adminApi.put(`/variants/${editing.id}`, payload);
        toast.success("Đã cập nhật biến thể");
      } else {
        await adminApi.post("/variants", payload);
        toast.success("Đã thêm biến thể");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminApi.del(`/variants/${deleteTarget.id}`);
      toast.success("Đã xoá biến thể");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Xoá thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const activeProduct = products.find((p) => p.id === productFilter);

  return (
    <div>
      <PageHeader
        title="Biến thể & Tồn kho"
        subtitle={
          activeProduct
            ? `Đang lọc theo: ${activeProduct.name}`
            : "Quản lý SKU, dung tích, giá và tồn kho"
        }
        actions={<Button onClick={openCreate}>+ Thêm biến thể</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.checked) next.set("lowStock", "true");
              else next.delete("lowStock");
              setParams(next, { replace: true });
            }}
          />
          Chỉ hiện tồn thấp (≤ 5)
        </label>
        {productFilter && (
          <Button
            variant="ghost"
            onClick={() => {
              params.delete("product");
              setParams(params);
            }}
          >
            × Bỏ lọc sản phẩm
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : variants.length === 0 ? (
          <EmptyState message="Chưa có biến thể nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Dung tích</th>
                  <th className="p-4">Giá</th>
                  <th className="p-4">Giá vốn</th>
                  <th className="p-4">Tồn</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-mono text-xs">{v.sku}</td>
                    <td className="p-4 text-gray-700">{v.product?.name || "—"}</td>
                    <td className="p-4 text-gray-600">{v.volume || "—"}</td>
                    <td className="p-4 text-gray-600">{formatVnd(v.price)}</td>
                    <td className="p-4 text-gray-600">{formatVnd(v.costPrice)}</td>
                    <td className="p-4">
                      {v.stock <= 5 ? (
                        <Badge color="red">{v.stock}</Badge>
                      ) : (
                        <span className="text-gray-700">{v.stock}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {v.isActive ? (
                        <Badge color="green">Bật</Badge>
                      ) : (
                        <Badge color="gray">Tắt</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(v)}>
                          Sửa
                        </Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(v)}>
                          Xoá
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa biến thể" : "Thêm biến thể"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Sản phẩm">
            <Select value={form.product} onChange={(e) => set({ product: e.target.value })}>
              <option value="">— Chọn sản phẩm —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => set({ sku: e.target.value })} />
            </Field>
            <Field label="Dung tích" hint="VD: 50ml">
              <Input value={form.volume} onChange={(e) => set({ volume: e.target.value })} />
            </Field>
            <Field label="Giá (VNĐ)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
              />
            </Field>
            <Field label="Lý do đổi giá" hint="Được lưu trong lịch sử giá niêm yết">
              <Input
                value={form.priceHistoryReason}
                onChange={(e) => set({ priceHistoryReason: e.target.value })}
                placeholder="Điều chỉnh theo bảng giá nhà phân phối"
              />
            </Field>
            <Field label="Giá vốn (VNĐ)" hint="Dùng để tính lợi nhuận và giá trị tồn kho">
              <Input
                type="number"
                min="0"
                value={form.costPrice}
                onChange={(e) => set({ costPrice: e.target.value })}
              />
            </Field>
            <Field label="Tồn kho">
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => set({ stock: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Ảnh (mỗi dòng 1 URL)">
            <div className="mb-2">
              <ImageUploader
                onUploaded={(urls) =>
                  set({
                    images: [form.images.trim(), ...urls].filter(Boolean).join("\n"),
                  })
                }
              />
            </div>
            <Textarea
              rows={2}
              value={form.images}
              onChange={(e) => set({ images: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set({ isActive: e.target.checked })}
            />
            Kích hoạt biến thể
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá biến thể"
        message={`Xoá biến thể "${deleteTarget?.sku}"?`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
