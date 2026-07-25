// =============================================================================
//  ADMIN REVIEWS — duyet / tu choi / xoa danh gia san pham
// =============================================================================
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  adminApi,
  apiMessage,
  formatDate,
  type AdminReview,
  type Paginated,
} from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  LoadingState,
  PageHeader,
} from "../../components/admin/ui";

type Filter = "all" | "pending" | "approved";

export default function AdminReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const requestedFilter = searchParams.get("status");
  const filter: Filter =
    requestedFilter === "pending" || requestedFilter === "approved"
      ? requestedFilter
      : "all";
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const status = filter === "all" ? undefined : filter;
      const res = await adminApi.get<AdminReview[] | Paginated<AdminReview>>(
        "/reviews",
        status ? { status } : undefined,
      );
      setReviews(Array.isArray(res) ? res : res.data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được đánh giá"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setApproval(r: AdminReview, approved: boolean) {
    try {
      setBusyId(r.id);
      await adminApi.patch(`/reviews/${r.id}/${approved ? "approve" : "reject"}`);
      toast.success(approved ? "Đã duyệt" : "Đã từ chối");
      setReviews((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, approved } : x)),
      );
    } catch (e) {
      toast.error(apiMessage(e, "Cập nhật thất bại"));
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminApi.del(`/reviews/${deleteTarget.id}`);
      toast.success("Đã xoá đánh giá");
      setReviews((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(apiMessage(e, "Xoá thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ duyệt" },
    { key: "approved", label: "Đã duyệt" },
  ];

  function changeFilter(nextFilter: Filter) {
    const params = new URLSearchParams(searchParams);
    if (nextFilter === "all") params.delete("status");
    else params.set("status", nextFilter);
    setSearchParams(params, { replace: true });
  }

  return (
    <div>
      <PageHeader
        title="Quản lý đánh giá"
        subtitle="Duyệt, từ chối hoặc xoá đánh giá sản phẩm"
        actions={
          <div className="flex gap-2">
            {filters.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "primary" : "secondary"}
                onClick={() => changeFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        }
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : reviews.length === 0 ? (
          <EmptyState message="Không có đánh giá nào." />
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {r.userName || r.guestEmail || "Ẩn danh"}
                    </span>
                    <span className="text-amber-500">
                      {"★".repeat(r.rating)}{"☆".repeat(Math.max(0, 5 - r.rating))}
                    </span>
                    <Badge color={r.approved ? "green" : "gray"}>
                      {r.approved ? "Đã duyệt" : "Chờ duyệt"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{r.comment}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {r.product?.name ? `Sản phẩm: ${r.product.name} · ` : ""}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.product?.id && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        window.open(`/product/${r.product?.id}`, "_blank", "noopener")
                      }
                      title={`Xem sản phẩm: ${r.product?.name ?? ""}`}
                    >
                      <Eye className="h-4 w-4" />
                      Xem
                    </Button>
                  )}
                  {!r.approved && (
                    <Button
                      variant="secondary"
                      disabled={busyId === r.id}
                      onClick={() => setApproval(r, true)}
                    >
                      Duyệt
                    </Button>
                  )}
                  {r.approved && (
                    <Button
                      variant="secondary"
                      disabled={busyId === r.id}
                      onClick={() => setApproval(r, false)}
                    >
                      Bỏ duyệt
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setDeleteTarget(r)}>
                    Xoá
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá đánh giá"
        message="Bạn có chắc muốn xoá đánh giá này?"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
