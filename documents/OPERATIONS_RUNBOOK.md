# Operations Runbook

Ngay cap nhat: 2026-07-15

## Health checks

API:

```bash
curl -fsS https://<domain>/api/v1/health/live
curl -fsS https://<domain>/api/v1/health/ready
```

Web:

```bash
curl -fsS https://<domain>/api/health
```

Database:

```bash
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Worker:

```bash
docker compose ps worker
docker compose logs --tail=200 worker
```

## Logs

Ung dung ghi structured JSON log va co request ID. Khong duoc log:

- `authorization` header.
- Password/password hash.
- Access token/promotion token/API token.
- SĐT day du.

Khi dieu tra loi, uu tien tim theo:

- `requestId`
- `orderCode`
- `integrationJobId`
- `integration`
- `status`

## Monitoring and alerting

Can cau hinh dashboard/canh bao cho:

| Tin hieu | Nguong goi y | Hanh dong |
|---|---|---|
| API 5xx rate | > 5% trong 5 phut | Kiem tra deploy moi, logs API, DB readiness |
| API p95 latency | > 1s trong 10 phut | Kiem tra DB, partner timeout, CPU/memory |
| Database down | `ready` fail > 2 phut | Kiem tra Postgres, disk, connection pool |
| Worker stopped | container down > 1 phut | Restart worker, xem last error |
| Integration pending age | pending > 15 phut | Kiem tra worker va partner API |
| Integration failed jobs | > 0 hoac tang nhanh | Xem admin integration logs, retry/manual review |
| Login failures | Tang bat thuong | Kiem tra brute force/rate limit |
| Promotion check rate | Tang bat thuong | Kiem tra spam, CAPTCHA extension neu can |

## Incident: API unhealthy

1. Kiem tra `/health/live` va `/health/ready`.
2. Kiem tra logs:

```bash
docker compose logs --tail=300 api
```

3. Neu readiness fail do DB, xu ly theo incident database.
4. Neu loi do deploy moi, rollback app theo `documents/DEPLOYMENT.md`.
5. Sau khi khoi phuc, ghi lai request ID/error signature.

## Incident: database issue

1. Kiem tra container va disk:

```bash
docker compose ps postgres
docker compose logs --tail=200 postgres
df -h
```

2. Kiem tra ket noi:

```bash
docker compose exec postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

3. Neu corruption/mat data, dung app ghi moi va restore theo `documents/BACKUP_RESTORE.md`.

## Incident: worker or integration failure

1. Xem failed/pending jobs trong admin portal.
2. Kiem tra worker logs:

```bash
docker compose logs --tail=300 worker
```

3. Kiem tra partner sandbox/production status.
4. Retry manual qua admin UI/API neu loi da khac phuc.
5. Khong sua order da tao thanh failed chi vi sync loi; order van la source of truth trong DB.

## Manual retry integration job

Qua admin portal: vao Integration errors -> Retry.

Qua API:

```bash
curl -X POST "https://<domain>/api/v1/admin/integrations/<job-id>/retry" \
  -H "authorization: Bearer <admin-token>"
```

Khong dua token vao ticket/log/chat.

## Release checklist

- [ ] CI xanh tren commit can deploy.
- [ ] Backup thanh cong truoc deploy.
- [ ] Migration SQL da review.
- [ ] Chay migration deploy thanh cong.
- [ ] API/web/DB health check xanh.
- [ ] Worker dang chay.
- [ ] Integration pending/failed khong tang bat thuong.
- [ ] Smoke test phone check/catalog/checkout/admin login.
- [ ] Co nguoi truc rollback trong cua so deploy.

## Post-deploy smoke

```bash
curl -fsS https://<domain>/api/v1/health/ready
curl -fsS https://<domain>/api/health
k6 run tools/k6/public-smoke.js
```

Dat `BASE_URL` va `TEST_PROMOTION_PHONE` cho staging:

```bash
BASE_URL=https://<domain>/api/v1 TEST_PROMOTION_PHONE=<test-phone> k6 run tools/k6/public-smoke.js
```
