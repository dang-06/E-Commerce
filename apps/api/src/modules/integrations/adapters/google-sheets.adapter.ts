import type { IntegrationName } from "@prisma/client";
import type { GoogleSheetsClientService } from "../google-sheets-client.service.js";
import type { IntegrationAdapterResult, IntegrationJobContext } from "../integration.types.js";

export class GoogleSheetsAdapter {
  readonly integration: IntegrationName = "sheet";

  constructor(private readonly sheets: GoogleSheetsClientService) {}

  async createOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    const externalId = await this.sheets.appendOrder(job, signal);
    return {
      externalId,
      responsePayload: {
        externalId,
        spreadsheet: "orders",
      },
    };
  }

  updateOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    return this.createOrder(job, signal);
  }

  async healthCheck(signal: AbortSignal): Promise<boolean> {
    return this.sheets.healthCheck(signal);
  }
}
