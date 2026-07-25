# Giải thích báo cáo Admin (admin/báo cáo) — L'Essence Noire

Tài liệu này giải thích **từng thành phần** trong trang `admin/báo cáo`: *nó là gì, vì sao có, và cách hệ thống tính*. Nguồn tính toán: `server/src/services/report.service.ts` (hàm `getReports`).

---

## 0. Nguyên tắc chung của toàn báo cáo

- **Khoảng thời gian (range):** mặc định 30 ngày gần nhất (`from` = hôm nay − 29 ngày, `to` = cuối ngày hôm nay). Có thể truyền `from`, `to`, và `granularity` (day/week/month/quarter/year) để đổi mốc gom nhóm.
- **Kỳ so sánh trước (previous):** một khoảng có **độ dài bằng đúng** khoảng đang xem, nằm ngay liền trước → dùng để tính tăng/giảm %.
- **Cùng kỳ năm ngoái (YoY):** đúng khoảng này nhưng lùi lại 1 năm.
- **Doanh thu = tiền thật đã thu:** chỉ tính các bản ghi `Payment` có `status = paid`, phương thức `cod` hoặc `bank_qr`, và đơn hàng **không** bị `cancelled`/`returned`. Mốc thời gian doanh thu là `paidAt` (ngày thanh toán), không phải ngày tạo đơn.
- **% thay đổi:** `(hiện tại − trước) / trước × 100`. Nếu kỳ trước = 0 thì trả 100% (nếu hiện tại > 0) hoặc 0%.

---

## 1. Doanh thu (revenue)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `total` | Tổng doanh thu đã thu trong kỳ | Cộng `amount` của mọi payment hợp lệ có `paidAt` nằm trong kỳ |
| `paidOrderCount` | Số lượt thanh toán thành công | Đếm số payment hợp lệ trong kỳ |
| `previous` / `previousChange` | Doanh thu kỳ liền trước + % thay đổi | Tính lại `total` cho kỳ trước; `previousChange = percentChange(total, previous)` |
| `yoy` / `yoyChange` | Doanh thu cùng kỳ năm ngoái + % thay đổi | Tính lại `total` cho khoảng lùi 1 năm |
| `byCategory` | Doanh thu theo danh mục | Với mỗi item đã bán, cộng doanh thu vào danh mục của sản phẩm |
| `byProduct` | Doanh thu theo sản phẩm (chỉ sp có bán) | Gom theo sản phẩm: số lượng, doanh thu, giá vốn, biên lợi nhuận |
| `series` | Chuỗi doanh thu theo thời gian (vẽ biểu đồ) | Gom payment theo `periodKey` (ngày/tuần/tháng…) |

**Vì sao có:** trả lời “bán được bao nhiêu tiền, tăng/giảm so với trước và năm ngoái, nhóm hàng/sản phẩm nào đóng góp nhiều nhất, xu hướng theo thời gian”.

> **Lưu ý netRatio:** khi 1 đơn có giảm giá/voucher, hệ thống phân bổ số tiền thực thu về từng item theo tỉ lệ `payment.amount / tổng giá item` để doanh thu theo sản phẩm khớp với tiền thật thu.

---

## 2. Đơn hàng (orders)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `total` | Số đơn tạo trong kỳ | Đếm order có `createdAt` trong kỳ |
| `statusCounts` | Số đơn theo trạng thái | Gom theo trạng thái chuẩn hóa: pending / shipping / done / cancelled / returned |
| `aov` | Giá trị đơn trung bình (Average Order Value) | `doanh thu / số lượt thanh toán` |
| `cancellationRate` | Tỉ lệ hủy + hoàn | `(cancelled + returned) / tổng đơn × 100` |
| `returnRate` | Tỉ lệ hoàn hàng | `returned / tổng đơn × 100` |
| `series` | Số đơn theo thời gian | Gom order theo `periodKey` |

**Vì sao có:** đo sức khỏe vận hành bán hàng — có bao nhiêu đơn, chất lượng đơn (AOV), và mức độ hủy/hoàn.

