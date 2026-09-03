import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { GoogleSheetConfigService } from "./google-sheet-config.service.js";
import { GoogleSheetsClientService } from "./google-sheets-client.service.js";
import { IntegrationAdapterRegistry } from "./integration-adapter.registry.js";
import { IntegrationWorkerService } from "./integration-worker.service.js";
import { IntegrationsController, SpxWebhooksController } from "./integrations.controller.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";
import { SpxAccountService } from "./spx-account.service.js";
import { SpxShippingService } from "./spx-shipping.service.js";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController, SpxWebhooksController],
  providers: [
    GoogleSheetConfigService,
    GoogleSheetsClientService,
    IntegrationAdapterRegistry,
    IntegrationWorkerService,
    PrismaIntegrationJobStore,
    SpxAccountService,
    SpxShippingService,
  ],
  exports: [
    GoogleSheetConfigService,
    GoogleSheetsClientService,
    IntegrationWorkerService,
    PrismaIntegrationJobStore,
    SpxAccountService,
    SpxShippingService,
  ],
})
export class IntegrationsModule {}
