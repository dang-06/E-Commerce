import type { IntegrationName } from "@prisma/client";
import type {
  IntegrationAdapter,
  IntegrationAdapterResult,
  IntegrationJobContext,
} from "../integration.types.js";

export class MockIntegrationAdapter implements IntegrationAdapter {
  constructor(readonly integration: IntegrationName) {}

  createOrder(job: IntegrationJobContext): Promise<IntegrationAdapterResult> {
    return Promise.resolve({
      externalId: `mock-${this.integration}-${job.order.orderCode}`,
      responsePayload: { provider: "mock", orderCode: job.order.orderCode },
    });
  }

  updateOrder(job: IntegrationJobContext): Promise<IntegrationAdapterResult> {
    return Promise.resolve({
      externalId: job.externalId ?? `mock-${this.integration}-${job.order.orderCode}`,
      responsePayload: { provider: "mock", orderCode: job.order.orderCode, action: "update" },
    });
  }

  getOrderStatus(job: IntegrationJobContext): Promise<IntegrationAdapterResult> {
    return Promise.resolve({
      externalId: job.externalId ?? `mock-${this.integration}-${job.order.orderCode}`,
      responsePayload: { provider: "mock", status: "success" },
    });
  }

  healthCheck(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
