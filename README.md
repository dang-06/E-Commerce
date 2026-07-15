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
