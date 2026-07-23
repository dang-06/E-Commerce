# IMPLEMENTATION PLAN - WEBSITE BAN HANG UU DAI THEO SO DIEN THOAI

> Nguon yeu cau: `documents/phan-tich-yeu-cau-website-ban-hang.md`  
> Ngay lap ke hoach: 14/07/2026  
> Pham vi buoc nay: phan tich, lap ke hoach, chua trien khai code  
> Luu y: khong tu gia dinh cac noi dung duoc danh dau `CẦN XÁC NHẬN`

---

## 1. Audit repository hien tai

### 1.1. Ket qua kiem tra

- Repository hien tai chi co thu muc `documents/`.
- Khong tim thay `AGENTS.md` hoac file huong dan tuong duong trong workspace.
- Khong co `package.json`, workspace config, lockfile, source code frontend/backend.
- Khong co Dockerfile, Docker Compose, database migration, Prisma/ORM schema.
- Khong co CI/CD config.
- `git status` khong chay duoc vi thu muc hien tai chua phai Git repository.

### 1.2. He qua lap ke hoach

- Du an nen duoc khoi tao moi theo monorepo Next.js + NestJS + PostgreSQL.
- Chua co ORM san co trong repository; de xuat chon Prisma vi phu hop TypeScript, migration ro rang, DX tot cho greenfield MVP.
- Can khoi tao Git repository truoc khi trien khai de tranh mat lich su thay doi.

---

## 2. Tom tat muc tieu va pham vi MVP

### 2.1. Muc tieu san pham

Xay dung website ban hang rieng cho shop dang ban qua Fanpage/Messenger, cho phep khach nhap so dien thoai de kiem tra uu dai, tu chon san pham, dat hang, dong thoi giup admin quan ly san pham, danh sach khach uu dai, don hang va trang thai dong bo sang he thong ben thu ba.

### 2.2. Pham vi MVP da xac dinh

#### Website nguoi mua

- Truy cap tu Messenger/quang cao/link truc tiep.
- Nhap so dien thoai truoc khi vao gian hang theo luong hien tai.
- Kiem tra du/khong du dieu kien nhan uu dau qua google sheet (list uu dai).
- Nhan ket qua du/khong du dieu kien uu dai.
- Xem danh sach san pham voi gia niem yet hoac gia uu dai.
- Xem gia goc, so tien giam, phi van chuyen, tong thanh toan.
- Them/sua/xoa san pham trong gio hang.
- Nhap thong tin nguoi nhan.
- Tao don hang va nhan ma don.

#### Trang quan tri

- Dang nhap/dang xuat admin.
- Quan ly san pham: SKU, ten, mo ta, hinh anh, gia, trang thai.
- Import danh sach so dien thoai uu dai tu CSV/Excel.
- Tim kiem, kich hoat, vo hieu hoa khach uu dai.
- Xem danh sach/chi tiet don hang.
- Cap nhat trang thai don hang.
- Xem trang thai dong bo Google Sheet/Pancake.
- Retry dong bo that bai.
- Xuat bao cao don hang co ban.

#### Backend

- Chuan hoa va validate so dien thoai.
- Kiem tra dieu kien uu dai.
- Phat hanh promotion token co chu ky va thoi han.
- Cung cap danh sach san pham va gia phu hop.
- Tinh lai gia chinh thuc khi quote/tao don.
- Kiem tra san pham, so luong, ton kho neu ap dung.
- Chong sua gia va tao don trung.
- Luu don bang database transaction.
- Tao integration job trong cung transaction.
- Worker dong bo ben thu ba va retry khi loi.
- Ghi audit/integration log.

### 2.3. Ngoai pham vi MVP mac dinh

Chi trien khai khi duoc bo sung va xac nhan: tai khoan nguoi mua, tich diem, nhieu voucher/chuong trinh uu dai dong thoi, thanh toan online, kho nang cao, tu dong tao/theo doi van don BEST Express, dong bo hai chieu Pancake, SMS/Zalo/email automation, dashboard nang cao, mobile app.

---

## 3. Business rule da chot

| Ma | Noi dung |
|---|---|
| BR-01 | Khach nhap so dien thoai truoc khi vao gian hang. |
| BR-02 | API chi tra ket qua du/khong du dieu kien va token can thiet. |
| BR-03 | Khong yeu cau OTP hoac xac minh chu so dien thoai. |
| BR-04 | Nguoi mua duoc su dung SĐT khach cu do nguoi khac chia se. |
| BR-05 | SĐT nguoi nhan co the khac SĐT mo uu dai. |
| BR-06 | Muc giam la 25.000 VND tren moi don vi san pham hop le. |
| BR-07 | Backend quyet dinh gia cuoi cung. |

### 3.1. Nguyen tac ky thuat bat buoc

