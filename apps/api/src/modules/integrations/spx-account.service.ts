import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { SpxAccount } from "@prisma/client";
import { getConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import type { CreateSpxAccountDto } from "./dto/spx-account.dto.js";
import { createSpxSignedRequest } from "./adapters/spx-signature.js";
import { IntegrationPartnerError } from "./integration.types.js";
import { redactSensitive } from "./utils/redact.js";

export interface SpxAccountCredentials {
  userId: number;
  userSecret: string;
}

export interface SpxAccountResponse {
  id: string;
  phone: string;
  email: string | null;
  userId: string;
  isActive: boolean;
  verifiedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SpxResponse {
  ret_code?: unknown;
  message?: unknown;
  data?: unknown;
}

@Injectable()
export class SpxAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SpxAccountResponse[]> {
    const accounts = await this.prisma.spxAccount.findMany({
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });
    return accounts.map((account) => this.toResponse(account));
  }

  async getActiveCredentials(): Promise<SpxAccountCredentials | null> {
    const account = await this.prisma.spxAccount.findFirst({
      orderBy: { updatedAt: "desc" },
      where: { isActive: true },
    });
    if (!account) {
      return this.envCredentials();
    }
    return {
      userId: Number(account.userId),
      userSecret: this.decrypt(account.userSecretCiphertext),
    };
  }

  async createFromSpx(dto: CreateSpxAccountDto): Promise<SpxAccountResponse> {
    const phone = dto.phone.trim();
    const email = dto.email?.trim() ? dto.email.trim() : undefined;
    const response = await this.post("/open/api/v1/account/create", {
      phone,
      ...(email ? { email } : {}),
    });
    const data = this.asRecord(response.data);
    const userId = this.asNumber(data.user_id);
    const userSecret = this.asString(data.user_secret);
    if (!userId || !userSecret) {
      throw new IntegrationPartnerError("SPX create account response is missing user_id/user_secret", true, undefined, redactSensitive(response));
    }

    const account = await this.prisma.$transaction(async (tx) => {
      await tx.spxAccount.updateMany({ data: { isActive: false }, where: { isActive: true } });
      const saved = await tx.spxAccount.upsert({
        where: { userId: BigInt(userId) },
        create: {
          email: email ?? null,
          isActive: true,
          phone,
          userId: BigInt(userId),
          userSecretCiphertext: this.encrypt(userSecret),
        },
        update: {
          email: email ?? null,
          isActive: true,
          lastError: null,
          phone,
          userSecretCiphertext: this.encrypt(userSecret),
        },
      });
      return saved;
    });

    return this.verify(account.id.toString());
  }

  async verify(id: string): Promise<SpxAccountResponse> {
    const account = await this.prisma.spxAccount.findUnique({ where: { id: BigInt(id) } });
    if (!account) {
      throw new NotFoundException("SPX account not found");
    }
    const userSecret = this.decrypt(account.userSecretCiphertext);
    try {
      const response = await this.post("/open/api/v1/account/verify", {
        user_id: Number(account.userId),
        user_secret: userSecret,
      });
      const data = this.asRecord(response.data);
      const matched = data.match_result === true;
      const updated = await this.prisma.spxAccount.update({
        where: { id: account.id },
        data: {
          lastError: matched ? null : "SPX account credentials did not match",
          verifiedAt: matched ? new Date() : null,
        },
      });
      if (!matched) {
        throw new BadRequestException("SPX account credentials did not match");
      }
      return this.toResponse(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SPX account verify failed";
      await this.prisma.spxAccount.update({
        where: { id: account.id },
        data: { lastError: message, verifiedAt: null },
      });
      throw error;
    }
  }

  async activate(id: string): Promise<SpxAccountResponse> {
    const account = await this.prisma.spxAccount.findUnique({ where: { id: BigInt(id) } });
    if (!account) {
      throw new NotFoundException("SPX account not found");
    }
    const activated = await this.prisma.$transaction(async (tx) => {
      await tx.spxAccount.updateMany({ data: { isActive: false }, where: { isActive: true } });
      return tx.spxAccount.update({
        where: { id: account.id },
        data: { isActive: true },
      });
    });
    return this.toResponse(activated);
  }

  private async post(path: string, payload: unknown): Promise<SpxResponse> {
    const config = getConfig().spx;
    if (!config.appId || !config.appSecret) {
      throw new IntegrationPartnerError("SPX app credentials are missing", false);
    }
    const signed = createSpxSignedRequest({
      appId: config.appId,
      appSecret: config.appSecret,
      payload,
    });
    const response = await fetch(new URL(path, config.baseUrl).toString(), {
      body: signed.payloadText,
      headers: signed.headers,
      method: "POST",
    });
    const body = await this.readBody(response);
    if (!response.ok) {
      throw new IntegrationPartnerError(
        `SPX returned HTTP ${response.status}`,
        response.status >= 500 || response.status === 429,
        response.status,
        redactSensitive(body),
      );
    }
    const spx = this.asRecord(body) as SpxResponse;
    if (spx.ret_code !== 0) {
      throw new IntegrationPartnerError(
        `SPX returned ret_code ${String(spx.ret_code)}: ${this.asString(spx.message) ?? "unknown error"}`,
        true,
        undefined,
        redactSensitive(spx),
      );
    }
    return spx;
  }

  private envCredentials(): SpxAccountCredentials | null {
    const config = getConfig().spx;
    if (!config.userId || !config.userSecret) {
      return null;
    }
    return {
      userId: config.userId,
      userSecret: config.userSecret,
    };
  }

  private encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
  }

  private decrypt(cipherText: string): string {
    const [ivText, tagText, encryptedText] = cipherText.split(".");
    if (!ivText || !tagText || !encryptedText) {
      throw new Error("Invalid encrypted SPX user secret");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey(), Buffer.from(ivText, "base64"));
    decipher.setAuthTag(Buffer.from(tagText, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }

  private encryptionKey(): Buffer {
    return createHash("sha256").update(getConfig().spx.accountEncryptionKey).digest();
  }

  private toResponse(account: SpxAccount): SpxAccountResponse {
    return {
      createdAt: account.createdAt,
      email: account.email,
      id: account.id.toString(),
      isActive: account.isActive,
      lastError: account.lastError,
      phone: account.phone,
      updatedAt: account.updatedAt,
      userId: account.userId.toString(),
      verifiedAt: account.verifiedAt,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
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
