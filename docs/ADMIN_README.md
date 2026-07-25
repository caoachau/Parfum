# Trang Quản trị (Admin Panel) - L'Essence Noire

Tài liệu mô tả toàn bộ phần **quản lý nghiệp vụ** đã được bổ sung cho web bán nước hoa.

## 1. Đăng nhập admin

- Tài khoản mặc định (tạo bởi `npm run seed`): **admin@lessencenoire.vn** / **Admin@123**
- Sau khi đăng nhập bằng tài khoản có `role = admin`, menu **QUẢN TRỊ** sẽ hiện trên Header.
- Truy cập trực tiếp: `/admin`

## 2. Chạy dự án

```bash
# Backend
cd server
npm install
cp .env.example .env      # điền MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm run seed              # tạo dữ liệu mẫu + tài khoản admin
npm run dev               # http://localhost:5000

# Frontend
cd client
npm install
npm run dev               # http://localhost:5173
```

## 3. Các màn hình quản trị (đầy đủ nghiệp vụ)

| Màn hình | Đường dẫn | Chức năng |
|---|---|---|
| Dashboard | `/admin` | Doanh thu, số đơn/sản phẩm/người dùng, đơn theo trạng thái, cảnh báo tồn thấp, đơn gần đây |
| Sản phẩm | `/admin/products` | Thêm/sửa/xoá, ẩn-hiện, tìm kiếm, phân trang, tự sinh slug, gán thương hiệu/danh mục, notes hương |
| Biến thể / Tồn kho | `/admin/variants` | CRUD SKU, dung tích, giá, tồn kho; lọc theo sản phẩm; cảnh báo tồn ≤ 5 |
| Đơn hàng | `/admin/orders` | Danh sách + lọc trạng thái, xem chi tiết, cập nhật trạng thái đơn & thanh toán, tự hoàn kho khi huỷ |
| Thương hiệu | `/admin/brands` | CRUD, chặn xoá khi còn sản phẩm dùng |
| Danh mục | `/admin/categories` | CRUD, chặn xoá khi còn sản phẩm dùng |
| Đánh giá | `/admin/reviews` | Duyệt / bỏ duyệt / xoá đánh giá của khách |
| Người dùng | `/admin/users` | Tìm kiếm, phân quyền admin/khách, xoá; chặn tự hạ quyền / tự xoá |

## 4. API quản trị (backend)

Tất cả nằm dưới `/api/admin`, **bắt buộc** `authenticate` + `authorize('admin')` (áp dụng ở cấp router).

```
GET    /api/admin/stats

GET    /api/admin/products            ?page&limit&search&brand&category&status
GET    /api/admin/products/:id
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

GET    /api/admin/variants            ?product&lowStock&search
POST   /api/admin/variants
PUT    /api/admin/variants/:id
DELETE /api/admin/variants/:id

GET    /api/admin/brands
POST   /api/admin/brands
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id

GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

GET    /api/admin/orders              ?page&limit&status
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status   { status }
PATCH  /api/admin/orders/:id/payment  { status }

GET    /api/admin/users               ?page&limit&search&role
PATCH  /api/admin/users/:id/role      { role }
DELETE /api/admin/users/:id

GET    /api/admin/reviews             ?status=pending|approved
PATCH  /api/admin/reviews/:id/approve
PATCH  /api/admin/reviews/:id/reject
DELETE /api/admin/reviews/:id

POST   /api/admin/upload             (multipart 'image' -> Cloudinary)
```

## 5. Quy tắc nghiệp vụ đã cài đặt

- **Huỷ đơn** (`status = cancelled`) → tự động **hoàn lại tồn kho** (`restoreStock`) và đặt thanh toán về `unpaid`. Chỉ hoàn kho 1 lần.
- Chuyển đơn sang `paid`/`done` → tự đồng bộ thanh toán sang `paid`.
- **Xoá sản phẩm** → xoá luôn các biến thể con để tránh dữ liệu mồ côi.
- **Xoá thương hiệu/danh mục** bị chặn nếu còn sản phẩm đang dùng.
- **Slug** sản phẩm tự sinh từ tên (bỏ dấu tiếng Việt) và đảm bảo duy nhất.
- Admin **không thể tự hạ quyền hoặc tự xoá** tài khoản của mình.

## 6. Danh sách file thay đổi / thêm mới

**Backend (server/src)**
- `services/admin.service.ts` (mới) – toàn bộ nghiệp vụ quản trị
- `controllers/admin.controller.ts` (mới)
- `routes/admin.routes.ts` (mới) – router `/api/admin` có guard admin + validate zod
- `routes/index.ts` (sửa) – mount `/admin`, đồng thời mount `variant.routes` & `upload.routes` (trước đây bị bỏ quên)
- `routes/review.routes.ts` (sửa) – **thêm guard admin** cho các endpoint duyệt đánh giá (trước đây bị hở bảo mật)

**Frontend (client/src)**
- `lib/adminApi.ts` (mới) – client gọi API admin + kiểu dữ liệu + helper (formatVnd, formatDate...)
- `components/admin/ui.tsx` (mới) – bộ UI dùng chung (Modal, Button, Field, Badge, Pagination, ConfirmDialog...)
- `components/AdminLayout.tsx` (viết lại) – sidebar đầy đủ menu
- `pages/admin/AdminDashboard.tsx` (viết lại) – thống kê thật
- `pages/admin/AdminProducts.tsx` (mới)
- `pages/admin/AdminVariants.tsx` (mới)
- `pages/admin/AdminBrands.tsx` (viết lại) – CRUD đầy đủ
- `pages/admin/AdminCategories.tsx` (mới)
- `pages/admin/AdminOrders.tsx` (mới)
- `pages/admin/AdminUsers.tsx` (mới)
- `pages/admin/AdminReviews.tsx` (mới)
- `router.tsx` (sửa) – thêm cây route `/admin` bọc trong `AdminRoute` + `AdminLayout`
- `components/Header.tsx` (sửa) – thêm link "Quản trị" cho admin
