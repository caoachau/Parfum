import { useEffect, useState } from "react";
import { Images, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, apiMessage, type AdminScentFamilyCard } from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import ImageUploader from "./ImageUploader";
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
  Textarea,
} from "./ui";

type FormState = {
  name: string;
  image: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

type MediaImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
};

type MediaList = {
  images: MediaImage[];
  nextCursor: string | null;
  folder: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  image: "",
  description: "",
  displayOrder: "0",
  isActive: true,
};

export default function ScentFamilyCardManager() {
  const [rows, setRows] = useState<AdminScentFamilyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminScentFamilyCard | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminScentFamilyCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [media, setMedia] = useState<MediaImage[]>([]);
  const [mediaCursor, setMediaCursor] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setRows(await adminApi.get<AdminScentFamilyCard[]>("/scent-family-cards"));
    } catch (error) {
      toast.error(apiMessage(error, "Không tải được card nhóm hương"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, displayOrder: String(rows.length) });
    setModalOpen(true);
  }

  function openEdit(item: AdminScentFamilyCard) {
    setEditing(item);
    setForm({
      name: item.name,
      image: item.image,
      description: item.description || "",
      displayOrder: String(item.displayOrder || 0),
      isActive: item.isActive !== false,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Nhập tên nhóm hương");
    if (!form.image.trim()) return toast.error("Chọn ảnh từ thư mục perfumeshop/brand");
    const payload = {
      name: form.name.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      displayOrder: Math.max(0, Number(form.displayOrder) || 0),
      isActive: form.isActive,
    };
    try {
      setSaving(true);
      if (editing) await adminApi.put(`/scent-family-cards/${editing.id}`, payload);
      else await adminApi.post("/scent-family-cards", payload);
      toast.success(editing ? "Đã cập nhật card nhóm hương" : "Đã thêm card nhóm hương");
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Không lưu được card nhóm hương"));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminApi.del(`/scent-family-cards/${deleteTarget.id}`);
      toast.success("Đã xóa card nhóm hương");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, "Không xóa được card nhóm hương"));
    } finally {
      setDeleting(false);
    }
  }

  async function loadMedia(reset = true) {
    try {
      setMediaLoading(true);
      const result = await adminApi.get<MediaList>("/media", {
        folder: "brand",
        max: 60,
        cursor: reset ? undefined : mediaCursor || undefined,
      });
      setMedia((current) => (reset ? result.images : [...current, ...result.images]));
      setMediaCursor(result.nextCursor);
    } catch (error) {
      toast.error(apiMessage(error, "Không tải được ảnh trong perfumeshop/brand"));
    } finally {
      setMediaLoading(false);
    }
  }

  function openPicker() {
    setPickerOpen(true);
    setMedia([]);
    setMediaCursor(null);
    loadMedia(true);
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">Card nhóm hương /brand</h2>
          <p className="mt-1 text-xs text-gray-500">
            Cloud: <strong>dwj2trmn0</strong> · Thư mục: <strong>perfumeshop/brand/</strong>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm nhóm hương
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : rows.length === 0 ? (
          <EmptyState message="Chưa có card nhóm hương được quản lý. Bấm “Thêm nhóm hương” để tạo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">Ảnh</th>
                  <th className="p-4">Nhóm hương</th>
                  <th className="p-4">Mô tả</th>
                  <th className="p-4 text-center">Thứ tự</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 align-middle hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <img
                        loading="lazy"
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-16 bg-gray-100 object-cover"
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-950">{item.name}</td>
                    <td className="p-4">
                      <p className="line-clamp-3 max-w-md text-xs leading-5 text-gray-600">
                        {item.description || "Chưa có mô tả"}
                      </p>
                    </td>
                    <td className="p-4 text-center">{item.displayOrder}</td>
                    <td className="p-4">
                      <Badge color={item.isActive ? "green" : "gray"}>
                        {item.isActive ? "Đang hiện" : "Đã ẩn"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => openEdit(item)} title="Sửa card">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(item)}
                          title="Xóa card"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Cập nhật card nhóm hương" : "Thêm card nhóm hương"}
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
          <Field label="Tên nhóm hương">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Woody, Floral, Chypre..."
            />
          </Field>
          <Field label="Thứ tự hiển thị">
            <Input
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={(event) => setForm({ ...form, displayOrder: event.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Mô tả">
            <Textarea
              className="min-h-24"
              maxLength={500}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Mô tả ngắn cho card nhóm hương..."
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Ảnh card từ perfumeshop/brand/">
            <div className="space-y-3">
              <Input
                value={form.image}
                readOnly
                placeholder="Chọn hoặc tải ảnh lên thư mục brand"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={openPicker}>
                  <Images className="h-4 w-4" /> Chọn từ thư viện brand
                </Button>
                <ImageUploader
                  multiple={false}
                  folder="brand"
                  label="Tải ảnh mới"
                  onUploaded={(urls) =>
                    setForm((current) => ({ ...current, image: urls[0] || current.image }))
                  }
                />
              </div>
              {form.image && (
                <img
                  loading="lazy"
                  src={form.image}
                  alt="Xem trước card"
                  className="h-56 w-44 border border-gray-200 object-cover"
                />
              )}
            </div>
          </Field>
        </div>
        <label className="mt-5 flex items-center gap-3 border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            className="h-4 w-4 accent-gray-900"
          />
          Hiển thị card trên trang /brand
        </label>
      </Modal>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Chọn ảnh từ perfumeshop/brand/"
        wide
      >
        {mediaLoading && media.length === 0 ? (
          <LoadingState />
        ) : media.length === 0 ? (
          <EmptyState message="Thư mục brand chưa có ảnh." />
        ) : (
          <>
            <div className="grid max-h-[62vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
              {media.map((image) => (
                <button
                  key={image.publicId}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, image: image.url }));
                    setPickerOpen(false);
                  }}
                  className="group border border-gray-200 bg-white p-1 text-left transition hover:border-[#8B7419]"
                >
                  <img
                    loading="lazy"
                    src={image.url}
                    alt={image.publicId}
                    className="aspect-[0.82/1] w-full object-cover"
                  />
                  <p className="mt-1 truncate px-1 text-[9px] text-gray-400">{image.publicId}</p>
                </button>
              ))}
            </div>
            {mediaCursor && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  disabled={mediaLoading}
                  onClick={() => loadMedia(false)}
                >
                  {mediaLoading ? "Đang tải..." : "Tải thêm ảnh"}
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa card nhóm hương"
        message={`Xóa card “${deleteTarget?.name || ""}” khỏi trang /brand? Ảnh trên Cloudinary không bị xóa.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </section>
  );
}
