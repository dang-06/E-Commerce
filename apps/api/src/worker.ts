import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { getConfig } from "./config/app.config.js";
import { IntegrationWorkerService } from "./modules/integrations/integration-worker.service.js";

async function bootstrap(): Promise<void> {
  const logger = new Logger("IntegrationWorker");
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn", "log"] });
  const worker = app.get(IntegrationWorkerService);
  const intervalMs = getConfig().integrationPollIntervalMs;
  const batchSize = getConfig().integrationBatchSize;

  logger.log(`Integration worker started; pollIntervalMs=${intervalMs}; batchSize=${batchSize}`);

  const tick = async (): Promise<void> => {
    try {
      const result = await worker.processDueJobs(batchSize);
      if (result.processed > 0) {
        logger.log(
          `processed=${result.processed}; succeeded=${result.succeeded}; failed=${result.failed}`,
        );
      }
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  await tick();
  setInterval(() => {
    void tick();
  }, intervalMs);

  const shutdown = async (): Promise<void> => {
    logger.log("Integration worker shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

void bootstrap();
