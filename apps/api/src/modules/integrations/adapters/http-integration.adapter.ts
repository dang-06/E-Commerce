import type { IntegrationName } from "@prisma/client";
import {
  IntegrationPartnerError,
  type IntegrationAdapter,
  type IntegrationAdapterResult,
  type IntegrationJobContext,
  type PartnerOperation,
} from "../integration.types.js";
import { redactSensitive } from "../utils/redact.js";

export interface HttpIntegrationAdapterConfig {
  baseUrl: string;
  paths: Partial<Record<PartnerOperation, string>>;
  token?: string;
}

export abstract class HttpIntegrationAdapter implements IntegrationAdapter {
  abstract readonly integration: IntegrationName;

  constructor(private readonly config: HttpIntegrationAdapterConfig) {}

  createOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    return this.request("createOrder", job, signal);
  }

  updateOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    return this.request("updateOrder", job, signal);
  }

  getOrderStatus(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    return this.request("getOrderStatus", job, signal, "GET");
  }

  async healthCheck(signal: AbortSignal): Promise<boolean> {
    const path = this.config.paths.healthCheck;
    if (!path) {
      return true;
    }
    const response = await fetch(this.url(path), { method: "GET", signal });
    return response.ok;
  }

  private async request(
    operation: Exclude<PartnerOperation, "healthCheck">,
    job: IntegrationJobContext,
    signal: AbortSignal,
    method = "POST",
  ): Promise<IntegrationAdapterResult> {
    const path = this.config.paths[operation];
    if (!path) {
      throw new IntegrationPartnerError(`${operation} is not configured`, false);
    }
    const init: RequestInit = {
      headers: this.headers(),
      method,
      signal,
    };
    if (method !== "GET") {
      init.body = JSON.stringify(this.payload(job, operation));
    }
    const response = await fetch(this.url(path, job), init);
    const body = await this.readBody(response);

    if (response.ok) {
      return this.parseSuccess(body, job);
    }

    if (response.status === 409) {
      const externalId = this.extractExternalId(body);
      if (externalId) {
        return { externalId, responsePayload: redactSensitive(body), alreadyCreated: true };
      }
    }

    throw new IntegrationPartnerError(
      `Partner ${this.integration} returned HTTP ${response.status}`,
      response.status >= 500 || response.status === 429,
      response.status,
      redactSensitive(body),
    );
  }

  private parseSuccess(body: unknown, job: IntegrationJobContext): IntegrationAdapterResult {
    const externalId = this.extractExternalId(body);
    if (!externalId) {
      throw new IntegrationPartnerError("Partner response is missing externalId", true, undefined, redactSensitive(body));
    }
    return {
      externalId,
      responsePayload: redactSensitive(body),
      alreadyCreated: externalId === job.externalId,
    };
  }

  private extractExternalId(body: unknown): string | null {
    if (!body || typeof body !== "object") {
      return null;
    }
    const record = body as Record<string, unknown>;
    const value = record.externalId ?? record.id ?? record.orderId;
    return typeof value === "string" && value.trim() ? value : null;
  }

  private payload(job: IntegrationJobContext, operation: PartnerOperation): unknown {
    return {
      action: operation,
      idempotencyKey: `${this.integration}:${job.order.orderCode}`,
      order: job.order,
    };
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      ...(this.config.token ? { authorization: `Bearer ${this.config.token}` } : {}),
    };
  }

  private url(path: string, job?: IntegrationJobContext): string {
    const resolved = path
      .replace(":externalId", encodeURIComponent(job?.externalId ?? ""))
      .replace(":orderCode", encodeURIComponent(job?.order.orderCode ?? ""));
    return new URL(resolved, this.config.baseUrl).toString();
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
