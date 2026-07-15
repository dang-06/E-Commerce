import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { UnauthorizedException } from "@nestjs/common";
import { getConfig } from "../../config/app.config.js";
import { PromotionTokenService, type PromotionTokenPayload } from "./promotion-token.service.js";

function signPayload(payload: PromotionTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getConfig().authSecret)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

void test("promotion token rejects expired signed payloads", () => {
  const token = signPayload({
    jti: "expired-token",
    phoneHash: "phone-hash",
    promotionRule: "PHONE_25000",
    promotionRuleVersion: 1,
    iat: 1,
    exp: 1,
  });

  assert.throws(() => new PromotionTokenService().verify(token), UnauthorizedException);
});

void test("promotion token rejects tampered signatures", () => {
  const { token } = new PromotionTokenService().sign("phone-hash", "PHONE_25000", 1);

  assert.throws(() => new PromotionTokenService().verify(`${token}tampered`), UnauthorizedException);
});
