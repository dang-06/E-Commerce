import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";

export interface PromotionTokenPayload {
  jti: string;
  phoneHash: string;
  promotionRule: string;
  promotionRuleVersion: number;
  iat: number;
  exp: number;
}

@Injectable()
export class PromotionTokenService {
  private readonly secret = getConfig().authSecret;
  private readonly ttlSeconds = getConfig().promotionTokenTtlSeconds;

  sign(phoneHash: string, promotionRule: string, promotionRuleVersion: number): {
    token: string;
    expiresAt: Date;
    jti: string;
  } {
    const now = Math.floor(Date.now() / 1000);
    const payload: PromotionTokenPayload = {
      jti: randomUUID(),
      phoneHash,
      promotionRule,
      promotionRuleVersion,
      iat: now,
      exp: now + this.ttlSeconds,
    };
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signEncodedPayload(encodedPayload);
    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt: new Date(payload.exp * 1000),
      jti: payload.jti,
    };
  }

  verify(token: string): PromotionTokenPayload {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException("Invalid promotion token");
    }

    const expectedSignature = this.signEncodedPayload(encodedPayload);
    if (!this.safeEquals(signature, expectedSignature)) {
      throw new UnauthorizedException("Invalid promotion token");
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as PromotionTokenPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Promotion token expired");
    }

    return payload;
  }

  private signEncodedPayload(encodedPayload: string): string {
    return createHmac("sha256", this.secret).update(encodedPayload).digest("base64url");
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }
}

