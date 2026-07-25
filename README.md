<div align="center">

# 🖤 L'Essence Noire

### Nền tảng thương mại điện tử nước hoa cao cấp — *Fullstack TypeScript*

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

*Cửa hàng nước hoa chính hãng: catalog, giỏ hàng, khuyến mãi (Flash Sale / Discount / Voucher), thanh toán VietQR, khu quản trị đầy đủ.*

</div>

---

## 📑 Mục lục

1. [Tổng quan](#-tổng-quan)
2. [Kiến trúc](#-kiến-trúc)
3. [Công nghệ](#-công-nghệ)
4. [Chức năng chính](#-chức-năng-chính)
5. [Bảo mật](#-bảo-mật)
6. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
7. [Bắt đầu nhanh](#-bắt-đầu-nhanh)
8. [Biến môi trường](#-biến-môi-trường)
9. [Scripts thường dùng](#-scripts-thường-dùng)
10. [SEO & Prerender (SSR)](#-seo--prerender-ssr)
11. [Sao lưu & Migration DB](#-sao-lưu--migration-db)
12. [Docker](#-docker)
13. [CI/CD](#-cicd)
14. [Workflow phát triển](#-workflow-phát-triển)

---

## 🌸 Tổng quan

**L'Essence Noire** là một ứng dụng thương mại điện tử fullstack cho cửa hàng nước hoa cao cấp, viết hoàn toàn bằng **TypeScript** theo mô hình **monorepo** (npm workspaces):

- **`client/`** — Ứng dụng React (Vite) cho khách hàng + khu quản trị (admin).
- **`server/`** — REST API bằng Express + MongoDB (Mongoose) theo kiến trúc phân lớp.

Hệ thống hỗ trợ toàn bộ vòng đời mua hàng: duyệt sản phẩm → giỏ hàng → áp khuyến mãi → đặt hàng → thanh toán VietQR → theo dõi đơn; kèm khu quản trị để quản lý sản phẩm, tồn kho, khuyến mãi, đơn hàng, người dùng, nội dung blog và báo cáo doanh thu.

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

**Điểm nhấn nghiệp vụ — chống race condition tồn kho:** khi đặt hàng, `order.service` dùng **giao dịch MongoDB** (`session.withTransaction`) với 3 lớp khóa nguyên tử: (1) trừ tồn theo điều kiện `stock >= qty`, (2) trừ suất Flash Sale theo `soldCount + qty <= stockAllocated`, (3) giới hạn mỗi khách qua unique index. Có sẵn cơ chế *fallback* khi MongoDB không hỗ trợ transaction (single-node).

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

## ✨ Chức năng chính

**Khách hàng**
- Catalog sản phẩm, biến thể (dung tích/nồng độ), tìm kiếm & lọc, trang chi tiết có JSON-LD.
- Giỏ hàng cho khách vãng lai (localStorage) + đồng bộ khi đăng nhập.
- Khuyến mãi 3 tầng: **Flash Sale > Discount (theo độ ưu tiên) > Voucher**.
- Thanh toán VietQR + tra cứu đơn theo mã.
- Tài khoản: hồ sơ, địa chỉ, wishlist, hồ sơ mùi hương, lịch sử đơn.
- Blog/Journal thương hiệu, trang giới thiệu, liên hệ.

**Quản trị (`/admin`)**
- Quản lý sản phẩm, biến thể, thương hiệu, danh mục, media.
- Quản lý đơn hàng, người dùng, đánh giá, blog.
- Quản lý khuyến mãi (Flash Sale / Discount / Voucher) + email thông báo có công tắc tổng.
- Báo cáo doanh thu, tồn kho, lợi nhuận.

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
│       ├── migrations/      # ⭐ Migration DB (mới)
│       ├── scripts/         # seed, backup, restore, migrate, ...
│       └── app.ts · index.ts
│
├── docs/                   # Tài liệu (bao gồm SEO, Backup & Migration)
├── .github/workflows/      # CI
├── docker-compose.yml · render.yaml
└── README.md
```

---

## 🚀 Bắt đầu nhanh

```bash
# 1. Cài dependency (npm workspaces, chạy ở thư mục gốc)
npm install

# 2. Tạo file .env cho server từ mẫu rồi điền giá trị
cp .env.example server/.env    # sửa MONGO_URI, JWT_*, ... 

# 3. (Tùy chọn) seed dữ liệu mẫu + tạo admin
npm run seed        --workspace server
npm run create-admin --workspace server

# 4. Chạy song song server + client
npm run dev --workspace server   # API  http://localhost:5000
npm run dev --workspace client   # Web  http://localhost:5173
```

> Yêu cầu: Node ≥ 20, MongoDB 7 (khuyến nghị **replica set 1 node** để bật transaction), Redis (tùy chọn).

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

## 🔎 SEO & Prerender (SSR)

SPA thuần render phía client nên bất lợi cho SEO. Dự án bổ sung **prerender tại thời điểm build** bằng [`react-snap`](https://github.com/stereobooster/react-snap): sau khi build, một trình duyệt headless sẽ chụp HTML tĩnh của các trang tĩnh (Trang chủ, Shop, Giới thiệu, Thương hiệu, Blog, Liên hệ, Chính sách), giúp bot đọc được nội dung + thẻ meta ngay trong HTML.

```bash
# Cài phụ thuộc mới rồi build kèm prerender
npm install
npm run build:seo --workspace client
```

- `main.tsx` tự **hydrate** khi phát hiện HTML đã prerender, ngược lại render bình thường.
- Danh sách route prerender cấu hình trong `client/package.json` → `reactSnap.include`.
- Chi tiết, xử lý dữ liệu động và tích hợp Docker: xem **`docs/SEO-PRERENDER.md`**.

---

## 💾 Sao lưu & Migration DB

**Sao lưu / khôi phục** (Extended JSON + gzip, giữ nguyên kiểu ObjectId/Date):

```bash
npm run backup  --workspace server                          # -> server/backups/<timestamp>/
npm run restore --workspace server -- backups/<timestamp>          # upsert theo _id
npm run restore --workspace server -- backups/<timestamp> --drop   # xóa rồi nạp lại
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

---

## 🛠 Workflow phát triển

1. Nhánh mới từ `main`: `feat/...`, `fix/...`.
2. Code → `npm run lint && npm run typecheck && npm test` (mỗi workspace).
3. Commit: **Husky + lint-staged** tự format/lint file staged (`.husky/pre-commit`).
4. Mở Pull Request → CI xanh → review → merge.
5. Trước khi đổi schema quan trọng: viết **migration** + chạy **backup**.

---

<div align="center">

**L'Essence Noire** — *Khám phá mùi hương chữ ký của bạn.* 🖤

</div>
