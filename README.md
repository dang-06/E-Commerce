# Ecommerce Promotion Platform

Monorepo foundation for the phone-based ecommerce promotion MVP.

## Stack

- Node.js 24
- npm workspaces
- Next.js + TypeScript in `apps/web`
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

- Web: `http://localhost:3000`
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

The first Prisma migration is a baseline migration only. It intentionally does not create business tables while the relevant `CẦN XÁC NHẬN` items remain unresolved.

```bash
npm run db:generate
npm run db:migrate
```
