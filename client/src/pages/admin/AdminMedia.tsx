// =============================================================================
//  ADMIN MEDIA — Thu vien anh (Cloudinary) quan ly toan he thong
//  - Xem trang thai cau hinh Cloudinary
//  - Tai anh len (nhieu file)
//  - Xem luoi anh, copy URL, xoa anh
//  - Tai them (phan trang bang next_cursor)
// =============================================================================
import { useEffect, useState } from "react";
import { Check, Copy, ImagePlus, LoaderCircle, Search, Trash2 } from "lucide-react";
import {
  adminApi,
  apiMessage,
  type AdminProduct,
  type AdminScentFamilyCard,
  type Paginated,
} from "../../lib/adminApi";
import { api } from "../../lib/api";
import { toast } from "../../store/toast.store";
import {
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
} from "../../components/admin/ui";
import ImageUploader from "../../components/admin/ImageUploader";

type MediaImage = {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
};
type MediaList = { images: MediaImage[]; nextCursor: string | null; folder: string };
type MediaStatus = { configured: boolean; cloudName: string | null; folder: string };
type ProductFilterResponse = { fragranceFamilies?: string[] };
type ImageAction = "cover" | "append" | "replace";
type MediaFolder = "" | "products" | "news" | "brand" | "home" | "about" | "feed back";

// Moi thu muc chi phuc vu dung khu vuc cua no.
const FOLDER_USAGE: Record<string, string> = {
  products: "trang Cửa hàng / sản phẩm",
  news: "trang Tin tức / blog",
  brand: "trang Thương hiệu",
  home: "trang chủ",
  about: "trang Giới thiệu",
  "feed back": "đánh giá khách hàng",
};

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(2) + " MB";
}

