import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { adminApi, apiMessage, type AdminBrand } from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import ImageUploader from "../../components/admin/ImageUploader";
import ScentFamilyCardManager from "../../components/admin/ScentFamilyCardManager";
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
  Textarea,
} from "../../components/admin/ui";

type BrandForm = {
  name: string;
  slug: string;
  heroImage: string;
  logo: string;
  description: string;
  viewCollectionUrl: string;
  journalUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  country: string;
  website: string;
  foundedYear: string;
};

const EMPTY_FORM: BrandForm = {
  name: "",
  slug: "",
  heroImage: "",
  logo: "",
  description: "",
  viewCollectionUrl: "",
  journalUrl: "",
  isPublished: true,
  isFeatured: false,
  country: "",
  website: "",
  foundedYear: "",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultCollectionUrl(name: string) {
  return name.trim() ? `/shop?brand=${encodeURIComponent(name.trim())}` : "";
}

function toForm(brand: AdminBrand): BrandForm {
  return {
    name: brand.name || "",
    slug: brand.slug || "",
    heroImage: brand.heroImage || "",
    logo: brand.logo || "",
    description: brand.description || "",
    viewCollectionUrl: brand.viewCollectionUrl || defaultCollectionUrl(brand.name),
    journalUrl: brand.journalUrl || "",
    isPublished: brand.isPublished !== false,
    isFeatured: Boolean(brand.isFeatured),
    country: brand.country || "",
    website: brand.website || "",
    foundedYear: brand.foundedYear ? String(brand.foundedYear) : "",
  };
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [form, setForm] = useState<BrandForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [collectionTouched, setCollectionTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminBrand | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setBrands(await adminApi.get<AdminBrand[]>("/brands"));
    } catch (error) {
      toast.error(apiMessage(error, "Không tải được thương hiệu"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setSlugTouched(false);
    setCollectionTouched(false);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(brand: AdminBrand) {
    setEditing(brand);
    setSlugTouched(true);
    setCollectionTouched(true);
    setForm(toForm(brand));
    setModalOpen(true);
  }

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
      viewCollectionUrl: collectionTouched ? current.viewCollectionUrl : defaultCollectionUrl(name),
    }));
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Nhập tên thương hiệu");
    if (!form.slug.trim()) return toast.error("Nhập slug thương hiệu");
    if (!form.heroImage.trim()) return toast.error("Chọn hoặc nhập ảnh hero");
    if (!form.description.trim()) return toast.error("Nhập mô tả thương hiệu");
    if (form.description.trim().length > 260)
      return toast.error("Mô tả nên dưới 260 ký tự để không vỡ layout");

    const foundedYear = form.foundedYear ? Number(form.foundedYear) : null;
    if (foundedYear && (foundedYear < 1000 || foundedYear > new Date().getFullYear())) {
      return toast.error("Năm thành lập không hợp lệ");
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      heroImage: form.heroImage.trim(),
      logo: form.logo.trim(),
      description: form.description.trim(),
      viewCollectionUrl: form.viewCollectionUrl.trim() || defaultCollectionUrl(form.name),
      journalUrl: form.journalUrl.trim(),
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      country: form.country.trim(),
      website: form.website.trim(),
      foundedYear,
    };

    try {
      setSaving(true);
      if (editing) await adminApi.put(`/brands/${editing.id}`, payload);
      else await adminApi.post("/brands", payload);
      toast.success(editing ? "Đã cập nhật thương hiệu" : "Đã thêm thương hiệu");
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Lưu thương hiệu thất bại"));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminApi.del(`/brands/${deleteTarget.id}`);
      toast.success("Đã xóa thương hiệu");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Xóa thương hiệu thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý thương hiệu"
        subtitle="Thêm, sửa và ẩn/hiện các thương hiệu trên trang Thương hiệu"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm thương hiệu
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : brands.length === 0 ? (
          <EmptyState message="Chưa có thương hiệu nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">Ảnh</th>
                  <th className="p-4">Tên / Slug</th>
                  <th className="p-4">Mô tả</th>
                  <th className="p-4">Link</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-gray-50 align-middle hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {brand.heroImage || brand.logo ? (
                        <img
                          loading="lazy"
                          src={brand.heroImage || brand.logo}
                          alt={brand.name}
                          className="h-16 w-24 border border-gray-100 bg-white object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-24 items-center justify-center bg-[#EEEAE4] font-title text-lg text-gray-700">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{brand.name}</p>
                      <p className="mt-1 max-w-44 truncate text-xs text-gray-400">/{brand.slug}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {[brand.country, brand.foundedYear].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="line-clamp-3 max-w-xs text-gray-600">
                        {brand.description || "Chưa cập nhật"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-xs">
                        {brand.viewCollectionUrl && (
                          <a
                            href={brand.viewCollectionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#75672F] hover:underline"
                          >
                            Xem bộ sưu tập <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {brand.journalUrl && (
                          <a
                            href={brand.journalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[#75672F] hover:underline"
                          >
                            Đọc nhật ký
                          </a>
                        )}
                        {!brand.viewCollectionUrl && !brand.journalUrl && (
                          <span className="text-gray-400">Chưa có link</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-2">
                        <Badge color={brand.isPublished ? "green" : "gray"}>
                          {brand.isPublished ? "Đã đăng" : "Bản nháp"}
                        </Badge>
                        {brand.isFeatured && (
                          <Badge color="yellow">
                            <Star className="mr-1 inline h-3 w-3" /> Nổi bật
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEdit(brand)}
                          title="Sửa thương hiệu"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(brand)}
                          title="Xóa thương hiệu"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <ScentFamilyCardManager />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Cập nhật thương hiệu" : "Thêm thương hiệu"}
        wide
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tên thương hiệu">
            <Input
              value={form.name}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Byredo"
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm({ ...form, slug: slugify(event.target.value) });
              }}
              placeholder="byredo"
            />
          </Field>
          <Field label="URL bộ sưu tập">
            <Input
              value={form.viewCollectionUrl}
              onChange={(event) => {
                setCollectionTouched(true);
                setForm({ ...form, viewCollectionUrl: event.target.value });
              }}
              placeholder="/shop?brand=Byredo"
            />
          </Field>
          <Field label="URL nhật ký (tùy chọn)">
            <Input
              value={form.journalUrl}
              onChange={(event) => setForm({ ...form, journalUrl: event.target.value })}
              placeholder="/blog?brand=Byredo"
            />
          </Field>
          <Field label="Quốc gia">
            <Input
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
              placeholder="Pháp, Ý..."
            />
          </Field>
          <Field label="Năm thành lập">
            <Input
              type="number"
              min="1000"
              max={new Date().getFullYear()}
              value={form.foundedYear}
              onChange={(event) => setForm({ ...form, foundedYear: event.target.value })}
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Mô tả" hint={`${form.description.length}/260 ký tự khuyến nghị`}>
            <Textarea
              value={form.description}
              maxLength={320}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="min-h-28"
              placeholder="Đoạn mô tả ngắn 2-3 câu cho thẻ thương hiệu..."
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Ảnh hero">
            <div className="space-y-2">
              <Input
                value={form.heroImage}
                onChange={(event) => setForm({ ...form, heroImage: event.target.value })}
                placeholder="URL ảnh hero"
              />
              <ImageUploader
                multiple={false}
                folder="brand"
                label="Tải ảnh hero"
                onUploaded={(urls) =>
                  setForm((current) => ({ ...current, heroImage: urls[0] || current.heroImage }))
                }
              />
              {form.heroImage && (
                <img
                  loading="lazy"
                  src={form.heroImage}
                  alt="Xem trước ảnh hero"
                  className="h-32 w-full border border-gray-200 object-cover"
                />
              )}
            </div>
          </Field>
          <Field label="Logo (tùy chọn)">
            <div className="space-y-2">
              <Input
                value={form.logo}
                onChange={(event) => setForm({ ...form, logo: event.target.value })}
                placeholder="URL logo"
              />
              <ImageUploader
                multiple={false}
                folder="brand"
                label="Tải logo"
                onUploaded={(urls) =>
                  setForm((current) => ({ ...current, logo: urls[0] || current.logo }))
                }
              />
              {form.logo && (
                <img
                  loading="lazy"
                  src={form.logo}
                  alt="Xem trước logo"
                  className="h-32 w-full border border-gray-200 bg-white object-contain p-2"
                />
              )}
            </div>
          </Field>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}
              className="h-4 w-4 accent-gray-900"
            />
            Đăng trên trang Thương hiệu
          </label>
          <label className="flex items-center gap-3 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              className="h-4 w-4 accent-gray-900"
            />
            <span>
              <span className="block font-medium text-gray-800">Nổi bật trên trang chủ</span>
              <span className="mt-1 block text-xs text-gray-500">
                Thương hiệu sẽ hiện trong mục Thương hiệu nổi bật ở Trang chủ.
              </span>
            </span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa thương hiệu"
        message={`Xóa "${deleteTarget?.name || ""}"? Chỉ có thể xóa thương hiệu không còn sản phẩm.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}
