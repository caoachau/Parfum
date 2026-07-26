<div align="center">

# 🖤 L'Essence Noire

### Nền tảng thương mại điện tử nước hoa cao cấp — *Fullstack TypeScript*

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

*Cửa hàng nước hoa chính hãng: catalog & biến thể, giỏ hàng, khuyến mãi 3 tầng (Flash Sale / Discount / Voucher), thanh toán VietQR, SEO prerender và khu quản trị đầy đủ.*

[Tổng quan](#-tổng-quan) · [Kiến trúc](#-kiến-trúc) · [Bắt đầu nhanh](#-bắt-đầu-nhanh) · [API](#-tài-liệu-api) · [Roadmap](#-roadmap)

</div>

---

## 📑 Mục lục

- [🌸 Tổng quan](#-tổng-quan)
- [📖 Giới thiệu đồ án](#-giới-thiệu-đồ-án)
- [🌟 Chức năng chính](#-chức-năng-chính)
- [🏗 Kiến trúc](#-kiến-trúc)
- [🧰 Công nghệ](#-công-nghệ)
- [🔐 Bảo mật](#-bảo-mật)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🚀 Bắt đầu nhanh](#-bắt-đầu-nhanh)
- [🔧 Biến môi trường](#-biến-môi-trường)
- [📜 Scripts thường dùng](#-scripts-thường-dùng)
- [📚 Tài liệu API](#-tài-liệu-api)
- [🔎 SEO & Prerender](#-seo--prerender-ssr)
- [💾 Sao lưu & Migration DB](#-sao-lưu--migration-db)
- [🐳 Docker](#-docker)
- [🔄 CI/CD](#-cicd)
- [🧪 Kiểm thử & Chất lượng](#-kiểm-thử--chất-lượng)
- [🛠 Workflow phát triển](#-workflow-phát-triển)
- [📊 Thống kê dự án](#-thống-kê-dự-án)
- [🗺 Roadmap](#-roadmap)
- [🤝 Đóng góp](#-đóng-góp)
- [📜 License](#-license)

---

## 🌸 Tổng quan

**L'Essence Noire** là một ứng dụng thương mại điện tử fullstack cho cửa hàng nước hoa cao cấp, viết hoàn toàn bằng **TypeScript** theo mô hình **monorepo** (npm workspaces):

- **`client/`** — Ứng dụng React (Vite) cho khách hàng + khu quản trị (admin).
- **`server/`** — REST API bằng Express + MongoDB (Mongoose) theo kiến trúc phân lớp.

Hệ thống hỗ trợ toàn bộ vòng đời mua hàng: duyệt sản phẩm → giỏ hàng → áp khuyến mãi → đặt hàng → thanh toán VietQR → theo dõi đơn; kèm khu quản trị để quản lý sản phẩm, tồn kho, khuyến mãi, đơn hàng, người dùng, nội dung blog và báo cáo doanh thu.

> 🖤 *Khám phá mùi hương chữ ký của bạn.*

---

## 📖 Giới thiệu đồ án

Đây là đồ án môn học phát triển một website thương mại điện tử nước hoa hoàn chỉnh, áp dụng kiến trúc **Client–Server**, quy trình **Agile/SCRUM**, CI/CD và triển khai container hóa.

### 👥 Thông tin nhóm

| Vai trò | Thành viên | GitHub |
|--------|-----------|--------|
| Team Lead / Fullstack | … | … |
| Frontend Developer | … | … |
| Backend Developer | … | … |

- **Trường / Khoa:** …
- **Học phần:** …
- **Giảng viên hướng dẫn:** …
- **Năm học:** …

### 🎯 Mục tiêu đồ án

- Xây dựng ứng dụng web fullstack hoàn chỉnh với kiến trúc Client–Server.
- Thiết kế bộ máy giá & khuyến mãi 3 tầng minh bạch, tuân thủ pháp luật khuyến mại (Nghị định 81).
- Áp dụng React, Node.js/Express, MongoDB trong một dự án quy mô thật.
- Bảo mật nhiều lớp (JWT, CSRF, Helmet, rate-limit, sanitize).
- Container hóa bằng Docker, thiết lập CI/CD với GitHub Actions và triển khai cloud.
- Tối ưu SEO cho SPA bằng prerender.

---

## 🌟 Chức năng chính

### 🛍️ Khách hàng

- **Catalog & biến thể:** danh sách sản phẩm, biến thể theo dung tích/nồng độ, tìm kiếm & lọc theo họ hương/thương hiệu/giá; trang chi tiết có **JSON-LD**.
- **Giỏ hàng lai:** giỏ hàng cho khách vãng lai (localStorage) + đồng bộ khi đăng nhập.
- **Khuyến mãi 3 tầng:** **Flash Sale > Discount (theo độ ưu tiên) > Voucher**.
- **Thanh toán VietQR** + tra cứu đơn theo mã.
- **Tài khoản:** hồ sơ, sổ địa chỉ, wishlist, hồ sơ mùi hương, lịch sử đơn.
- **Nội dung:** Blog/Journal thương hiệu, trang giới thiệu, liên hệ.

### 🛠️ Quản trị (`/admin`)

- Quản lý **sản phẩm, biến thể, thương hiệu, danh mục, media**.
- Quản lý **đơn hàng, người dùng, đánh giá, blog**.
- Quản lý **khuyến mãi** (Flash Sale / Discount / Voucher) + email thông báo có công tắc tổng.
- **Báo cáo** doanh thu, tồn kho, lợi nhuận.

---

## 🏗 Kiến trúc

```
                          ┌───────────────────────────┐
            HTTPS         │        Nginx (client)      │
  Người dùng ───────────► │  SPA React + prerender SEO │
                          │  proxy /api ──────────────►│
                          └───────────────┬───────────┘
                                           │ /api/v1
                                           ▼
                          ┌───────────────────────────┐
                          │      Express API (server)  │
                          │  routes → controllers →    │
                          │  services → models         │
                          │  middlewares: helmet, cors,│
                          │  csrf, rate-limit, sanitize│
                          └───────┬───────────┬────────┘
                                  │           │
                          ┌───────▼───┐   ┌───▼──────┐
                          │ MongoDB 7 │   │ Redis 7  │
                          │ (Mongoose)│   │(ratelimit│
                          └───────────┘   │ /cache)  │
                                          └──────────┘
```

**Luồng request:** `route` (định tuyến + validate) → `controller` (điều phối HTTP) → `service` (nghiệp vụ, giao dịch) → `model` (Mongoose schema). Middleware xử lý bảo mật, xác thực và xử lý lỗi tập trung.

**Điểm nhấn nghiệp vụ — chống race condition tồn kho:** khi đặt hàng, `order.service` dùng **giao dịch MongoDB** (`session.withTransaction`) với 3 lớp khóa nguyên tử:

1. Trừ tồn theo điều kiện `stock >= qty`.
2. Trừ suất Flash Sale theo `soldCount + qty <= stockAllocated`.
3. Giới hạn mỗi khách qua unique index.

Có sẵn cơ chế *fallback* khi MongoDB không hỗ trợ transaction (single-node).

**Bộ máy resolve giá:** giá hiển thị của mỗi biến thể quyết định theo thứ tự **Flash Sale → Discount (priority) → Giá niêm yết**; voucher áp ở cấp đơn hàng; giá/tên sản phẩm được *snapshot* vào đơn để giữ tính lịch sử.

---

## 🧰 Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| **Frontend** | React 18, TypeScript, Vite 5, React Router 6, Zustand, Tailwind CSS 3, Axios |
| **Backend** | Node ≥20, Express, TypeScript, Mongoose 7, JWT, bcryptjs, Zod/validators |
| **Database** | MongoDB 7 (giao dịch/replica set), Redis 7 (rate-limit phân tán, tùy chọn) |
| **Bảo mật** | Helmet (CSP/HSTS), CORS allowlist, CSRF double-submit, express-mongo-sanitize, rate-limit |
| **Thanh toán** | VietQR + webhook HMAC-SHA256 (SePay) |
| **Ảnh** | Cloudinary |
| **Test** | Vitest (client + server) |
| **DevOps** | Docker (multi-stage), Docker Compose, Nginx, GitHub Actions, Render |
| **Chất lượng** | ESLint, Prettier, Husky + lint-staged |
| **SEO** | Prerender (react-snap), meta/OG động, robots.txt, sitemap.xml, JSON-LD |

---

## 🔐 Bảo mật

- **Xác thực:** JWT access token (15 phút, giữ trong bộ nhớ — chống XSS) + refresh token trong **httpOnly cookie**; *silent refresh* qua interceptor.
- **CSRF:** double-submit token (`X-CSRF-Token`) trên `/auth/refresh` và `/auth/logout`.
- **Mật khẩu:** bcrypt cost 12.
- **HTTP headers:** Helmet với CSP + HSTS.
- **CORS allowlist** cấu hình qua `CORS_ORIGINS`.
- **Chống NoSQL injection:** express-mongo-sanitize; body giới hạn 100kb.
- **Rate limiting** (Redis khi chạy nhiều instance).
- **Webhook thanh toán:** xác thực HMAC-SHA256, chống replay (±300s), so sánh hằng thời gian.
- **trust proxy** đúng để `req.ip` chính xác + secure cookie sau Nginx.
- Giám sát lỗi tùy chọn qua **Sentry**.

> ⚠️ Không commit secret. Dùng `.env.example` làm mẫu; xoay (rotate) mọi khóa đã từng lộ.

---

## 📁 Cấu trúc thư mục

```
.
├── client/                 # React + Vite (SPA + prerender SEO)
│   ├── public/             # robots.txt, sitemap.xml, favicon
│   ├── src/
│   │   ├── pages/          # Các trang (khách + admin)
│   │   ├── components/     # UI dùng chung, Shop, admin
│   │   ├── store/          # Zustand (auth, cart, language, ...)
│   │   ├── hooks/          # useSeo, ...
│   │   ├── lib/            # api (axios), token, adminApi
│   │   ├── router.tsx      # Định tuyến (lazy + Suspense)
│   │   └── main.tsx        # Entry (hydrate khi có prerender)
│   ├── Dockerfile · nginx.conf · vite.config.ts
│
├── server/                 # Express API (TypeScript)
│   └── src/
│       ├── config/         # env, db
│       ├── models/         # Mongoose schema (22)
│       ├── routes/         # Định tuyến /api/v1
│       ├── controllers/    # Điều phối HTTP
│       ├── services/       # Nghiệp vụ (order, pricing-engine, ...)
│       ├── middlewares/    # auth, csrf, error, rate-limit, ...
│       ├── migrations/     # ⭐ Migration DB
│       ├── scripts/        # seed, backup, restore, migrate, ...
│       └── app.ts · index.ts
│
├── docs/                   # Tài liệu (SEO, Backup & Migration)
├── .github/workflows/      # CI
├── docker-compose.yml · render.yaml
└── README.md
```

---

## 🚀 Bắt đầu nhanh

### 📋 Yêu cầu hệ thống

- **Node.js** ≥ 20
- **MongoDB 7** (khuyến nghị **replica set 1 node** để bật transaction) hoặc MongoDB Atlas
- **Redis 7** (tùy chọn — rate-limit phân tán/cache)
- **npm** ≥ 9 (dùng npm workspaces)

### 🛠️ Các bước cài đặt

```bash
# 1. Clone dự án
git clone <repo-url> lessence-noire && cd lessence-noire

# 2. Cài dependency (npm workspaces, chạy ở thư mục gốc)
npm install

# 3. Tạo file .env cho server từ mẫu rồi điền giá trị
cp .env.example server/.env    # sửa MONGO_URI, JWT_*, CLOUDINARY_*, VIETQR_*, ...

# 4. (Tùy chọn) seed dữ liệu mẫu + tạo tài khoản admin
npm run seed         --workspace server
npm run create-admin --workspace server

# 5. Chạy song song server + client
npm run dev --workspace server   # API  http://localhost:5000
npm run dev --workspace client   # Web  http://localhost:5173
```

Truy cập:

- **Web (khách + admin):** http://localhost:5173
- **API:** http://localhost:5000/api/v1

---

## 🔧 Biến môi trường

Xem đầy đủ trong `.env.example`. Các biến quan trọng:

| Biến | Ý nghĩa |
|------|---------|
| `MONGO_URI` | Chuỗi kết nối MongoDB (bắt buộc) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Khóa ký JWT (bắt buộc) |
| `CLIENT_URL` / `CORS_ORIGINS` | Origin được phép (CORS) |
| `CLOUDINARY_*` | Upload ảnh |
| `VIETQR_*` / `SEPAY_WEBHOOK_SECRET` | Thanh toán VietQR + webhook |
| `REDIS_URL` | Rate-limit phân tán (tùy chọn) |
| `SENTRY_DSN` | Giám sát lỗi (tùy chọn) |
| `CSRF_ENABLED` | Bật/tắt CSRF (mặc định bật) |
| `TRUST_PROXY` | Số proxy tin cậy trước app |

---

## 📜 Scripts thường dùng

**Client** (`npm run <script> --workspace client`)

| Script | Mô tả |
|--------|-------|
| `dev` / `build` / `preview` | Phát triển / build / xem thử |
| `prerender` | Prerender HTML tĩnh cho SEO (react-snap) |
| `build:seo` | `build` + `prerender` |
| `lint` · `typecheck` · `test` · `format` | Chất lượng mã |

**Server** (`npm run <script> --workspace server`)

| Script | Mô tả |
|--------|-------|
| `dev` / `build` / `start` | Phát triển / build / chạy production |
| `seed` · `create-admin` | Seed dữ liệu / tạo admin |
| `backup` · `restore` | ⭐ Sao lưu / khôi phục DB |
| `migrate` · `migrate:down` · `migrate:create` | ⭐ Migration DB |
| `lint` · `typecheck` · `test` · `format` | Chất lượng mã |

---

## 📚 Tài liệu API

API theo chuẩn REST, versioned dưới tiền tố **`/api/v1`**. Một số endpoint tiêu biểu:

#### 🔐 Authentication

- `POST /api/v1/auth/register` — Đăng ký tài khoản
- `POST /api/v1/auth/login` — Đăng nhập (trả JWT + set refresh cookie)
- `POST /api/v1/auth/refresh` — Làm mới access token (yêu cầu CSRF token)
- `POST /api/v1/auth/logout` — Đăng xuất
- `GET  /api/v1/auth/me` — Lấy thông tin phiên hiện tại

#### 🧴 Sản phẩm & biến thể

- `GET    /api/v1/products?scentFamily=&brand=&minPrice=&maxPrice=` — Danh sách + lọc
- `GET    /api/v1/products/:slug` — Chi tiết sản phẩm (kèm biến thể, JSON-LD)
- `POST   /api/v1/admin/products` — Tạo sản phẩm *(admin)*
- `PUT    /api/v1/admin/products/:id` — Cập nhật *(admin)*
- `DELETE /api/v1/admin/products/:id` — Xóa *(admin)*

#### 🛒 Giỏ hàng & đơn hàng

- `POST /api/v1/cart/sync` — Đồng bộ giỏ hàng khi đăng nhập
- `POST /api/v1/orders` — Tạo đơn (giao dịch tồn kho + snapshot giá/ưu đãi)
- `GET  /api/v1/orders/:code` — Tra cứu đơn theo mã
- `GET  /api/v1/admin/orders` — Danh sách đơn *(admin)*

#### 🎁 Khuyến mãi

- `GET/POST/PUT/DELETE /api/v1/admin/flash-sales` — Quản trị Flash Sale
- `GET/POST/PUT/DELETE /api/v1/admin/discounts` — Quản trị Discount
- `GET/POST/PUT/DELETE /api/v1/admin/vouchers` — Quản trị Voucher
- `POST /api/v1/cart/apply-voucher` — Áp voucher khi thanh toán

#### 💳 Thanh toán

- `GET  /api/v1/payments/vietqr/:orderCode` — Sinh mã VietQR cho đơn
- `POST /api/v1/webhooks/sepay` — Webhook xác nhận thanh toán (HMAC-SHA256)

#### 📊 Báo cáo *(admin)*

- `GET /api/v1/admin/reports/revenue` — Doanh thu theo thời gian
- `GET /api/v1/admin/reports/inventory` — Tồn kho
- `GET /api/v1/admin/reports/profit` — Lợi nhuận

> 💡 Danh sách endpoint có thể mở rộng — tham chiếu trực tiếp trong `server/src/routes/`.

---

## 🔎 SEO & Prerender (SSR)

SPA thuần render phía client nên bất lợi cho SEO. Dự án bổ sung **prerender tại thời điểm build** bằng [`react-snap`](https://github.com/stereobooster/react-snap): sau khi build, một trình duyệt headless sẽ chụp HTML tĩnh của các trang tĩnh (Trang chủ, Shop, Giới thiệu, Thương hiệu, Blog, Liên hệ, Chính sách), giúp bot đọc được nội dung + thẻ meta ngay trong HTML.

```bash
npm install
npm run build:seo --workspace client
```

- `main.tsx` tự **hydrate** khi phát hiện HTML đã prerender, ngược lại render bình thường.
- Danh sách route prerender cấu hình trong `client/package.json` → `reactSnap.include`.
- Chi tiết: xem **`docs/SEO-PRERENDER.md`**.

---

## 💾 Sao lưu & Migration DB

**Sao lưu / khôi phục** (Extended JSON + gzip, giữ nguyên kiểu ObjectId/Date):

```bash
npm run backup  --workspace server                           # -> server/backups/<timestamp>/
npm run restore --workspace server -- backups/<timestamp>         # upsert theo _id
npm run restore --workspace server -- backups/<timestamp> --drop  # xóa rồi nạp lại
```

**Migration** (theo dõi trong collection `_migrations`):

```bash
npm run migrate:create --workspace server -- them-truong-xyz   # tạo file mới
npm run migrate        --workspace server                      # chạy migration đang chờ
npm run migrate:down   --workspace server                      # revert cái mới nhất
```

Đã kèm 2 migration mẫu: backfill `basePrice` và đồng bộ index. Chi tiết: **`docs/BACKUP-MIGRATION.md`**.

---

## 🐳 Docker

```bash
docker compose up -d --build
# client: http://localhost:8080   ·   server: http://localhost:5000
```

- **`server/Dockerfile`** & **`client/Dockerfile`**: multi-stage, chạy bằng user `node`, có `HEALTHCHECK`.
- **`client/nginx.conf`**: SPA fallback, cache `/assets/` 1 năm, proxy `/api/` → `server:5000`.
- **`docker-compose.yml`**: `mongo:7` + `redis:7` + `server` + `client`.

> Để bật giao dịch MongoDB trong compose, chạy Mongo dạng **single-node replica set** (`--replSet rs0` + `rs.initiate()`) hoặc dùng MongoDB Atlas.

---

## 🔄 CI/CD

`.github/workflows/ci.yml` gồm 3 job: **server**, **client**, **docker** — chạy `npm ci`, lint, typecheck, test và build image (buildx, không push). Deploy mẫu qua **`render.yaml`**.

**Chiến lược nhánh:**

- **`main`** — môi trường development, build image tag `dev-latest`.
- **`production`** — môi trường production, build tag `latest`, deploy qua webhook.

---

## 🧪 Kiểm thử & Chất lượng

Dự án dùng **Vitest** cho cả client và server.

```bash
# Client
npm run test --workspace client        # watch mode
npm run test --workspace client -- run # chạy 1 lần (CI)

# Server
npm run test --workspace server
```

**Công cụ chất lượng:**

- **ESLint + Prettier** — lint & format tự động.
- **TypeScript strict** — `npm run typecheck` ở mỗi workspace.
- **Husky + lint-staged** — pre-commit hook tự format/lint file staged.
- **Trivy** (tùy chọn) — quét lỗ hổng cho Docker image trong CI.

---

## 🛠 Workflow phát triển

1. Nhánh mới từ `main`: `feat/...`, `fix/...`.
2. Code → `npm run lint && npm run typecheck && npm test` (mỗi workspace).
3. Commit: **Husky + lint-staged** tự format/lint file staged (`.husky/pre-commit`).
4. Mở Pull Request → CI xanh → review → merge.
5. Trước khi đổi schema quan trọng: viết **migration** + chạy **backup**.

---

## 📊 Thống kê dự án

### ✅ Tính năng đã hoàn thành

- ✅ **Xác thực & phân quyền** — JWT access/refresh, httpOnly cookie, CSRF
- ✅ **Catalog & biến thể** — lọc theo họ hương/thương hiệu/giá, JSON-LD
- ✅ **Giỏ hàng lai** — localStorage + đồng bộ khi đăng nhập
- ✅ **Khuyến mãi 3 tầng** — Flash Sale > Discount > Voucher
- ✅ **Đặt hàng an toàn** — giao dịch MongoDB chống race condition tồn kho
- ✅ **Thanh toán VietQR** — webhook HMAC-SHA256, chống replay
- ✅ **Khu quản trị** — sản phẩm, đơn, người dùng, khuyến mãi, blog, báo cáo
- ✅ **SEO Prerender** — react-snap, meta/OG động, sitemap, robots
- ✅ **Backup & Migration DB** — script chuyên dụng
- ✅ **Docker hóa** — multi-stage, Nginx, healthcheck
- ✅ **CI/CD** — GitHub Actions (lint/typecheck/test/build)

### 📈 Quy mô (ước tính)

- **Ngôn ngữ chính:** TypeScript (client + server)
- **Mongoose schema:** ~22 models
- **Kiến trúc:** monorepo 2 workspaces (`client`, `server`)
- **Bảo mật:** 8+ lớp middleware

---

## 🗺 Roadmap

- 🔄 Tích hợp thêm cổng thanh toán (VNPay / Momo)
- 🔄 Gợi ý mùi hương cá nhân hóa bằng AI
- 🔄 Đa ngôn ngữ (i18n) đầy đủ
- 🔄 Ứng dụng di động (React Native)
- 🔄 Tách một số nghiệp vụ thành microservices, triển khai Kubernetes
- 🔄 PWA / hỗ trợ offline

---

## 🤝 Đóng góp

1. **Fork** repository về tài khoản cá nhân.
2. Tạo branch mới: `git checkout -b feat/ten-tinh-nang`.
3. Commit theo **Conventional Commits**: `git commit -m "feat: them tinh nang X"`.
4. Push và mở **Pull Request** để review.

**Coding standards:**

- **TypeScript strict**, async/await.
- **React:** functional components + hooks.
- **CSS:** Tailwind utility-first.
- **API:** RESTful, đặt tên rõ ràng, versioned.
- **Naming:** camelCase cho biến, PascalCase cho component.

---

## 📜 License

Dự án phát hành dưới **MIT License** — xem file [LICENSE](LICENSE) để biết chi tiết.

✅ Được phép: sử dụng, sao chép, chỉnh sửa, phân phối · ✅ Yêu cầu: giữ copyright notice · ❌ Không đảm bảo: warranty/liability.

---

<div align="center">

**L'Essence Noire** — *Khám phá mùi hương chữ ký của bạn.* 🖤

Được phát triển với ❤️ bằng TypeScript.

</div>
