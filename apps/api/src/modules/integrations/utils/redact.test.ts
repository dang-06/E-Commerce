import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitive, toSafeErrorMessage } from "./redact.js";

void test("redacts secrets, bearer tokens and raw Vietnamese phone numbers", () => {
  const redacted = JSON.stringify(
    redactSensitive({
      authorization: "Bearer partner-secret",
      apiKey: "raw-key",
      payload: {
        phone: "0901234567",
        note: "Call 0912345678 before delivery",
      },
    }),
  );

  assert.doesNotMatch(redacted, /partner-secret|raw-key|0901234567|0912345678/);
  assert.match(redacted, /\[redacted\]/);
  assert.match(redacted, /\[phone\]/);
});

void test("safe error messages do not expose sensitive values", () => {
  const message = toSafeErrorMessage(
    new Error("Request failed for 0901234567 with Authorization: Bearer token-value"),
  );

  assert.doesNotMatch(message, /0901234567|token-value/);
});
