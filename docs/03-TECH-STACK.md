# 03 — Công nghệ & thư viện

## Ngôn ngữ & nền tảng
- **TypeScript** toàn bộ (client + server).
- **Node.js ≥ 20**, **npm workspaces** (monorepo).

## Frontend (`client/`)
| Thư viện | Vai trò |
|----------|--------|
| **React 18** | UI declarative, concurrent |
| **Vite 5** | Dev server + bundler cực nhanh |
| **React Router 6** | Định tuyến SPA (`createBrowserRouter`, lazy) |
| **Zustand** | Quản lý state nhẹ, không boilerplate |
| **Tailwind CSS 3** | Styling utility-first |
| **Axios** | HTTP client + interceptor refresh token |
| **Vitest** | Unit/component test |

## Backend (`server/`)
| Thư viện | Vai trò |
|----------|--------|
| **Express** | Web framework REST |
| **Mongoose 7** | ODM cho MongoDB, schema + index + transaction |
| **jsonwebtoken** | Ký/xác minh JWT (access 15ph, refresh 7 ngày) |
| **bcryptjs** | Hash mật khẩu (cost 12) + hash refresh token |
| **Zod** | Validate dữ liệu đầu vào (schema) |
| **helmet** | HTTP security headers (CSP, HSTS) |
| **express-mongo-sanitize** | Chống NoSQL injection |
| **compression** | Gzip response |
| **cloudinary** + **multer** | Upload & lưu trữ ảnh |
| **nodemailer** | Gửi email (SMTP) |
| **swagger-ui-express** | Trang tài liệu API |
| **@sentry/node** *(optional)* | Giám sát lỗi |
| **ioredis / redis** *(optional)* | Rate-limit phân tán |

## Hạ tầng & DevOps
- **MongoDB 7**, **Redis 7**
- **Docker** (multi-stage) + **Docker Compose**
- **Nginx** (phục vụ SPA + reverse proxy)
- **GitHub Actions** (CI), **Render** (deploy)

## Chất lượng mã
- **ESLint** + **Prettier** (client: nháy kép; server: nháy đơn; printWidth 100)
- **Husky** + **lint-staged** (format/lint khi commit)

## Dịch vụ bên ngoài
- **Cloudinary** (ảnh) · **SMTP/Gmail** (email) · **eSMS.vn** (SMS OTP) · **VietQR + SePay** (thanh toán) · **Sentry** (lỗi)
