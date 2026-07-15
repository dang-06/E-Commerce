FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY packages/contracts packages/contracts
COPY packages/database packages/database
COPY apps/api apps/api

RUN npm run build -w packages/contracts
RUN npm run build -w packages/database
RUN npm run build -w apps/api

EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]

