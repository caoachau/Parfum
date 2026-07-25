// =============================================================================
//  ADMIN CONTENT — "Noi dung trang"
//  Quan ly anh CUA TUNG VI TRI tren toan website (banner, hero, anh section...).
//  Moi vi tri (slot) co the:
//    - Chon anh tu Thu vien Cloudinary (nut "Chọn ảnh")
//    - Dan truc tiep 1 URL anh (nut "Nhập URL")
//    - Khoi phuc anh mac dinh (nut "Mặc định")
//  Frontend tu dong doc map { key: url } qua store siteContent de hien thi.
// =============================================================================
import { useEffect, useMemo, useState } from "react";
import { adminApi, apiMessage } from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import {
  Button,
  Card,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
} from "../../components/admin/ui";

type Slot = {
  key: string;
  label: string;
  group: string;
  defaultUrl: string;
  url: string;
  hasOverride: boolean;
};
type AdminList = { groups: string[]; slots: Slot[] };

type MediaImage = {
  publicId: string;
  url: string;
  width: number;
  height: number;
};
type MediaList = { images: MediaImage[]; nextCursor: string | null; folder: string };

export default function AdminContent() {
  const [data, setData] = useState<AdminList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Bo chon anh tu thu vien
  const [pickerFor, setPickerFor] = useState<Slot | null>(null);
  // Nhap URL thu cong
  const [urlFor, setUrlFor] = useState<Slot | null>(null);
  const [urlValue, setUrlValue] = useState("");

  async function load() {
    try {
      setLoading(true);
      setData(await adminApi.get<AdminList>("/site-content"));
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được nội dung trang"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function applyLocal(key: string, url: string, hasOverride: boolean) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            slots: prev.slots.map((s) => (s.key === key ? { ...s, url, hasOverride } : s)),
          }
        : prev,
    );
  }

  async function saveContent(slot: Slot, url: string) {
    setSaving(slot.key);
    try {
      await adminApi.put("/site-content", { key: slot.key, url });
      applyLocal(slot.key, url, true);
      toast.success(`Đã cập nhật: ${slot.label}`);
    } catch (e) {
      toast.error(apiMessage(e, "Cập nhật thất bại"));
    } finally {
      setSaving(null);
    }
  }

  async function resetContent(slot: Slot) {
    setSaving(slot.key);
    try {
      const res = await adminApi.post<{ key: string; url: string }>("/site-content/reset", {
        key: slot.key,
      });
      applyLocal(slot.key, res.url || slot.defaultUrl, false);
      toast.success(`Đã khôi phục mặc định: ${slot.label}`);
    } catch (e) {
      toast.error(apiMessage(e, "Khôi phục thất bại"));
    } finally {
      setSaving(null);
    }
  }

  const grouped = useMemo(() => {
    if (!data) return [] as { group: string; slots: Slot[] }[];
    return data.groups.map((group) => ({
      group,
      slots: data.slots.filter((s) => s.group === group),
    }));
  }, [data]);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Nội dung trang"
        subtitle="Quản lý ảnh hiển thị ở từng vị trí trên website (banner, hero, ảnh section...)"
      />

      <Card className="mb-6 border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Mỗi vị trí bên dưới tương ứng 1 ảnh trên web. Bấm <b>Chọn ảnh</b> để lấy ảnh từ Thư viện
        Cloudinary, hoặc <b>Nhập URL</b> nếu dùng ảnh ngoài. Bấm <b>Mặc định</b> để quay về ảnh gốc.
        Thay đổi áp dụng ngay khi tải lại trang web.
      </Card>

      <div className="space-y-10">
        {grouped.map(({ group, slots }) => (
          <section key={group}>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">{group}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => (
                <Card key={slot.key} className="overflow-hidden">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                    {slot.url ? (
                      <img
                        src={slot.url}
                        alt={slot.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{slot.label}</p>
                      {slot.hasOverride ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          Đã tùy chỉnh
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[11px] text-gray-400" title={slot.url}>
                      {slot.url}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1 text-xs"
                        disabled={saving === slot.key}
                        onClick={() => setPickerFor(slot)}
                      >
                        Chọn ảnh
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2.5 py-1 text-xs"
                        disabled={saving === slot.key}
                        onClick={() => {
                          setUrlFor(slot);
                          setUrlValue(slot.hasOverride ? slot.url : "");
                        }}
                      >
                        Nhập URL
                      </Button>
                      {slot.hasOverride && (
                        <Button
                          variant="ghost"
                          className="px-2.5 py-1 text-xs text-red-600"
                          disabled={saving === slot.key}
                          onClick={() => resetContent(slot)}
                        >
                          Mặc định
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Modal chon anh tu thu vien */}
      <MediaPickerModal
        open={!!pickerFor}
        title={pickerFor ? `Chọn ảnh cho: ${pickerFor.label}` : ""}
        onClose={() => setPickerFor(null)}
        onPick={(url) => {
          if (pickerFor) saveContent(pickerFor, url);
          setPickerFor(null);
        }}
      />

      {/* Modal nhap URL thu cong */}
      <Modal
        open={!!urlFor}
        onClose={() => setUrlFor(null)}
        title={urlFor ? `Nhập URL ảnh: ${urlFor.label}` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUrlFor(null)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                if (urlFor && urlValue.trim()) {
                  saveContent(urlFor, urlValue.trim());
                  setUrlFor(null);
                }
              }}
            >
              Lưu
            </Button>
          </>
        }
      >
        <Field label="URL ảnh">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://..."
          />
        </Field>
        {urlValue.trim() && (
          <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100">
            <img
              loading="lazy"
              src={urlValue}
              alt="preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

// -------------------------------------------------------------------- picker --
function MediaPickerModal({
  open,
  title,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadImages(reset = true) {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      const res = await adminApi.get<MediaList>("/media", {
        max: 24,
        cursor: reset ? undefined : cursor || undefined,
      });
      setImages((prev) => (reset ? res.images : [...prev, ...res.images]));
      setCursor(res.nextCursor);
      setLoaded(true);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được thư viện ảnh"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (open && !loaded) loadImages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      {loading ? (
        <LoadingState />
      ) : images.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Chưa có ảnh trong Thư viện. Hãy vào mục "Thư viện ảnh" để tải ảnh lên trước.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((img) => (
              <button
                key={img.publicId}
                type="button"
                onClick={() => onPick(img.url)}
                className="group aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition hover:ring-2 hover:ring-gray-900"
                title={img.publicId}
              >
                <img
                  src={img.url}
                  alt={img.publicId}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          {cursor && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" disabled={loadingMore} onClick={() => loadImages(false)}>
                {loadingMore ? "Đang tải..." : "Tải thêm"}
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
