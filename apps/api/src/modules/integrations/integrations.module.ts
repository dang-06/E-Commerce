import { Module } from "@nestjs/common";
import { IntegrationAdapterRegistry } from "./integration-adapter.registry.js";
import { IntegrationWorkerService } from "./integration-worker.service.js";
import { IntegrationsController } from "./integrations.controller.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationAdapterRegistry, IntegrationWorkerService, PrismaIntegrationJobStore],
  exports: [IntegrationWorkerService, PrismaIntegrationJobStore],
})
export class IntegrationsModule {}
