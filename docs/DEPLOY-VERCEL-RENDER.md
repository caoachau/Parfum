# Deploy: Frontend → Vercel · Backend → Render · DB → MongoDB Atlas

Sơ đồ:
```
Trình duyệt  →  Vercel (React SPA)  ─(rewrite /api)─▶  Render (Express)  →  MongoDB Atlas
```
Nhờ **rewrite `/api` trên Vercel** (file `client/vercel.json`), trình duyệt chỉ gọi cùng domain vercel.app → **cookie thành first-party, không dính CORS/cross-site**.

---

## Bước 1 — MongoDB Atlas
1. Tạo cluster free (M0). Atlas có sẵn **replica set** → bật được **transaction** (chống oversell).
2. Network Access: cho phép `0.0.0.0/0` (hoặc IP Render).
3. Lấy connection string → `MONGO_URI` (nhớ thêm tên DB, ví dụ `/hoc_parfum`).

## Bước 2 — Backend trên Render
1. New → **Blueprint** → chọn repo → Render đọc `render.yaml`, tạo service **lessence-server** (Docker).
2. Điền các biến `sync:false` trong Dashboard:
   - `MONGO_URI` = chuỗi Atlas
   - `CLIENT_URL` = `https://<ten-app>.vercel.app`
   - `CORS_ORIGINS` = `https://<ten-app>.vercel.app`
   - `CLOUDINARY_*`, `SMTP_*`, `MAIL_FROM`
   - `VIETQR_*`, `SEPAY_WEBHOOK_SECRET`
   - `ESMS_*` (nếu dùng OTP SMS), `REDIS_URL`/`SENTRY_DSN` (tùy chọn)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → Render **tự sinh** (generateValue).
3. Deploy → kiểm tra `https://lessence-server.onrender.com/api/health` trả `{status:'ok'}`.
> ⚠️ Ghi lại URL thật của service. Nếu **khác** `lessence-server.onrender.com` thì phải sửa lại `destination` trong `client/vercel.json`.

## Bước 3 — Frontend trên Vercel
1. New Project → import repo.
2. **Root Directory** = `client` (quan trọng vì là monorepo).
3. Framework **Vite**, Build `npm run build`, Output `dist` (đã khai trong `vercel.json`).
4. **KHÔNG** cần set `VITE_API_URL` → để trống, client mặc định gọi `/api` → Vercel rewrite về Render.
5. Deploy.

## Bước 4 — Nối webhook thanh toán
- Vào SePay/ngân hàng, đặt webhook URL = `https://<ten-app>.vercel.app/api/v1/payment-webhooks/...` (hoặc trỏ thẳng tới Render).

---

## Sau khi deploy — checklist kiểm tra
- [ ] `GET /api/health` OK
- [ ] Đăng ký / đăng nhập → F5 vẫn còn đăng nhập (**refresh token cookie hoạt động**)
- [ ] Đặt 1 đơn thử → sinh VietQR
- [ ] Quên mật khẩu → nhận OTP email
- [ ] Ảnh upload lên Cloudinary hiển thị

## Lưu ý quan trọng
- **react-snap prerender KHÔNG chạy trên Vercel** (thiếu Chromium). Để build thường `npm run build`; SEO vẫn hoạt động nhờ `useSeo` (meta động) + `robots.txt`/`sitemap.xml`. Nếu muốn prerender thì chạy `build:seo` ở máy có Chromium rồi deploy thư mục tĩnh.
- **Render free/starter ngủ khi không dùng** → request đầu tiên chậm ~30s. Nâng plan nếu cần luôn sẵn sàng.
- **Bảo mật secret**: đổi toàn bộ secret thật (JWT, SMTP, Cloudinary...) vì `.env` cũ từng nằm trong source.
- Nếu **KHÔNG dùng proxy** mà gọi thẳng Render: set `VITE_API_URL=https://lessence-server.onrender.com/api`, phải bật CORS đúng origin và cookie `sameSite=none; secure` (code đã set khi production).
