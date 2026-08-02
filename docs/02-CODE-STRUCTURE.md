# 02 — Cấu trúc mã nguồn (từng folder / từng file)

## A. Cấp gốc (root)

| File/Folder | Ý nghĩa |
|-------------|--------|
| `package.json` | Khai báo **npm workspaces** (`client`, `server`), script dùng chung |
| `package-lock.json` | Khóa phiên bản dependency toàn monorepo |
| `docker-compose.yml` | Chạy mongo + redis + server + client |
| `render.yaml` | Cấu hình deploy trên Render |
| `.github/workflows/ci.yml` | Pipeline CI (lint, typecheck, test, build image) |
| `.husky/` | Git hooks (pre-commit chạy lint-staged) |
| `.env.example` | Mẫu biến môi trường |
| `.gitignore` | Bỏ qua node_modules, dist, .env, backups... |
| `ERD.md` | Sơ đồ quan hệ thực thể (dạng text) |
| `README.md` | Tổng quan dự án |
| `SECURITY.md` | Chính sách bảo mật |
| `docs/` | Thư mục tài liệu này |
| `resolve_conflicts.ps1` | ⚠️ Script cũ xử lý conflict git — **nên xóa** (rủi ro giữ cả 2 nhánh conflict) |

---

## B. `client/` — Frontend React + Vite

### B.1. Cấp gốc client
| File | Ý nghĩa |
|------|--------|
| `index.html` | HTML gốc, chứa `<div id="root">`, link favicon, meta mặc định |
| `vite.config.ts` | Cấu hình Vite (plugin React, build) |
| `vitest.config.ts` | Cấu hình test |
| `tsconfig.json` | Cấu hình TypeScript |
| `tailwind.config.js` / `postcss.config.js` | Tailwind CSS |
| `nginx.conf` | Cấu hình Nginx khi chạy production (SPA fallback + proxy /api) |
| `Dockerfile` | Build ảnh Docker (multi-stage) |
| `public/` | Tài nguyên tĩnh: `robots.txt`, `sitemap.xml`, `favicon.ico` |

### B.2. `client/src/`
| Folder/File | Chức năng |
|-------------|----------|
| `main.tsx` | Entry: hydrate (nếu đã prerender) hoặc render; gọi `bootstrap()` auth |
| `router.tsx` | Khai báo toàn bộ route (lazy load + Suspense), `ProtectedRoute`, `AdminRoute` |
| `index.css` | CSS toàn cục + Tailwind directives |
| `vite-env.d.ts` | Khai báo type cho Vite |
| `pages/` (~45 file) | Mỗi file = 1 trang: `Home`, `Shop`, `ProductDetail`, `Cart`, `Checkout`, `Blog`, `About`, `Contact`, `PrivacyPolicy`, khu `account/*`, khu `admin/*`... |
| `components/` (~47 file) | UI tái sử dụng; `components/Shop/*` (bộ lọc, card), `components/admin/*` (bảng, form quản trị) |
| `store/` | **Zustand**: `auth.store`, `cart.store`, `toast.store`, `wishlist.store`. |
| `lib/` | `api.ts` (axios + interceptor refresh), `token.ts` (access token in-memory + đọc CSRF), `adminApi.ts` |
| `hooks/` | `useSeo.ts` — cập nhật title/meta/OG/twitter động cho SEO |
| `types/` | Định nghĩa TypeScript dùng chung |
| `assets/` | Ảnh/icon build-time |

---

## C. `server/` — Backend Express + MongoDB

### C.1. Cấp gốc server
`Dockerfile`, `package.json` (scripts dev/build/seed/backup/migrate...), `tsconfig.json`, `vitest.config.ts`, `.env` (**không commit**), `tests/` (15 file vitest).

### C.2. `server/src/`

