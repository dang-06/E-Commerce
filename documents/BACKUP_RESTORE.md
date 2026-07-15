# Backup and Restore

Ngay cap nhat: 2026-07-15

## Backup policy

- Tan suat toi thieu: hang ngay.
- Retention toi thieu: 14 ngay hoac theo yeu cau kinh doanh.
- Backup phai duoc ma hoa neu dua ra object storage.
- Phai test restore dinh ky, khong chi test backup command.
- Backup truoc moi production migration.

## One-off backup bang Docker Compose

```bash
docker compose --profile backup run --rm postgres-backup
```

File backup nam trong volume `postgres-backups`, dinh dang custom dump:

```bash
docker compose run --rm postgres sh -c "ls -lah /backups"
```

## Backup hang ngay

Neu dung server VM, cau hinh cron tren host:

```cron
15 18 * * * cd /path/to/repo && docker compose --profile backup run --rm postgres-backup >> /var/log/ecommerce-backup.log 2>&1
```

18:15 UTC tuong duong 01:15 gio Viet Nam ngay hom sau. Dieu chinh theo cua so it traffic.

Neu dung cloud managed database, uu tien native automated backup/PITR cua provider va van giu runbook restore rieng.

## Xoa backup cu

Vi du voi local volume mount ra host:

```bash
find /path/to/backups -name '*.dump' -mtime +14 -delete
```

Chi xoa sau khi da xac nhan co backup moi va restore test gan nhat thanh cong.

## Restore vao database moi

1. Dung app ghi du lieu moi:

```bash
docker compose stop api worker web
```

2. Tao database restore rieng hoac reset database muc tieu theo quy trinh da phe duyet.

3. Restore:

```bash
docker compose exec -T postgres pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname "$POSTGRES_DB" \
  /backups/<backup-file>.dump
```

4. Kiem tra schema va health:

```bash
docker compose --profile migration run --rm migrate
docker compose up -d api worker web
curl -fsS http://localhost:4000/api/v1/health/ready
```

## Restore tu object storage

1. Download backup vao server, khong commit vao repo.
2. Xac minh checksum neu co.
3. Copy vao container/volume backup.
4. Chay `pg_restore` nhu phan tren.

## Rollback sau restore

- Checkout app version tuong ung voi schema trong backup.
- Rebuild/restart API, worker, web.
- Chay smoke test checkout va admin login.
- Kiem tra integration jobs pending/failed de retry thu cong neu can.

## Canh bao

- Restore production se ghi de du lieu hien tai; can approval ro rang.
- Khong restore len database dang co traffic ghi.
- Neu migration da chay va co order moi sau migration, restore co the lam mat order moi; can export/doi soat truoc khi restore.
