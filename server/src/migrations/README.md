# Migrations

Moi file dat ten `<so-thu-tu>-<ten>.ts` va export `up(db, mongoose)` (bat buoc) + `down(db, mongoose)` (tuy chon).

- Tao moi:  `npm run migrate:create -- ten-thay-doi`
- Chay:     `npm run migrate`
- Revert:   `npm run migrate:down`  (hoac `npm run migrate down <so-luong>`)

Trang thai duoc luu trong collection `_migrations`. Migration da chay se khong chay lai.
