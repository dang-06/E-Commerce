import { Injectable } from "@nestjs/common";
import type { IntegrationName } from "@prisma/client";
import { getConfig, type IntegrationEndpointConfig } from "../../config/app.config.js";
import { BestExpressAdapter } from "./adapters/best-express.adapter.js";
import { GoogleSheetsAdapter } from "./adapters/google-sheets.adapter.js";
import { MockIntegrationAdapter } from "./adapters/mock-integration.adapter.js";
import { PancakeAdapter } from "./adapters/pancake.adapter.js";
import type { IntegrationAdapter } from "./integration.types.js";

@Injectable()
export class IntegrationAdapterRegistry {
  private readonly adapters = new Map<IntegrationName, IntegrationAdapter>();

  constructor() {
    const config = getConfig().integrationEndpoints;
    this.adapters.set("sheet", this.build("sheet", config.sheet));
    this.adapters.set("pancake", this.build("pancake", config.pancake));
    this.adapters.set("best", this.build("best", config.best));
  }

  get(integration: IntegrationName): IntegrationAdapter {
    const adapter = this.adapters.get(integration);
    if (!adapter) {
      return new MockIntegrationAdapter(integration);
    }
    return adapter;
  }

  private build(integration: IntegrationName, config: IntegrationEndpointConfig): IntegrationAdapter {
    if (!config.baseUrl || !config.createOrderPath) {
      return new MockIntegrationAdapter(integration);
    }
    const paths = {
      createOrder: config.createOrderPath,
      ...(config.updateOrderPath ? { updateOrder: config.updateOrderPath } : {}),
      ...(config.getOrderStatusPath ? { getOrderStatus: config.getOrderStatusPath } : {}),
      ...(config.healthCheckPath ? { healthCheck: config.healthCheckPath } : {}),
    };
    const httpConfig = {
      baseUrl: config.baseUrl,
      paths,
      ...(config.token ? { token: config.token } : {}),
    };
    if (integration === "pancake") {
      return new PancakeAdapter(httpConfig);
    }
    if (integration === "best") {
      return new BestExpressAdapter(httpConfig);
    }
    return new GoogleSheetsAdapter(httpConfig);
  }
}
