# MVP Scope — L'Essence Noire

> Tài liệu này mô tả phạm vi **đã được triển khai trong mã nguồn hiện tại**, không phải danh sách tính năng dự kiến. Nguồn đối chiếu chính là `client/src/router.tsx`, `server/src/routes/`, các service nghiệp vụ và model MongoDB.

## 1. Tuyên bố MVP

L'Essence Noire là nền tảng thương mại điện tử nước hoa cho phép hoàn thành trọn vẹn vòng đời bán hàng:

**Duyệt sản phẩm → chọn biến thể → thêm giỏ → tính giá/khuyến mãi → đặt hàng → COD hoặc Bank QR → theo dõi và xử lý đơn.**

MVP đồng thời cung cấp khu quản trị để cửa hàng tự vận hành catalog, tồn kho, đơn hàng, thanh toán, khuyến mãi, nội dung, khách hàng và báo cáo mà không cần thao tác trực tiếp trên cơ sở dữ liệu.

## 2. Người dùng và giá trị cung cấp

### 2.1. Khách vãng lai

- Duyệt, tìm kiếm và lọc sản phẩm.
- Lưu giỏ hàng trong `localStorage`.
- Đặt hàng không bắt buộc đăng nhập.
- Xem thông tin thanh toán bằng guest access token của đơn.
- Tra cứu đơn theo mã đơn, email hoặc số điện thoại; kết quả công khai được giới hạn dữ liệu nhạy cảm và có rate-limit.

### 2.2. Thành viên

- Có toàn bộ khả năng của khách vãng lai.
- Đồng bộ giỏ khách vào giỏ tài khoản khi đăng nhập.
- Quản lý hồ sơ, mật khẩu, nhiều địa chỉ và địa chỉ mặc định.
- Xem lịch sử đơn, wishlist và hồ sơ mùi hương.
- Quản lý tùy chọn email cho đơn hàng, khuyến mãi và Journal.

### 2.3. Admin

- Quản trị dữ liệu bán hàng và nội dung website.
- Theo dõi đơn, tồn kho, thanh toán và các trường hợp cần đối soát.
- Theo dõi dashboard, báo cáo kinh doanh, chi phí và yêu cầu hỗ trợ.

## 3. Phạm vi đã triển khai

### 3.1. Storefront và catalog

- [x] Trang chủ, cửa hàng, thương hiệu, Journal/Blog, giới thiệu, liên hệ và chính sách riêng tư.
- [x] Danh sách sản phẩm có phân trang, tìm kiếm và lọc theo thương hiệu, danh mục, giá, giới tính, họ hương và các facet lấy từ dữ liệu thực tế.
- [x] Sản phẩm có nhiều biến thể; mỗi biến thể quản lý SKU, dung tích, giá bán, giá vốn, tồn kho, ảnh và trạng thái hoạt động.
- [x] Trang chi tiết theo ID hoặc slug, hiển thị ảnh, mô tả, tầng hương, biến thể, giá đã resolve, đánh giá và sản phẩm liên quan.
- [x] Brand Journal và các thẻ nhóm hương (`scent family card`).
- [x] Đánh giá chỉ dành cho thành viên đã mua sản phẩm; mỗi người đánh giá một lần cho mỗi sản phẩm và admin có thể duyệt, từ chối hoặc xóa.

### 3.2. Giỏ hàng, báo giá và checkout

- [x] Giỏ khách vãng lai được lưu riêng trong `localStorage`.
- [x] Giỏ thành viên được lưu trên MongoDB; giỏ guest được merge vào giỏ tài khoản ở lần đăng nhập kế tiếp.
- [x] Thêm, sửa số lượng, xóa từng sản phẩm và xóa toàn bộ giỏ.
- [x] Kiểm tra tồn kho và gọi API `price-preview` trước khi tạo đơn.
- [x] Checkout cho cả khách vãng lai và thành viên, gồm địa chỉ giao hàng, ghi chú, phương thức giao và voucher.
- [x] Hai phương thức thanh toán đang hỗ trợ: `cod` và `bank_qr`.
- [x] Đơn lưu snapshot tên sản phẩm, biến thể, giá, giá vốn và khuyến mãi tại thời điểm mua để không bị thay đổi theo catalog về sau.

### 3.3. Giá và khuyến mãi

- [x] Giá sản phẩm được resolve tập trung theo thứ tự: **Flash Sale → Discount theo priority → giá niêm yết**.
- [x] Voucher được áp ở cấp đơn hàng sau khi tính giá từng sản phẩm.
- [x] Discount có thể áp theo sản phẩm hoặc danh mục, theo phần trăm hoặc số tiền cố định.
- [x] Flash Sale có giá riêng, thời gian hiệu lực, quota `stockAllocated` và giới hạn mua mỗi khách.
- [x] Voucher hỗ trợ giảm theo phần trăm, số tiền cố định hoặc miễn phí vận chuyển; có giá trị đơn tối thiểu, trần giảm, tổng lượt dùng, lượt dùng mỗi khách, phân khúc người dùng và quy tắc cộng dồn.
- [x] Lưu lịch sử thay đổi giá niêm yết.
- [x] Có dữ liệu giải trình giá tham chiếu/khuyến mãi tập trung và giới hạn giảm mặc định trong pricing engine; đây là hỗ trợ nghiệp vụ, không thay thế việc kiểm tra pháp lý của người vận hành.

