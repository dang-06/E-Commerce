import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Injectable } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import { IntegrationPartnerError, type IntegrationJobContext } from "./integration.types.js";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface SheetValuesResponse {
  values?: unknown[][];
}

interface AppendValuesResponse {
  updates?: {
    updatedRange?: string;
  };
}

interface CachedPhones {
  expiresAt: number;
  phones: Set<string>;
}

const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const defaultTokenUri = "https://oauth2.googleapis.com/token";

@Injectable()
export class GoogleSheetsClientService {
  private token: { accessToken: string; expiresAt: number } | null = null;
  private serviceAccount: ServiceAccountKey | null | undefined;
  private eligiblePhonesCache: CachedPhones | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async isPhoneEligible(normalizedPhone: string): Promise<boolean | null> {
    const config = await this.prisma.googleSheetConfig.findFirst({
      where: { purpose: "eligible_customers", isActive: true },
    });
    if (!config) {
      return null;
    }

    const phones = await this.getEligiblePhones(config);
    return phones.has(normalizedPhone);
  }

  async appendOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<string> {
    const config = await this.prisma.googleSheetConfig.findFirst({
      where: { purpose: "orders", isActive: true },
    });
    if (!config) {
      throw new IntegrationPartnerError("Google Sheet order config is not configured", true);
    }

    const range = this.range(config.worksheetName, "A:Z");
    const body = {
      majorDimension: "ROWS",
      values: [this.orderRow(job)],
    };
    const response = await this.request<AppendValuesResponse>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(
        range,
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        body: JSON.stringify(body),
        method: "POST",
        signal,
      },
    );
    return response.updates?.updatedRange ?? `${config.spreadsheetId}:${Date.now()}`;
  }

  async healthCheck(signal: AbortSignal): Promise<boolean> {
    const config = await this.prisma.googleSheetConfig.findFirst({
      where: { purpose: "orders", isActive: true },
    });
    if (!config) {
      return false;
    }
    await this.readValues(config.spreadsheetId, this.range(config.worksheetName, "A1:A1"), signal);
    return true;
  }

  private async getEligiblePhones(config: {
    spreadsheetId: string;
    worksheetName: string | null;
    phoneColumn: string | null;
  }): Promise<Set<string>> {
    const now = Date.now();
    if (this.eligiblePhonesCache && this.eligiblePhonesCache.expiresAt > now) {
      return this.eligiblePhonesCache.phones;
    }

    const rows = await this.readValues(config.spreadsheetId, this.range(config.worksheetName, "A:Z"));
    const phoneIndex = this.resolvePhoneColumnIndex(rows, config.phoneColumn);
    const phones = new Set<string>();
    for (const row of rows) {
      const value = this.cellToString(row[phoneIndex]).replace(/\D/g, "");
      const normalized = this.normalizePossibleVietnamesePhone(value);
      if (normalized) {
        phones.add(normalized);
      }
    }

    this.eligiblePhonesCache = {
      expiresAt: now + getConfig().googleSheets.cacheTtlSeconds * 1000,
      phones,
    };
    return phones;
  }

  private async readValues(spreadsheetId: string, range: string, signal?: AbortSignal): Promise<unknown[][]> {
    const init: RequestInit = { method: "GET" };
    if (signal) {
      init.signal = signal;
    }
    const response = await this.request<SheetValuesResponse>(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
      init,
    );
    return response.values ?? [];
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const token = await this.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    headers.set("content-type", "application/json");
    const response = await fetch(url, { ...init, headers });
    const body = await this.readBody(response);
    if (!response.ok) {
      throw new IntegrationPartnerError(`Google Sheets returned HTTP ${response.status}`, response.status >= 500, response.status, body);
    }
    return body as T;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt > now + 30_000) {
      return this.token.accessToken;
    }

    const key = await this.getServiceAccount();
    if (!key) {
      throw new IntegrationPartnerError("Google service account is not configured", true);
    }

    const iat = Math.floor(now / 1000);
    const exp = iat + 3600;
    const assertion = this.signJwt(
      { alg: "RS256", typ: "JWT" },
      {
        aud: key.token_uri ?? defaultTokenUri,
        exp,
        iat,
        iss: key.client_email,
        scope: sheetsScope,
      },
      key.private_key,
    );
    const response = await fetch(key.token_uri ?? defaultTokenUri, {
      body: new URLSearchParams({
        assertion,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST",
    });
    const body = (await this.readBody(response)) as AccessTokenResponse;
    if (!response.ok || !body.access_token) {
      throw new IntegrationPartnerError("Google token request failed", response.status >= 500, response.status, body);
    }
    this.token = {
      accessToken: body.access_token,
      expiresAt: now + (body.expires_in ?? 3600) * 1000,
    };
    return this.token.accessToken;
  }

  private async getServiceAccount(): Promise<ServiceAccountKey | null> {
    if (this.serviceAccount !== undefined) {
      return this.serviceAccount;
    }
    const config = getConfig().googleSheets;
    const raw = config.serviceAccountJson ?? (config.serviceAccountKeyFile ? await readFile(config.serviceAccountKeyFile, "utf8") : null);
    if (!raw) {
      this.serviceAccount = null;
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ServiceAccountKey>;
    if (!parsed.client_email || !parsed.private_key) {
      throw new IntegrationPartnerError("Google service account key is invalid", false);
    }
    this.serviceAccount = {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
      ...(parsed.token_uri ? { token_uri: parsed.token_uri } : {}),
    };
    return this.serviceAccount;
  }

  private signJwt(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string): string {
    const encodedHeader = this.base64Url(JSON.stringify(header));
    const encodedPayload = this.base64Url(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createSign("RSA-SHA256").update(signingInput).sign(privateKey);
    return `${signingInput}.${this.base64Url(signature)}`;
  }

  private base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
  }

  private resolvePhoneColumnIndex(rows: unknown[][], configuredColumn: string | null): number {
    const column = configuredColumn?.trim();
    if (!column) {
      return 0;
    }
    if (/^[A-Z]+$/i.test(column)) {
      return this.columnLetterToIndex(column);
    }
    const header = rows[0] ?? [];
    const found = header.findIndex((cell) => this.cellToString(cell).trim().toLowerCase() === column.toLowerCase());
    return found >= 0 ? found : 0;
  }

  private columnLetterToIndex(column: string): number {
    return column
      .toUpperCase()
      .split("")
      .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
  }

  private normalizePossibleVietnamesePhone(value: string): string | null {
    if (!value) {
      return null;
    }
    if (value.startsWith("84") && value.length === 11) {
      return `0${value.slice(2)}`;
    }
    if (value.length === 9) {
      return `0${value}`;
    }
    if (value.startsWith("0") && value.length === 10) {
      return value;
    }
    return null;
  }

  private orderRow(job: IntegrationJobContext): string[] {
    const order = job.order;
    return [
      new Date().toISOString(),
      order.orderCode,
      order.recipientName,
      order.recipientPhone,
      `${order.address}, ${order.ward}, ${order.district}, ${order.province}`,
      order.totalQuantity.toString(),
      order.subtotal,
      order.discountAmount,
      order.shippingFee,
      order.totalAmount,
      order.paymentMethod,
      order.note ?? "",
      order.items.map((item) => `${item.sku} x${item.quantity}`).join("; "),
    ];
  }

  private range(worksheetName: string | null, fallbackRange: string): string {
    if (!worksheetName) {
      return fallbackRange;
    }
    return `${this.quoteSheetName(worksheetName)}!${fallbackRange}`;
  }

  private quoteSheetName(name: string): string {
    return `'${name.replaceAll("'", "''")}'`;
  }

  private cellToString(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      return value.toString();
    }
    return "";
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
