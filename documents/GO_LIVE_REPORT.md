# Go-live Report

Ngay audit: 2026-07-15

Vai tro audit: Senior Tech Lead final audit truoc Go-live.

## 1. Ket luan

**Ket qua: BLOCKED**

Chua duoc Go-live production voi traffic va du lieu that.

Ly do: core backend cho buyer flow da co test tot, nhung cac dieu kien go-live bat buoc van chua dat: trang quan tri dang dung mock auth/mock data, admin order APIs chua day du, tich hop doi tac that chua co docs/credential/sandbox, chua UAT tren thiet bi/trinh duyet that, chua chay Docker/staging/migration/backup trong moi truong co Docker va PostgreSQL, va nhieu business rule quan trong van `CẦN XÁC NHẬN`.

Co the tiep tuc **staging/internal demo** cho buyer flow va backend core sau khi cau hinh DB/dev data, nhung khong nen mo production.

## 2. Pham vi da doc va doi chieu

- `documents/phan-tich-yeu-cau-website-ban-hang.md`
- `documents/IMPLEMENTATION_PLAN.md`
- `documents/TEST_REPORT.md`
- `documents/SECURITY_CHECKLIST.md`
- `documents/DEPLOYMENT.md`
- Source code `apps/api`, `apps/shop`, `apps/admin-portal`
- Prisma schema va migration `packages/database/prisma`
- Docker, Compose, CI/CD, backup/restore/runbook docs

## 3. Hang muc da hoan thanh

| Hang muc | Trang thai | Evidence |
|---|---|---|
| Monorepo Node 24 npm workspaces | PASS | Root `package.json`, CI Node 24 |
| TypeScript strict/lint/test/build | PASS | Commands trong muc 12 |
| PostgreSQL/Prisma schema | PASS | `schema.prisma`, migration init |
| Money VND khong dung float | PASS | `BigInt`/`BIGINT` cho price/order totals |
| Product public API active/non-deleted/sortOrder | PASS | `ProductsService.listPublic` |
| Product admin API CRUD/status/soft delete | PASS | `AdminProductsController` |
| Admin auth backend | PASS | bcrypt, bearer token, guard, role guard |
| Promotion check | PASS | phone normalize/hash, token, TTL, rate limit |
| Promotion API khong lo customer details | PASS | response chi `eligible`, token, `expiresAt` |
| Backend tinh lai gia | PASS | `OrdersService.calculate` lay DB product |
| Frontend khong gui price/totals | PASS | `apps/shop/lib/api.ts` chi gui token/phone/items/recipient/payment/note/idempotency |
| DTO reject price/totals la | PASS | ValidationPipe + order test tampered totals |
| Order transaction | PASS | `orders`, `order_items`, `integration_jobs`, `integration_logs` trong `$transaction` |
| Idempotency | PASS | unique key + duplicate handling test |
| Integration retry worker | PASS | DB lock, processing, timeout, backoff, manual review |
| Sensitive integration logs | PASS | `redactSensitive`, tests |
| Dockerfile multi-stage non-root | PASS static | `docker/api.Dockerfile`, `docker/web.Dockerfile` |
| Deployment docs/runbooks | PASS docs | `DEPLOYMENT`, `OPERATIONS_RUNBOOK`, `BACKUP_RESTORE` |

## 4. Acceptance criteria vs tests

