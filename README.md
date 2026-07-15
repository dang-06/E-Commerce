# Ecommerce Promotion Platform

Monorepo foundation for the phone-based ecommerce promotion MVP.

## Stack

- Node.js 24
- npm workspaces
- Next.js + TypeScript buyer UI in `apps/shop`
- NestJS + TypeScript in `apps/api`
- Shared DTO/type schemas in `packages/contracts`
- PostgreSQL
- Prisma baseline in `packages/database`
- Docker Compose for local web, API and database

## Local Setup

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Run apps individually:

```bash
npm run dev:web
npm run dev:api
```

The default local URLs are:

- Shop: `http://localhost:3000`
- API liveness: `http://localhost:4000/api/v1/health/live`
- API readiness: `http://localhost:4000/api/v1/health/ready`
- Swagger/OpenAPI: `http://localhost:4000/api/v1/docs`

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Docker Compose starts:

- `web` on port `3000`
- `api` on port `4000`
- `postgres` on port `5432`

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
docker compose config
```

## Database

Prisma schema and migrations live in `packages/database`. PostgreSQL is the source of truth for products, promotion checks and orders.

```bash
npm run db:generate
npm run db:migrate
```

## Orders API

All routes are under the global prefix `/api/v1`.

### `POST /orders/quote`

Creates an authoritative server-side quote and stores a short-lived quote snapshot by `idempotencyKey`.

The frontend sends only promotion/session and cart identity data:

```json
{
  "idempotencyKey": "idem-unique-key",
  "promotionToken": "signed-token",
  "promotionPhone": "0901234567",
  "items": [{ "productId": "1", "quantity": 2 }],
  "paymentMethod": "cod"
}
```

The API recalculates subtotal, discount, shipping fee and total from the database.

### `POST /orders`

Creates the order in a database transaction with `orders`, `order_items`, `integration_jobs` and `integration_logs`.

The API does not accept frontend unit price, discount, subtotal or total fields. If the current product price no longer matches the stored quote for the same `idempotencyKey`, the API returns `409` with `status: "price_changed"` and a fresh quote for customer confirmation.

`GET /orders/:code` is not exposed yet because the lookup security rule is still marked `CẦN XÁC NHẬN`.

## Integrations

Partner API details and credentials are not confirmed in the requirements. The API therefore defaults to mock adapters and never calls a production partner unless a base URL and explicit endpoint paths are configured.

Admin integration operations:

- `GET /api/v1/admin/integrations`
- `POST /api/v1/admin/integrations/:id/retry`

Worker behavior:

- Claims `pending` or retryable `failed` jobs with a database lock.
- Moves the job to `processing`.
- Calls the configured adapter with timeout.
- Stores `success` and `externalId` on success.
- Stores redacted error details, increments `attemptCount`, and schedules exponential backoff on retryable failure.
- Moves exhausted or non-retryable jobs to `cancelled` for manual review.

Configuration:

```bash
API_INTEGRATION_TIMEOUT_SECONDS=10
API_INTEGRATION_MAX_ATTEMPTS=5
API_INTEGRATION_BACKOFF_BASE_SECONDS=60
API_INTEGRATION_POLL_INTERVAL_SECONDS=5
API_INTEGRATION_BATCH_SIZE=10

# Disabled by default. Set only to sandbox/confirmed partner endpoints.
API_INTEGRATION_SHEET_BASE_URL=
API_INTEGRATION_SHEET_CREATE_ORDER_PATH=
API_INTEGRATION_PANCAKE_BASE_URL=
API_INTEGRATION_PANCAKE_CREATE_ORDER_PATH=
API_INTEGRATION_BEST_BASE_URL=
API_INTEGRATION_BEST_CREATE_ORDER_PATH=
```

`GoogleSheetsAdapter`, `PancakeAdapter`, and `BestExpressAdapter` share the same interface: `createOrder`, `updateOrder`, optional `getOrderStatus`, and optional `healthCheck`.

Run the worker after building the API:

```bash
npm run build -w apps/api
npm run worker -w apps/api
```

For local development:

```bash
npm run worker:dev -w apps/api
```