### 3.4. Đơn hàng và tồn kho

- [x] Khách vãng lai và thành viên đều có thể tạo đơn.
- [x] Thành viên xem lịch sử/chi tiết đơn; khách vãng lai truy cập chi tiết đơn bằng guest access token được trả một lần khi tạo đơn.
- [x] Tra cứu công khai theo mã 6 ký tự, MongoDB ID, email hoặc số điện thoại.
- [x] Trạng thái đơn: `pending`, `paid`, `shipping`, `done`, `cancelled`, `returned`.
- [x] Thành viên được hủy đơn hợp lệ; khách có thể hủy đơn QR đang chờ bằng guest token; admin có thể cập nhật trạng thái và lý do.
- [x] Ưu tiên MongoDB transaction để chống oversell và giữ đồng bộ giữa đơn hàng, tồn kho, voucher và quota Flash Sale.
- [x] Khi chạy MongoDB standalone không hỗ trợ transaction, hệ thống có fallback bằng cập nhật/claim nguyên tử để tránh trừ hoặc hoàn kho lặp.

### 3.5. Thanh toán Bank QR và đối soát

- [x] Sinh thông tin VietQR cho đơn `bank_qr`.
- [x] Nhận webhook SePay, xác minh chữ ký HMAC và chống replay.
- [x] Lưu từng giao dịch theo `providerTransactionId` duy nhất để webhook retry không cộng tiền hai lần.
- [x] Theo dõi số tiền thực nhận và phân loại: chưa chuyển, chuyển thiếu, đủ tiền chờ xác nhận, đã trả đủ và chuyển dư.
- [x] Admin có thể xác nhận thanh toán, cập nhật thanh toán và đánh dấu hoàn tiền.
- [x] Tiền đến sau khi đơn đã hủy không làm sống lại đơn; số tiền nhận được được đưa vào luồng chờ hoàn.
- [x] Background job gửi email nhắc hạn/cảnh báo, tự hủy đơn QR thiếu tiền sau thời gian đối soát, hoàn tồn kho, voucher và quota Flash Sale đúng một lần.

Chi tiết vòng đời QR nằm tại [`BANK-QR-PAYMENT-LIFECYCLE.md`](./BANK-QR-PAYMENT-LIFECYCLE.md).

### 3.6. Tài khoản và thông báo

- [x] Đăng ký, đăng nhập, đăng xuất và tự làm mới phiên đăng nhập.
- [x] Xác thực email và gửi lại email xác thực.
- [x] Quên mật khẩu bằng OTP email hoặc OTP số điện thoại, sau đó đổi mật khẩu bằng reset token.
- [x] Cập nhật hồ sơ và đổi mật khẩu bằng mật khẩu hiện tại.
- [x] Quản lý nhiều địa chỉ, wishlist và hồ sơ mùi hương.
- [x] Công tắc email tổng và tùy chọn riêng cho thông báo đơn hàng, khuyến mãi và Journal.
- [x] Đăng ký nhận Journal bằng email.
- [x] Email vòng đời đơn hàng/thanh toán và email Discount/Flash Sale tôn trọng tùy chọn của người dùng; voucher thông thường không tự gửi email hàng loạt.

### 3.7. Nội dung và hỗ trợ khách hàng

- [x] Blog/Journal có trạng thái nháp hoặc xuất bản, nội dung nhiều section và bài liên quan.
- [x] Nội dung/ảnh của các vị trí trên trang có thể thay đổi từ admin qua `site-content`.
- [x] Form liên hệ/yêu cầu hỗ trợ cho khách vãng lai hoặc thành viên.
- [x] Admin theo dõi và cập nhật yêu cầu hỗ trợ qua các trạng thái `open`, `in_progress`, `resolved`, `closed`.
- [x] Quản lý ảnh bằng Cloudinary, upload theo nhóm và xóa media.

### 3.8. Khu quản trị

- [x] Dashboard tổng quan, xu hướng doanh thu, cơ cấu thương hiệu/danh mục, phương thức thanh toán và các cảnh báo vận hành.
- [x] CRUD sản phẩm, biến thể, thương hiệu, danh mục và thẻ nhóm hương.
- [x] CRUD Voucher, Discount, Flash Sale và xem lịch sử giá.
- [x] Danh sách/chi tiết đơn; lọc theo trạng thái đơn, phương thức/trạng thái thanh toán và các ca chuyển thiếu, chuyển dư, cần hoàn.
- [x] Xác nhận thanh toán, cập nhật trạng thái đơn và đánh dấu hoàn tiền.
- [x] Quản lý người dùng và phân quyền `customer`/`admin`.
- [x] Quản lý đánh giá, Blog, nội dung trang và media.
- [x] Báo cáo doanh thu, đơn hàng, sản phẩm, tồn kho, giá vốn, lợi nhuận, chi phí, khách hàng, thanh toán và hỗ trợ; có chế độ xuất/in báo cáo.
- [x] Tìm kiếm và danh sách thông báo/cảnh báo trong admin.