- Khong dung gia hoac tong tien frontend gui len lam du lieu chinh thuc.
- Database la nguon du lieu chinh cho san pham va don hang.
- Don hang phai luu thanh cong truoc khi dong bo sang he thong ben thu ba.
- Neu Google Sheet, Pancake hoac BEST Express loi, khong duoc lam mat don hang da tao.
- Moi thay doi lien quan den gia, uu dai, phi van chuyen, thanh toan hoac gioi han su dung phai duoc xac nhan truoc khi trien khai.
- MVP co the don gian nhung thiet ke du lieu phai cho phep mo rong.
- Khong tra ve ten, dia chi, lich su don hoac danh sach khach hang trong API kiem tra uu dai.
- Dong bo ben thu ba bat buoc theo luong: luu `orders` + `order_items` + `integration_job` trong transaction, commit, worker moi gui sang ben thu ba, ghi ket qua va retry khi that bai.

---

## 4. Toan bo noi dung CẦN XÁC NHẬN

### 4.1. Theo doi tuong/tich hop

- Pancake tiep nhan/van hanh don qua API.
- Google Sheet dung de import, export hoac doi soat.
- BEST Express la he thong van chuyen hay nguon khach cu, tich hop API hay thao tac thu cong.

### 4.2. Business rule

| Ma | Noi dung can xac nhan |
|---|---|
| BR-08 | Khach khong hop le co duoc tiep tuc mua gia thuong khong. |
| BR-09 | Dieu kien uu dai la tung mua hay bat buoc da giao thanh cong. |
| BR-10 | Nguon danh sach khach cu. |
| BR-11 | Mot SĐT duoc su dung uu dai bao nhieu lan. |
| BR-12 | Co gioi han so san pham duoc giam trong mot don khong. |
| BR-13 | Tat ca hay chi mot so san pham duoc tham gia uu dai. |
| BR-14 | Phi van chuyen co dinh hay theo dia chi. |
| BR-15 | Co cong don voi chuong trinh khac khong. |
| BR-16 | Xu ly san pham co gia nho hon 25.000 VND. |
| BR-19 | Don huy co hoan lai luot uu dai khong. |
| BR-20 | Chuong trinh co ngay bat dau/ket thuc khong. |

### 4.3. API va UX

- API tra cuu don `/api/v1/orders/:code` dung ma bao mat hay so dien thoai.
- Phone gate: bat buoc nhap SĐT truoc khi xem san pham hay cho xem san pham cong khai va chi nhap SĐT de mo gia uu dai.
- Khach co can tra cuu don khong.
- Yeu cau SEO.

### 4.4. Cau hoi truoc phat trien

1. Danh sach khach uu dai lay tu Google Sheet, Pancake, BEST Express hay Excel?
2. Tieu chi hop le la tung mua hang hay bat buoc don da giao thanh cong?
3. Danh sach duoc import thu cong hay dong bo tu dong?
4. Mot SĐT duoc su dung uu dai bao nhieu lan?
5. Mua ba san pham giong nhau co duoc giam 75.000 VND khong?
6. Tat ca san pham deu giam hay admin chon san pham tham gia?
7. Co gioi han so luong duoc giam tren mot don khong?
8. Khach khong du dieu kien co duoc mua voi gia thuong khong?
9. Phi van chuyen co dinh hay tinh theo dia chi?
10. Website, Pancake hay he thong nao la noi quan ly don chinh?
11. Chi gui don sang Pancake hay phai tu tao van don BEST Express?
12. Thanh toan bang COD, chuyen khoan hay thanh toan online?
13. Co quan ly ton kho khong?
14. Co bat buoc nhap SĐT truoc khi xem san pham khong?
15. Da co logo, mau sac, hinh anh va mo ta san pham chua?
16. Co website tham khao khong?
17. Can nhung trang noi dung nao: gioi thieu, lien he, giao hang, doi tra, bao mat?
18. Co can Facebook Pixel, Google Analytics hoac TikTok Pixel khong?
19. Co yeu cau SEO khong?
20. Co bao nhieu tai khoan quan tri va can phan quyen the nao?
21. Don hang co nhung trang thai nao?
22. Co can gui SMS, Zalo hoac email xac nhan don khong?
23. Khach co can tra cuu don khong?
24. Can nhung bao cao nao?
25. Da co domain va hosting chua?
26. Du kien so luot truy cap va so don moi ngay?
27. Pham vi bao hanh va ho tro van hanh?
28. Thoi gian mong muon Go-live?

### 4.5. Trang thai quyet dinh chua xac nhan

- Nguon khach du dieu kien.
- Gioi han su dung uu dai.
- Phi van chuyen.
- Thanh toan.
- Ton kho.
- Tich hop Pancake chi tiet.
- Tich hop Google Sheet chi tiet.
- Tich hop BEST Express.
- UX phone gate va SEO.
- Domain/hosting.

---

## 5. Noi dung bat buoc xac nhan truoc khi code

Nhung noi dung duoi day anh huong truc tiep den database schema, API contract, pricing engine, checkout va integration. Khong nen code truoc khi co cau tra loi:

