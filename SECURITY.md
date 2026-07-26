# 🔒 Chính sách Bảo mật — L'Essence Noire

Tài liệu này mô tả các biện pháp bảo mật được áp dụng trong dự án, quy trình báo cáo lỗ hổng, và các khuyến nghị triển khai an toàn. Mọi đóng góp về bảo mật đều được ghi nhận.

---

## 📌 Phiên bản được hỗ trợ

| Phiên bản | Được hỗ trợ vá bảo mật |
|----------|:-------------------------:|
| `main` (production) | ✅ |
| Nhánh phát triển / feature | ⚠️ Chỉ khi đang review |
| Bản fork / tự chỉnh sửa | ❌ Không |

---

## 🚨 Báo cáo lỗ hổng bảo mật

**Vui lòng KHÔNG tạo issue công khai cho lỗ hổng bảo mật.**

Nếu phát hiện lỗ hổng, hãy báo cáo riêng tư qua:

- **Email:** `Chaucao4325@gmail.com` *(Team Leader)*
- Hoặc dùng tính năng **GitHub Security Advisories** (*Security → Report a vulnerability*).

Khi báo cáo, vui lòng kèm theo:

1. Mô tả lỗ hổng và mức độ ảnh hưởng.
2. Các bước tái hiện (proof-of-concept nếu có).
3. Phiên bản / commit bị ảnh hưởng.
4. Đề xuất khắc phục (nếu có).

**Cam kết phản hồi:**

| Mốc | Thời gian |
|------|-----------|
| Xác nhận đã nhận báo cáo | Trong vòng **48 giờ** |
| Đánh giá sơ bộ & phân loại | Trong vòng **5 ngày làm việc** |
| Cập nhật tiến độ xử lý | Định kỳ cho đến khi vá xong |

Ch�ng tôi tuân theo nguyên tắc **responsible disclosure**: vui lòng cho chúng tôi thời gian hợp lý để vá trước khi công bố công khai.

---

## 🛡️ Các biện pháp bảo mật đã triển khai

### 1. Xác thực & Phiên (Authentication)

- **JWT hai token:**
  - **Access token** — vòng đời ngắn (~15 phút), **giữ trong bộ nhớ** phía client (không lưu localStorage → giảm rủi ro XSS).
  - **Refresh token** — lưu trong **httpOnly cookie** (JS không đọc được), có `Secure` + `SameSite` khi chạy HTTPS.
- **Silent refresh:** khi access token hết hạn (HTTP 401), interceptor tự gọi `/auth/refresh` rồi phát lại request.
- **Thu hồi token:** `/auth/logout` vô hiệu hoá refresh token.
- **Băm mật khẩu:** `bcrypt` với cost = **12**; không bao giờ lưu mật khẩu dạng plaintext.

### 2. Chống CSRF

- Cơ chế **double-submit token** (`X-CSRF-Token`) cho các endpoint nhạy cảm dùng cookie như `/auth/refresh` và `/auth/logout`.
- Có thể bật/tắt qua biến `CSRF_ENABLED` (mặc định **bật**).

### 3. HTTP Headers & CORS

- **Helmet** thiết lập **CSP** (Content-Security-Policy) và **HSTS**.
- **CORS allowlist** cấu hình qua `CORS_ORIGINS` — chỉ cho phép các origin được khai báo.
- **`trust proxy`** được đặt đúng để `req.ip` chính xác và secure cookie hoạt động sau reverse proxy (Nginx).

### 4. Chống tấn công đầu vào (Input hardening)

- **`express-mongo-sanitize`** — loại bỏ toán tử `$`/`.` để chống **NoSQL injection**.
- **Validate dữ liệu** bằng **Zod** cho mọi payload quan trọng.
- **Giới hạn kích thước body** (`BODY_LIMIT`, mặc định 100kb) → chống payload quá lớn.

### 5. Rate limiting

- Giới hạn số request theo cửa sổ thời gian (`RATE_LIMIT_WINDOW_MINUTES`, `RATE_LIMIT_MAX`).
- Hỗ trợ **Redis** để rate-limit phân tán khi chạy nhiều instance.

### 6. Thanh toán & Webhook

- Webhook SePay/VietQR xác thực bằng **HMAC-SHA256** (`SEPAY_WEBHOOK_SECRET`).
- **Chống replay:** chỉ chấp nhận webhook trong cửa sổ **±300 giây**.
- So sánh chữ ký bằng **hằng thời gian** (constant-time) để chống timing attack.

### 7. Toàn vẹn dữ liệu nghiệp vụ

- Đặt hàng dùng **giao dịch MongoDB** (`session.withTransaction`) với khoá nguyên tử → chống **race condition** "bán quá tồn".
- Giá được **snapshot** vào đơn → không thể bị thay đổi sau khi đặt.
- Mọi thay đổi giá/khuyến mãi tuân thủ **Nghị định 81** (`assertLegalDiscount`).

### 8. Phân quyền

- Mọi route `/admin/*` đều qua middleware `auth` + `requireRole('admin')`.
- Người dùng chỉ truy cập được dữ liệu của chính mình (đơn hàng, địa chỉ, đánh giá).

### 9. Giám sát

- Tích hợp **Sentry** (tùy chọn, qua `SENTRY_DSN`) để theo dõi lỗi thời gian thực.
- Xử lý lỗi tập trung — không lộ stack trace / thông tin nhạy cảm ra client ở môi trường production.

---

## 🔑 Quản lý bí mật (Secrets)

- **KHÔNG** commit file `.env` thật. Chỉ commit `.env.example` làm mẫu.
- Sinh JWT secret bằng chuỗi ngẫu nhiên mạnh: `openssl rand -hex 32`.
- **Xoay (rotate)** ngay mọi khóa từng bị lộ (JWT secret, webhook secret, API key Cloudinary...).
- Dùng secret manager của nền tảng (Render, Docker secrets...) ở production, không hardcode.
- Đặt `ADMIN_PASSWORD` mặc định thành mật khẩu mạnh và đổi ngay sau lần đăng nhập đầu.

---

## ✅ Checklist trước khi triển khai production

- [ ] `NODE_ENV=production`
- [ ] Chuỗi JWT secret đủ mạnh, khác nhau cho access & refresh
- [ ] `COOKIE_SECURE=true` và chạy sau HTTPS
- [ ] `CORS_ORIGINS` chỉ chứa domain thật
- [ ] `CSRF_ENABLED=true`
- [ ] `SEPAY_WEBHOOK_SECRET` đã cấu hình & webhook dùng HTTPS
- [ ] MongoDB bật xác thực + chỉ mở nội bộ (không public 27017)
- [ ] Đã bật sao lưu định kỳ (`npm run backup`)
- [ ] `SENTRY_DSN` đã cấu hình (nếu dùng)
- [ ] Quét lỗ hổng dependency (`npm audit`) và Docker image (Trivy)
- [ ] Không còn tài khoản / dữ liệu seed mẫu trên production

---

## 📚 Tham chiếu

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)

---

<div align="center">

**L'Essence Noire** — Bảo mật là trách nhiệm chung. Cảm ơn bạn đã giúp dự án an toàn hơn. 🖤

</div>
