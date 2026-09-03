# Environment Variables

Ngay cap nhat: 2026-07-27

Khong commit secret that. File `.env.example` chi dung placeholder; moi truong staging/production phai luu secret trong secret manager, CI/CD secrets hoac file `.env` nam ngoai Git.

## Public web and edge

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `NODE_ENV` | Co | `production` | `development`, `staging`, `production` |
| `WEB_PORT` | Khong | `31080` | Port web expose ra host local |
| `ADMIN_PORT` | Khong | `31081` | Port admin portal expose ra host local |
| `NEXT_PUBLIC_API_BASE_URL` | Co | `https://shop.example.com/api/v1` | Bien public, khong dat secret |
| `HTTP_PORT` | Khong | `80` | Caddy HTTP |
| `HTTPS_PORT` | Khong | `443` | Caddy HTTPS |
| `WEB_DOMAIN` | Staging/prod | `shop.example.com` | Domain cho buyer web |
| `API_DOMAIN` | Tuy chon | `api.example.com` | Co the dung chung domain qua `/api/*` |
| `ACME_EMAIL` | Khong | `ops@example.com` | Email van hanh cho TLS/ACME neu ha tang yeu cau |

## API

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `API_PORT` | Khong | `31082` | Port API expose ra host local; trong container van la `4000` |
| `API_HOST` | Khong | `0.0.0.0` | Trong container nen dung `0.0.0.0` |
| `API_CORS_ORIGINS` | Co | `https://shop.example.com,https://admin.example.com` | Khong dung wildcard production |
| `API_SWAGGER_ENABLED` | Khong | `false` | Nen tat tren production public |
| `API_AUTH_SECRET` | Co | secret manager | Secret ky token; toi thieu 32 bytes random |
| `API_ACCESS_TOKEN_TTL_SECONDS` | Khong | `3600` | TTL admin token |
| `API_LOGIN_RATE_LIMIT_MAX` | Khong | `5` | Gioi han login |
| `API_LOGIN_RATE_LIMIT_WINDOW_SECONDS` | Khong | `900` | Cua so rate limit login |
| `API_PROMOTION_TOKEN_TTL_SECONDS` | Khong | `1800` | TTL promotion token |
| `API_PROMOTION_RATE_LIMIT_MAX` | Khong | `20` | Gioi han check uu dai |
| `API_PROMOTION_RATE_LIMIT_WINDOW_SECONDS` | Khong | `900` | Cua so rate limit check uu dai |
| `API_DEFAULT_SHIPPING_FEE_VND` | Khong | `30000` | Phi ship cho don 1 san pham; tu 2 san pham tro len mien phi ship |
| `API_ORDER_INTEGRATIONS` | Khong | `sheet,pancake` | Danh sach adapter tao job khi co don |
| `CLOUDINARY_CLOUD_NAME` | Khi upload anh | `your_cloud_name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Khi upload anh | `your_api_key` | Chi dung server-side |
| `CLOUDINARY_API_SECRET` | Khi upload anh | secret manager | Khong log, khong dua xuong frontend |
| `CLOUDINARY_PRODUCT_IMAGE_FOLDER` | Khong | `ecommerce-products` | Folder upload anh san pham |

Luu y:

- Neu frontend/admin goi API bi CORS, them dung origin that vao `API_CORS_ORIGINS`, sau do restart `api`.
- Neu sua `NEXT_PUBLIC_API_BASE_URL`, can rebuild `web` va `admin-portal` vi day la bien build-time cua Next.js.
- Upload anh/video qua Cloudinary can `CLOUDINARY_*` trong container `api`. Video ho tro MP4, WEBM, MOV, toi da 50MB.

## Integration worker

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `API_INTEGRATION_TIMEOUT_SECONDS` | Khong | `10` | Timeout request doi tac |
| `API_INTEGRATION_MAX_ATTEMPTS` | Khong | `5` | Qua so lan nay chuyen manual review |
| `API_INTEGRATION_BACKOFF_BASE_SECONDS` | Khong | `60` | Base exponential backoff |
| `API_INTEGRATION_POLL_INTERVAL_SECONDS` | Khong | `5` | Worker polling |
| `API_INTEGRATION_BATCH_SIZE` | Khong | `10` | So job xu ly moi vong |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Khi dung Google Sheets | `/run/secrets/google-service-account.json` | Duong dan file key service account, mount read-only |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Tuy chon | secret manager | Thay the file key bang JSON mot dong, khong commit |
| `GOOGLE_SHEETS_CACHE_TTL_SECONDS` | Khong | `60` | Cache danh sach SĐT uu dai de giam request Google |
| `API_INTEGRATION_PANCAKE_*` | Khi dung Pancake | secret manager | Can API docs/credential xac nhan |
| `API_INTEGRATION_BEST_*` | Khi dung BEST | secret manager | Chi bat neu nam trong MVP |

## SPX delivery

Bat SPX bang cach them `spx` vao `API_ORDER_INTEGRATIONS`, vi du `sheet,pancake,spx`.

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `SPX_ENV` | Khong | `test` | `test` hoac `live` |
| `SPX_TEST_BASE_URL` | Khong | `https://test-stable.spx.vn/` | Host sandbox VN |
| `SPX_LIVE_BASE_URL` | Khi live | `https://spx.vn/` | Host production VN |
| `SPX_APP_ID` | Co | `1000628` | AppID do SPX cap |
| `SPX_APP_SECRET` | Co | secret manager | Khong commit, dung de ky `check-sign` |
| `SPX_ACCOUNT_ENCRYPTION_KEY` | Co | secret manager | Key ma hoa `user_secret` luu trong bang `spx_accounts` |
| `SPX_USER_ID` | Dev fallback | secret manager | Chi dung khi chua co account active trong DB |
| `SPX_USER_SECRET` | Dev fallback | secret manager | Chi dung khi chua co account active trong DB |
| `SPX_DEFAULT_SERVICE_TYPE` | Khong | `1` | `1` standard, `2` instant |
| `SPX_DEFAULT_COLLECT_TYPE` | Khong | `1` | `1` pickup, `2` drop off |
| `SPX_PAYMENT_ROLE` | Khong | `1` | `1` sender pay, `2` receiver pay |
| `SPX_ENABLE_COD` | Khong | `true` | COD amount lay tu tong tien backend |
| `SPX_ALLOW_MUTUAL_CHECK` | Khong | `false` | Chi bat khi SPX/VN shop xac nhan |
| `SPX_ALLOW_TRY_ON` | Khong | `false` | Chi bat khi SPX/VN shop xac nhan |
| `SPX_ALLOW_PARTIAL_DELIVERY` | Khong | `false` | Chi bat khi SPX/VN shop xac nhan |
| `SPX_SENDER_NAME` | Co | `Shop ABC` | Ten nguoi gui |
| `SPX_SENDER_PHONE` | Co | `0901234567` | SĐT nguoi gui |
| `SPX_SENDER_STATE` | Co | `TP. Ho Chi Minh` | Province theo file address SPX |
| `SPX_SENDER_CITY` | Co | `Quan 1` | District theo file address SPX |
| `SPX_SENDER_DISTRICT` | Co | `Phuong Ben Nghe` | Ward theo file address SPX |
| `SPX_SENDER_DETAIL_ADDRESS` | Co | `123 Nguyen Hue` | Dia chi chi tiet |
| `SPX_DEFAULT_WEIGHT_KG` | Khong | `0.5` | Default khi product/order chua co can nang |
| `SPX_DEFAULT_LENGTH_CM` | Khong | `10` | Default chieu dai kien hang |
| `SPX_DEFAULT_WIDTH_CM` | Khong | `10` | Default chieu rong kien hang |
| `SPX_DEFAULT_HEIGHT_CM` | Khong | `10` | Default chieu cao kien hang |

