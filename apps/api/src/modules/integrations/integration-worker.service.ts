import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { getConfig } from "../../config/app.config.js";
import { IntegrationAdapterRegistry } from "./integration-adapter.registry.js";
import { IntegrationPartnerError, type ClaimedIntegrationJob } from "./integration.types.js";
import { toSafeErrorMessage } from "./utils/redact.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";
import type { IntegrationFailureUpdate, IntegrationJobStore } from "./repositories/integration-job.store.js";

export interface WorkerRunResult {
  processed: number;
  succeeded: number;
  failed: number;
}

@Injectable()
export class IntegrationWorkerService {
  private readonly workerId = `api-worker-${randomUUID()}`;

  constructor(
    private readonly registry: IntegrationAdapterRegistry,
    private readonly prismaStore: PrismaIntegrationJobStore,
  ) {}

  async processDueJobs(limit = 10, store: IntegrationJobStore = this.prismaStore): Promise<WorkerRunResult> {
    const result: WorkerRunResult = { processed: 0, succeeded: 0, failed: 0 };
    for (let index = 0; index < limit; index += 1) {
      const processed = await this.processOne(store);
      if (!processed) {
        break;
      }
      result.processed += 1;
      if (processed === "success") {
        result.succeeded += 1;
      } else {
        result.failed += 1;
      }
    }
    return result;
  }

  async processOne(store: IntegrationJobStore = this.prismaStore): Promise<"success" | "failed" | null> {
    const config = getConfig();
    const job = await store.claimNextDueJob(this.workerId, new Date(), config.integrationMaxAttempts);
    if (!job) {
      return null;
    }

    const adapter = this.registry.get(job.integration);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.integrationTimeoutMs);

    try {
      const response =
        job.action === "update"
          ? await adapter.updateOrder(job, controller.signal)
          : await adapter.createOrder(job, controller.signal);
      await store.markSuccess(job, response.externalId, response.responsePayload ?? {});
      return "success";
    } catch (error) {
      await store.markFailure(job, this.toFailureUpdate(job, error));
      return "failed";
    } finally {
      clearTimeout(timeout);
    }
  }

  private toFailureUpdate(job: ClaimedIntegrationJob, error: unknown): IntegrationFailureUpdate {
    const config = getConfig();
    const attemptCount = job.attemptCount + 1;
    const retryable = this.isRetryable(error);
    const exhausted = attemptCount >= config.integrationMaxAttempts;
    const status = retryable && !exhausted ? "failed" : "cancelled";
    return {
      attemptCount,
      errorMessage: toSafeErrorMessage(error),
      nextRetryAt: status === "failed" ? this.nextRetryAt(attemptCount, config.integrationBackoffBaseMs) : null,
      responsePayload: error instanceof IntegrationPartnerError ? error.responsePayload : undefined,
      status,
    };
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof IntegrationPartnerError) {
      return error.retryable;
    }
    if (error instanceof Error && error.name === "AbortError") {
      return true;
    }
    return true;
  }

  private nextRetryAt(attemptCount: number, baseMs: number): Date {
    const exponent = Math.max(attemptCount - 1, 0);
    const delayMs = Math.min(baseMs * 2 ** exponent, 60 * 60 * 1000);
    return new Date(Date.now() + delayMs);
  }
}
