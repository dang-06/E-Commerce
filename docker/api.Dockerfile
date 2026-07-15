FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

FROM deps AS build

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY packages/contracts packages/contracts
COPY packages/database packages/database
COPY apps/api apps/api

RUN npm run db:generate -w packages/database
RUN npm run build -w packages/contracts
RUN npm run build -w packages/database
RUN npm run build -w apps/api

FROM node:24-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
RUN npm ci --omit=dev
RUN npm run db:generate -w packages/database

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package*.json ./
COPY --from=prod-deps --chown=node:node /app/apps/api/package.json apps/api/package.json
COPY --from=prod-deps --chown=node:node /app/packages/contracts/package.json packages/contracts/package.json
COPY --from=prod-deps --chown=node:node /app/packages/database/package.json packages/database/package.json
COPY --from=prod-deps --chown=node:node /app/packages/database/prisma packages/database/prisma
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist
COPY --from=build --chown=node:node /app/packages/contracts/dist packages/contracts/dist
COPY --from=build --chown=node:node /app/packages/database/dist packages/database/dist

USER node

EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]
