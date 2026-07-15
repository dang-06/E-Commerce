# Test Report

Ngay lap: 2026-07-15

Pham vi: vong kiem thu va hardening local cho monorepo Next.js/NestJS/PostgreSQL. Bao cao nay khong thay the UAT tren thiet bi that hoac kiem thu tich hop doi tac production.

## 1. Tong quan

| Nhom | Ket qua | Ghi chu |
|---|---|---|
| Functional | Pass voi automated tests hien co va hardening tests bo sung | Bao gom phone eligibility, pricing, cart, checkout, admin permission, integration retry |
| Security | Pass voi cac guard/test tu dong trong pham vi local | CSRF khong ap dung hien tai vi API dung Bearer token, khong dung cookie session |
| Reliability | Pass voi unit/integration tests local | Transaction rollback va worker concurrency da co test bang fake store/mock server |
| Performance | Smoke script da tao, chua chay trong shell nay | Can chay K6 khi API + DB local/staging san sang |
| Compatibility | Chua xac minh bang device/browser thật | Can UAT Chrome, Safari, Android, iPhone, Messenger/Facebook in-app browser |

## 2. Functional coverage

| Luong | Evidence | Trang thai |
|---|---|---|
| SĐT hop le/khong hop le/sai dinh dang | `apps/api/src/modules/promotions/promotions.service.test.ts` | Covered |
| Chuan hoa `+84`, `84`, `0` | `normalizes Vietnamese phone numbers` | Covered |
| Gia thuong/gia uu dai | `orders.service.test.ts`, `shop-components.test.tsx` | Covered |
| Gio hang va tong tien realtime | `apps/shop/test/components/shop-components.test.tsx`, `apps/shop/test/e2e/buyer-flow.test.ts` | Covered |
| Checkout quote va create order | `apps/api/src/modules/orders/orders.service.test.ts` | Covered |
| Backend khong tin gia frontend | ValidationPipe + order tests tampered totals | Covered |
| Quan tri login/role | `apps/api/src/modules/auth/auth.integration.test.ts`, `apps/admin-portal/test/admin-actions.test.ts` | Covered |
| Import khach uu dai | `promotions.service.test.ts` | Covered |
| Integration worker retry | `integration-worker.service.test.ts` | Covered |

## 3. Security hardening

| Hang muc | Ket qua | Ghi chu |
|---|---|---|
| Sua gia bang DevTools | Pass | DTO whitelist/forbid va backend tinh lai gia tu DB |
| Token gia/bi sua/het han | Pass | Bo sung token het han co chu ky hop le |
| Spam API check uu dai | Pass | Rate limit theo IP hash va phone hash co test |
| SQL injection | Low risk theo implementation | Prisma parameterized query; validation DTO va phone normalizer chan input sai dinh dang |
| XSS | Pass cho UI render san pham | React escape; bo sung test khong render raw `<script>` |
| CSRF | Not applicable hien tai | Auth API dung Bearer token, khong dung HTTP-only cookie session |
| Upload file khong hop le | Pass | Bo sung test reject extension khong ho tro |
| Broken access control | Pass trong test hien co | Auth guard/role guard/admin action test |
| Lo SĐT/secret trong log | Pass trong integration utils test | Phone/token/authorization/api key bi redact |

## 4. Reliability

| Hang muc | Ket qua | Ghi chu |
|---|---|---|
| Don trung | Pass | Idempotency key unique va test duplicate request |
| Transaction rollback | Pass | Fake transaction test rollback khi integration log fail |
| Worker dong thoi | Pass | Mock concurrency test chi xu ly job mot lan |
| Pancake/Google Sheet loi | Pass voi mock adapter | Chua co API production/sandbox da xac nhan |
| Doi tac da tao don nhung client mat response | Pass voi mock 409 already exists | Phu thuoc doi tac co external id/idempotency thuc te |

## 5. Performance

Da tao smoke script:

```bash
k6 run tools/k6/public-smoke.js
BASE_URL=http://localhost:4000/api/v1 TEST_PROMOTION_PHONE=0901234567 k6 run tools/k6/public-smoke.js
```

Nguong mac dinh:

- `http_req_failed < 5%`
- `p95 http_req_duration < 500ms`
- 1 VU trong 30 giay cho `/products` va `/promotions/check`

Chua chay K6 trong shell nay neu CLI K6 hoac API/DB local chua san sang. Can chay lai tren staging voi dataset gan thuc te.

## 6. Compatibility

Chua the ket luan pass neu chua kiem thu tren thiet bi/trinh duyet that:

- Chrome desktop/mobile.
- Safari desktop/iOS.
- Android Chrome.
- iPhone Safari.
- Messenger/Facebook in-app browser.

Can UAT mobile-first voi network throttling 4G va phone gate tu link Facebook/Messenger.

## 7. Rui ro con lai

- Phi van chuyen, thanh toan, ton kho va usage limit uu dai van chua duoc chot nen test theo gia tri cau hinh hien tai, khong khang dinh dung nghiep vu cuoi.
- Pancake/Google Sheet/BEST Express chua co endpoint/payload/auth/sandbox duoc xac nhan; integration hien dang dung interface/mock/HTTP adapter generic.
- Admin portal hien la UI portal va mock service cho nhieu man hinh quan tri; can noi API admin that cho orders/report/status neu nam trong scope production.
- Chua co browser/device test thuc te trong moi truong nay.
- Docker/K6/DB migration phu thuoc toolchain local/staging; can chay lai trong CI/staging co Docker, PostgreSQL va K6.

## 8. Noi dung can khach hang chap nhan

- Chap nhan phone gate truoc catalog va thong bao trung tinh cho SĐT khong hop le.
- Chap nhan khong OTP cho SĐT uu dai hoac yeu cau them OTP/CAPTCHA/usage limit.
- Xac nhan phi ship, phuong thuc thanh toan, ton kho va rule usage limit.
- Cung cap sample file/API docs/credential/sandbox cho Pancake, Google Sheet va BEST Express neu thuoc MVP.
- Xac nhan UAT tren Chrome/Safari/Android/iPhone/Messenger/Facebook in-app browser.

## 9. Verification commands

| Lenh | Ket qua | Ghi chu |
|---|---|---|
| `npm run lint` | Pass | Tat ca workspaces |
| `npm run typecheck` | Pass | Tat ca workspaces |
| `npm test` | Pass | Chay lai ngoai sandbox de mock HTTP server co the bind `127.0.0.1` |
| `npm run build` | Pass | Co warning Next.js workspace root/lockfile va middleware deprecation |
| `docker compose config` | Not run | Shell hien tai khong co Docker CLI: `command not found: docker` |
| `k6 run tools/k6/public-smoke.js` | Not run | K6 CLI co san, nhung API/DB local/staging chua duoc start trong vong nay |
