FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY packages/contracts packages/contracts
COPY apps/web apps/web

RUN npm run build -w packages/contracts
RUN npm run build -w apps/web

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/web"]

