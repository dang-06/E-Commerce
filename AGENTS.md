# Agent Guidelines

## Project Source of Truth

- Use `documents/phan-tich-yeu-cau-website-ban-hang.md` as the business source of truth.
- Do not implement items marked `CẦN XÁC NHẬN` until they are explicitly resolved.
- Keep `documents/IMPLEMENTATION_PLAN.md` updated when foundation or module status changes.

## Engineering Rules

- Use Node.js 24 and npm workspaces.
- Keep TypeScript strict.
- Do not accept frontend price or totals as official order data.
- Keep PostgreSQL as the primary data source for products and orders.
- Persist orders before any third-party synchronization.
- Do not add Redis, Kafka, or other infrastructure until the MVP needs it.
- Never commit secrets; use `.env.example` for required variables.

## Commands

- `npm install`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `docker compose config`
