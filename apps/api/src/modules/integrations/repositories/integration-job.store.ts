import type { IntegrationName, IntegrationStatus } from "@prisma/client";
import type { ClaimedIntegrationJob, IntegrationJobListItem } from "../integration.types.js";

export interface IntegrationFailureUpdate {
  attemptCount: number;
  errorMessage: string;
  nextRetryAt: Date | null;
  status: Extract<IntegrationStatus, "failed" | "cancelled">;
  responsePayload?: unknown;
}

export interface IntegrationJobStore {
  claimNextDueJob(workerId: string, now: Date, maxAttempts: number): Promise<ClaimedIntegrationJob | null>;
  markSuccess(job: ClaimedIntegrationJob, externalId: string, responsePayload: unknown): Promise<void>;
  markFailure(job: ClaimedIntegrationJob, update: IntegrationFailureUpdate): Promise<void>;
  release(job: ClaimedIntegrationJob): Promise<void>;
  list(limit: number): Promise<IntegrationJobListItem[]>;
  retryNow(id: string): Promise<IntegrationJobListItem>;
  getById(id: string): Promise<IntegrationJobListItem | null>;
}

export interface PartnerAdapterConfig {
  baseUrl?: string;
  createOrderPath?: string;
  updateOrderPath?: string;
  getOrderStatusPath?: string;
  healthCheckPath?: string;
  token?: string;
}

export type PartnerConfigMap = Record<IntegrationName, PartnerAdapterConfig>;
