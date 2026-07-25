# 05 — Tính năng

## A. Khách hàng (storefront)

### Catalog & tìm kiếm
- Danh sách sản phẩm, lọc theo thương hiệu/danh mục/giá/nhóm hương.
- Biến thể (variant) theo dung tích/nồng độ; mỗi variant có giá, giá gốc, giá vốn, tồn kho, SKU.
- Trang chi tiết sản phẩm có **JSON-LD** (SEO) + hồ sơ mùi hương (scent family card).

### Giỏ hàng & đặt hàng
- Giỏ cho **khách vãng lai** (localStorage) + **đồng bộ** khi đăng nhập.
- Đặt hàng an toàn với **transaction** chống oversell (xem `01-ARCHITECTURE`).
- Tra cứu đơn theo mã, xem lịch sử đơn.

### Khuyến mãi (3 tầng, ưu tiên rõ ràng)
1. **Flash Sale** — giá sốc theo suất (`stockAllocated`), giới hạn mỗi khách.
2. **Discount** — giảm theo độ ưu tiên/quy tắc.
3. **Voucher** — mã giảm giá, đếm lượt dùng qua `voucherCounter`.
> Thứ tự áp dụng: **Flash Sale > Discount > Voucher** (xem `pricing-engine.service`).

### Tài khoản
- Đăng ký/đăng nhập, xác thực email, đổi mật khẩu.
- Quên mật khẩu qua **OTP email hoặc SMS**.
- Hồ sơ, nhiều địa chỉ (đặt mặc định), wishlist, tùy chọn nhận thông báo.
- Voucher tặng thành viên mới / hoàn thiện hồ sơ.

### Nội dung & hỗ trợ
- Blog/Journal thương hiệu + đăng ký nhận tin (journal subscriber).
- Trang giới thiệu, liên hệ, chính sách; gửi yêu cầu hỗ trợ (support request).
- Thanh toán **VietQR** + xác nhận tự động qua webhook.

## B. Quản trị (`/admin`)

| Nhóm | Chức năng |
|------|----------|
| Sản phẩm | CRUD sản phẩm, biến thể, thương hiệu, danh mục, media (Cloudinary) |
| Khuyến mãi | Tạo/sửa Flash Sale, Discount, Voucher; email thông báo có **công tắc tổng** |
| Đơn hàng | Xem/cập nhật trạng thái, thanh toán, hoàn tiền |
| Người dùng | Quản lý tài khoản, phân quyền |
| Nội dung | Blog, nội dung trang tĩnh (site content slots), scent family card |
| Báo cáo | Doanh thu, tồn kho, lợi nhuận (dựa trên giá vốn), chi phí (expense) |
| Đánh giá | Duyệt/quản lý review |

> Chi tiết khu admin: `docs/ADMIN_README.md`. Ca kiểm thử khuyến mãi: `docs/TEST-CASES-voucher-discount.md`.