## 4. Yêu cầu phi chức năng đã có

### 4.1. Kiến trúc và công nghệ

- Monorepo TypeScript gồm React/Vite ở `client/` và Express/Mongoose ở `server/`.
- REST API được mount tại `/api/v1`; `/api` được giữ để tương thích ngược.
- Backend phân lớp route → controller → service → model.
- MongoDB lưu dữ liệu chính; Redis dùng cho rate-limit phân tán khi được cấu hình và có fallback cục bộ.
- Cloudinary lưu media, SMTP gửi email và SePay/VietQR phục vụ thanh toán QR.

### 4.2. Bảo mật

- [x] JWT access token ngắn hạn lưu trong bộ nhớ phía client.
- [x] Refresh token trong cookie `httpOnly`; refresh/logout được bảo vệ bằng CSRF double-submit.
- [x] Mật khẩu băm bằng bcrypt; validator mật khẩu mạnh và rate-limit cho endpoint nhạy cảm.
- [x] Helmet/CSP/HSTS, CORS allowlist, giới hạn JSON body, sanitize truy vấn MongoDB và error handler tập trung.
- [x] Route admin yêu cầu xác thực và role `admin`.
- [x] Webhook thanh toán dùng HMAC, cửa sổ thời gian chống replay và idempotency theo mã giao dịch.

### 4.3. SEO, vận hành và chất lượng

- [x] Meta/OG động, JSON-LD sản phẩm, sitemap và robots.
- [x] Prerender các route tĩnh chính của SPA bằng `react-snap`.
- [x] Docker Compose, image multi-stage, Nginx reverse proxy và healthcheck.
- [x] GitHub Actions cho lint, typecheck, test và build.
- [x] Script seed, tạo admin, backup, restore, migration và backfill dữ liệu.
- [x] Swagger/OpenAPI được phục vụ từ backend; đặc tả cần tiếp tục được đồng bộ khi API thay đổi.

## 5. Ngoài phạm vi phiên bản hiện tại

- Thanh toán thẻ quốc tế, trả góp, VNPay hoặc MoMo.
- Ứng dụng mobile native và PWA/offline hoàn chỉnh.
- Đa ngôn ngữ hoàn chỉnh; giao diện hiện vận hành chủ yếu bằng tiếng Việt.
- Gợi ý mùi hương bằng AI và chăm sóc khách hàng tự động.
- SSR động đầy đủ; hệ thống hiện là SPA kết hợp prerender route tĩnh.
- Marketplace nhiều nhà bán, quản lý nhiều kho/chi nhánh và đơn vị vận chuyển tích hợp trực tiếp.
- Microservices và Kubernetes; backend hiện là một Express API phân lớp.

## 6. Điều kiện vận hành và giới hạn hiện tại

- SMTP, Cloudinary, SePay/VietQR, SMS/OTP và Redis chỉ hoạt động đầy đủ khi có biến môi trường/dịch vụ tương ứng.
- MongoDB replica set là cấu hình khuyến nghị để mọi thao tác nhiều collection chạy trong transaction; standalone sử dụng fallback nguyên tử có chủ đích.
- Prerender hiện bao phủ các trang tĩnh được cấu hình, chưa render trước toàn bộ trang chi tiết sản phẩm động.
- OpenAPI/Swagger phải được cập nhật cùng route và schema để luôn là tài liệu chính xác.

## 7. Definition of Done của MVP

MVP được xem là hoàn thành khi:

1. Khách vãng lai có thể hoàn thành luồng catalog → giỏ → checkout → COD/Bank QR → tra cứu đơn.
2. Thành viên có thể đăng nhập, đồng bộ giỏ, quản lý tài khoản và xem lịch sử đơn.
3. Admin có thể tạo dữ liệu bán hàng, xử lý đơn/thanh toán và xem báo cáo mà không sửa database thủ công.
4. Tạo/hủy đơn giữ đúng tồn kho, lượt voucher và quota Flash Sale kể cả khi request cạnh tranh hoặc job chạy lặp.
5. Webhook thanh toán retry không ghi nhận tiền hai lần; chuyển thiếu không được giao và chuyển dư/tiền đến muộn được đưa vào luồng hoàn tiền.
6. Dự án chạy được bằng `docker compose up`; lint, typecheck, test và build chạy thành công trong CI.
7. Các luồng vận hành quan trọng có tài liệu và biến môi trường mẫu trong repository.

## 8. Roadmap gần nhất

1. Bật MongoDB replica set mặc định trong các môi trường cần transaction đầy đủ và giảm phụ thuộc vào fallback standalone.
2. Mở rộng prerender hoặc chuyển sang SSR cho trang chi tiết sản phẩm động.
3. Tiếp tục đồng bộ và hoàn thiện độ phủ Swagger/OpenAPI.
4. Bổ sung cổng thanh toán nội địa khác khi có nhu cầu kinh doanh.
