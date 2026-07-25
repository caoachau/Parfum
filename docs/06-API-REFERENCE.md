# 06 — REST API & Router

## Nguyên tắc thiết kế
- **REST**: tài nguyên danh từ số nhiều (`/products`, `/orders`), động từ qua HTTP method (GET/POST/PUT/PATCH/DELETE).
- **Tiền tố**: toàn bộ mount dưới **`/api/v1`** (và `/api` cho tương thích), đăng ký trong `routes/index.ts`.
- **Middleware chain**: `validate (Zod)` → `authenticate` → `authorize` → `verifyCsrf` (khi cần) → controller.
- **Rate limit**: `/api/v1` chung 300 req/15ph; `/auth/*` nhạy cảm 10 req/15ph.

## Nhóm endpoint chính

| Prefix | Mô tả |
|--------|-------|
| `/health` | Health check (trả `{status:'ok'}`) |
| `/auth` | Đăng ký, đăng nhập, refresh, logout, OTP reset, verify email, hồ sơ/địa chỉ |
| `/categories`, `/brands` | Danh mục, thương hiệu |
| `/products`, `/variants` | Sản phẩm & biến thể |
| `/reviews` | Đánh giá |
| `/cart` | Giỏ hàng |
| `/orders` | Đặt/ tra cứu đơn; sinh dữ liệu VietQR |
| `/payment-webhooks` | Nhận webhook thanh toán (HMAC) |
| `/account` | Dữ liệu tài khoản mở rộng |
| `/blog`, `/site-content`, `/scent-family-cards` | Nội dung |
| `/support` | Yêu cầu hỗ trợ |
| `/admin/orders`, `/admin/*` | Khu quản trị (yêu cầu role admin) |

## Ví dụ luồng auth (`/auth`)

| Method | Path | Ý nghĩa |
|--------|------|--------|
| POST | `/auth/register` | Đăng ký (rate-limit chặt) |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/refresh` | Làm mới access token (cần CSRF) |
| POST | `/auth/logout` | Đăng xuất (cần auth + CSRF) |
| POST | `/auth/forgot-password` | Gửi OTP email |
| POST | `/auth/verify-password-reset-email-otp` | Xác minh OTP email |
| POST | `/auth/forgot-password-phone` | Gửi OTP SMS |
| POST | `/auth/verify-password-reset-otp` | Xác minh OTP SMS |
| POST | `/auth/reset-password` | Đặt lại mật khẩu bằng resetToken |
| POST | `/auth/verify-email` | Xác thực email |
| GET  | `/auth/me` | Thông tin người dùng hiện tại |
| PUT  | `/auth/me`, `/auth/me/password` | Cập nhật hồ sơ / mật khẩu |
| CRUD | `/auth/me/addresses/*` | Quản lý địa chỉ |

## Swagger / OpenAPI
- Gắn tại **`/api/docs`** qua `swagger-ui-express` (`config/swagger.ts`).
- Spec hiện tại là **stub** (`paths: {}`). Đề xuất nâng cấp: sinh spec tự động bằng `swagger-jsdoc` từ comment JSDoc ở từng route, hoặc định nghĩa schema thủ công.
