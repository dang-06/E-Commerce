import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { getConfig } from "../../config/app.config.js";
import { PrismaService } from "../../database/prisma.service.js";
import { SpxAdapter } from "./adapters/spx.adapter.js";
import { generateSpxCheckSign } from "./adapters/spx-signature.js";
import { SpxAccountService } from "./spx-account.service.js";
import { redactSensitive } from "./utils/redact.js";

export interface SpxAwbResponse {
  shipmentId: string;
  trackingNo: string;
  awbLink: string;
  awbExpiresAt: Date;
}

export interface SpxShipmentListItem {
  id: string;
  orderId: string;
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  trackingNo: string | null;
  trackingLink: string | null;
  statusCode: string | null;
  status: string | null;
  awbLink: string | null;
  awbExpiresAt: Date | null;
  estimatedShippingFee: string | null;
  actualShippingFee: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SpxShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spxAccounts: SpxAccountService,
  ) {}

  async listShipments(limit = 100): Promise<SpxShipmentListItem[]> {
    const take = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100;
    const shipments = await this.prisma.shippingShipment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            recipientName: true,
            recipientPhone: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take,
      where: { provider: "spx" },
    });

    return shipments.map((shipment) => ({
      actualShippingFee: shipment.actualShippingFee?.toString() ?? null,
      awbExpiresAt: shipment.awbExpiresAt,
      awbLink: shipment.awbLink,
      createdAt: shipment.createdAt,
      estimatedShippingFee: shipment.estimatedShippingFee?.toString() ?? null,
      id: shipment.id.toString(),
      orderCode: shipment.order.orderCode,
      orderId: shipment.order.id.toString(),
      recipientName: shipment.order.recipientName,
      recipientPhone: shipment.order.recipientPhone,
      status: shipment.status,
      statusCode: shipment.statusCode,
      trackingLink: shipment.trackingLink,
      trackingNo: shipment.trackingNo,
      updatedAt: shipment.updatedAt,
    }));
  }

  async getAwb(shipmentId: string): Promise<SpxAwbResponse> {
    const shipment = await this.prisma.shippingShipment.findUniqueOrThrow({
      where: { id: BigInt(shipmentId) },
    });
    if (shipment.provider !== "spx" || !shipment.trackingNo) {
      throw new Error("Shipment is not a valid SPX shipment");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, getConfig().integrationTimeoutMs);
    try {
      const result = await new SpxAdapter(getConfig().spx, () => this.spxAccounts.getActiveCredentials()).getAwb(
        shipment.trackingNo,
        controller.signal,
      );
      const awbExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const updated = await this.prisma.shippingShipment.update({
        where: { id: shipment.id },
        data: {
          awbExpiresAt,
          awbLink: result.awbLink,
          rawLastEvent: redactSensitive(result.responsePayload) as Prisma.InputJsonValue,
        },
      });
      await this.prisma.shippingEvent.create({
        data: {
          eventType: "get_awb",
          payload: redactSensitive(result.responsePayload) as Prisma.InputJsonValue,
          provider: "spx",
          shipmentId: shipment.id,
          trackingNo: shipment.trackingNo,
        },
      });
      return {
        awbExpiresAt,
        awbLink: updated.awbLink ?? result.awbLink,
        shipmentId: updated.id.toString(),
        trackingNo: updated.trackingNo ?? shipment.trackingNo,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async handleWebhook(eventType: string, headers: Record<string, string | string[] | undefined>, body: unknown): Promise<void> {
    this.verifyWebhook(headers, body);
    const payload = this.asRecord(body);
    const trackingNo = this.asString(payload.tracking_no) ?? this.asString(payload.forward_tracking_no);
    const providerEventId = this.asString(payload.id);
    const occurredAt = this.asUnixDate(payload.timestamp);
    const statusCode = this.asString(payload.status_code) ?? this.asString(payload.status_code_name);

    await this.prisma.$transaction(async (tx) => {
      const shipment = trackingNo
        ? await tx.shippingShipment.findFirst({ where: { provider: "spx", trackingNo } })
        : null;
      const event = await this.createWebhookEvent(tx, {
        eventType,
        occurredAt,
        payload,
        providerEventId,
        shipmentId: shipment?.id ?? null,
        statusCode,
        trackingNo,
      });
      if (!event || !shipment) {
        return;
      }
      await this.applyWebhookToShipment(tx, shipment.id, eventType, payload);
    });
  }

  private verifyWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): void {
    const config = getConfig().spx;
    if (!config.appId || !config.appSecret) {
      throw new UnauthorizedException("SPX webhook credentials are not configured");
    }
    const checkSign = this.header(headers, "check-sign");
    const timestamp = Number(this.header(headers, "timestamp"));
    const randomNum = Number(this.header(headers, "random-num"));
    const appId = Number(this.header(headers, "app-id") ?? config.appId);
    if (!checkSign || !Number.isFinite(timestamp) || !Number.isFinite(randomNum) || appId !== config.appId) {
      throw new UnauthorizedException("Invalid SPX webhook headers");
    }
    const expected = generateSpxCheckSign({
      appId: config.appId,
      appSecret: config.appSecret,
      payloadText: JSON.stringify(body),
      randomNum,
      timestamp,
    });
    if (expected !== checkSign) {
      throw new UnauthorizedException("Invalid SPX webhook signature");
    }
  }

  private async createWebhookEvent(
    tx: Prisma.TransactionClient,
    input: {
      eventType: string;
      occurredAt: Date | null;
      payload: Record<string, unknown>;
      providerEventId: string | null;
      shipmentId: bigint | null;
      statusCode: string | null;
      trackingNo: string | null;
    },
  ) {
    try {
      return await tx.shippingEvent.create({
        data: {
          eventType: input.eventType,
          occurredAt: input.occurredAt,
          payload: redactSensitive(input.payload) as Prisma.InputJsonValue,
          provider: "spx",
          providerEventId: input.providerEventId,
          shipmentId: input.shipmentId,
          statusCode: input.statusCode,
          trackingNo: input.trackingNo,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return null;
      }
      throw error;
    }
  }

  private async applyWebhookToShipment(
    tx: Prisma.TransactionClient,
    shipmentId: bigint,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const actualShippingFee = this.asBigInt(payload.latest_shipping_fee);
    const chargeableWeight = this.asString(payload.latest_chargeable_weight);
    const data: Prisma.ShippingShipmentUpdateInput = {
      rawLastEvent: redactSensitive(payload) as Prisma.InputJsonValue,
    };
    const status = this.asString(payload.status);
    const statusCode = this.asString(payload.status_code);
    if (status) data.status = status;
    if (statusCode) data.statusCode = statusCode;
    if (actualShippingFee !== null) data.actualShippingFee = actualShippingFee;
    if (chargeableWeight) data.chargeableWeight = chargeableWeight;
    await tx.shippingShipment.update({ where: { id: shipmentId }, data });

    if (eventType === "tracking" && statusCode) {
      await this.updateOrderStatusFromSpx(tx, shipmentId, statusCode);
    }
  }

  private async updateOrderStatusFromSpx(
    tx: Prisma.TransactionClient,
    shipmentId: bigint,
    statusCode: string,
  ): Promise<void> {
    const shipment = await tx.shippingShipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      return;
    }
    const orderStatus = this.mapSpxStatus(statusCode);
    if (!orderStatus) {
      return;
    }
    await tx.order.update({ where: { id: shipment.orderId }, data: { orderStatus } });
  }

  private mapSpxStatus(statusCode: string): "confirmed" | "shipped" | "delivered" | "cancelled" | null {
    if (statusCode === "1001") return "confirmed";
    if (statusCode.startsWith("2")) return "shipped";
    if (statusCode.startsWith("3")) return "delivered";
    if (statusCode.startsWith("6") || statusCode.startsWith("7")) return "cancelled";
    return null;
  }

  private header(headers: Record<string, string | string[] | undefined>, name: string): string | null {
    const value = headers[name] ?? headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
  }

  private asBigInt(value: unknown): bigint | null {
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? BigInt(Math.round(parsed)) : null;
  }

  private asUnixDate(value: unknown): Date | null {
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
    return Number.isFinite(parsed) ? new Date(parsed * 1000) : null;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002"
    );
  }
}
