export interface AppConfig {
  accessTokenTtlSeconds: number;
  authSecret: string;
  corsOrigins: string[];
  cloudinary: CloudinaryConfig;
  databaseUrl: string;
  defaultShippingFeeVnd: number;
  host: string;
  loginRateLimitMax: number;
  loginRateLimitWindowMs: number;
  orderIntegrationNames: ("sheet" | "pancake" | "best" | "spx")[];
  integrationBackoffBaseMs: number;
  integrationBatchSize: number;
  integrationMaxAttempts: number;
  integrationPollIntervalMs: number;
  integrationTimeoutMs: number;
  integrationEndpoints: {
    best: IntegrationEndpointConfig;
    pancake: IntegrationEndpointConfig;
    sheet: IntegrationEndpointConfig;
  };
  spx: SpxConfig;
  googleSheets: GoogleSheetsConfig;
  port: number;
  promotionRateLimitMax: number;
  promotionRateLimitWindowMs: number;
  promotionTokenTtlSeconds: number;
  swaggerEnabled: boolean;
}

export interface SpxConfig {
  appId: number | undefined;
  appSecret: string | undefined;
  baseUrl: string;
  defaultCollectType: 1 | 2;
  defaultHeightCm: number;
  defaultLengthCm: number;
  defaultServiceType: 1 | 2;
  defaultWeightKg: number;
  defaultWidthCm: number;
  accountEncryptionKey: string;
  enableCod: boolean;
  env: "test" | "live";
  allowMutualCheck: boolean;
  allowPartialDelivery: boolean;
  allowTryOn: boolean;
  paymentRole: 1 | 2;
  senderCity: string | undefined;
  senderDetailAddress: string | undefined;
  senderDistrict: string | undefined;
  senderName: string | undefined;
  senderPhone: string | undefined;
  senderState: string | undefined;
  userId: number | undefined;
  userSecret: string | undefined;
}

export interface CloudinaryConfig {
  apiKey: string | undefined;
  apiSecret: string | undefined;
  cloudName: string | undefined;
  productImageFolder: string;
}

export interface IntegrationEndpointConfig {
  baseUrl?: string;
  createOrderPath?: string;
  updateOrderPath?: string;
  getOrderStatusPath?: string;
  healthCheckPath?: string;
  token?: string;
}