export default function AdminMedia() {
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [folder, setFolder] = useState<MediaFolder>("products");
  const [images, setImages] = useState<MediaImage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toDelete, setToDelete] = useState<MediaImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [assignImage, setAssignImage] = useState<MediaImage | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [scentFamilies, setScentFamilies] = useState<AdminScentFamilyCard[]>([]);
  const [unconfiguredScentFamilies, setUnconfiguredScentFamilies] = useState<string[]>([]);
  const [selectedScentFamily, setSelectedScentFamily] = useState<AdminScentFamilyCard | null>(null);
  const [newScentFamilyName, setNewScentFamilyName] = useState("");
  const [imageAction, setImageAction] = useState<ImageAction>("cover");
  const [assigning, setAssigning] = useState(false);

  async function loadStatus() {
    try {
      setStatus(await adminApi.get<MediaStatus>("/media/status"));
    } catch {
      /* bo qua */
    }
  }

  async function loadImages(reset = true) {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      const res = await adminApi.get<MediaList>("/media", {
        max: 24,
        cursor: reset ? undefined : cursor || undefined,
        folder: folder || undefined,
      });
      setImages((prev) => (reset ? res.images : [...prev, ...res.images]));
      setCursor(res.nextCursor);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được danh sách ảnh"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    setCursor(null);
    loadImages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  useEffect(() => {
    if (!assignImage) return;
    let active = true;

    if (folder === "brand") {
      setProductsLoading(true);
      void (async () => {
        try {
          const result = await adminApi.get<AdminScentFamilyCard[]>("/scent-family-cards");
          if (!active) return;
          setScentFamilies(result);

          try {
            const { data } = await api.get<ProductFilterResponse>("/products/filters");
            if (!active) return;
            const configuredNames = new Set(
              result.map((item) => item.name.trim().toLocaleLowerCase("vi")),
            );
            setUnconfiguredScentFamilies(
              Array.from(
                new Set((data.fragranceFamilies || []).map((name) => name.trim()).filter(Boolean)),
              )
                .filter((name) => !configuredNames.has(name.toLocaleLowerCase("vi")))
                .sort((left, right) => left.localeCompare(right, "vi")),
            );
          } catch {
            if (active) setUnconfiguredScentFamilies([]);
          }
        } catch (error) {
          if (active) {
            setScentFamilies([]);
            setUnconfiguredScentFamilies([]);
            toast.error(apiMessage(error, "Không tải được danh sách nhóm hương"));
          }
        } finally {
          if (active) setProductsLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }

    if (folder !== "products") return;
    const timer = window.setTimeout(async () => {
      try {
        setProductsLoading(true);
        const result = await adminApi.get<Paginated<AdminProduct>>("/products", {
          page: 1,
          limit: 20,
          search: productSearch.trim() || undefined,
        });
        if (active) setProductResults(result.data);
      } catch (error) {
        if (active) {
          setProductResults([]);
          toast.error(apiMessage(error, "Không tải được danh sách sản phẩm"));
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [assignImage, folder, productSearch]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminApi.post("/media/delete", { publicId: toDelete.publicId });
      setImages((prev) => prev.filter((i) => i.publicId !== toDelete.publicId));
      toast.success("Đã xoá ảnh");
      setToDelete(null);
    } catch (e) {
      toast.error(apiMessage(e, "Xoá ảnh thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Đã copy URL ảnh"),
      () => toast.error("Không copy được"),
    );
  }

  function openAssignImage(image: MediaImage) {
    setAssignImage(image);
    setProductSearch("");
    setProductResults([]);
    setSelectedProduct(null);
    setSelectedScentFamily(null);
    setNewScentFamilyName("");
    setScentFamilies([]);
    setUnconfiguredScentFamilies([]);
    setImageAction("cover");
  }

  function closeAssignImage() {
    if (assigning) return;
    setAssignImage(null);
    setSelectedProduct(null);
    setSelectedScentFamily(null);
    setNewScentFamilyName("");
  }

  async function updateProductImage() {
    if (folder !== "products") {
      toast.error('Chỉ ảnh trong thư mục "products" mới được gán cho sản phẩm');
      return;
    }
    if (!assignImage || !selectedProduct) {
      toast.error("Vui lòng chọn sản phẩm cần cập nhật");
      return;
    }

    const currentImages = selectedProduct.images || [];
    const withoutSelected = currentImages.filter((url) => url !== assignImage.url);
    const nextImages =
      imageAction === "replace"
        ? [assignImage.url]
        : imageAction === "append"
          ? [...withoutSelected, assignImage.url]
          : [assignImage.url, ...withoutSelected];

    try {
      setAssigning(true);
      await adminApi.put(`/products/${selectedProduct.id}`, { images: nextImages });
      toast.success(
        imageAction === "replace"
          ? "Đã thay toàn bộ ảnh sản phẩm"
          : imageAction === "append"
            ? "Đã thêm ảnh vào sản phẩm"
            : "Đã đổi ảnh đại diện sản phẩm",
      );
      setAssignImage(null);
      setSelectedProduct(null);
    } catch (error) {
      toast.error(apiMessage(error, "Cập nhật ảnh sản phẩm thất bại"));
    } finally {
      setAssigning(false);
    }
  }

  async function updateScentFamilyImage() {
    if (folder !== "brand") {
      toast.error('Chỉ ảnh trong thư mục "brand" mới được gán cho nhóm hương');
      return;
    }
    if (!assignImage) return;

    const nextName = newScentFamilyName.trim();
    if (!selectedScentFamily && !nextName) {
      toast.error("Chọn nhóm hương hoặc nhập tên nhóm hương mới");
      return;
    }

    try {
      setAssigning(true);
      if (selectedScentFamily) {
        await adminApi.put(`/scent-family-cards/${selectedScentFamily.id}`, {
          name: selectedScentFamily.name,
          image: assignImage.url,
          description: selectedScentFamily.description || "",
          displayOrder: selectedScentFamily.displayOrder || 0,
          isActive: selectedScentFamily.isActive !== false,
        });
        toast.success(`Đã gán ảnh cho nhóm hương ${selectedScentFamily.name}`);
      } else {
        await adminApi.post("/scent-family-cards", {
          name: nextName,
          image: assignImage.url,
          description: `Khám phá sắc thái đặc trưng của nhóm hương ${nextName}.`,
          displayOrder: scentFamilies.length,
          isActive: true,
        });
        toast.success(`Đã tạo và gán ảnh cho nhóm hương ${nextName}`);
      }

      setAssignImage(null);
      setSelectedScentFamily(null);
      setNewScentFamilyName("");
    } catch (error) {
      toast.error(apiMessage(error, "Không gán được ảnh cho nhóm hương"));
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thư viện ảnh"
        subtitle="Quản lý toàn bộ ảnh hệ thống trên Cloudinary"
        actions={
          status?.configured ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={folder}
                onChange={(event) => setFolder(event.target.value as MediaFolder)}
                aria-label="Chọn thư mục ảnh"
              >
                <option value="">Thư mục gốc</option>
                <option value="products">products</option>
                <option value="news">news</option>
                <option value="brand">brand</option>
                <option value="home">home</option>
                <option value="about">about</option>
                <option value="feed back">feed back</option>
              </Select>
              <ImageUploader
                multiple
                folder={folder || undefined}
                label="Tải ảnh lên"
                onUploaded={() => loadImages(true)}
              />
            </div>
          ) : undefined
        }
      />

      {/* Trang thai cau hinh Cloudinary */}
      {status && !status.configured && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 p-5">
          <h3 className="font-semibold text-yellow-800">⚠️ Cloudinary chưa được cấu hình</h3>
          <p className="mt-1 text-sm text-yellow-700">
            Thêm 3 biến sau vào file <code>server/.env</code> rồi khởi động lại server:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-yellow-100 p-3 text-xs text-yellow-900">
            {`CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=perfumeshop`}
          </pre>
          <p className="mt-2 text-xs text-yellow-700">
            Lấy thông tin tại dashboard.cloudinary.com → Account Details.
          </p>
        </Card>
      )}

      {status?.configured && (
        <p className="mb-4 text-sm text-gray-500">
          Cloud: <span className="font-medium text-gray-700">{status.cloudName}</span> · Thư mục:{" "}
          <span className="font-medium text-gray-700">
            {status.folder}/{folder ? `${folder}/` : ""}
          </span>
        </p>
      )}

      {/* Pham vi thu muc: moi thu muc chi phuc vu dung khu vuc cua no. */}
      {status?.configured && (
        <Card className="mb-6 border-[#E4DACE] bg-[#FBF7F0] p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Phạm vi thư mục “{folder || "gốc"}”:</span> ảnh trong
            thư mục này phục vụ {FOLDER_USAGE[folder] || "khu vực tương ứng"}.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {folder === "products"
              ? "Ảnh ở đây có thể gán trực tiếp cho sản phẩm. "
              : folder === "brand"
                ? "Ảnh ở đây có thể gán trực tiếp cho nhóm hương trên trang /brand. "
                : "Ảnh ở đây chỉ dùng trong khu vực này (copy URL để sử dụng). "}
            Quản trị viên được thêm/sửa/xoá ảnh trong thư mục này, nhưng ảnh KHÔNG được dùng để gán
            hoặc thao tác cho thư mục khác — mỗi thư mục quản lý độc lập.
          </p>
        </Card>
      )}

      {loading ? (
        <LoadingState />
      ) : images.length === 0 ? (
        <EmptyState message="Chưa có ảnh nào. Hãy tải ảnh lên." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((img) => (
              <Card key={img.publicId} className="group overflow-hidden">
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  <img
                    src={img.url}
                    alt={img.publicId}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-gray-500" title={img.publicId}>
                    {img.publicId.replace(status?.folder + "/", "")}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {img.width}×{img.height} · {formatBytes(img.bytes)}
                  </p>
                  <div className="mt-2 flex gap-1">
                    {folder === "products" || folder === "brand" ? (
                      <Button
                        className="flex-1 px-2 py-1 text-xs"
                        onClick={() => openAssignImage(img)}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        {folder === "brand" ? "Gán nhóm hương" : "Gán sản phẩm"}
                      </Button>
                    ) : (
                      <span
                        className="flex-1 truncate rounded-md bg-gray-100 px-2 py-1 text-center text-[10px] text-gray-400"
                        title={`Ảnh thư mục "${folder || "gốc"}" chỉ dùng cho ${FOLDER_USAGE[folder] || "khu vực tương ứng"}, không gán cho sản phẩm`}
                      >
                        {FOLDER_USAGE[folder] || "Không dùng cho sản phẩm"}
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => copyUrl(img.url)}
                      aria-label="Copy URL ảnh"
                      title="Copy URL ảnh"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => setToDelete(img)}
                      aria-label="Xóa ảnh"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {cursor && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" disabled={loadingMore} onClick={() => loadImages(false)}>
                {loadingMore ? "Đang tải..." : "Tải thêm"}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Xoá ảnh"
        message="Bạn có chắc muốn xoá ảnh này khỏi Cloudinary? Hành động không thể hoàn tác."
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />

      <Modal
        open={!!assignImage}
        onClose={closeAssignImage}
        title={folder === "brand" ? "Gán ảnh cho nhóm hương" : "Cập nhật ảnh sản phẩm"}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={closeAssignImage} disabled={assigning}>
              Hủy
            </Button>
            <Button
              onClick={folder === "brand" ? updateScentFamilyImage : updateProductImage}
              disabled={
                assigning ||
                (folder === "brand"
                  ? !selectedScentFamily && !newScentFamilyName.trim()
                  : !selectedProduct)
              }
            >
              {assigning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {assigning
                ? "Đang cập nhật..."
                : folder === "brand"
                  ? "Gán ảnh nhóm hương"
                  : "Cập nhật sản phẩm"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-[180px_1fr]">
          <div>
            <div className="aspect-square overflow-hidden border border-gray-200 bg-gray-50">
              {assignImage && (
                <img
                  loading="lazy"
                  src={assignImage.url}
                  alt={assignImage.publicId}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <p className="mt-2 truncate text-xs text-gray-500" title={assignImage?.publicId}>
              {assignImage?.publicId}
            </p>
          </div>

          {folder === "brand" ? (
            <div className="min-w-0 space-y-4">
              <Field label="Chọn nhóm hương hiện có">
                <div className="max-h-72 overflow-y-auto border-y border-gray-100">
                  {productsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                      <LoaderCircle className="h-4 w-4 animate-spin" /> Đang tải nhóm hương
                    </div>
                  ) : scentFamilies.length || unconfiguredScentFamilies.length ? (
                    <>
                      {scentFamilies.length > 0 && (
                        <p className="bg-gray-50 px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Đã có card
                        </p>
                      )}
                      {scentFamilies.map((family) => {
                        const selected = selectedScentFamily?.id === family.id;
                        return (
                          <button
                            key={family.id}
                            type="button"
                            onClick={() => {
                              setSelectedScentFamily(family);
                              setNewScentFamilyName("");
                            }}
                            className={`flex w-full items-center gap-3 border-b border-gray-100 px-2 py-3 text-left transition last:border-0 ${selected ? "bg-[#F1ECE5]" : "hover:bg-gray-50"}`}
                          >
                            <span className="h-14 w-11 shrink-0 overflow-hidden bg-gray-100">
                              <img
                                loading="lazy"
                                src={family.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {family.name}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                {family.isActive ? "Đang hiển thị trên /brand" : "Đang ẩn"}
                              </span>
                            </span>
                            {selected && <Check className="h-5 w-5 shrink-0 text-green-700" />}
                          </button>
                        );
                      })}

                      {unconfiguredScentFamilies.length > 0 && (
                        <p className="bg-amber-50 px-2 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                          Nhóm mới từ sản phẩm — chưa có card
                        </p>
                      )}
                      {unconfiguredScentFamilies.map((name) => {
                        const selected = !selectedScentFamily && newScentFamilyName === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setSelectedScentFamily(null);
                              setNewScentFamilyName(name);
                            }}
                            className={`flex w-full items-center gap-3 border-b border-gray-100 px-2 py-3 text-left transition last:border-0 ${selected ? "bg-[#F1ECE5]" : "hover:bg-gray-50"}`}
                          >
                            <span className="flex h-14 w-11 shrink-0 items-center justify-center bg-gray-100">
                              <ImagePlus className="h-4 w-4 text-gray-400" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {name}
                              </span>
                              <span className="mt-0.5 block text-xs text-amber-700">
                                Chọn ảnh này để tạo card tự động
                              </span>
                            </span>
                            {selected && <Check className="h-5 w-5 shrink-0 text-green-700" />}
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <p className="py-10 text-center text-sm text-gray-400">
                      Chưa có nhóm hương nào.
                    </p>
                  )}
                </div>
              </Field>

              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                Hoặc tạo nhóm mới
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <Field label="Tên nhóm hương mới">
                <Input
                  value={newScentFamilyName}
                  onChange={(event) => {
                    setNewScentFamilyName(event.target.value);
                    if (event.target.value) setSelectedScentFamily(null);
                  }}
                  placeholder="Ví dụ: Fresh, Marine, Tobacco..."
                />
              </Field>

              <p className="text-xs leading-5 text-gray-600">
                Chọn nhóm hiện có để thay ảnh, hoặc nhập tên mới để tạo card mới. Thay đổi sẽ xuất
                hiện trên trang /brand sau khi lưu.
              </p>
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              <Field label="Cách cập nhật">
                <Select
                  value={imageAction}
                  onChange={(event) => setImageAction(event.target.value as ImageAction)}
                >
                  <option value="cover">Đặt làm ảnh chính, giữ các ảnh cũ</option>
                  <option value="append">Thêm vào cuối thư viện sản phẩm</option>
                  <option value="replace">Thay toàn bộ ảnh hiện tại</option>
                </Select>
              </Field>

              <Field label="Tìm và chọn sản phẩm">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Tên hoặc slug sản phẩm..."
                    className="pl-10"
                  />
                </div>
              </Field>

              <div className="max-h-64 overflow-y-auto border-y border-gray-100">
                {productsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Đang tìm sản phẩm
                  </div>
                ) : productResults.length ? (
                  productResults.map((product) => {
                    const selected = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className={`flex w-full items-center gap-3 border-b border-gray-100 px-2 py-3 text-left transition last:border-0 ${selected ? "bg-[#F1ECE5]" : "hover:bg-gray-50"}`}
                      >
                        <span className="h-11 w-11 shrink-0 overflow-hidden bg-gray-100">
                          {product.images?.[0] ? (
                            <img
                              loading="lazy"
                              src={product.images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center">
                              <ImagePlus className="h-4 w-4 text-gray-400" />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {product.brand?.name || "Chưa có thương hiệu"} ·{" "}
                            {product.images?.length || 0} ảnh
                          </span>
                        </span>
                        {selected && <Check className="h-5 w-5 shrink-0 text-green-700" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="py-10 text-center text-sm text-gray-400">
                    Không tìm thấy sản phẩm.
                  </p>
                )}
              </div>

              {selectedProduct && (
                <p className="text-xs text-gray-600">
                  Đã chọn <strong>{selectedProduct.name}</strong>. Thay đổi sẽ được lưu ngay vào
                  MongoDB.
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