1. Nguon danh sach khach uu dai va co import thu cong hay dong bo tu dong.
2. Tieu chi khach hop le: tung mua hay da giao thanh cong.
3. Gioi han su dung uu dai moi SĐT, bao gom don huy co hoan luot hay khong.
4. Gioi han so san pham/so luong duoc giam trong mot don.
5. San pham nao tham gia uu dai: tat ca hay admin chon.
6. Xu ly san pham co gia nho hon 25.000 VND.
7. Khach khong hop le co duoc mua gia thuong khong.
8. Phi van chuyen: co dinh, theo dia chi, hay nhap thu cong.
9. Phuong thuc thanh toan trong MVP: COD, chuyen khoan, online.
10. Co quan ly ton kho trong MVP khong.
11. He thong nao la nguon quan ly don chinh: website hay Pancake.
12. Pham vi tich hop: Google Sheet, Pancake, BEST Express; mot chieu hay co tao van don.
13. Trang thai don hang chinh thuc.
14. Phone gate va yeu cau SEO.
15. Domain/hosting va moi truong deploy.

Co the chuan bi skeleton repo, Docker local, lint/test/build pipeline sau khi chot stack; tuy nhien cac module business khong nen trien khai khi cac diem tren chua ro.

---

## 6. Kien truc de xuat

### 6.1. Stack

- Monorepo: pnpm workspace.
- Frontend: Next.js App Router + TypeScript.
- UI: Tailwind CSS + component primitives co the dung shadcn/ui neu can toc do MVP.
- Backend API: NestJS + TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- Worker: NestJS worker app dung chung domain modules va Prisma.
- Queue MVP: bang `integration_logs`/`integration_jobs` trong PostgreSQL voi polling worker va `FOR UPDATE SKIP LOCKED` hoac Prisma transaction tuong duong. Chi them Redis/BullMQ khi can scale queue/rate limit phan tan.
- API docs: Swagger/OpenAPI tu NestJS.
- Docker: Docker Compose cho local, Dockerfile rieng cho web/api/worker.
- Reverse proxy production: Nginx/Caddy hoac platform ingress.
- CI/CD: GitHub Actions lint, typecheck, test, build, migration dry-run.

### 6.2. Thanh phan chinh

| Thanh phan | Trach nhiem |
|---|---|
| `apps/web` | Website nguoi mua va admin UI. |
| `apps/api` | REST API, auth, promotion, pricing, order, admin, integration control. |
| `apps/worker` | Retry/dong bo Google Sheet, Pancake, BEST Express theo job. |
| `packages/database` | Prisma schema, migrations, seed, database client. |
| `packages/shared` | DTO/schema chung, type, constant, phone normalization helper neu can share. |
| PostgreSQL | Nguon du lieu chinh. |
| Object storage | Luu anh san pham khi co cau hinh. MVP co the dung image URL neu chua chot upload. |

### 6.3. Domain modules backend

- `AuthModule`: admin login, JWT/session, role guard.
- `AdminsModule`: tai khoan admin/operator.
- `ProductsModule`: product catalog, status, SKU, pricing metadata.
- `EligibleCustomersModule`: import CSV/Excel, phone hash, active/inactive, usage policy.
- `PromotionsModule`: phone check, token signing, promotion checks log.
- `PricingModule`: quote va tinh gia chinh thuc, khong tin frontend price.
- `OrdersModule`: checkout, idempotency, transaction, order code, status.
- `IntegrationsModule`: integration jobs/logs, retry, external ID.
- `ReportsModule`: export don hang co ban.
- `AuditModule`: audit log cho admin action va su kien nhay cam.

### 6.4. Data model MVP

Bat dau tu cac bang trong tai lieu yeu cau:

- `admins`
- `eligible_customers`
- `products`
- `orders`
- `order_items`
- `promotion_checks`
- `integration_logs` hoac tach thanh `integration_jobs` + `integration_logs` neu can phan biet queue state va history

De xuat bo sung khi thiet ke chi tiet:

- `audit_logs`: hanh dong admin, thay doi san pham, don hang, retry integration.
- `settings`: cau hinh phi ship, promotion window, token TTL, neu cac rule duoc chot can config runtime.
- `product_images`: neu can nhieu anh moi san pham.

### 6.5. Bao mat va tinh dung dung

- Password hash bang Argon2 hoac bcrypt.
- Admin API bat buoc auth + role guard.
- Rate limit promotion check va login.
- Hash SĐT cho log/lookup an toan; chi luu SĐT normalized khi co nhu cau nghiep vu ro rang.
- Promotion token co `jti`, `exp`, chu ky server-side.
- Idempotency key unique tren order create.
- DB transaction khi tao order + items + integration jobs.
- Khong log request/response chua du lieu nhay cam khi tich hop.

---

## 7. Cau truc monorepo de xuat