export interface GoogleSheetsConfig {
  cacheTtlSeconds: number;
  serviceAccountJson?: string;
  serviceAccountKeyFile?: string;
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

function parseOrderIntegrationNames(value: string | undefined): ("sheet" | "pancake" | "best" | "spx")[] {
  const raw = value ?? "sheet";
  const allowed = new Set(["sheet", "pancake", "best", "spx"]);
  const names = raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  for (const name of names) {
    if (!allowed.has(name)) {
      throw new Error(`Invalid API_ORDER_INTEGRATIONS value: ${name}`);
    }
  }

  return names as ("sheet" | "pancake" | "best" | "spx")[];
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
    cloudinary: {
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      productImageFolder: process.env.CLOUDINARY_PRODUCT_IMAGE_FOLDER ?? "ecommerce-products",
    },
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgresql://ecommerce:change_me@localhost:5432/ecommerce?schema=public",
    defaultShippingFeeVnd: parseNonNegativeInt(
      process.env.API_DEFAULT_SHIPPING_FEE_VND,
      30000,
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
    integrationBackoffBaseMs: parsePositiveInt(
      process.env.API_INTEGRATION_BACKOFF_BASE_SECONDS,
      60,
      "API_INTEGRATION_BACKOFF_BASE_SECONDS",
    ) * 1000,
    integrationBatchSize: parsePositiveInt(
      process.env.API_INTEGRATION_BATCH_SIZE,
      10,
      "API_INTEGRATION_BATCH_SIZE",
    ),
    integrationMaxAttempts: parsePositiveInt(
      process.env.API_INTEGRATION_MAX_ATTEMPTS,
      5,
      "API_INTEGRATION_MAX_ATTEMPTS",
    ),
    integrationPollIntervalMs: parsePositiveInt(
      process.env.API_INTEGRATION_POLL_INTERVAL_SECONDS,
      5,
      "API_INTEGRATION_POLL_INTERVAL_SECONDS",
    ) * 1000,
    integrationTimeoutMs: parsePositiveInt(
      process.env.API_INTEGRATION_TIMEOUT_SECONDS,
      10,
      "API_INTEGRATION_TIMEOUT_SECONDS",
    ) * 1000,
    integrationEndpoints: {
      best: readIntegrationEndpoint("BEST"),
      pancake: readIntegrationEndpoint("PANCAKE"),
      sheet: readIntegrationEndpoint("SHEET"),
    },
    spx: readSpxConfig(),
    googleSheets: {
      cacheTtlSeconds: parsePositiveInt(
        process.env.GOOGLE_SHEETS_CACHE_TTL_SECONDS,
        60,
        "GOOGLE_SHEETS_CACHE_TTL_SECONDS",
      ),
      ...(process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        ? { serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON }
        : {}),
      ...(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE
        ? { serviceAccountKeyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE }
        : {}),
    },
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

function readSpxConfig(): SpxConfig {
  const env = process.env.SPX_ENV === "live" ? "live" : "test";
  const testBaseUrl = process.env.SPX_TEST_BASE_URL ?? "https://test-stable.spx.vn/";
  const liveBaseUrl = process.env.SPX_LIVE_BASE_URL ?? "https://spx.vn/";
  return {
    allowMutualCheck: parseBoolean(process.env.SPX_ALLOW_MUTUAL_CHECK, false),
    allowPartialDelivery: parseBoolean(process.env.SPX_ALLOW_PARTIAL_DELIVERY, false),
    allowTryOn: parseBoolean(process.env.SPX_ALLOW_TRY_ON, false),
    appId: parseOptionalPositiveInt(process.env.SPX_APP_ID, "SPX_APP_ID"),
    appSecret: process.env.SPX_APP_SECRET,
    baseUrl: env === "live" ? liveBaseUrl : testBaseUrl,
    defaultCollectType: parseOneOf(process.env.SPX_DEFAULT_COLLECT_TYPE, 1, [1, 2], "SPX_DEFAULT_COLLECT_TYPE"),
    defaultHeightCm: parsePositiveNumber(process.env.SPX_DEFAULT_HEIGHT_CM, 10, "SPX_DEFAULT_HEIGHT_CM"),
    defaultLengthCm: parsePositiveNumber(process.env.SPX_DEFAULT_LENGTH_CM, 10, "SPX_DEFAULT_LENGTH_CM"),
    defaultServiceType: parseOneOf(process.env.SPX_DEFAULT_SERVICE_TYPE, 1, [1, 2], "SPX_DEFAULT_SERVICE_TYPE"),
    defaultWeightKg: parsePositiveNumber(process.env.SPX_DEFAULT_WEIGHT_KG, 0.5, "SPX_DEFAULT_WEIGHT_KG"),
    defaultWidthCm: parsePositiveNumber(process.env.SPX_DEFAULT_WIDTH_CM, 10, "SPX_DEFAULT_WIDTH_CM"),
    accountEncryptionKey:
      process.env.SPX_ACCOUNT_ENCRYPTION_KEY ??
      process.env.API_AUTH_SECRET ??
      "development-only-change-me-spx-account-encryption-key",
    enableCod: parseBoolean(process.env.SPX_ENABLE_COD, true),
    env,
    paymentRole: parseOneOf(process.env.SPX_PAYMENT_ROLE, 1, [1, 2], "SPX_PAYMENT_ROLE"),
    senderCity: process.env.SPX_SENDER_CITY,
    senderDetailAddress: process.env.SPX_SENDER_DETAIL_ADDRESS,
    senderDistrict: process.env.SPX_SENDER_DISTRICT,
    senderName: process.env.SPX_SENDER_NAME,
    senderPhone: process.env.SPX_SENDER_PHONE,
    senderState: process.env.SPX_SENDER_STATE,
    userId: parseOptionalPositiveInt(process.env.SPX_USER_ID, "SPX_USER_ID"),
    userSecret: process.env.SPX_USER_SECRET,
  };
}

function parseOptionalPositiveInt(value: string | undefined, name: string): number | undefined {
  if (!value) {
    return undefined;
  }
  return parsePositiveInt(value, 0, name);
}

function parsePositiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }
  return parsed;
}

function parseOneOf<T extends number>(value: string | undefined, fallback: T, allowed: readonly T[], name: string): T {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!allowed.includes(parsed as T)) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }
  return parsed as T;
}

function readIntegrationEndpoint(name: "BEST" | "PANCAKE" | "SHEET"): IntegrationEndpointConfig {
  const config: IntegrationEndpointConfig = {};
  setIfPresent(config, "baseUrl", process.env[`API_INTEGRATION_${name}_BASE_URL`]);
  setIfPresent(config, "createOrderPath", process.env[`API_INTEGRATION_${name}_CREATE_ORDER_PATH`]);
  setIfPresent(config, "updateOrderPath", process.env[`API_INTEGRATION_${name}_UPDATE_ORDER_PATH`]);
  setIfPresent(config, "getOrderStatusPath", process.env[`API_INTEGRATION_${name}_GET_ORDER_STATUS_PATH`]);
  setIfPresent(config, "healthCheckPath", process.env[`API_INTEGRATION_${name}_HEALTH_CHECK_PATH`]);
  setIfPresent(config, "token", process.env[`API_INTEGRATION_${name}_TOKEN`]);
  return config;
}

function setIfPresent(
  config: IntegrationEndpointConfig,
  key: keyof IntegrationEndpointConfig,
  value: string | undefined,
): void {
  if (value) {
    config[key] = value;
  }
}
