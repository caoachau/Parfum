# SEO & Prerender (SSR tĩnh)

## Vấn đề

`client/` là SPA React (Vite). Mặc định, HTML trả về gần như rỗng (`<div id="root"></div>`), nội dung do JS dựng phía client. Điều này bất lợi cho SEO và chia sẻ mạng xã hội (bot đọc HTML trống).

## Giải pháp: prerender tại build time

Dùng [`react-snap`](https://github.com/stereobooster/react-snap): sau khi `vite build`, nó mở từng route trong trình duyệt headless (Puppeteer), chờ render xong rồi **ghi HTML tĩnh** vào `dist/<route>/index.html`. Vì chạy trên trình duyệt thật nên `useEffect`, hook `useSeo` (meta/OG) và JSON-LD đều được nạp vào HTML.

### Các thay đổi đã thực hiện

1. **`client/src/main.tsx`** — tự động `hydrateRoot` khi `#root` đã có DOM (đã prerender), ngược lại `createRoot`.
2. **`client/package.json`** — thêm:
   - `devDependencies.react-snap`
   - script `prerender` và `build:seo`
   - block cấu hình `reactSnap` (danh sách route + tham số puppeteer)
3. **Store SSR-safe** — `cart.store.ts` và `language.store.ts` đã guard `typeof window` để không lỗi khi chạy ngoài trình duyệt.
4. **`index.html`** — sửa link favicon bị 404 (`/favicon.png` → `/favicon.ico`).

### Cách dùng

```bash
npm install                              # cài react-snap + puppeteer
npm run build:seo --workspace client     # = build + prerender
npm run preview   --workspace client     # xem thử; View Source sẽ thấy HTML đầy đủ
```

### Cấu hình route prerender

Trong `client/package.json`:

```json
"reactSnap": {
  "source": "dist",
  "include": ["/", "/shop", "/about", "/brand", "/blog", "/contact", "/privacy-policy"],
  "puppeteerArgs": ["--no-sandbox", "--disable-setuid-sandbox"],
  "skipThirdPartyRequests": true
}
```

Thêm route tĩnh vào `include` khi cần. **Không** nên prerender route cần đăng nhập (`/account`, `/admin`, `/checkout`).

### Dữ liệu động (sản phẩm, blog theo slug)

Mặc định prerender chạy **không có backend**, nên trang danh sách/chi tiết sẽ chụp phần khung + meta, phần dữ liệu tải qua API sẽ hiện sau khi JS chạy. Để prerender cả dữ liệu động:

1. Chạy server API + build client trước.
2. Sinh danh sách slug (ví dụ từ `/api/v1/products`) và thêm vào `reactSnap.include`.
3. Chạy prerender khi API đang bật để fetch thành công.

Tự động hóa bằng script sinh `include` động trước `react-snap` (CI job riêng).

### Tích hợp Docker

`react-snap` cần Chromium. Trong `client/Dockerfile` (stage build) có thể thêm:

```dockerfile
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN npm run build:seo
```

> Mặc định script `build` **không** tự prerender để tránh làm hỏng CI khi thiếu Chromium. Chạy prerender có chủ đích qua `build:seo`.

### Giải pháp thay thế

- **`vite-react-ssg`**: SSG native cho Vite (không cần Puppeteer) — yêu cầu chuyển router sang dạng mảng routes và code SSR-safe triệt để.
- **SSR thật (Next.js / Vite SSR)**: tốt nhất cho trang chi tiết sản phẩm nhưng chi phí migrate lớn.
