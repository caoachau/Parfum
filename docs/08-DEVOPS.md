# 08 — DevOps: Docker, Nginx, CI/CD

## 1. Docker
- **`server/Dockerfile`** & **`client/Dockerfile`**: multi-stage build trên `node:alpine`, `npm ci` (fallback `npm install`), chạy bằng user `node`, có `HEALTHCHECK`.
- Client build ra tĩnh → phục vụ bởi **Nginx**.

## 2. `client/nginx.conf`
- **SPA fallback**: mọi route trả `index.html`.
- Cache `/assets/` **1 năm immutable**.
- **Reverse proxy** `/api/` → `http://server:5000`.

## 3. `docker-compose.yml`
```
mongo:7   (healthcheck)
redis:7
server    (env_file ./server/.env, depends_on mongo/redis)
client    (8080:80, depends_on server healthy, VITE_API_URL=/api)
```
```bash
docker compose up -d --build
# client http://localhost:8080 · server http://localhost:5000
```
> Để bật **transaction** MongoDB cần replica set: chạy mongo với `--replSet rs0` rồi `rs.initiate()`, hoặc dùng Atlas.

## 4. CI — `.github/workflows/ci.yml`
3 job chạy song song:
1. **server**: `npm ci` → lint → typecheck → test.
2. **client**: `npm ci` → lint → typecheck → test → build.
3. **docker**: build image (buildx, `push:false`) kiểm tra Dockerfile.
- Dùng npm workspaces + `--if-present` để bỏ qua script thiếu.

## 5. Deploy — `render.yaml`
- Định nghĩa service trên **Render** (web service + static site) làm mẫu deploy.

## 6. Git hooks — `.husky/`
- `pre-commit` chạy **lint-staged**: format + lint các file staged trước khi commit (xem `07-UTILITIES` và root README).

## 7. Đề xuất cải tiến
- Thêm step **backup DB** trước khi deploy (xem `BACKUP-MIGRATION.md`).
- Thêm job chạy **migration** tự động khi release.
- Bật **prerender SEO** trong build client (xem `SEO-PRERENDER.md`).
