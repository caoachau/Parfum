# Security

## 🔴 Bắt buộc: xoay (rotate) toàn bộ secret đã từng nằm trong `server/.env`

File `server/.env` từng được đóng gói kèm mã nguồn ⇒ **coi như đã lộ**. Đã xóa khỏi repo/gói,
nhưng bạn PHẢI tạo lại giá trị mới cho tất cả secret dưới đây (giá trị cũ vô hiệu hóa):

- [ ] `MONGO_URI` — đổi mật khẩu user MongoDB (Atlas: rotate password / tạo user mới).
- [ ] `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — sinh chuỗi ngẫu nhiên mới:
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
      (đổi 2 secret này sẽ đăng xuất mọi phiên hiện tại — chấp nhận được).
- [ ] `CLOUDINARY_API_SECRET` — rotate trong Cloudinary Console.
- [ ] `SMTP_PASS` — thu hồi App Password Gmail cũ, tạo cái mới.
- [ ] `ESMS_API_KEY`, `ESMS_SECRET_KEY` — rotate với eSMS.
- [ ] `SEPAY_WEBHOOK_SECRET` — tạo secret webhook mới trong SePay.
- [ ] `ADMIN_BOOTSTRAP_PASSWORD` / mật khẩu admin — đổi mật khẩu admin.

## Quản lý secret

- KHÔNG commit/đóng gói `.env` (đã có trong `.gitignore` + `.dockerignore`).
- Production: dùng secret manager của nền tảng (Render/Railway env vars, Doppler, Vault…).
- `.env.example` chỉ chứa KEY, không chứa giá trị.

## Các biện pháp đã áp dụng trong code

- Access token giữ in-memory ở client (không localStorage) + silent refresh qua refresh cookie.
- Admin bootstrap: chỉ tạo khi CHƯA có admin và có đủ env; không reset mật khẩu tài khoản đã tồn tại; không log credential.
- Rate limiter: dọn bucket hết hạn định kỳ (hết rò rỉ bộ nhớ). Đa instance nên chuyển sang Redis (xem `REDIS_URL`).
- CSRF double-submit cho endpoint dùng cookie.
- Helmet CSP + HSTS, `trust proxy`, CORS allowlist.
- Docker chạy user `node` (server), có `HEALTHCHECK`, dùng `npm ci` khi có lockfile.

## Việc cần làm thủ công còn lại

- [ ] Chạy `npm install` trong `server/` rồi commit `server/package-lock.json` (để CI/Docker dùng `npm ci`).
- [ ] (Tùy chọn) `npm i @sentry/node` trong `server/` + set `SENTRY_DSN` để bật error tracking.
- [ ] Chạy `npm install` ở gốc để kích hoạt husky pre-commit (lint-staged).