#### `config/`
| File | Chức năng |
|------|----------|
| `env.ts` | Đọc & validate biến môi trường (bắt lỗi sớm nếu thiếu MONGO_URI, JWT_*) |
| `db.ts` | Kết nối Mongoose, xử lý disconnect + graceful shutdown |
| `cloudinary.ts` | Cấu hình Cloudinary + danh sách thư mục media |
| `swagger.ts` | Gắn Swagger UI tại `/api/docs` (spec hiện tại là stub) |
| `siteContentSlots.ts` | Định nghĩa các "slot" nội dung trang tĩnh (banner, hero...) |

#### `models/` (22 schema Mongoose)
`user`, `product`, `variant`, `brand`, `category`, `cart`, `order`, `payment`, `review`, `wishlist`, `discount`, `voucher`, `voucherCounter`, `flashSale`, `flashSaleUsage`, `blogArticle`, `journalSubscriber`, `siteContent`, `scentFamilyCard`, `supportRequest`, `expense`, `priceHistory`.
- **Chống race condition**: `variant` (tồn kho), `flashSale`+`flashSaleUsage` (unique index mỗi khách), `voucherCounter` (đếm lượt dùng).

#### `routes/` (21 file)
Định tuyến theo tài nguyên; `index.ts` gom tất cả dưới `/api/v1`, gắn `apiLimiter` (300 req/15ph), route `/health`. `auth.routes` có `authLimiter` riêng (10 req/15ph).

#### `controllers/` (24 file)
Điều phối HTTP cho từng tài nguyên: `auth`, `product`, `order`, `cart`, `promotion`, `payment-webhook`, `dashboard`, `report`, `admin*`...

#### `services/` (26 file) — trái tim nghiệp vụ
| Service | Vai trò |
|---------|--------|
| `order.service` | Đặt hàng, transaction, khóa tồn, fallback |
| `pricing-engine.service` | Tính giá: Flash Sale > Discount > Voucher |
| `promotion.service` | Quản lý khuyến mãi |
| `auth.service` | Đăng ký/đăng nhập, refresh, OTP reset, verify email |
| `payment-webhook.service` | Xác minh HMAC webhook ngân hàng |
| `notification.service` | Gửi email thông báo đơn/khuyến mãi |
| `report.service` | Báo cáo doanh thu, tồn kho, lợi nhuận |
| `security.service` | Tiện ích bảo mật (hash, so sánh...) |
| `media.service` | Upload/quản lý ảnh Cloudinary |
| còn lại | `account`, `brand`, `category`, `product`, `variant`, `cart`, `review`, `blog`, `siteContent`, `scentFamilyCard`, `admin*` |

#### `middlewares/` (7 file)
`auth` (xác thực JWT + `authorize` theo role), `csrf` (double-submit), `error` (xử lý lỗi tập trung + Sentry), `rateLimit` (in-memory/Redis), `sanitize` (mongo-sanitize), `upload` (multer + Cloudinary), `validate` (Zod).

#### `utils/` (10 file)
`jwt`, `mailer` (nodemailer), `sms` (eSMS OTP), `cookies` (refresh/CSRF cookie), `logger`, `monitoring` (Sentry), `promotionPricing` (quy tắc khuyến mãi), `orderStatus`, `contactValidation`, `regex`.

#### `validators/`
`password.schema` (mật khẩu mạnh). Schema đăng ký/đăng nhập được khai báo tại `auth.routes.ts`.

#### `scripts/`
`seed`, `createAdmin`, `backfillVariantCostPrices`, `seedProductNotes`, `seedScentFamilyCards`, **`backup`**, **`restore`**, **`migrate`**, **`migrate-create`** (4 cái sau là mới thêm).

#### `migrations/`
Trình migration + 2 migration mẫu (xem `BACKUP-MIGRATION.md`).

#### `app.ts` & `index.ts`
- `app.ts`: `createApp()` ráp middleware theo thứ tự: trust proxy → compression → helmet (CSP/HSTS) → CORS allowlist → json(100kb, giữ rawBody cho webhook) → mongo-sanitize → static `/uploads` → routes `/api/v1` + `/api` → swagger → errorHandler.
- `index.ts`: kết nối DB rồi `app.listen(PORT)`.
