import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service.js";
import type { ClaimedIntegrationJob, IntegrationJobListItem } from "../integration.types.js";
import { maskPhone, redactSensitive } from "../utils/redact.js";
import type { IntegrationFailureUpdate, IntegrationJobStore } from "./integration-job.store.js";

type JobWithOrder = Prisma.IntegrationJobGetPayload<{
  include: { order: { include: { items: { orderBy: { id: "asc" } } } } };
}>;

@Injectable()
export class PrismaIntegrationJobStore implements IntegrationJobStore {
  constructor(private readonly prisma: PrismaService) {}

  async claimNextDueJob(workerId: string, now: Date, maxAttempts: number): Promise<ClaimedIntegrationJob | null> {
    const staleLock = new Date(now.getTime() - 10 * 60 * 1000);
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: bigint }[]>`
        SELECT id
        FROM integration_jobs
        WHERE status IN ('pending', 'failed')
          AND attempt_count < ${maxAttempts}
          AND (next_retry_at IS NULL OR next_retry_at <= ${now})
          AND (locked_at IS NULL OR locked_at <= ${staleLock})
        ORDER BY COALESCE(next_retry_at, created_at), id
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `;
      const id = rows[0]?.id;
      if (!id) {
        return null;
      }
      const job = await tx.integrationJob.update({
        where: { id },
        data: { status: "processing", lockedAt: now, lockedBy: workerId },
        include: { order: { include: { items: { orderBy: { id: "asc" } } } } },
      });
      return this.toClaimedJob(job);
    });
  }

  async markSuccess(job: ClaimedIntegrationJob, externalId: string, responsePayload: unknown): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.integrationJob.update({
        where: { id: job.rawId },
        data: {
          externalId,
          lastError: null,
          lockedAt: null,
          lockedBy: null,
          nextRetryAt: null,
          status: "success",
        },
      });
      await tx.integrationLog.create({
        data: {
          orderId: job.rawOrderId,
          integrationJobId: job.rawId,
          integration: job.integration,
          action: job.action,
          status: "success",
          externalId,
          attemptCount: job.attemptCount,
          responsePayload: redactSensitive(responsePayload) as Prisma.InputJsonValue,
        },
      });
    });
  }

  async markFailure(job: ClaimedIntegrationJob, update: IntegrationFailureUpdate): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const persisted = await tx.integrationJob.update({
        where: { id: job.rawId },
        data: {
          attemptCount: update.attemptCount,
          lastError: update.errorMessage,
          lockedAt: null,
          lockedBy: null,
          nextRetryAt: update.nextRetryAt,
          status: update.status,
        },
      });
      await tx.integrationLog.create({
        data: {
          orderId: persisted.orderId,
          integrationJobId: job.rawId,
          integration: job.integration,
          action: job.action,
          status: update.status,
          attemptCount: update.attemptCount,
          errorMessage: update.errorMessage,
          nextRetryAt: update.nextRetryAt,
          responsePayload: redactSensitive(update.responsePayload) as Prisma.InputJsonValue,
        },
      });
    });
  }

  async release(job: ClaimedIntegrationJob): Promise<void> {
    await this.prisma.integrationJob.update({
      where: { id: job.rawId },
      data: { lockedAt: null, lockedBy: null, status: "failed" },
    });
  }

  async list(limit: number): Promise<IntegrationJobListItem[]> {
    const jobs = await this.prisma.integrationJob.findMany({
      include: { order: { select: { orderCode: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
    });
    return jobs.map((job) => ({
      id: job.id.toString(),
      orderCode: job.order.orderCode,
      integration: job.integration,
      action: job.action,
      status: job.status,
      attemptCount: job.attemptCount,
      nextRetryAt: job.nextRetryAt,
      externalId: job.externalId,
      lastError: job.lastError,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));
  }

  async retryNow(id: string): Promise<IntegrationJobListItem> {
    const job = await this.prisma.integrationJob.update({
      where: { id: BigInt(id) },
      data: { status: "pending", nextRetryAt: null, lockedAt: null, lockedBy: null, lastError: null },
      include: { order: { select: { orderCode: true } } },
    });
    return {
      id: job.id.toString(),
      orderCode: job.order.orderCode,
      integration: job.integration,
      action: job.action,
      status: job.status,
      attemptCount: job.attemptCount,
      nextRetryAt: job.nextRetryAt,
      externalId: job.externalId,
      lastError: job.lastError,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async getById(id: string): Promise<IntegrationJobListItem | null> {
    const job = await this.prisma.integrationJob.findUnique({
      where: { id: BigInt(id) },
      include: { order: { select: { orderCode: true } } },
    });
    if (!job) {
      return null;
    }
    return {
      id: job.id.toString(),
      orderCode: job.order.orderCode,
      integration: job.integration,
      action: job.action,
      status: job.status,
      attemptCount: job.attemptCount,
      nextRetryAt: job.nextRetryAt,
      externalId: job.externalId,
      lastError: job.lastError,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private toClaimedJob(job: JobWithOrder): ClaimedIntegrationJob {
    return {
      id: job.id.toString(),
      rawId: job.id,
      rawOrderId: job.orderId,
      integration: job.integration,
      action: job.action,
      attemptCount: job.attemptCount,
      externalId: job.externalId,
      order: {
        orderCode: job.order.orderCode,
        recipientName: job.order.recipientName,
        recipientPhoneMasked: maskPhone(job.order.recipientPhone),
        address: job.order.address,
        province: job.order.province,
        district: job.order.district,
        ward: job.order.ward,
        totalQuantity: job.order.totalQuantity,
        subtotal: job.order.subtotal.toString(),
        discountAmount: job.order.discountAmount.toString(),
        shippingFee: job.order.shippingFee.toString(),
        totalAmount: job.order.totalAmount.toString(),
        paymentMethod: job.order.paymentMethod,
        note: job.order.note,
        items: job.order.items.map((item) => ({
          sku: item.sku,
          productName: item.productName,
          listedPrice: item.listedPrice.toString(),
          discountPerItem: item.discountPerItem.toString(),
          finalUnitPrice: item.finalUnitPrice.toString(),
          quantity: item.quantity,
          lineSubtotal: item.lineSubtotal.toString(),
          lineDiscount: item.lineDiscount.toString(),
          lineTotal: item.lineTotal.toString(),
        })),
      },
    };
  }
}
