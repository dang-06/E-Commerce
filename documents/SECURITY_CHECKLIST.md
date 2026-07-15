# Security Checklist

Ngay cap nhat: 2026-07-15

## Authentication and authorization

- [x] Admin dang nhap bang email/password.
- [x] Password hash bang bcrypt, khong tra password hash trong API.
- [x] Bearer access token cho admin API.
- [x] Guard authentication cho route admin.
- [x] Role guard cho `admin` va `operator`.
- [x] Login rate limit.
- [x] Endpoint current user khong tra secret/hash.
- [ ] Chot policy token expiry/refresh/logout cho production.

## Input validation

- [x] Global `ValidationPipe` bat `whitelist` va `forbidNonWhitelisted`.
- [x] DTO order khong chap nhan price/discount/subtotal/total tu frontend.
- [x] Validate SKU, slug, price VND integer, anh va trang thai product.
- [x] Validate phone Viet Nam va chuan hoa `+84`/`84`/`0`.
- [x] Reject import file khong thuoc CSV/TSV/XLS/XLSX.
- [x] Bo sung file size limit va MIME/extension whitelist cho import.
- [ ] Bo sung row limit production cho import neu dataset thuc te lon.

## Pricing and checkout abuse

- [x] Backend lay product tu DB va tinh lai subtotal/discount/shipping/total.
- [x] Order item luu snapshot SKU, ten, gia niem yet, muc giam, gia cuoi.
- [x] Promotion token co chu ky, TTL, `jti`, phone hash va promotion rule/version.
- [x] Token gia, bi sua va het han bi reject.
- [x] Gia thay doi sau quote tra `price_changed`, khong am tham tao don.
- [x] Idempotency key ngan don trung.
- [ ] Usage limit uu dai chua chot; schema san sang nhung khong tu ap rule.

## PII and logging

- [x] `promotion_checks` ghi phone hash, khong ghi SĐT ro.
- [x] IP duoc hash trong promotion check.
- [x] Eligible customer list/export mask SĐT khi khong can xem day du.
- [x] Integration error/log redact authorization, token, api key, secret, cookie va raw SĐT.
- [x] UI/admin khong hien raw secret hoac raw authorization header.
- [ ] Xac nhan retention policy cho PII/log/audit log.

## Web security

- [x] React render text tu API khong dung raw HTML cho product name.
- [x] CORS cau hinh theo bien moi truong.
- [x] CSRF khong ap dung voi auth hien tai vi dung Bearer token, khong dung cookie session.
- [ ] Neu doi sang HTTP-only cookie, bat buoc them CSRF token/SameSite/secure cookie policy.
- [ ] Can cau hinh security headers tai reverse proxy/hosting: HSTS, CSP, X-Frame-Options hoac frame-ancestors, Referrer-Policy.

## Integrations

- [x] Khong goi production trong test.
- [x] Chua tu doan endpoint/payload/auth khi thieu tai lieu doi tac.
- [x] Adapter interface rieng cho GoogleSheets, Pancake, BEST.
- [x] Worker co lock job, timeout, retry backoff va manual review.
- [x] Loi dong bo khong lam order da tao thanh that bai.
- [ ] Can credential/API docs/sandbox de harden request signing, idempotency va error mapping doi tac.

## Operations

- [x] Health endpoints cho API/database readiness.
- [x] Request ID middleware va structured logging.
- [x] Dockerfile/compose duoc tao.
- [ ] Chay `docker compose config` trong moi truong co Docker CLI.
- [ ] Backup/restore PostgreSQL.
- [ ] Monitoring/alert cho failed integration jobs, high promotion check rate, login failures.
- [ ] UAT va penetration smoke tren staging truoc production.
