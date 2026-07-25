# MVP Scope — L'Essence Noire (viết lại)

> Bản viết lại (Markdown) từ `MVP_Scope.docx`, bám theo mã nguồn thực tế hiện tại. `ERD.png` được giữ nguyên.

## 1. Mục tiêu
Xây dựng nền tảng thương mại điện tử bán nước hoa chính hãng, cho phép khách duyệt – mua – thanh toán VietQR, kèm khu quản trị vận hành toàn bộ cửa hàng.

## 2. Đối tượng người dùng
- **Khách vãng lai**: duyệt, thêm giỏ, đặt hàng.
- **Thành viên**: tài khoản, địa chỉ, wishlist, lịch sử đơn, voucher.
- **Admin**: quản lý catalog, đơn, khuyến mãi, nội dung, báo cáo.

## 3. Phạm vi MVP (In-scope)

### 3.1. Storefront
- [x] Catalog sản phẩm + biến thể, lọc & tìm kiếm.
- [x] Trang chi tiết (ảnh, mô tả, hồ sơ mùi hương, JSON-LD SEO).
- [x] Giỏ hàng khách vãng lai + đồng bộ khi đăng nhập.
- [x] Đặt hàng + thanh toán VietQR + tra cứu đơn.
- [x] Khuyến mãi 3 tầng: Flash Sale > Discount > Voucher.

### 3.2. Tài khoản
- [x] Đăng ký/đăng nhập, xác thực email.
- [x] Quên mật khẩu qua OTP **email** hoặc **SMS**.
- [x] Hồ sơ, nhiều địa chỉ, wishlist, tùy chọn thông báo.

### 3.3. Quản trị
- [x] CRUD sản phẩm/biến thể/thương hiệu/danh mục/media.
- [x] Quản lý đơn hàng, khuyến mãi, người dùng, blog, nội dung trang.
- [x] Báo cáo doanh thu / tồn kho / lợi nhuận / chi phí.
- [x] Email thông báo khuyến mãi có công tắc tổng.

### 3.4. Phi chức năng
- [x] Bảo mật: JWT + refresh httpOnly, CSRF, bcrypt, Helmet, rate-limit, webhook HMAC.
- [x] SEO: meta/OG động, robots, sitemap, prerender.
- [x] Docker + CI + Nginx.
- [x] Sao lưu & migration DB.

## 4. Ngoài phạm vi (Out-of-scope MVP)
- Cổng thanh toán thẻ quốc tế (Visa/Master), trả góp.
- Đa ngôn ngữ hoàn chỉnh (hiện có khung vi/en).
- Ứng dụng di động native.
- Đề xuất gợi ý bằng AI, chăm sóc khách hàng tự động.
- SSR đầy đủ (hiện dùng prerender tĩnh).

## 5. Tiêu chí hoàn thành (Definition of Done)
- Chạy được bằng `docker compose up`.
- CI xanh (lint + typecheck + test).
- Đặt hàng chống oversell khi mua đồng thời (transaction).
- Có tài liệu trong `docs/`.

## 6. Cột mốc tiếp theo (Roadmap gợi ý)
1. Bật replica set + bỏ fallback transaction.
2. Job hủy đơn `bank_qr` quá hạn → giải phóng suất flash sale.
3. Hoàn thiện Swagger spec.
4. Prerender cả trang chi tiết sản phẩm (dữ liệu động).
