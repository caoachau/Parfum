# Bộ Test Case: Discount & Voucher (end-to-end)

Tài liệu này mô tả các kịch bản kiểm thử cho toàn bộ vòng đời khuyến mãi của L'Essence Noire:

1. Admin tạo mã (voucher + discount sản phẩm/danh mục)
2. User áp mã khi đặt hàng
3. Hệ thống xử lý & tính tiền (pricing engine)
4. Đơn hàng cuối cùng (giữ chỗ lượt dùng, snapshot, hoàn/hủy)

> Ký hiệu kết quả: **PASS** = hệ thống phải cho phép; **BLOCK** = hệ thống phải chặn và trả lỗi rõ ràng.

Các thành phần liên quan trong mã nguồn:
- `server/src/models/voucher.model.ts`, `discount.model.ts`, `voucherCounter.model.ts`
- `server/src/services/promotion.service.ts` (tạo/validate)
- `server/src/services/pricing-engine.service.ts` + `promotionPricing.ts` (tính tiền)
- `server/src/services/order.service.ts` (giữ chỗ / rollback / hoàn tiền)

---

## PHẦN A — Admin tạo VOUCHER

Ràng buộc chính (`normalizeVoucher` / `createVoucher`):
- `code` viết HOA, duy nhất (trùng → 409).
- `type`: `percent` | `percentage` | `fixed` | `free_shipping`.
- `percentage` > 100 → chặn.
- `free_shipping` → `value` bị ép về 0.
- Khoảng ngày: `startDate` phải < `endDate` (>= là không hợp lệ). `expiresAt` = `endDate`.

| ID | Mục tiêu | Tiền điều kiện | Dữ liệu nhập | Kết quả mong đợi |
|----|----------|----------------|--------------|------------------|
| A1 | Tạo voucher % hợp lệ | Đăng nhập admin | code `SALE10`, type `percentage`, value 10, minOrder 500k, start < end | **PASS** — lưu code `SALE10` (HOA) |
| A2 | Ép chữ HOA | | code `sale10` | **PASS** — lưu thành `SALE10` |
| A3 | Trùng mã | Đã có `SALE10` | code `sale10` (tạo lần 2) | **BLOCK** — lỗi 409 "mã đã tồn tại" |
| A4 | % vượt 100 | | type `percentage`, value 150 | **BLOCK** — không cho tạo |
| A5 | Free shipping ép value 0 | | type `free_shipping`, value 99 | **PASS** — lưu value = 0 |
| A6 | Khoảng ngày sai | | startDate = endDate (hoặc start > end) | **BLOCK** — khoảng ngày không hợp lệ |
| A7 | maxDiscount cho voucher % | | type `percentage`, value 20, maxDiscount 200k | **PASS** — lưu trần giảm 200k |
| A8 | Giới hạn lượt / tổng | | usageLimit 100, usageLimitPerUser 1 | **PASS** — lưu đúng, usedCount khởi tạo 0 |
| A9 | Phân khúc khách | | userSegment `VIP` | **PASS** — chỉ VIP dùng được (xem C) |
| A10 | Loại type không hợp lệ | | type `abc` | **BLOCK** — sai enum |

---

## PHẦN B — Admin tạo DISCOUNT (sản phẩm / danh mục)

Ràng buộc chính (`assertLegalDiscount` / `assertReferenceEvidence` / `dateRange`):
- `scope`: `PRODUCT` (cần `products[]`) hoặc `CATEGORY` (cần `categories[]`).
- `type`: `PERCENTAGE` | `FIXED`.
- `PERCENTAGE` > 100 → chặn.
- Giảm "thông thường" > 50% → chặn, TRỪ KHI `isConcentratedPromotion = true` (khuyến mãi tập trung).
- `FIXED` > 50% giá gốc → chặn.
- Nếu chưa từng có đơn đã thanh toán cho SP → yêu cầu bằng chứng giá tham chiếu: `referencePriceConfirmed = true` **và** `referencePriceNote` >= 10 ký tự.
- `startDate` < `endDate` (bắt buộc cả hai).

