import type { IntegrationName } from "@prisma/client";
import { HttpIntegrationAdapter } from "./http-integration.adapter.js";

export class GoogleSheetsAdapter extends HttpIntegrationAdapter {
  readonly integration: IntegrationName = "sheet";
}
