// =============================================================================
//  ADMIN USERS — quan ly nguoi dung: xem, doi quyen, xoa
// =============================================================================
import { useEffect, useState } from "react";
import {
  adminApi,
  apiMessage,
  formatDate,
  type AdminUser,
  type Paginated,
} from "../../lib/adminApi";
import { toast } from "../../store/toast.store";
import { useAuth } from "../../store/auth.store";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  LoadingState,
  PageHeader,
} from "../../components/admin/ui";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const me = useAuth((s) => s.user);

  async function load() {
    try {
      setLoading(true);
      const res = await adminApi.get<AdminUser[] | Paginated<AdminUser>>("/users");
      setUsers(Array.isArray(res) ? res : res.data);
    } catch (e) {
      toast.error(apiMessage(e, "Không tải được người dùng"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(u: AdminUser) {
    const nextRole = u.role === "admin" ? "customer" : "admin";
    try {
      setBusyId(u.id);
      await adminApi.patch(`/users/${u.id}/role`, { role: nextRole });
      toast.success(nextRole === "admin" ? "Đã cấp quyền admin" : "Đã gỡ quyền admin");
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
    } catch (e) {
      toast.error(apiMessage(e, "Đổi quyền thất bại"));
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminApi.del(`/users/${deleteTarget.id}`);
      toast.success("Đã xoá người dùng");
      setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(apiMessage(e, "Xoá thất bại"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Xem danh sách, cấp/gỡ quyền admin, xoá tài khoản"
      />

      <Card>
        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState message="Chưa có người dùng nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="p-4">Người dùng</th>
                  <th className="p-4">Liên hệ</th>
                  <th className="p-4">Quyền</th>
                  <th className="p-4">Đơn hàng</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = me?.id === u.id;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{u.name || "—"}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="p-4 text-gray-600">{u.phone || "—"}</td>
                      <td className="p-4">
                        <Badge color={u.role === "admin" ? "blue" : "gray"}>
                          {u.role === "admin" ? "Quản trị viên" : "Khách"}
                        </Badge>
                      </td>
                      <td className="p-4">{u.orderCount ?? 0}</td>
                      <td className="p-4 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            disabled={isMe || busyId === u.id}
                            onClick={() => toggleRole(u)}
                          >
                            {u.role === "admin" ? "Gỡ admin" : "Cấp admin"}
                          </Button>
                          <Button
                            variant="danger"
                            disabled={isMe}
                            onClick={() => setDeleteTarget(u)}
                          >
                            Xoá
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá người dùng"
        message={`Xoá tài khoản "${deleteTarget?.email}"? Hành động không thể hoàn tác.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