| ID | Mục tiêu | Dữ liệu nhập | Kết quả mong đợi |
|----|----------|--------------|------------------|
| B1 | Discount % sản phẩm hợp lệ | scope PRODUCT, products=[X], type PERCENTAGE, value 20 | **PASS** |
| B2 | Thiếu danh sách sản phẩm | scope PRODUCT, products=[] | **BLOCK** — cần chọn sản phẩm |
| B3 | Thiếu danh sách danh mục | scope CATEGORY, categories=[] | **BLOCK** — cần chọn danh mục |
| B4 | % vượt 100 | type PERCENTAGE, value 120 | **BLOCK** |
| B5 | Giảm > 50% thường | value 60, isConcentratedPromotion false | **BLOCK** — vượt trần 50% |
| B6 | Giảm > 50% có KM tập trung | value 60, isConcentratedPromotion true, kèm bằng chứng | **PASS** |
| B7 | FIXED vượt 50% giá gốc | type FIXED, value = 60% giá gốc | **BLOCK** |
| B8 | Thiếu bằng chứng giá (SP chưa bán) | value 40, referencePriceConfirmed false | **BLOCK** — cần xác nhận giá tham chiếu |
| B9 | Ghi chú bằng chứng quá ngắn | referencePriceConfirmed true, note = "ok" (<10 ký tự) | **BLOCK** |
| B10 | Bằng chứng hợp lệ | referencePriceConfirmed true, note >= 10 ký tự | **PASS** |
| B11 | SP đã có đơn thanh toán | SP đã từng bán | **PASS** — không cần xác nhận giá tham chiếu |
| B12 | Khoảng ngày sai | start >= end | **BLOCK** |

---

## PHẦN C — User ÁP voucher khi đặt hàng

Ràng buộc chính (`resolveVoucher` trong pricing-engine):
- Không tồn tại / `isActive = false` → lỗi.
- Chưa tới hạn: `startDate > now` → lỗi "chưa bắt đầu".
- Hết hạn: `endDate <= now` → lỗi "đã hết hạn".
- `subtotal < minOrder` → lỗi "chưa đạt giá trị tối thiểu".
- `usedCount >= usageLimit` → lỗi "hết lượt".
- Phân khúc: `segmentMatches` theo NEW/RETURNING/LOYAL/VIP (dựa số đơn đã thanh toán & tổng chi).
- `usageLimitPerUser`: đếm theo `VoucherCounter(voucher, customerKey)`.
- Chồng mã: `mayStackVoucher(stackable, productPromotionDiscount)` — nếu SP đang có KM sản phẩm (>0) thì voucher phải `stackable = true` mới dùng được.

Phân khúc khách (`customerSegment`): đã thanh toán >= 20 đơn HOẶC tổng chi >= 50.000.000đ → **VIP**; >= 3 đơn → **LOYAL**; >= 1 đơn → **RETURNING**; còn lại → **NEW**. `customerKey` = `user:{id}` nếu đăng nhập, ngược lại `email:{email viết thường}`.

| ID | Mục tiêu | Tiền điều kiện | Thao tác | Kết quả mong đợi |
|----|----------|----------------|----------|------------------|
| C1 | Mã không tồn tại | | Áp `KHONGCO` | **BLOCK** — không tìm thấy mã |
| C2 | Mã bị tắt | voucher isActive=false | Áp mã | **BLOCK** — mã không khả dụng |
| C3 | Chưa tới ngày | startDate = ngày mai | Áp mã | **BLOCK** — chưa bắt đầu |
| C4 | Hết hạn | endDate = hôm qua | Áp mã | **BLOCK** — đã hết hạn |
| C5 | Chưa đạt tối thiểu | minOrder 500k | subtotal 300k | **BLOCK** — chưa đạt giá trị tối thiểu |
| C6 | Đạt tối thiểu | minOrder 500k | subtotal 600k | **PASS** |
| C7 | Hết tổng lượt | usedCount = usageLimit | Áp mã | **BLOCK** — hết lượt |
| C8 | Vượt lượt mỗi người | usageLimitPerUser 1, user đã dùng 1 lần | Áp lại | **BLOCK** — bạn đã dùng mã này |
| C9 | Sai phân khúc | userSegment VIP, khách NEW | Áp mã | **BLOCK** — không đủ điều kiện phân khúc |
| C10 | Đúng phân khúc | userSegment RETURNING, khách có 1 đơn đã thanh toán | Áp mã | **PASS** |
| C11 | Chồng mã bị chặn | SP đang có KM sản phẩm, voucher stackable=false | Áp mã | **BLOCK** — không thể chồng khuyến mãi |
| C12 | Chồng mã cho phép | SP đang có KM sản phẩm, voucher stackable=true | Áp mã | **PASS** |
| C13 | Guest theo email | Chưa đăng nhập, đã dùng mã bằng email trước đó | Áp lại cùng email | **BLOCK** nếu vượt usageLimitPerUser |

---

## PHẦN D — Hệ thống XỬ LÝ & tính tiền (quoteOrder)

Ràng buộc chính (`quoteOrder` + `voucherDiscountAmount`):
- `percentage`: giảm = round(subtotal * value / 100). Trần **50%** subtotal TRỪ KHI voucher là KM tập trung (concentrated).
- `fixed`: giảm = value (clamp không vượt subtotal).
- `maxDiscount`/`maxDiscountAmount`: nếu có, cắt phần giảm không vượt trần.
- `free_shipping`: `shippingDiscount` = toàn bộ phí ship; phần giảm voucher = 0.
- Tổng cuối: `finalTotal = max(0, subtotal - voucherDiscount + shippingFee + tax)` (phí ship đã bị bù nếu free_shipping).

