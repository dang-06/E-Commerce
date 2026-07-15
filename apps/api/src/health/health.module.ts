import { Module } from "@nestjs/common";
import { DatabaseReadinessService } from "./database-readiness.service.js";
import { HealthController } from "./health.controller.js";

@Module({
  controllers: [HealthController],
  providers: [DatabaseReadinessService],
})
export class HealthModule {}
