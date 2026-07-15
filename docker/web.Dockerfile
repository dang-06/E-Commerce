FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY apps/shop/package.json apps/shop/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

COPY tsconfig.base.json eslint.config.mjs .prettierrc.json ./
COPY packages/contracts packages/contracts
COPY apps/shop apps/shop

RUN npm run build -w packages/contracts
RUN npm run build -w apps/shop

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/shop"]
