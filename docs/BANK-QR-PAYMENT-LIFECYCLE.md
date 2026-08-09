# Luồng thanh toán Bank QR

## 1. Trạng thái và nguyên tắc

- Khi tạo đơn QR, tồn kho và quota khuyến mãi được giữ ngay. Order nhận hai mốc:
  - `paymentExpiresAt`: hết hạn thanh toán.
  - `paymentCancellationAt`: hết khoảng đệm đối soát; từ đây đơn thiếu tiền được tự hủy.
- Mỗi webhook SePay được lưu trong `payment.transactions`. `providerTransactionId` có unique index nên webhook retry không cộng tiền lần hai.
- `receivedAmount` là tổng mọi lần chuyển cho đơn:
  - `0`: `unpaid`.
  - nhỏ hơn `amount`: `partial`, tuyệt đối không cho giao hàng.
  - bằng `amount`: chờ admin xác nhận đối soát, sau đó thành `paid`.
  - lớn hơn `amount`: đã đủ tiền; `excessAmount` và `refundAmount` là phần chênh cần hoàn.
- Trạng thái hoàn tiền được tách ở `refundStatus` (`none/pending/refunded`). Vì vậy đơn chuyển dư vẫn có thể là `paid` trong khi phần dư đang `pending`.
- Tiền đến sau khi đơn đã hủy không làm sống lại đơn và không trừ kho lại. Toàn bộ số thực nhận được đưa vào hàng chờ hoàn tiền.

## 2. Job nhắc hạn và hủy đơn

Job được bật trong `server/src/index.ts`, chạy ngay khi server khởi động rồi lặp theo `QR_PAYMENT_JOB_INTERVAL_MS`.

1. Gửi email “đơn chưa thanh toán” trước thời điểm hủy theo `QR_PAYMENT_REMINDER_MINUTES_BEFORE_CANCELLATION`.
2. Gửi email “đơn sắp bị hủy” theo `QR_PAYMENT_WARNING_MINUTES_BEFORE_CANCELLATION`.
3. Sau `paymentCancellationAt`, nếu tổng thực nhận vẫn thiếu:
   - claim đơn nguyên tử từ `pending` sang `cancelled`;
   - hoàn tồn kho và quota voucher/flash sale;
   - nếu đã nhận một phần tiền, đặt đúng số thực nhận vào `refundAmount`;
   - gửi email đơn đã hủy.

Mongo transaction được ưu tiên để hủy đơn, hoàn kho và trả quota cùng commit. Nếu Mongo standalone không hỗ trợ transaction, hệ thống dùng atomic claim để ngăn hai worker hoàn kho lặp. Các đơn QR cũ chưa có deadline được job tự backfill từ `createdAt`.

## 3. Cấu hình

```env
QR_PAYMENT_TTL_MINUTES=30
QR_RECONCILIATION_GRACE_MINUTES=10
QR_PAYMENT_REMINDER_MINUTES_BEFORE_CANCELLATION=15
QR_PAYMENT_WARNING_MINUTES_BEFORE_CANCELLATION=5
QR_PAYMENT_JOB_INTERVAL_MS=60000
QR_PAYMENT_JOB_BATCH_SIZE=50
```

SMTP phải được cấu hình (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) thì email mới được gửi.

## 4. Thử nhanh ở local

Có thể tạm dùng cấu hình sau rồi restart server:

```env
QR_PAYMENT_TTL_MINUTES=3
QR_RECONCILIATION_GRACE_MINUTES=1
QR_PAYMENT_REMINDER_MINUTES_BEFORE_CANCELLATION=2
QR_PAYMENT_WARNING_MINUTES_BEFORE_CANCELLATION=1
QR_PAYMENT_JOB_INTERVAL_MS=10000
```

Tạo một đơn Bank QR và không thanh toán. Kết quả mong đợi:

- email nhắc chưa thanh toán, sau đó email sắp hủy;
- sau khoảng 4 phút đơn thành `cancelled` với lý do quá hạn;
- tồn kho, voucher và suất flash sale được trả lại đúng một lần;
- terminal server có log `[qr-payment-job]` khi job thực sự xử lý dữ liệu;
- dashboard admin hiển thị các nhóm chưa chuyển, chuyển thiếu, chờ xác nhận đủ, chuyển dư và cần hoàn.

Chạy test tự động:

```powershell
cd server
npm test -- --run tests/bank-transfer-flow.test.ts tests/qr-payment-lifecycle.test.ts
```

Chạy toàn bộ kiểm tra:

```powershell
cd server
npm run typecheck
npm test

cd ../client
npm run typecheck
npm test
```
