import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminApi,
  apiMessage,
  formatVnd,
  type AdminBrand,
  type AdminCategory,
  type AdminProduct,
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
  Pagination,
  Select,
  Textarea,
} from "../../components/admin/ui";
import ImageUploader from "../../components/admin/ImageUploader";

type FormState = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  gender: string;
  fragranceFamily: string;
  concentration: string;
  season: string;
  images: string;
  notesTop: string;
  notesMiddle: string;
  notesBase: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  category: "",
  gender: "",
  fragranceFamily: "",
  concentration: "",
  season: "",
  images: "",
  notesTop: "",
  notesMiddle: "",
  notesBase: "",
  isActive: true,
};

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const splitLines = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

export default function AdminProducts() {
  const [list, setList] = useState<Paginated<AdminProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await adminApi.get<Paginated<AdminProduct>>("/products", {
        page,
        limit: 10,
        search: search || undefined,
      });
      setList(data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được sản phẩm"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([
          adminApi.get<AdminBrand[]>("/brands"),
          adminApi.get<AdminCategory[]>("/categories"),
        ]);
        setBrands(b);
        setCategories(c);
      } catch {
        /* im lặng: form vẫn dùng được */
      }
    })();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: AdminProduct) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      brand: p.brand?.id || "",
      category: p.category?.id || "",
      gender: p.gender,
      fragranceFamily: p.fragranceFamily,
      concentration: p.concentration,
      season: (p.season || []).join(", "),
      images: (p.images || []).join("\n"),
      notesTop: (p.notes?.top || []).join(", "),
      notesMiddle: (p.notes?.middle || []).join(", "),
      notesBase: (p.notes?.base || []).join(", "),
      isActive: p.isActive,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description,
      brand: form.brand || null,
      category: form.category || null,
      gender: form.gender,
      fragranceFamily: form.fragranceFamily,
      concentration: form.concentration,
      season: splitList(form.season),
      images: splitLines(form.images),
      notes: {
        top: splitList(form.notesTop),
        middle: splitList(form.notesMiddle),
        base: splitList(form.notesBase),
      },
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      if (editing) {
        await adminApi.put(`/products/${editing.id}`, payload);
        toast.success("Đã cập nhật sản phẩm");
      } else {
        await adminApi.post("/products", payload);
        toast.success("Đã thêm sản phẩm");
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
      await adminApi.del(`/products/${deleteTarget.id}`);
      toast.success("Đã xoá sản phẩm");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(apiMessage(e, "Xoá thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div>
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle="Thêm, sửa, xoá và ẩn/hiện sản phẩm"
        actions={<Button onClick={openCreate}>+ Thêm sản phẩm</Button>}
      />

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Tìm theo tên / slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              load();
            }
          }}
          className="max-w-xs"
        />
        <Button
          variant="secondary"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          Tìm
        </Button>
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : !list || list.data.length === 0 ? (
          <EmptyState message="Chưa có sản phẩm nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Thương hiệu</th>
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Giá từ</th>
                  <th className="p-4">Tồn</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            loading="lazy"
                            src={p.images[0]}
                            alt={p.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.variantCount} biến thể</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{p.brand?.name || "—"}</td>
                    <td className="p-4 text-gray-600">{p.category?.name || "—"}</td>
                    <td className="p-4 text-gray-600">{formatVnd(p.minPrice)}</td>
                    <td className="p-4 text-gray-600">{p.stock}</td>
                    <td className="p-4">
                      {p.isActive ? (
                        <Badge color="green">Đang bán</Badge>
                      ) : (
                        <Badge color="gray">Ẩn</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/variants?product=${p.id}`}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                        >
                          Biến thể
                        </Link>
                        <Button variant="secondary" onClick={() => openEdit(p)}>
                          Sửa
                        </Button>
                        <Button variant="danger" onClick={() => setDeleteTarget(p)}>
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

      {list && <Pagination page={list.page} totalPages={list.totalPages} onChange={setPage} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wide
        title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tên sản phẩm">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Slug" hint="Để trống để tự sinh từ tên">
            <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
          </Field>
          <Field label="Thương hiệu">
            <Select value={form.brand} onChange={(e) => set({ brand: e.target.value })}>
              <option value="">— Không chọn —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Danh mục">
            <Select value={form.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">— Không chọn —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Giới tính">
            <Select value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
              <option value="">—</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="unisex">Unisex</option>
            </Select>
          </Field>
          <Field label="Nhóm hương">
            <Input
              value={form.fragranceFamily}
              onChange={(e) => set({ fragranceFamily: e.target.value })}
            />
          </Field>
          <Field label="Nồng độ" hint="EDP, EDT, Parfum...">
            <Input
              value={form.concentration}
              onChange={(e) => set({ concentration: e.target.value })}
            />
          </Field>
          <Field label="Mùa / Dịp" hint="Phân cách bằng dấu phẩy">
            <Input value={form.season} onChange={(e) => set({ season: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Mô tả">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Ảnh (mỗi dòng 1 URL)">
              <Textarea
                rows={3}
                value={form.images}
                onChange={(e) => set({ images: e.target.value })}
              />
            </Field>
            <div className="mt-2">
              <ImageUploader
                onUploaded={(urls) =>
                  set({
                    images: [form.images.trim(), ...urls].filter(Boolean).join("\n"),
                  })
                }
              />
            </div>
          </div>
          <Field label="Hương đầu" hint="Phân cách dấu phẩy">
            <Input value={form.notesTop} onChange={(e) => set({ notesTop: e.target.value })} />
          </Field>
          <Field label="Hương giữa">
            <Input
              value={form.notesMiddle}
              onChange={(e) => set({ notesMiddle: e.target.value })}
            />
          </Field>
          <Field label="Hương cuối">
            <Input value={form.notesBase} onChange={(e) => set({ notesBase: e.target.value })} />
          </Field>
          <Field label="Trạng thái">
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set({ isActive: e.target.checked })}
              />
              Đang bán (hiển thị trên web)
            </label>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá sản phẩm"
        message={`Xoá "${deleteTarget?.name}"? Toàn bộ biến thể của sản phẩm cũng sẽ bị xoá.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