```text
.
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── docker-compose.yml
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── worker.Dockerfile
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   └── lib/
│   │   └── package.json
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── common/
│   │   │   └── main.ts
│   │   └── package.json
│   └── worker/
│       ├── src/
│       └── package.json
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   ├── shared/
│   │   └── src/
│   ├── eslint-config/
│   └── tsconfig/
├── documents/
│   ├── phan-tich-yeu-cau-website-ban-hang.md
│   └── IMPLEMENTATION_PLAN.md
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 8. Milestone, module va checklist task

### Milestone 0 - Requirement confirmation

- [ ] Xac nhan toan bo noi dung bat buoc truoc khi code o muc 5.
- [ ] Chot luong phone gate/SEO.
- [ ] Chot trang thai don hang.
- [ ] Chot danh sach 9 san pham, gia, hinh anh, mo ta.
- [ ] Chot source khach uu dai va format import.
- [ ] Chot pham vi tich hop Google Sheet/Pancake/BEST.
- [ ] Chot domain, hosting, moi truong staging/production.

### Milestone 1 - Foundation

- [ ] Khoi tao Git repository.
- [x] Them `AGENTS.md`/huong dan development.
- [x] Khoi tao npm workspaces monorepo.
- [x] Khoi tao Next.js app.
- [x] Khoi tao NestJS API app.
- [ ] Khoi tao NestJS worker app. Defer: buoc trien khai nen tang hien tai chi yeu cau web/API.
- [x] Cau hinh TypeScript strict, ESLint, Prettier.
- [x] Cau hinh env schema va `.env.example`.
- [x] Cau hinh Docker Compose cho PostgreSQL, web, api.
- [x] Cau hinh GitHub Actions CI.
- [x] Them README local setup.

### Milestone 2 - Database va core backend

- [x] Tao Prisma schema baseline, chua tao bang nghiep vu khi cac muc `CẦN XÁC NHẬN` chua duoc chot.
- [x] Tao Prisma schema cho `admins`.
- [x] Tao Prisma schema cho `eligible_customers`.
- [x] Tao Prisma schema cho `products`.
- [x] Tao Prisma schema cho `orders`.
- [x] Tao Prisma schema cho `order_items`.
- [x] Tao Prisma schema cho `promotion_checks`.
- [x] Tao Prisma schema cho integration job/log.
- [x] Bo sung `product_images`, `promotion_rules`, `audit_logs`, `integration_jobs` de ho tro anh nhieu, cau hinh rule, audit va queue retry rieng voi log lich su.
- [x] Tao migration dau tien cho schema nghiep vu. Chua apply duoc local vi moi truong hien tai khong co PostgreSQL/Docker.
- [x] Tao seed admin/operator, promotion rule mac dinh va san pham mau cho development. Chua chay duoc local vi PostgreSQL chua san sang.
- [x] Tao Prisma service/module dung chung.

### Milestone 3 - Admin auth va product management

- [x] Implement admin login.
- [x] Implement password hash bcrypt va access token Bearer.
- [x] Implement auth guard va role guard admin/operator.
- [x] Implement endpoint `GET /api/v1/admin/auth/me` khong tra password hash.
- [x] Test login dung/sai, tai khoan locked, unauthenticated, admin/operator role va current user endpoint.
- [x] API danh sach san pham.
- [x] API tao san pham.
- [x] API sua san pham.
- [x] API an/hien san pham.
- [x] API xoa mem san pham.
- [x] Admin UI login.
- [x] Admin UI product list/form/status.
- [ ] Audit log thay doi san pham.

### Milestone 4 - Eligible customers va promotion

- [x] Implement phone normalization.
- [x] Implement phone hash.
- [x] API import CSV/Excel danh sach khach uu dai.
- [x] API tim kiem/kich hoat/vo hieu hoa khach uu dai.
- [x] API public `POST /api/v1/promotions/check`.
- [x] Promotion token co chu ky, TTL, `jti`.
- [x] Ghi `promotion_checks` khong lo du lieu nhay cam.
- [x] Rate limit promotion check.
- [x] Thiet ke diem mo rong CAPTCHA qua `captchaToken`, chua bat mac dinh.
- [x] UI phone entry/result.

### Milestone 5 - Shopping va pricing

- [x] API public `GET /api/v1/products`.
- [x] API public `GET /api/v1/products/:slug`.
- [x] Pricing service tinh gia tu database.
- [x] API `POST /api/v1/orders/quote`.
- [x] UI danh sach san pham mobile-first trong `apps/shop`.
- [x] UI product detail neu nam trong MVP.
- [x] UI cart add/update/remove.
- [x] UI hien thi subtotal, discount, shipping fee, total.
- [x] Xu ly gia thay doi/san pham bi an theo rule da chot.

### Milestone 6 - Checkout va order

- [x] DTO validation checkout.
- [x] Idempotency key flow.
- [x] Order code generation.
- [x] Tao order transaction: order + items + integration jobs.
- [x] Kiem tra promotion token va dieu kien SĐT khi tao don.
- [x] Kiem tra product active va so luong.
- [x] Kiem tra ton kho khi `stockQuantity` duoc cau hinh; khong tru/giu ton kho.
- [x] Khong cho frontend price anh huong gia chinh thuc.
- [x] UI checkout form.
- [x] UI order success voi ma don.
- [ ] API/UX tra cuu don neu duoc xac nhan.

### Milestone 7 - Admin order operations

- [ ] API admin order list voi filter/search.
- [ ] API admin order detail.
- [ ] API cap nhat trang thai don.
- [x] Admin UI order list.
- [x] Admin UI order detail.
- [x] Admin UI update status.
- [x] Export bao cao don hang co ban.
- [ ] Audit log cap nhat don hang.

### Milestone 8 - Integrations va worker

- [x] Thiet ke adapter interface cho Google Sheet/Pancake/BEST.
- [x] Worker lay pending job va khoa tranh xu ly trung.
- [x] Retry backoff va `next_retry_at`.
- [x] Luu external ID/status/response da mask.
- [x] API admin xem integration status.
- [x] API admin retry manual.
- [x] Admin UI integration status/retry.
- [ ] Implement Google Sheet adapter theo thong tin da xac nhan.
- [ ] Implement Pancake adapter theo thong tin da xac nhan.
- [ ] Implement BEST adapter neu nam trong MVP da xac nhan.

### Milestone 9 - QA, hardening, go-live

- [ ] Test responsive Chrome/Safari/Android/iPhone.
- [ ] Test Messenger/Facebook in-app browser.
- [x] Test rate limit va validation.
- [x] Test chong sua gia DevTools bang backend validation/price recompute.
- [x] Test idempotency tao don trung.
- [x] Test integration timeout/error/retry.
- [x] Tao security checklist va test report.
- [x] Bo sung hardening tests cho token het han, import file sai dinh dang, log redaction va XSS escape UI.
- [x] Tao K6 smoke script cho public APIs.
- [ ] Cau hinh monitoring/logging co request ID.
- [ ] Backup database.
- [ ] Staging deployment.
- [ ] UAT voi khach hang.
- [ ] Production deployment.
- [ ] Huong dan admin/van hanh.

---

## 9. Dependency va thu tu trien khai

### 9.1. Dependency nghiep vu

- Promotion va pricing phu thuoc vao rule khach hop le, gioi han su dung, san pham tham gia, phi ship.
- Checkout phu thuoc vao payment method, ton kho, order status, idempotency policy.
- Integration phu thuoc vao viec chot he thong quan ly don chinh va API/credential/map field.
- Admin order operations phu thuoc vao trang thai don chinh thuc.
- UI/SEO phu thuoc vao phone gate va noi dung/brand.

### 9.2. Dependency ky thuat

- Database schema phai co truoc API core.
- Prisma migration phai co truoc seed va repository/service.
- Auth guard phai co truoc admin product/order APIs.
- Pricing service phai co truoc quote va checkout.
- Order transaction phai co truoc worker integration.
- Integration job table phai co truoc retry UI/API.
- CI va Docker nen co tu som de moi milestone co the verify.

### 9.3. Thu tu de xuat

1. Chot requirement bat buoc.
2. Foundation monorepo + Docker + CI.
3. Database schema + migration.
4. Auth admin + product management.
5. Eligible customers + promotion check.
6. Public product + cart/pricing/quote.
7. Checkout/order transaction.
8. Admin order operations.
9. Worker/integration/retry.
10. QA/UAT/go-live.

---

## 10. Chien luoc test

### 10.1. Unit test

- Phone normalization: `+84`, `84`, `0`, sai dinh dang.
- Pricing service: gia goc, discount 25.000 VND, gioi han uu dai theo rule da chot, gia nho hon discount theo rule da chot.
- Promotion token: hop le, het han, gia mao, sai chu ky.
- Idempotency/order code helpers.
- Retry backoff.

### 10.2. Integration test backend

- Promotion check voi khach hop le/khong hop le/inactive.
- Product API chi tra san pham active.
- Quote khong tin price frontend.
- Create order transaction tao dung order/items/jobs.
- Duplicate idempotency key chi tao mot order.
- Product bi an/gia doi trong luc checkout.
- Admin auth/authorization.
- Integration job retry va manual retry.

### 10.3. E2E test

- Luong nguoi mua: nhap SĐT, xem gia, them gio, checkout, nhan ma don.
- Luong khach khong hop le theo rule da xac nhan.
- Luong admin: login, tao/sua/an san pham, xem/cap nhat don.
- Luong import khach uu dai.
- Luong integration loi -> retry -> success.

### 10.4. Frontend/UI test

- Component test cho cart, price summary, checkout form.
- Playwright cho mobile viewport, desktop viewport, Messenger/Facebook in-app browser neu co thiet bi/test matrix.
- Accessibility smoke test cho form, button, error state.

### 10.5. Non-functional/security test

- Rate limit promotion check va login.
- DevTools price tampering.
- Payload co field la/field vuot do dai.
- XSS trong ten, dia chi, note.
- Khong log SĐT ro trong promotion log va integration log.
- Load smoke cho API check SĐT va create order.

---

## 11. Rui ro ky thuat va nghiep vu

### 11.1. Rui ro nghiep vu

| Rui ro | Tac dong | Giam thieu |
|---|---|---|
| Chua chot rule su dung uu dai | Sai pricing, sai schema, phai sua lai order logic | Chot BR-08 den BR-20 truoc khi code business. |
| Chua ro nguon khach cu | Import/dong bo sai, khong doi soat duoc | Lay sample file/API docs tu Google Sheet/Pancake/BEST. |
| Khong OTP nhung cho dung SĐT chia se | Uu dai co the bi dung boi nguoi khong phai chu SĐT | Chap nhan la quyet dinh kinh doanh, them rate limit va usage limit neu duoc chot. |
| Phone gate anh huong SEO/chuyen doi | Giam index va tang bounce rate | Chot phone gate vs public catalog truoc UI. |
| Tich hop Pancake/BEST thieu tai lieu | Tre milestone integration | Mock adapter va chi implement khi co credential/docs/sandbox. |
| Phi ship/thanh toan chua ro | Sai tong thanh toan va thong tin don | Chot phi ship/payment truoc checkout. |

### 11.2. Rui ro ky thuat

| Rui ro | Tac dong | Giam thieu |
|---|---|---|
| Greenfield chua co Git/source | De mat thay doi, kho review | Khoi tao Git va CI tu Milestone 1. |
| Worker xu ly trung job | Don bi dong bo lap | DB lock, status transition, idempotency voi external adapter neu ho tro. |
| Gia thay doi khi khach dang checkout | Khach thay doi ky vong tong tien | Backend quote lai va tra loi can xac nhan gia moi theo rule duoc chot. |
| Log lo PII | Rui ro bao mat/van hanh | Mask/hash phone, redact integration payload. |
| Excel/CSV import loi format | Du lieu khach sai/duplicate | Validate, preview, report loi tung dong, transaction import. |
| Database migration sai tren production | Downtime/mat du lieu | Migration review, backup, staging dry-run. |
| Khong co monitoring queue | Mat dong bo ma khong phat hien | Dashboard/log/canh bao pending/failed jobs. |

---

## 12. Definition of Ready va Done

### 12.1. Ready

- [ ] Co mo ta muc tieu.
- [ ] Co business rule lien quan.
- [ ] Khong con `CẦN XÁC NHẬN` anh huong den task.
- [ ] Co acceptance criteria.
- [ ] Co dependency ro rang.
- [ ] Co thiet ke UI hoac mo ta giao dien neu task co UI.
- [ ] Co API contract neu task co frontend/backend boundary.

### 12.2. Done

- [ ] Dung acceptance criteria.
- [ ] Pass lint.
- [ ] Pass typecheck.
- [ ] Pass unit/integration test lien quan.
- [ ] Pass build.
- [ ] Da review validation va phan quyen.
- [ ] Khong lam lo du lieu nhay cam.
- [ ] Co migration khi thay doi database.
- [ ] Da test responsive voi UI.
- [ ] Da cap nhat OpenAPI/docs khi thay doi API.
- [ ] Da deploy staging neu task can UAT.

---

## 13. Checklist tong hop theo module

| Module | Trang thai | Checklist |
|---|---|---|
| Requirement confirmation | Not started | [ ] Chot rule bat buoc [ ] Chot integration [ ] Chot hosting |
| Monorepo foundation | In progress | [ ] Git [x] npm workspaces [x] Next [x] Nest API [ ] Worker deferred [x] CI [x] Docker |
| Database | In progress | [x] Prisma baseline [x] Migration baseline [x] Business schemas [x] Seed [ ] Backup plan |
| Auth/Admin | In progress | [x] Login [x] Current user [x] Role guard [x] Auth tests [x] Admin UI shell |
| Products | In progress | [x] CRUD [x] Status [x] Images [x] Public catalog [x] Admin UI |
| Site settings | In progress | [x] Homepage banner text/image API [x] Admin settings form [x] Public shop rendering |
| Eligible customers | In progress | [x] Import CSV/Excel [x] Phone hash [x] Activate/deactivate [x] Masked list |
| Promotions | In progress | [x] Check API [x] Token [x] Rate limit [x] Logs [ ] UI |
| Pricing/Cart | In progress | [x] Quote [x] Cart UI [x] Price summary [x] Price-change handling |
| Checkout/Orders | In progress | [x] Validation [x] Transaction [x] Idempotency [x] Order success [ ] Public order lookup pending confirmation |
| Admin orders | In progress | [x] UI list [x] UI detail [x] UI status update [x] UI export [x] API list/detail/status |
| Integrations | In progress | [x] UI job/log status [x] UI retry action [x] Worker [x] Retry backend [x] Mock/HTTP adapter interface [ ] Real partner adapters pending confirmed docs |
| QA/Release | In progress | [x] Automated tests [x] Security checklist [x] Test report [x] Swagger/OpenAPI docs [ ] Browser device matrix [ ] UAT [ ] Monitoring [ ] Production deploy |

---

## 14. Verification log

### 2026-07-21 - Swagger/OpenAPI API docs

- [x] Swagger UI enabled at `/api/v1/docs` when `API_SWAGGER_ENABLED=true`.
- [x] Added request examples and response schemas for public shop APIs, admin auth, products, eligible customers, orders, integrations, audit logs, and health checks.
- [x] API typecheck, API lint, and full workspace build pass with Node.js 24.
- [x] Full workspace lint passes after removing unused homepage variables in `apps/shop/app/page.tsx`.

### 2026-07-23 - Homepage banner settings

- [x] Added persisted `site_settings` config for homepage banner text and image URL.
- [x] Added public API for shop rendering and admin API for editing banner settings.
- [x] Added admin settings form with image upload/URL and banner text controls.
- [x] Workspace typecheck, lint, and build pass with Node.js 24.

### 2026-07-15 - Database schema va admin auth

- [x] Prisma schema hop le voi `DATABASE_URL` PostgreSQL mau.
- [x] Prisma Client generate thanh cong.
- [x] API/database/contracts lint thanh cong.
- [x] API/database/contracts typecheck thanh cong.
- [x] API/database/contracts test thanh cong; auth test bao gom login dung/sai, tai khoan locked, unauthenticated, admin/operator role va current user endpoint.
- [x] API/database/contracts build thanh cong.
- [ ] Root lint/typecheck/format/build dang bi chan boi `apps/shop` va `apps/admin-portal` moi them; day la UI prototype chua duoc chuan hoa theo ESLint/Prettier/TypeScript strict cua monorepo.
- [ ] Migration/seed chua apply duoc local vi chua co PostgreSQL tai `localhost:5432` va shell hien tai khong co Docker CLI.

### 2026-07-15 - Products va Promotions backend

- [x] Products public API: `GET /api/v1/products`, `GET /api/v1/products/:slug`, chi tra active va chua xoa mem, sap xep theo `sortOrder`.
- [x] Products admin API: list, create, update, an/hien, xoa mem; validate SKU, slug, gia VND integer, anh va status.
- [x] Promotions phone normalization cho SĐT Viet Nam va phone hash bang HMAC.
- [x] `POST /api/v1/promotions/check` chi tra `eligible`, `promotionToken`, `expiresAt`; khong tra thong tin khach cu.
- [x] Promotion token co chu ky, TTL, `jti`, phone hash va promotion rule/version.
- [x] Ghi `promotion_checks` bang phone hash va IP hash, khong ghi SĐT ro trong log ky thuat.
- [x] Rate limit promotion check theo IP hash va phone hash.
- [x] Admin eligible customers: import CSV/XLS/XLSX, masked list, kich hoat/vo hieu hoa, bao cao success/updated/invalid/duplicate.
- [x] API/database/contracts lint, typecheck, test va build thanh cong cho pham vi backend/packages.
- [x] Root `npm test` thanh cong.
- [ ] Root lint/typecheck/build van bi chan boi `apps/shop` va `apps/admin-portal` prototype chua duoc chuan hoa.
- [ ] Migration/seed chua apply duoc local vi PostgreSQL `localhost:5432` chua chay; Docker CLI khong co trong shell.

### 2026-07-15 - Buyer shop UI

- [x] `apps/shop` mobile-first buyer flow: gioi thieu chuong trinh, nhap SĐT, trang thai check uu dai, catalog, product detail, cart, receiver form, confirm order, success.
- [x] Khach phai check SĐT truoc khi vao catalog; SĐT khong eligible duoc xu ly bang thong bao trung tinh, khong lo thong tin ca nhan.
- [x] Catalog lay tu API `/api/v1/products`, khong hard-code san pham/gia trong frontend.
- [x] Gia uu dai hien listed price gach ngang, final price va saving khi co promotion session hop le.
- [x] Cart localStorage co sanitize, ho tro nhieu san pham/nhieu so luong va tinh tong realtime.
- [x] Checkout form co validation label/focus/error state va summary tong gia goc, tong giam, phi ship, tong thanh toan.
- [x] Promotion token chi duoc gui di theo order payload; UI ghi ro gia hien thi la tam tinh, backend tinh lai gia chinh thuc.
- [x] Component test va E2E-style flow test cho buyer journey chinh.
- [x] `apps/shop` lint, typecheck, test va build thanh cong.

### 2026-07-15 - Orders va checkout API

- [x] API `POST /api/v1/orders/quote` tinh gia chinh thuc tu database va luu quote snapshot ngan han theo `idempotencyKey`.
- [x] API `POST /api/v1/orders` khong nhan/khong tin unit price, discount, subtotal, total tu frontend.
- [x] Tao don bang transaction gom `orders`, `order_items`, `integration_jobs`, `integration_logs`.
- [x] Order item luu snapshot SKU, ten san pham, gia niem yet, muc giam, gia cuoi.
- [x] Recheck promotion token, SĐT uu dai, product active/deleted, gia hien tai, so luong va `stockQuantity` neu duoc cau hinh.
- [x] Phat hien gia thay doi so voi quote va tra `price_changed` de frontend yeu cau khach xac nhan lai.
- [x] Idempotency key chong tao don trung; order code sinh duy nhat.
- [x] Khong cho frontend price/tong tien anh huong gia chinh thuc; payload la bi ValidationPipe reject.
- [x] `apps/shop` goi quote truoc man xac nhan va dung cung `idempotencyKey` khi tao don.
- [x] API/shop lint, typecheck, test va build thanh cong cho pham vi vua thay doi.
- [x] Root `npm test` thanh cong.
- [ ] Root lint/typecheck/build van bi chan boi loi ton tai trong `apps/admin-portal` (`checkbox` missing, lint strict, DataTable typing).
- [ ] `npm run db:migrate` chua apply duoc local vi shell khong co `DATABASE_URL`; khi chay voi URL mau thi PostgreSQL local khong san sang.
- [ ] `docker compose config` chua chay duoc vi shell hien tai khong co Docker CLI.

### 2026-07-15 - Admin portal UI

- [x] `apps/admin-portal` co cac man hinh: login, dashboard, products list, product create/edit, eligible customers, import, orders list/detail, status update, sync errors/retry, reports export.
- [x] Admin routes duoc bao ve bang client guard; `/admin/login` cu duoc redirect ve `/login`.
- [x] Phan quyen admin/operator duoc gom trong helper va test; thao tac nhay cam co confirm.
- [x] So dien thoai duoc mask trong list/export; khong export raw secret/token/authorization header.
- [x] Import CSV preview hien loi theo tung dong.
- [x] Sync status dung `pending`, `processing`, `success`, `failed`.
- [x] Build admin khong con `ignoreBuildErrors`; build dung webpack de tranh Turbopack bind port trong sandbox.
- [x] Root lint, typecheck, test va build thanh cong.
- [x] Admin dev server chay tai `http://localhost:3001`, `/login` tra HTTP 200.

