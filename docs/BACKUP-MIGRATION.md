# Sao lưu & Migration Database

## 1. Sao lưu (Backup)

Script `server/src/scripts/backup.ts` xuất **toàn bộ collection** ra Extended JSON nén gzip, giữ nguyên kiểu `ObjectId`/`Date` (không cần cài `mongodump`).

```bash
npm run backup --workspace server
# -> server/backups/<timestamp>/
#      manifest.json + <collection>.json.gz
```

## 2. Khôi phục (Restore)

```bash
# Upsert theo _id (an toàn, idempotent)
npm run restore --workspace server -- backups/2026-07-25T...

# Xoá sạch collection rồi nạp lại (bản sao chính xác)
npm run restore --workspace server -- backups/2026-07-25T... --drop
```

## 3. Backup production (khuyến nghị `mongodump`)

Cho production nên dùng `mongodump` (BSON, nhanh, hỗ trợ oplog point-in-time):

```bash
mongodump --uri="$MONGO_URI" --gzip --archive=backup-$(date +%F).gz
mongorestore --uri="$MONGO_URI" --gzip --archive=backup-2026-07-25.gz --drop
```

Lịch cron mẫu (hàng ngày 2h sáng, giữ 14 ngày):

```cron
0 2 * * * cd /app/server && npm run backup >> /var/log/parfum-backup.log 2>&1
```

> Thư mục `backups/` đã được đưa vào `.gitignore`. Nên đẩy bản sao lên lưu trữ ngoài (S3/GCS) và mã hoá.

## 4. Migration

Trình migration nhẹ (`server/src/scripts/migrate.ts`) theo dõi trạng thái trong collection **`_migrations`**. Mỗi migration là một file trong `server/src/migrations/` đặt tên `<so-thu-tu>-<ten>.ts`, export `up` (bắt buộc) và `down` (tùy chọn).

```bash
# Tạo migration mới từ template
npm run migrate:create --workspace server -- them-truong-abc

# Chạy các migration đang chờ (up)
npm run migrate --workspace server

# Revert migration mới nhất (down)
npm run migrate:down --workspace server

# Revert 3 cái gần nhất
npm run migrate --workspace server -- down 3
```

### Cấu trúc 1 migration

```ts
import type { Db } from 'mongodb';
import type mongoose from 'mongoose';

export async function up(db: Db, m: typeof mongoose) {
  // thay đổi tiến
}

export async function down(db: Db, m: typeof mongoose) {
  // rollback (tùy chọn)
}
```

### Migration mẫu kèm theo

| File | Mô tả |
|------|-------|
| `0001-backfill-basePrice.ts` | Đặt `basePrice = price` cho variant cũ chưa có `basePrice` |
| `0002-sync-indexes.ts` | Nạp toàn bộ model và `syncIndexes()` khớp schema hiện tại |

### Quy trình an toàn khi đổi schema

1. `npm run backup` trước.
2. Viết + chạy thử migration trên môi trường staging.
3. `npm run migrate` trên production trong cửa sổ bảo trì.
4. Có sẵn `down` để rollback nhanh nếu lỗi.

> Lưu ý: giao dịch đa document cần MongoDB replica set. Trình migration này chạy tuần tự, mỗi migration nên tự đảm bảo tính idempotent khi có thể.
