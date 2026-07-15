import assert from "node:assert/strict";
import test from "node:test";
import { healthStatusSchema } from "./index.js";

void test("healthStatusSchema accepts a valid health response", () => {
  const parsed = healthStatusSchema.parse({
    status: "ok",
    timestamp: new Date("2026-07-14T00:00:00.000Z").toISOString(),
    requestId: "req_123",
  });

  assert.equal(parsed.status, "ok");
});