| AC | Noi dung | Test evidence | Ket qua |
|---|---|---|---|
| AC-01 | SĐT hop le tra `eligible=true` va token | `promotion check returns only eligible token data and stores phone hash` | PASS |
| AC-02 | SĐT khong hop le khong lo du lieu | `promotion check for inactive customer returns no customer details` | PASS mot phan; missing test cho non-existing phone explicit |
| AC-03 | Gia uu dai giam 25.000 VND/don vi | `PriceBlock...`, `calculates promotion discount...` | PASS |
| AC-04 | Gio hang cap nhat tong tien | `OrderSummary...`, `buyer flow checks phone...` | PASS |
| AC-05 | Backend tinh lai gia | `quotes and creates...`, `calculates promotion...` | PASS |
| AC-06 | Ngan sua gia DevTools | `rejects invalid quantities and does not trust frontend totals` | PASS |
| AC-07 | Tao don, order items, ma don | `returns duplicate...`, `rolls back...`, buyer flow test | PASS |
| AC-08 | Chong tao don trung | `returns duplicate for the same idempotency key` | PASS |
| AC-09 | Dong bo thanh cong luu external ID | `worker handles successful partner createOrder` | PASS voi mock server |
| AC-10 | Retry khi tich hop loi | timeout/4xx/5xx/invalid/retry tests | PASS voi mock server |
| AC-11 | Quan tri san pham | `products.service.test.ts`, admin portal action tests | PASS backend; UI hien tai mock data |

## 5. Doi chieu yeu cau nghiep vu va code

### Buyer flow

- PASS: phone gate truoc catalog trong `apps/shop/app/page.tsx`.
- PASS: product list lay tu API, khong hard-code gia/san pham trong shop UI.
- PASS: cart ho tro nhieu product/quantity, local storage co sanitize.
- PASS: quote truoc confirm va create order dung cung idempotency key.
- BLOCKED/Needs decision: khach khong eligible hien khong the mua gia thuong vi checkout API bat buoc promotion token hop le. BR-08 van `CẦN XÁC NHẬN`; khong tu sua rule trong audit.

### Products

- PASS: public chi tra active va chua xoa mem.
- PASS: admin create/update/status/soft delete.
- PASS: product co FK `order_items.product_id ON DELETE RESTRICT`, san pham da vao don khong bi hard delete qua DB.
- CONDITION: chua co real object storage/upload anh; hien dung image URL/path.

### Promotions

- PASS: normalize `+84`, `84`, `0`; hash phone cho lookup/log.
- PASS: token co signature, TTL, jti, phone hash, rule/version.
- PASS: rate limit theo IP hash + phone hash.
- PASS fixed in audit: import upload co file size limit va MIME/extension whitelist.
- CONDITION: CAPTCHA chi la extension point, chua bat production.
- CONDITION: usage limit uu dai chua ap dung vi BR-11 chua xac nhan.

### Orders/checkout

- PASS: frontend chi gui cac truong hop le, khong gui price/totals.
- PASS: backend tinh lai subtotal/discount/shipping/total tu database.
- PASS: recheck token, phone, product active/deleted, quantity, stockQuantity neu co.
- PASS: transaction tao order/items/integration job/log.
- PASS: idempotency key unique + duplicate response.
- RISK: quote snapshot luu in-memory `OrderQuoteStore`; neu multi-instance/restart se mat snapshot va co the khong phat hien price changed so voi quote cu. Can persist quote snapshot hoac deploy single API instance/sticky route cho giai doan dau.
- CONDITION: shipping fee dang la env static, BR-14 chua xac nhan.

### Admin

- PASS backend: auth/login/me/role guard, product APIs, eligible customer import/status, integrations list/retry.
- BLOCKED: `apps/admin-portal` dang dung `mockLogin`, `mockProducts`, `mockOrders`, `mockEligibleCustomers`, `mockIntegrationLogs`; chua noi API backend.
- BLOCKED: backend chua co admin order list/detail/status/export APIs theo tai lieu.
- CONDITION: audit log table co schema nhung chua ghi audit cho product/order admin actions.

### Integrations

- PASS: adapter interface, worker retry, lock job bang `FOR UPDATE SKIP LOCKED`, timeout, success/failure logging.
- PASS: test mock server cho success/timeout/4xx/5xx/invalid/retry/concurrent/already-created.
- BLOCKED: Google Sheet/Pancake/BEST real adapters chua implement endpoint/payload/auth production vi docs/credential chua xac nhan.

## 6. Security audit

