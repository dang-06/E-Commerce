# Environment Variables

Ngay cap nhat: 2026-07-15

Khong commit secret that. File `.env.example` chi dung placeholder; moi truong staging/production phai luu secret trong secret manager, CI/CD secrets hoac file `.env` nam ngoai Git.

## Public web and edge

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `NODE_ENV` | Co | `production` | `development`, `staging`, `production` |
| `WEB_PORT` | Khong | `3000` | Port container web expose ra host local |
| `NEXT_PUBLIC_API_BASE_URL` | Co | `https://shop.example.com/api/v1` | Bien public, khong dat secret |
| `HTTP_PORT` | Khong | `80` | Caddy HTTP |
| `HTTPS_PORT` | Khong | `443` | Caddy HTTPS |
| `WEB_DOMAIN` | Staging/prod | `shop.example.com` | Domain cho buyer web |
| `API_DOMAIN` | Tuy chon | `api.example.com` | Co the dung chung domain qua `/api/*` |
| `ACME_EMAIL` | Khong | `ops@example.com` | Email van hanh cho TLS/ACME neu ha tang yeu cau |

## API

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `API_PORT` | Khong | `4000` | Port NestJS |
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
| `API_DEFAULT_SHIPPING_FEE_VND` | Can xac nhan | `0` | Tam thoi theo business rule da chot/cau hinh |
| `API_ORDER_INTEGRATIONS` | Khong | `sheet,pancake` | Danh sach adapter tao job khi co don |

## Integration worker

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `API_INTEGRATION_TIMEOUT_SECONDS` | Khong | `10` | Timeout request doi tac |
| `API_INTEGRATION_MAX_ATTEMPTS` | Khong | `5` | Qua so lan nay chuyen manual review |
| `API_INTEGRATION_BACKOFF_BASE_SECONDS` | Khong | `60` | Base exponential backoff |
| `API_INTEGRATION_POLL_INTERVAL_SECONDS` | Khong | `5` | Worker polling |
| `API_INTEGRATION_BATCH_SIZE` | Khong | `10` | So job xu ly moi vong |
| `API_INTEGRATION_SHEET_BASE_URL` | Khi dung Sheet API | sandbox URL | Khong doan endpoint khi chua co docs |
| `API_INTEGRATION_SHEET_CREATE_ORDER_PATH` | Khi dung Sheet API | `/orders` | Tuong tu update/status/health |
| `API_INTEGRATION_SHEET_TOKEN` | Khi dung Sheet API | secret manager | Khong commit |
| `API_INTEGRATION_PANCAKE_*` | Khi dung Pancake | secret manager | Can API docs/credential xac nhan |
| `API_INTEGRATION_BEST_*` | Khi dung BEST | secret manager | Chi bat neu nam trong MVP |

## PostgreSQL

| Bien | Bat buoc | Vi du | Ghi chu |
|---|---:|---|---|
| `POSTGRES_HOST` | Khong | `postgres` | Host trong compose |
| `POSTGRES_PORT` | Khong | `5432` | Port DB |
| `POSTGRES_DB` | Co | `ecommerce` | Database name |
| `POSTGRES_USER` | Co | `ecommerce` | User app |
| `POSTGRES_PASSWORD` | Co | secret manager | Khong dung gia tri mau |
| `DATABASE_URL` | Co | `postgresql://...` | Dung cho Prisma migrate/API/worker |

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
