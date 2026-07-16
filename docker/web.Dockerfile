FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY apps/shop/package.json apps/shop/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

FROM deps AS build

ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY packages/contracts packages/contracts
COPY apps/shop apps/shop

RUN npm run build -w packages/contracts
RUN npm run build -w apps/shop

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=build --chown=node:node /app/apps/shop/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/shop/.next/static ./apps/shop/.next/static
COPY --from=build --chown=node:node /app/apps/shop/public ./apps/shop/public

USER node

EXPOSE 3000

CMD ["node", "apps/shop/server.js"]