---

## 3. Tồn kho (inventory)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `top` | 10 sản phẩm bán chạy nhất | Sắp xếp theo số lượng bán giảm dần, lấy 10 |
| `slow` | 10 sản phẩm bán chậm nhất | Sắp xếp số lượng tăng dần lấy 10, rồi ưu tiên tồn kho cao |
| `products` | Toàn bộ sản phẩm kèm chỉ số | stock, inventoryValue, revenue, quantity, cogs, margin |
| `inventoryValue` | Giá trị tồn kho (theo giá vốn) | Σ `tồn × giá vốn` của mọi biến thể |
| `turnover` | Vòng quay tồn kho | `COGS / giá trị tồn kho` (null nếu tồn = 0) |
| `lowStock` | Số biến thể sắp hết | Đếm biến thể có `stock ≤ 5` |
| `costCoverage` | % sản phẩm bán ra có khai giá vốn | `số lượng có giá vốn / tổng số lượng bán × 100` |

**Vì sao có:** biết hàng nào nên nhập thêm/đẩy bán, tiền đang “nằm” trong kho bao nhiêu, và dữ liệu giá vốn có đủ để tin số lợi nhuận hay chưa.

---

## 4. Khách hàng (customers)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `newCustomers` | Khách mua **lần đầu** trong kỳ | Khách có đơn trả tiền trong kỳ và lần thanh toán đầu tiên nằm trong kỳ |
| `returningCustomers` | Khách quay lại | `tổng khách có mua trong kỳ − khách mới` |
| `clv` | Giá trị vòng đời khách trung bình | `tổng chi tiêu của tất cả khách / số khách có mua` |
| `retentionRate` | Tỉ lệ giữ chân | `số khách kỳ trước còn mua ở kỳ này / số khách kỳ trước × 100` |
| `segments` | Phân khúc: new / returning / loyal / vip | Theo số đơn & chi tiêu tích lũy (xem dưới) |
| `totalWithOrders` | Số khách từng có đơn trả tiền | Đếm khách trong bản đồ chi tiêu |
| `registered` | Số tài khoản khách đã đăng ký | Đếm user role = customer |

**Quy tắc phân khúc:** VIP = ≥20 đơn **hoặc** chi tiêu ≥ 50 triệu; LOYAL = ≥3 đơn; RETURNING = ≥2 đơn; còn lại = NEW.

**Vì sao có:** hiểu tệp khách — thu hút khách mới tốt không, giữ chân ra sao, mỗi khách đáng giá bao nhiêu.

---

## 5. Tài chính (finance)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `revenue` | Doanh thu đã thu | Như mục 1 |
| `cogs` | Giá vốn hàng bán | Σ `giá vốn đơn vị × số lượng` của các item đã bán |
| `grossProfit` | Lợi nhuận gộp | `revenue − cogs` |
| `operatingExpenses` | Chi phí vận hành trong kỳ | Σ `amount` của các bản ghi `Expense` có `date` trong kỳ |
| `netProfit` | Lợi nhuận ròng | `grossProfit − operatingExpenses` |
| `expenseByType` | Chi phí theo loại | Gom chi phí theo `type` (marketing, lương, mặt bằng…) |
| `series` | Doanh thu/chi phí/dòng tiền theo thời gian | `cashFlow = revenue − expenses` mỗi kỳ |
| `expenses` | 100 khoản chi gần nhất | Danh sách chi tiết để đối chiếu |

**Vì sao có:** biết thực sự **lãi/lỗ** sau khi trừ giá vốn và chi phí, dòng tiền theo thời gian, và cơ cấu chi phí.

> Độ tin cậy `cogs`/lợi nhuận phụ thuộc `costCoverage` (mục 3). Nếu nhiều sản phẩm chưa khai giá vốn thì lợi nhuận gộp sẽ bị **thổi cao hơn thực tế**.

---

## 6. Vận hành (operations)

