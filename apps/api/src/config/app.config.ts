export interface AppConfig {
  accessTokenTtlSeconds: number;
  authSecret: string;
  corsOrigins: string[];
  databaseUrl: string;
  defaultShippingFeeVnd: number;
  host: string;
  loginRateLimitMax: number;
  loginRateLimitWindowMs: number;
  orderIntegrationNames: ("sheet" | "pancake" | "best")[];
  port: number;
  promotionRateLimitMax: number;
  promotionRateLimitWindowMs: number;
  promotionTokenTtlSeconds: number;
  swaggerEnabled: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid API_PORT value: ${value}`);
  }

  return parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return parsed;
}

function parseNonNegativeInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return parsed;
}

function parseOrderIntegrationNames(value: string | undefined): ("sheet" | "pancake" | "best")[] {
  const raw = value ?? "sheet";
  const allowed = new Set(["sheet", "pancake", "best"]);
  const names = raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  for (const name of names) {
    if (!allowed.has(name)) {
      throw new Error(`Invalid API_ORDER_INTEGRATIONS value: ${name}`);
    }
  }

  return names as ("sheet" | "pancake" | "best")[];
}

export function getConfig(): AppConfig {
  const corsOrigins =
    process.env.API_CORS_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  return {
    accessTokenTtlSeconds: parsePositiveInt(
      process.env.API_ACCESS_TOKEN_TTL_SECONDS,
      3600,
      "API_ACCESS_TOKEN_TTL_SECONDS",
    ),
    authSecret:
      process.env.API_AUTH_SECRET ??
      "development-only-change-me-auth-secret-at-least-32-characters",
    corsOrigins,
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgresql://ecommerce:change_me@localhost:5432/ecommerce?schema=public",
    defaultShippingFeeVnd: parseNonNegativeInt(
      process.env.API_DEFAULT_SHIPPING_FEE_VND,
      0,
      "API_DEFAULT_SHIPPING_FEE_VND",
    ),
    host: process.env.API_HOST ?? "0.0.0.0",
    loginRateLimitMax: parsePositiveInt(
      process.env.API_LOGIN_RATE_LIMIT_MAX,
      5,
      "API_LOGIN_RATE_LIMIT_MAX",
    ),
    loginRateLimitWindowMs:
      parsePositiveInt(
        process.env.API_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        900,
        "API_LOGIN_RATE_LIMIT_WINDOW_SECONDS",
      ) * 1000,
    orderIntegrationNames: parseOrderIntegrationNames(process.env.API_ORDER_INTEGRATIONS),
    port: parsePort(process.env.API_PORT, 4000),
    promotionRateLimitMax: parsePositiveInt(
      process.env.API_PROMOTION_RATE_LIMIT_MAX,
      20,
      "API_PROMOTION_RATE_LIMIT_MAX",
    ),
    promotionRateLimitWindowMs:
      parsePositiveInt(
        process.env.API_PROMOTION_RATE_LIMIT_WINDOW_SECONDS,
        900,
        "API_PROMOTION_RATE_LIMIT_WINDOW_SECONDS",
      ) * 1000,
    promotionTokenTtlSeconds: parsePositiveInt(
      process.env.API_PROMOTION_TOKEN_TTL_SECONDS,
      1800,
      "API_PROMOTION_TOKEN_TTL_SECONDS",
    ),
    swaggerEnabled: parseBoolean(process.env.API_SWAGGER_ENABLED, true),
  };
}
