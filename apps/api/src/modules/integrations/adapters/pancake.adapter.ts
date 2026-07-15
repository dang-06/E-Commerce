import type { IntegrationName } from "@prisma/client";
import { HttpIntegrationAdapter } from "./http-integration.adapter.js";

export class PancakeAdapter extends HttpIntegrationAdapter {
  readonly integration: IntegrationName = "pancake";
}