Luu y:

- Production nen tao `SPX_USER_ID`/`SPX_USER_SECRET` qua Admin > Dong bo > Tai khoan SPX; backend se luu `user_secret` dang ma hoa trong PostgreSQL.
- `SPX_APP_SECRET` va `SPX_ACCOUNT_ENCRYPTION_KEY` phai co trong ca `api` va `worker`.
- Webhook SPX can public HTTPS URL, vi du `https://api.example.com/api/v1/webhooks/spx/tracking`.
- Sender address va buyer address nen dung gia tri tu file address SPX Vietnam.

## PostgreSQL

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `POSTGRES_HOST` | Khong | `postgres` | Host trong compose |
| `POSTGRES_PORT` | Khong | `5432` | Port DB |
| `POSTGRES_DB` | Co | `ecommerce` | Database name |
| `POSTGRES_USER` | Co | `ecommerce` | User app |
| `POSTGRES_PASSWORD` | Co | secret manager | Khong dung gia tri mau |
| `DATABASE_URL` | Co | `postgresql://...` | Dung cho Prisma migrate/API/worker |

Neu dung PostgreSQL host/managed DB voi `docker-compose.host-db.yml`, vi du:

```env
DATABASE_URL=postgresql://ecommerce:<password>@host.docker.internal:5432/ecommerce?schema=public
```

PostgreSQL host can mo `pg_hba.conf` cho Docker bridge, vi container thuong ket noi tu subnet `172.16.0.0/12`.

## Backup and alerting

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `BACKUP_RETENTION_DAYS` | Khong | `14` | Retention toi thieu de xoa backup cu |
| `BACKUP_TARGET` | Khong | `local-volume` | Co the doi sang S3/GCS khi co credential |
| `ALERT_ERROR_RATE_THRESHOLD_PERCENT` | Khong | `5` | Nguong canh bao API 5xx |
| `ALERT_INTEGRATION_FAILED_THRESHOLD` | Khong | `1` | Failed job > nguong canh bao |
| `ALERT_INTEGRATION_PENDING_MAX_AGE_MINUTES` | Khong | `15` | Pending qua lau can canh bao |

## CI/CD secrets

| Secret/Variable | Bat buoc khi CD | Ghi chu |
|---|---:|---|
| `CD_DEPLOY_ENABLED` | Co | GitHub Actions variable, dat `true` moi deploy |
| `DEPLOY_HOST` | Co | GitHub Actions secret |
| `DEPLOY_USER` | Co | GitHub Actions secret |
| `DEPLOY_SSH_KEY` | Co | GitHub Actions secret |
| `DEPLOY_PATH` | Co | GitHub Actions variable, path repo tren server |
