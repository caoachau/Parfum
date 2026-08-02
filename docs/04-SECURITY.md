# 04 — Bảo mật

## 1. Xác thực (Authentication)
- **JWT hai token**:
  - **Access token**: sống 15 phút, **giữ trong bộ nhớ JS** (`lib/token.ts`) — KHÔNG lưu localStorage → giảm rủi ro XSS đánh cắp.
  - **Refresh token**: sống 7 ngày, lưu trong **httpOnly cookie** (JS không đọc được), path `/api/auth`.
- **Silent refresh**: khi access token hết hạn, interceptor Axios tự gọi `/auth/refresh` để lấy token mới.
- **Refresh token được hash (bcrypt)** trước khi lưu DB → lộ DB cũng không dùng lại được token.

## 2. CSRF (double-submit cookie)
- Server sinh `csrfToken` ngẫu nhiên (32 byte), đặt vào cookie **`httpOnly: false`** (để JS đọc).
- Client gửi lại qua header **`X-CSRF-Token`**; middleware `verifyCsrf` so khớp.
- Áp dụng cho endpoint nhạy cảm dùng cookie: **`/auth/refresh`**, **`/auth/logout`**.

## 3. Mật khẩu
- **bcrypt cost 12** cho mật khẩu người dùng; hash refresh token dùng cost 10.
- Chính sách mật khẩu mạnh qua `validators/password.schema.ts` (Zod).

## 4. Khôi phục mật khẩu bằng OTP (2 kênh)
- **Qua email**: OTP 6 số, TTL **5 phút**, lưu dưới dạng **hash** (`sha256(email:otp:secret)`). Sau khi xác minh OTP → cấp `resetToken` (32 byte, cũng hash) → gọi `/reset-password`.
- **Qua số điện thoại**: OTP 6 số gửi qua **eSMS.vn**, TTL 5 phút, quy trình tương tự.
- So sánh OTP bằng **constant-time** (`crypto.timingSafeEqual`) → chống dò thời gian.
- Chống dò email/sđt tồn tại: luôn trả về thông điệp trung tính.

## 5. Header & tầng mạng
- **Helmet**: CSP + HSTS.
- **CORS allowlist** qua `CORS_ORIGINS` (không dùng `*`).
- **trust proxy** đúng số tầng → `req.ip` chính xác sau Nginx + cookie `secure`.
- Body JSON giới hạn **100kb**.

## 6. Chống injection & lạm dụng
- **express-mongo-sanitize**: loại ký tự `$`/`.` → chống NoSQL injection.
- **Zod validate** mọi input trước khi vào controller.
- **Rate limiting**: API chung 300 req/15ph; endpoint auth 10 req/15ph (chống brute-force). Hỗ trợ Redis khi chạy nhiều instance.

## 7. Thanh toán (webhook)
- Webhook ngân hàng/SePay xác minh **HMAC-SHA256** trên **rawBody**.
- Chống replay: kiểm tra timestamp **±300 giây**.
- So sánh chữ ký bằng **constant-time**.

## 8. Khác
- **Quyền theo vai trò** (`authorize('admin')`) cho khu quản trị.
- **Không commit secret**: dùng `.env.example`; xoay khóa nếu lộ.
- Giám sát lỗi qua **Sentry** (tùy chọn).

> Xem thêm chính sách ở `SECURITY.md` (root).
