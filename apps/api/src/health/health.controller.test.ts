import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import { HealthController } from "./health.controller.js";
import type { DatabaseReadinessService } from "./database-readiness.service.js";

void test("liveness returns an ok response", () => {
  const controller = new HealthController({
    isReady: () => Promise.resolve(true),
  } as DatabaseReadinessService);

  const response = controller.liveness({
    header: () => "req_test",
  } as unknown as Request);

  assert.equal(response.status, "ok");
  assert.equal(response.requestId, "req_test");
});