| Hang muc | Ket qua | Ghi chu |
|---|---|---|
| Auth admin backend | PASS | bcrypt, bearer token, role guard, locked account test |
| Password hash khong tra API | PASS | auth tests |
| Authorization header/token/password logging | PASS backend scope | Khong log request headers/body; integration redaction co test |
| SĐT trong technical logs | PASS integration/promotion logs | `promotion_checks` phone hash; integration phone masked |
| XSS | PASS basic | React escape test cho product name |
| SQL injection | PASS basic | Prisma parameterized + DTO validation |
| CSRF | N/A hien tai | Auth dung Bearer token, khong cookie session |
| Upload file | PASS improved | File size 5 MB + MIME/extension whitelist + service validation |
| CORS | PASS config | Theo `API_CORS_ORIGINS`; production khong dung wildcard |
| Admin portal auth | BLOCKED | UI mock auth/localStorage token demo, khong dung backend auth |

## 7. Migration, backup, rollback

| Hang muc | Ket qua | Ghi chu |
|---|---|---|
| Prisma schema validate | PASS | Pass khi co `DATABASE_URL` mau |
| Prisma client generate | PASS | `npm run db:generate` |
| Migration SQL | PASS static | Co schema/constraints/index/FK |
| Production migration flow | PASS docs | `prisma migrate deploy` service rieng |
| Apply migration local/staging | NOT VERIFIED | Chua co PostgreSQL/Docker trong shell |
| Backup daily | PASS docs/config static | Compose backup profile + runbook |
| Restore procedure | PASS docs | `BACKUP_RESTORE.md` |
| Rollback strategy | PASS docs | app rollback + DB restore condition |
| Docker runtime verification | NOT VERIFIED | Docker CLI khong co trong shell |

## 8. Blockers

1. **Admin portal chua san sang production**: dang dung mock auth va mock data, khong thao tac tren DB/backend that.
2. **Admin order backend APIs chua day du**: list/detail/status/export theo scope quan tri chua implement tren API.
3. **Real integrations chua san sang**: Pancake/Google Sheet/BEST thieu API docs, payload, auth, sandbox/credential; hien chi co mock/generic HTTP adapter.
4. **UAT/browser/device chua thuc hien**: chua test Chrome/Safari/Android/iPhone/Messenger/Facebook in-app browser.
5. **Staging/deploy/runtime chua verify**: chua chay Docker Compose, migration deploy, backup/restore, health checks tren moi truong co Docker/PostgreSQL.
6. **Business rules quan trong chua chot**: BR-08 den BR-20, dac biet khach khong eligible co mua gia thuong khong, usage limit, shipping fee, payment, inventory, source customer, integration scope.
7. **Quote snapshot in-memory**: can giai phap production neu chay multi-instance hoac can guarantee price-change confirmation qua restart.
8. **Production monitoring/alerting chua cau hinh that**: moi co runbook/checklist, chua co dashboard/alert channel.

## 9. Rui ro duoc chap nhan neu go staging/internal demo

- Khong OTP va cho phep chia se SĐT la quyet dinh kinh doanh da ghi trong BR-03/BR-04.
- Shipping fee dang dung env static.
- Partner integration dung mock/adapter generic cho den khi co docs.
- Browser E2E hien la E2E-style Node test, chua phai Playwright/device test.
- Admin portal chi dung demo/mock, khong dung de van hanh du lieu that.

## 10. Viec can chu du an thuc hien

- Chot BR-08 den BR-20, dac biet: khach khong eligible, usage limit, shipping fee, payment, inventory.
- Cung cap 9 san pham that: SKU, slug, ten, gia, anh, mo ta, active/promotion flag.
- Cung cap danh sach khach uu dai that va tieu chi eligible.
- Cung cap domain/hosting/staging server/DNS.
- Cung cap production secrets qua secret manager/GitHub secrets, khong qua source code.
- Cung cap API docs/credential/sandbox cho Pancake/Google Sheet/BEST neu trong MVP.
- To chuc UAT tren Chrome, Safari, Android, iPhone, Messenger/Facebook in-app browser.
- Xac nhan monitoring/alert channel va nguoi truc van hanh.