### 2026-07-15 - Integration worker va adapters

- [x] Xac nhan trong docs: chi tiet API/credential Google Sheet, Pancake, BEST Express van la `CẦN XÁC NHẬN`; khong implement endpoint/payload/auth production.
- [x] Tao adapter contract chung `createOrder`, `updateOrder`, `getOrderStatus`, `healthCheck`.
- [x] Tao `GoogleSheetsAdapter`, `PancakeAdapter`, `BestExpressAdapter`; mac dinh mock adapter neu thieu base URL/path.
- [x] Worker claim job bang DB lock `FOR UPDATE SKIP LOCKED`, chuyen `processing`, timeout request, success/failure logging, exponential backoff.
- [x] Job het retry hoac loi non-retryable chuyen `cancelled` de manual review.
- [x] Admin API `GET /api/v1/admin/integrations` va `POST /api/v1/admin/integrations/:id/retry`.
- [x] Worker entrypoint `npm run worker -w apps/api` va `worker:dev`.
- [x] Integration tests voi mock HTTP server: success, timeout, HTTP 4xx, HTTP 5xx, response invalid, retry success, concurrent worker, partner already-created.
- [x] Cap nhat `documents/INTEGRATIONS.md`, README, `.env.example`, Docker Compose worker service.

### 2026-07-15 - QA hardening pass

- [x] Doc lai acceptance criteria, test bat buoc va trang thai quyet dinh chua xac nhan.
- [x] Bo sung unit test promotion token het han co chu ky hop le va token bi sua chu ky.
- [x] Bo sung test import file khach uu dai sai dinh dang.
- [x] Bo sung test redact secret, bearer token va raw SĐT trong integration logs/errors.
- [x] Bo sung UI component test dam bao ten san pham tu API duoc React escape, khong render raw script.
- [x] Tao K6 smoke script `tools/k6/public-smoke.js` cho `/products` va `/promotions/check`.
- [x] Tao `documents/TEST_REPORT.md`.
- [x] Tao `documents/SECURITY_CHECKLIST.md`.
- [ ] Kiem thu thiet bi/trinh duyet that: Chrome, Safari, Android, iPhone, Messenger/Facebook in-app browser.
- [ ] Kiem thu tich hop that Pancake/Google Sheet/BEST sau khi co endpoint, payload, auth va sandbox/credential da xac nhan.