| ID | Mục tiêu | Dữ liệu | Kết quả mong đợi |
|----|----------|---------|------------------|
| D1 | Giảm % cơ bản | subtotal 1.000.000, voucher 10% | voucherDiscount = 100.000 |
| D2 | Trần 50% (không tập trung) | subtotal 1.000.000, voucher 80% thường | giảm bị cắt còn 500.000 |
| D3 | KM tập trung vượt 50% | subtotal 1.000.000, voucher 80% concentrated | giảm = 800.000 (không bị cắt 50%) |
| D4 | maxDiscount cắt trần | subtotal 2.000.000, voucher 20% (=400k), maxDiscount 200k | giảm = 200.000 |
| D5 | Fixed clamp | subtotal 150.000, voucher fixed 300.000 | giảm = 150.000 (không âm tổng) |
| D6 | Free shipping | subtotal 600.000, ship 30.000, voucher free_shipping | shippingDiscount = 30.000, voucherDiscount = 0, finalTotal = 600.000 + tax |
| D7 | Tổng không âm | subtotal 100.000, voucher fixed 100.000, ship 0 | finalTotal = 0 |
| D8 | Kết hợp KM sản phẩm + voucher stackable | có productDiscount + voucher stackable | áp KM sản phẩm trước, rồi voucher trên subtotal đã giảm |

**Ví dụ tính tay (D6):** subtotal 600.000, ship 30.000, tax 0, voucher `FREESHIP`:
- shippingDiscount = 30.000 → phí ship thực trả = 0
- voucherDiscount = 0
- finalTotal = max(0, 600.000 - 0 + 30.000 - 30.000 + 0) = **600.000đ**

---

## PHẦN E — ĐƠN HÀNG CUỐI CÙNG (đặt / hủy / hoàn)

Ràng buộc chính (`order.service.ts`):
- `reserveVoucher`: cập nhật nguyên tử `updateOne({ _id, usedCount < usageLimit }, { $inc: { usedCount: 1 } })`. Nếu `modifiedCount !== 1` → **409** (đã có người khác dùng hết lượt trong lúc đặt).
- Tăng `VoucherCounter(voucher, customerKey).count` theo từng khách.
- Nếu bước sau lỗi → rollback: giảm lại cả `usedCount` và `VoucherCounter`.
- Hủy / hoàn đơn có dùng voucher → giảm `usedCount` (trả lại lượt).
- Đơn lưu snapshot: `voucherCode`, `voucherDiscount`, `voucherSnapshot { code, name, type, value, stackable, userSegment }`.

| ID | Mục tiêu | Tiền điều kiện | Thao tác | Kết quả mong đợi |
|----|----------|----------------|----------|------------------|
| E1 | Đặt hàng thành công | voucher còn lượt | Đặt đơn có mã | usedCount +1, VoucherCounter +1, đơn lưu snapshot |
| E2 | Chạy đua hết lượt | usageLimit 1, 2 request đồng thời | Đặt đồng thời | 1 đơn PASS, đơn còn lại **409** — không âm/không vượt usageLimit |
| E3 | Rollback khi lỗi thanh toán | Đặt đơn nhưng bước sau lỗi | | usedCount và VoucherCounter được trả lại (không rò rỉ lượt) |
| E4 | Hủy đơn | Đơn đã dùng mã | Hủy đơn | usedCount -1 (trả lại lượt) |
| E5 | Hoàn đơn | Đơn đã dùng mã | Hoàn tiền | usedCount -1 |
| E6 | Snapshot đầy đủ | Đặt đơn có mã | Xem chi tiết đơn | Có voucherCode, voucherDiscount, voucherSnapshot đúng giá trị lúc đặt |
| E7 | Đổi cấu hình voucher sau khi đặt | Admin sửa value voucher sau khi có đơn | Xem đơn cũ | Đơn cũ vẫn hiển thị theo snapshot (không đổi theo cấu hình mới) |
| E8 | Per-user counter độc lập | usageLimitPerUser 1 | 2 khách khác nhau cùng dùng | Cả hai PASS (đếm theo customerKey riêng) |

---

## Checklist hồi quy nhanh

- [ ] A1–A10 tạo voucher đúng ràng buộc
- [ ] B1–B12 tạo discount đúng ràng buộc (đặc biệt trần 50% và bằng chứng giá)
- [ ] C1–C13 áp mã: thời gian, tối thiểu, lượt, phân khúc, chồng mã
- [ ] D1–D8 tính tiền: trần 50%, maxDiscount, free_shipping, tổng không âm
- [ ] E1–E8 đặt/hủy/hoàn: nguyên tử lượt dùng, rollback, snapshot
- [ ] Chạy đua (E2) không cho vượt usageLimit

---

*Tài liệu tạo tự động cho mục đích kiểm thử nội bộ — L'Essence Noire.*
