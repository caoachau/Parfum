# 07 — Các tiện ích (utilities) & tích hợp

## 1. Gửi email — `utils/mailer.ts`
- Dùng **nodemailer** qua **dynamic import** (không bắt buộc có sẵn lúc build).
- Cấu hình SMTP qua env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
- **Không chặn nghiệp vụ**: nếu chưa cấu hình SMTP → chỉ log cảnh báo, trả `false` (không ném lỗi).
- `normalizeMailFrom()` chuẩn hoá tên người gửi; hỗ trợ cả CommonJS lẫn ESM của nodemailer.
- Dùng bởi: `auth.service` (OTP, verify email), `notification.service` (đơn/khuyến mãi), `blog.service`.

## 2. OTP khôi phục mật khẩu
- **Email OTP** (`auth.service`): 6 số, TTL 5 phút, lưu hash `sha256(email:otp:secret)`; gửi qua `sendMail`.
- **SMS OTP** (`utils/sms.ts`): gửi qua **eSMS.vn** REST API; có `SMS_DEV_MODE` để log OTP khi dev; timeout 10s; template bắt buộc chứa `{OTP}`.
- Sau khi xác minh OTP → cấp **resetToken** (32 byte hex, lưu hash) → gọi `/reset-password`.

## 3. QR code thanh toán (VietQR)
- Cấu hình ngân hàng trong `env.vietqr` (`bankBin`, `accountNo`, `accountName`).
- `order.service` sinh dữ liệu chuyển khoản VietQR khi đơn chọn `bank_qr`.
- Khách quét QR chuyển khoản → ngân hàng gửi **webhook** → `payment-webhook.service` xác minh HMAC-SHA256 → cập nhật đơn `paid`.

## 4. JWT — `utils/jwt.ts`
- `signAccess` (15m), `signRefresh` (7d), `verifyAccess`, `verifyRefresh`.
- Ký bằng `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (thuật toán HS256 mặc định).

## 5. bcrypt
- Hash mật khẩu người dùng (**cost 12**) và hash **refresh token** với cost 10 trước khi lưu DB.
- Dùng ở `auth.service`, `security.service`, script `createAdmin`, `seed`.

## 6. Cloudinary — `config/cloudinary.ts`
- Cấu hình 1 lần từ env; `isCloudinaryConfigured` kiểm tra đủ 3 biến.
- Thư mục media: `products`, `news`, `brand`, `home`, `about`, `feed back`.
- Upload qua `middlewares/upload.middleware.ts` (multer) → `media.service`.

## 7. Cookie — `utils/cookies.ts`
- `setRefreshCookie` (httpOnly, secure prod, sameSite none/lax, path `/api/auth`).
- `setCsrfCookie` (httpOnly:false để JS đọc).
- `parseCookies` tự viết (không cần cookie-parser).

## 8. Logger & Monitoring
- `utils/logger.ts`: log có cấp độ (info/warn/error).
- `utils/monitoring.ts` + `middlewares/error.middleware.ts`: tích hợp **Sentry** (tùy chọn qua `SENTRY_DSN`).

## 9. Giá & khuyến mãi
- `services/pricing-engine.service.ts` + `utils/promotionPricing.ts`: tính giá cuối và phí vận chuyển theo thứ tự Flash Sale > Discount > Voucher.

## 10. Rate limit & Sanitize & Validate
- `middlewares/rateLimit.middleware.ts` (in-memory, hỗ trợ Redis).
- `middlewares/sanitize.middleware.ts` (mongo-sanitize).
- `middlewares/validate.middleware.ts` (Zod schema).
