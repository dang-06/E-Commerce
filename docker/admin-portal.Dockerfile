FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY apps/admin-portal/package.json apps/admin-portal/package.json
RUN npm ci

FROM deps AS build

ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY apps/admin-portal apps/admin-portal

RUN npm run build -w apps/admin-portal

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app

COPY --from=build --chown=node:node /app/apps/admin-portal/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/admin-portal/.next/static ./apps/admin-portal/.next/static
COPY --from=build --chown=node:node /app/apps/admin-portal/public ./apps/admin-portal/public

USER node

EXPOSE 3001

CMD ["node", "apps/admin-portal/server.js"]
