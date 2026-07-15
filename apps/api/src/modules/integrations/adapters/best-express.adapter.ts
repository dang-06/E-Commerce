import type { IntegrationName } from "@prisma/client";
import { HttpIntegrationAdapter } from "./http-integration.adapter.js";

export class BestExpressAdapter extends HttpIntegrationAdapter {
  readonly integration: IntegrationName = "best";
}
