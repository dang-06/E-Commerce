# Integrations Operations Guide

## Decision status

Theo `documents/phan-tich-yeu-cau-website-ban-hang.md`, chi tiet API/credential cho Google Sheet, Pancake va BEST Express van la `CẦN XÁC NHẬN`.

Vi vay implementation hien tai:

- Khong hard-code endpoint, payload production, credential hay auth scheme cua doi tac.
- Mac dinh dung mock adapter.
- Chi goi HTTP adapter khi da cau hinh ro `BASE_URL` va `CREATE_ORDER_PATH`.
- Test chi dung mock HTTP server local, khong goi production.

## Adapter contract

Tat ca adapter dung interface chung:

- `createOrder`
- `updateOrder`
- `getOrderStatus` neu doi tac ho tro
- `healthCheck` neu phu hop

Adapter rieng:

- `GoogleSheetsAdapter`
- `PancakeAdapter`
- `BestExpressAdapter`

## Environment

```bash
API_ORDER_INTEGRATIONS=sheet
API_INTEGRATION_TIMEOUT_SECONDS=10
API_INTEGRATION_MAX_ATTEMPTS=5
API_INTEGRATION_BACKOFF_BASE_SECONDS=60
API_INTEGRATION_POLL_INTERVAL_SECONDS=5
API_INTEGRATION_BATCH_SIZE=10

# Disabled by default. Configure only confirmed sandbox/partner endpoints.
API_INTEGRATION_SHEET_BASE_URL=
API_INTEGRATION_SHEET_CREATE_ORDER_PATH=
API_INTEGRATION_SHEET_UPDATE_ORDER_PATH=
API_INTEGRATION_SHEET_GET_ORDER_STATUS_PATH=
API_INTEGRATION_SHEET_HEALTH_CHECK_PATH=
API_INTEGRATION_SHEET_TOKEN=

API_INTEGRATION_PANCAKE_BASE_URL=
API_INTEGRATION_PANCAKE_CREATE_ORDER_PATH=
API_INTEGRATION_PANCAKE_UPDATE_ORDER_PATH=
API_INTEGRATION_PANCAKE_GET_ORDER_STATUS_PATH=
API_INTEGRATION_PANCAKE_HEALTH_CHECK_PATH=
API_INTEGRATION_PANCAKE_TOKEN=

API_INTEGRATION_BEST_BASE_URL=
API_INTEGRATION_BEST_CREATE_ORDER_PATH=
API_INTEGRATION_BEST_UPDATE_ORDER_PATH=
API_INTEGRATION_BEST_GET_ORDER_STATUS_PATH=
API_INTEGRATION_BEST_HEALTH_CHECK_PATH=
API_INTEGRATION_BEST_TOKEN=
```

## Worker behavior

Worker lay job `pending` hoac `failed` da den `nextRetryAt`, lock bang PostgreSQL `FOR UPDATE SKIP LOCKED`, chuyen job sang `processing`, goi adapter voi timeout, va cap nhat ket qua:

- Success: luu `externalId`, status `success`, ghi `integration_logs`.
- Retryable failure: tang `attemptCount`, luu loi da redact, dat `nextRetryAt` theo exponential backoff.
- Non-retryable hoac het so lan retry: chuyen `cancelled` de manual review.

Loi dong bo khong lam order da tao thanh failed.

## Run

```bash
npm run build -w apps/api
npm run worker -w apps/api
```

Development:

```bash
npm run worker:dev -w apps/api
```

Docker Compose co service `worker` dung chung image voi API va command `npm run worker -w apps/api`.

## Admin API

Tat ca endpoint can Bearer token admin/operator:

- `GET /api/v1/admin/integrations?limit=50`
- `POST /api/v1/admin/integrations/:id/retry`

Manual retry reset job ve `pending`, xoa `nextRetryAt`, unlock job va giu nguyen order.

## Safety

- Khong log raw authorization, token, API key, secret, cookie hoac phone ro trong integration error.
- Adapter HTTP gui `idempotencyKey` dang `<integration>:<orderCode>` de doi tac co the idempotent neu ho tro.
- HTTP `409` co `externalId` duoc xem la da tao thanh cong, phu hop truong hop doi tac da tao don nhung client mat response.