| Thành phần | Là gì | Cách tính |
|---|---|---|
| `averageProcessingHours` | Giờ xử lý trung bình (tạo đơn → giao cho vận chuyển) | Trung bình `shippedAt − createdAt` (giờ) |
| `averageDeliveryHours` | Giờ giao hàng trung bình (bàn giao → hoàn tất) | Trung bình `completedAt − shippedAt` (giờ) |
| `timingCoverage` | % đơn có đủ mốc thời gian để đo | Tỉ lệ đơn có dữ liệu thời gian |
| `paymentMethods` | Cơ cấu phương thức thanh toán | Gom số lượt & số tiền theo `method` |
| `support.total/open/resolved/byStatus` | Thống kê yêu cầu hỗ trợ | Đếm theo trạng thái trong kỳ |
| `support.averageResolutionHours` | Giờ xử lý hỗ trợ trung bình | Trung bình `resolvedAt − createdAt` của yêu cầu đã xử lý |
| `supportRequests` | 100 yêu cầu hỗ trợ gần nhất | Danh sách chi tiết |

**Vì sao có:** đo tốc độ xử lý đơn, giao hàng, chăm sóc khách và thói quen thanh toán để tối ưu vận hành.

---

# Phụ lục A — Priority trong form Discount

**Priority (độ ưu tiên)** là số quyết định **discount nào được chọn** khi một sản phẩm cùng lúc thuộc **nhiều chương trình discount**:

- Hệ thống sắp xếp các discount đang hiệu lực theo `priority` **giảm dần** (số lớn hơn = ưu tiên cao hơn); nếu bằng nhau thì lấy chương trình **tạo trước**.
- Chỉ **một** discount được áp cho mỗi sản phẩm (không cộng dồn nhiều discount trên cùng một sản phẩm).
- **Flash Sale luôn được ưu tiên trước mọi Discount.** Thứ tự áp giá: `Flash Sale → Discount (theo priority) → giá niêm yết`.

> Ví dụ: Sản phẩm A thuộc “Sale hè” (priority 1) và “Siêu sale cuối tuần” (priority 10) → hệ thống áp “Siêu sale cuối tuần”.

---

# Phụ lục B — Vì sao “Flash Sale không hoạt động”

Một Flash Sale chỉ tự động áp dụng ngoài cửa hàng khi hội đủ **cả 3** điều kiện:

1. **Kích hoạt** đang bật (`isActive = true`).
2. Thời điểm hiện tại nằm trong khoảng **Bắt đầu → Kết thúc**.
3. **Còn tồn phân bổ** (`Đã bán < Tồn phân bổ`).

Ngoài ra giá Flash phải **thấp hơn giá g��c** (và không dưới 50% giá gốc nếu không đánh dấu “KM tập trung”). Khi tạo/sửa Flash Sale, màn hình admin đã thêm ghi chú nhắc đúng 3 điều kiện này. Nếu vẫn không thấy áp giá, kiểm tra lần lượt: trạng thái bật, mốc thời gian, tồn còn lại và mức giá.

---

# Phụ lục C — Voucher chào mừng thành viên mới

- Mã và mức ưu đãi **không còn cố định**. Admin tạo hoặc sửa voucher tại **admin → Ưu đãi & Voucher → tab Voucher**, sau đó tích **“Áp dụng cho thành viên mới”**.
- Khi khách hàng đã đăng nhập cập nhật thông tin cá nhân, địa chỉ hoặc hồ sơ mùi hương, hệ thống cấp voucher đang hoạt động được đánh dấu cho thành viên mới. Guest, admin và tài khoản đã có bất kỳ đơn hàng nào đều không được cấp.
- Mã được lưu vào tài khoản và trả về giao diện ngay sau khi cập nhật thành công. Email thông báo voucher được gửi thêm nếu SMTP đã được cấu hình.
- Khi thanh toán, voucher loại này chỉ dùng được bởi đúng tài khoản đã được cấp và tài khoản vẫn chưa có đơn hàng.

> Email cần các biến `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`. Việc SMTP chưa được cấu hình không làm mất mã đã cấp trong tài khoản.