## 11. Checklist trien khai production

- [ ] CI pass tren commit release.
- [ ] Format/prettier duoc xu ly hoac chap nhan bo qua trong release policy.
- [ ] Docker CLI/runner san sang; `docker compose config` pass.
- [ ] Build Docker images API/web pass.
- [ ] Tao production PostgreSQL rieng, khong dung chung staging.
- [ ] Cau hinh `DATABASE_URL`, `API_AUTH_SECRET`, `POSTGRES_PASSWORD` bang secret manager.
- [ ] Cau hinh `API_CORS_ORIGINS` dung domain production.
- [ ] Cau hinh domain/DNS/HTTPS qua Caddy hoac infra tuong duong.
- [ ] Backup truoc migration.
- [ ] Chay `docker compose --profile migration run --rm migrate`.
- [ ] Start `api`, `worker`, `web`, `caddy`.
- [ ] Health check `api/live`, `api/ready`, `web/api/health`.
- [ ] Import khach uu dai that va sample-check.
- [ ] Seed/nhap san pham that va verify gia/trang thai.
- [ ] Smoke test buyer: phone check, catalog, cart, quote, create order.
- [ ] Smoke test admin real backend sau khi admin portal/API hoan thien.
- [ ] Smoke test integration real/sandbox theo scope.
- [ ] Backup/restore dry-run.
- [ ] Monitoring/alert active: API error rate, DB, worker, pending/failed integration jobs.
- [ ] Rollback owner va rollback command san sang.
- [ ] UAT sign-off cua chu du an.

## 12. Verification commands

| Lenh | Ket qua | Ghi chu |
|---|---|---|
| `npm run lint` | PASS | Tat ca workspaces |
| `npm run typecheck` | PASS | Tat ca workspaces |
| `npm test` | PASS | Chay ngoai sandbox de mock HTTP server bind localhost |
| `npm run build` | PASS | Co warning Next.js ve workspace root/lockfile va admin middleware deprecation |
| `npm run db:generate` | PASS | Prisma Client generated |
| `prisma validate` voi `DATABASE_URL` mau | PASS | Schema hop le |
| YAML parse compose/CI/CD | PASS | `docker-compose.yml`, `ci.yml`, `cd.yml` parse duoc |
| `git diff --check` | PASS | Khong co whitespace error |
| `docker compose config` | NOT RUN | Shell khong co Docker CLI |
| `format:check` | FAIL | 96 file chua dung Prettier; khong sua hang loat trong audit de tranh churn |
| Browser E2E Playwright | NOT RUN | Chua co Playwright/device matrix |
| K6 smoke | NOT RUN | Can API/DB local/staging dang chay |

## 13. Files changed during audit

- `apps/api/src/modules/promotions/promotions.controller.ts`: them file size limit va MIME/extension whitelist cho import.
- `documents/SECURITY_CHECKLIST.md`: cap nhat trang thai upload hardening.
- `documents/GO_LIVE_REPORT.md`: report nay.

## 14. Final decision

**BLOCKED for production Go-live.**

Dieu kien de chuyen sang **PASS WITH CONDITIONS**:

1. Admin portal noi backend API that hoac tam thoi loai admin portal khoi production scope bang approval ro rang.
2. Admin order APIs hoan thien neu van hanh don tren website.
3. Chot va cau hinh cac business rules anh huong checkout/pricing.
4. Chay thanh cong staging deploy bang Docker, migration, backup/restore va health checks.
5. UAT browser/device/in-app browser pass.
6. Partner integrations duoc test voi sandbox/real API theo scope, hoac co approval go-live voi manual export/mock integration.

Dieu kien de chuyen sang **PASS**:

- Toan bo blockers tren da dong, monitoring/alerting active, production rollback/backup da dry-run, va chu du an sign-off UAT.
