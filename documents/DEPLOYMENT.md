# Deployment

Ngay cap nhat: 2026-07-15

## Muc tieu

Production deployment phai dam bao:

- Dockerfile multi-stage cho API va web.
- Runtime container chay non-root user `node`.
- Migration chay rieng, khong gan vao API startup.
- Health check cho API, web va PostgreSQL.
- HTTPS terminate qua Caddy hoac hạ tang tuong duong.
- CD chi chay sau CI thanh cong.

## Docker images

| Image | Dockerfile | Runtime |
|---|---|---|
| API/worker/migration | `docker/api.Dockerfile` | Node 24 Alpine, user `node`, Prisma client generated |
| Buyer web | `docker/web.Dockerfile` | Next.js standalone, Node 24 Alpine, user `node` |

Build local:

```bash
docker build -f docker/api.Dockerfile -t ecommerce-api:local .
docker build -f docker/web.Dockerfile -t ecommerce-web:local .
```

## Local/staging compose

Start database first:

```bash
docker compose up -d postgres
```

Run safe migration once:

```bash
docker compose --profile migration run --rm migrate
```

Start app services:

```bash
docker compose up -d api worker web
```

Start HTTPS/reverse proxy:

```bash
docker compose --profile edge up -d caddy
```

Check health:

```bash
curl -fsS http://localhost:31082/api/v1/health/live
curl -fsS http://localhost:31082/api/v1/health/ready
curl -fsS http://localhost:31080/api/health
curl -fsS http://localhost:31081/api/health
docker compose ps
```

## HTTPS

Compose co service `caddy` voi `docker/caddy/Caddyfile`.

- Local: `WEB_DOMAIN=localhost`, `API_DOMAIN=api.localhost`.
- Staging/production: tro DNS cua `WEB_DOMAIN` va `API_DOMAIN` ve server, mo port 80/443.
- Neu ha tang cloud da terminate TLS o load balancer, co the khong bat profile `edge`; dat reverse proxy/cloud LB forward vao `web:3000` va `api:4000`.
- Neu deploy bang Nginx tren host, dung quy trinh chi tiet tai `documents/DEPLOY_DOCKER_NGINX.md`.

## Migration an toan

Quy trinh production:

1. Backup database truoc deploy.
2. Review migration SQL trong PR.
3. CI phai pass.
4. Chay `docker compose --profile migration run --rm migrate`.
5. Neu migration fail: dung deploy, restore neu can, khong roll app moi.
6. Sau migration pass: rollout `api`, `worker`, `web`.
7. Chay health check va smoke test.

Khong dung `prisma migrate dev` tren staging/production.

## CI/CD

CI `.github/workflows/ci.yml` chay:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. `docker compose config`

CD `.github/workflows/cd.yml`:

- Trigger sau workflow `CI` tren branch `main` hoan tat thanh cong, hoac manual `workflow_dispatch`.
- Build Docker images va validate compose.
- Job deploy chi chay neu GitHub Actions variable `CD_DEPLOY_ENABLED=true`.
- Deploy that can secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` va variable `DEPLOY_PATH`.

## Rollback strategy

Rollback app-only:

```bash
git checkout <previous-good-sha>
docker compose up -d --build api worker web
docker compose --profile edge up -d caddy
```

Rollback khi co migration:

- Uu tien forward fix neu migration da apply va co data moi.
- Chi restore database neu migration lam hong du lieu hoac deploy chua mo traffic.
- Restore theo `documents/BACKUP_RESTORE.md`.
- Sau restore, checkout app version tuong ung voi schema da restore.

## Credentials can co

- PostgreSQL production password.
- `API_AUTH_SECRET` random manh.
- Domain/DNS va TLS/ACME quyen cau hinh.
- GitHub Actions deploy host/user/SSH key/path.
- API docs/credential/sandbox cho Pancake/Google Sheet/BEST neu bat adapter that.

## Ket qua dry-run trong shell nay

Da chay duoc:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Chua chay duoc:

- `docker compose config`, `docker build`, `docker compose up`: shell hien tai khong co Docker CLI.
- Deploy staging that: thieu host, SSH key, domain va production secrets.
