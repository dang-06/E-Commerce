import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";
import type { AccessTokenPayload, AdminRole, SafeAdmin } from "./auth.types.js";

@Injectable()
export class AccessTokenService {
  private readonly secret = getConfig().authSecret;
  private readonly ttlSeconds = getConfig().accessTokenTtlSeconds;

  sign(admin: Pick<SafeAdmin, "id" | "email" | "role">): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: AccessTokenPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      iat: now,
      exp: now + this.ttlSeconds,
    };

    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signInput(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): AccessTokenPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Invalid access token");
    }

    const [encodedHeader, encodedPayload, signature] = parts as [string, string, string];
    const expectedSignature = this.signInput(`${encodedHeader}.${encodedPayload}`);
    if (!this.safeEquals(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid access token");
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as Partial<AccessTokenPayload>;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      !this.isAdminRole(payload.role) ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      throw new UnauthorizedException("Invalid access token");
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Access token expired");
    }

    return payload as AccessTokenPayload;
  }

  private signInput(input: string): string {
    return createHmac("sha256", this.secret).update(input).digest("base64url");
  }

  private base64UrlEncode(input: string): string {
    return Buffer.from(input, "utf8").toString("base64url");
  }

  private base64UrlDecode(input: string): string {
    return Buffer.from(input, "base64url").toString("utf8");
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private isAdminRole(role: unknown): role is AdminRole {
    return role === "admin" || role === "operator";
  }
}
