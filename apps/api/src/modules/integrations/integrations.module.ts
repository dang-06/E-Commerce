import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { GoogleSheetConfigService } from "./google-sheet-config.service.js";
import { GoogleSheetsClientService } from "./google-sheets-client.service.js";
import { IntegrationAdapterRegistry } from "./integration-adapter.registry.js";
import { IntegrationWorkerService } from "./integration-worker.service.js";
import { IntegrationsController } from "./integrations.controller.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsController],
  providers: [
    GoogleSheetConfigService,
    GoogleSheetsClientService,
    IntegrationAdapterRegistry,
    IntegrationWorkerService,
    PrismaIntegrationJobStore,
  ],
  exports: [GoogleSheetConfigService, GoogleSheetsClientService, IntegrationWorkerService, PrismaIntegrationJobStore],
})
export class IntegrationsModule {}
