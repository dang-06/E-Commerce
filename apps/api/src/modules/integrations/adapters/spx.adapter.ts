import type { IntegrationName } from "@prisma/client";
import type { SpxConfig } from "../../../config/app.config.js";
import type { SpxAccountCredentials } from "../spx-account.service.js";
import {
  IntegrationPartnerError,
  type IntegrationAdapter,
  type IntegrationAdapterResult,
  type IntegrationJobContext,
} from "../integration.types.js";
import { redactSensitive } from "../utils/redact.js";
import { createSpxSignedRequest } from "./spx-signature.js";

interface SpxResponse {
  ret_code?: unknown;
  message?: unknown;
  data?: unknown;
}

interface SpxCreateOrderSuccess {
  provider: "spx";
  trackingNo: string;
  trackingLink?: string;
  orderId: string;
  status?: string;
  statusCode?: string;
  estimatedShippingFee?: string;
  raw: unknown;
}

export class SpxAdapter implements IntegrationAdapter {
  readonly integration: IntegrationName = "spx";

  constructor(
    private readonly config: SpxConfig,
    private readonly getCredentials?: () => Promise<SpxAccountCredentials | null>,
  ) {}

  async createOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    this.assertConfigured();
    const account = await this.accountCredentials();
    const payload = await this.createOrderPayload(job, signal, account);
    const response = await this.post("/open/api/v1/order/batch_create_order", payload, signal);
    const shipment = this.extractCreateOrderSuccess(response, job.order.orderCode);
    return {
      externalId: shipment.trackingNo,
      responsePayload: shipment,
    };
  }

  updateOrder(): Promise<IntegrationAdapterResult> {
    throw new IntegrationPartnerError("SPX update order is not implemented yet", false);
  }

  async getOrderStatus(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult> {
    this.assertConfigured();
    const trackingNo = job.externalId;
    if (!trackingNo) {
      throw new IntegrationPartnerError("SPX tracking number is missing", false);
    }
    const account = await this.accountCredentials();
    const response = await this.post(
      "/open/api/v1/order/batch_search_order",
      {
        user_id: account.userId,
        user_secret: account.userSecret,
        tracking_no_list: [trackingNo],
      },
      signal,
    );
    return { externalId: trackingNo, responsePayload: redactSensitive(response) };
  }

  async getAwb(trackingNo: string, signal: AbortSignal): Promise<{ awbLink: string; responsePayload: unknown }> {
    this.assertConfigured();
    const account = await this.accountCredentials();
    const response = await this.post(
      "/open/api/v1/order/batch_get_shipping_label",
      {
        user_id: account.userId,
        user_secret: account.userSecret,
        tracking_no_list: [trackingNo],
      },
      signal,
    );
    const data = this.asRecord(response.data);
    const awbLink = this.asString(data.awb_link);
    if (!awbLink) {
      throw new IntegrationPartnerError("SPX AWB response is missing awb_link", true, undefined, redactSensitive(response));
    }
    return { awbLink, responsePayload: redactSensitive(response) };
  }

  async healthCheck(signal: AbortSignal): Promise<boolean> {
    if (!this.hasAppCredentials()) {
      return false;
    }
    const account = await this.accountCredentials();
    const response = await this.post(
      "/open/api/v1/account/verify",
      {
        user_id: account.userId,
        user_secret: account.userSecret,
      },
      signal,
    );
    const data = this.asRecord(response.data);
    return data.match_result === true;
  }

  private async createOrderPayload(
    job: IntegrationJobContext,
    signal: AbortSignal,
    account: SpxAccountCredentials,
  ): Promise<unknown> {
    const pickup = this.config.defaultCollectType === 1 ? await this.getPickupSlot(signal, account) : null;
    const codAmount = this.config.enableCod && job.order.paymentMethod === "cod" ? Number(job.order.totalAmount) : 0;
    const itemDescription = job.order.items
      .map((item) => `${item.sku} x${item.quantity}`)
      .join(", ")
      .slice(0, 255);

    return {
      user_id: account.userId,
      user_secret: account.userSecret,
      orders: [
        {
          order_id: job.order.orderCode,
          base_info: {
            service_type: this.config.defaultServiceType,
          },
          sender_info: {
            sender_state: this.config.senderState,
            sender_city: this.config.senderCity,
            sender_district: this.config.senderDistrict,
            sender_name: this.config.senderName,
            sender_phone: this.config.senderPhone,
            sender_detail_address: this.config.senderDetailAddress,
          },
          fulfillment_info: {
            payment_role: this.config.paymentRole,
            cod_collection: codAmount > 0 ? 1 : 0,
            ...(codAmount > 0 ? { cod_amount: codAmount } : {}),
            high_value_processing_collection: 0,
            collect_type: this.config.defaultCollectType,
            ...(pickup
              ? {
                  pickup_time: pickup.pickupTime,
                  pickup_time_range: pickup.pickupTimeRange,
                  pickup_time_range_id: pickup.pickupTimeRangeId,
                }
              : {}),
            allow_mutual_check: this.config.allowMutualCheck ? 1 : 0,
            allow_try_on: this.config.allowTryOn ? 1 : 0,
            allow_partial_delivery: this.config.allowPartialDelivery ? 1 : 0,
          },
          deliver_info: {
            deliver_state: job.order.province,
            deliver_city: job.order.district,
            deliver_district: job.order.ward,
            deliver_name: job.order.recipientName,
            deliver_phone: job.order.recipientPhone,
            deliver_detail_address: job.order.address,
          },
          parcel_info: {
            parcel_weight: this.config.defaultWeightKg,
            parcel_length: this.config.defaultLengthCm,
            parcel_width: this.config.defaultWidthCm,
            parcel_height: this.config.defaultHeightCm,
            item_name: itemDescription || job.order.orderCode,
          },
        },
      ],
    };
  }

  private async getPickupSlot(signal: AbortSignal, account: SpxAccountCredentials): Promise<{
    pickupTime: number;
    pickupTimeRange: string;
    pickupTimeRangeId: number;
  } | null> {
    const response = await this.post(
      "/open/api/v1/order/get_pickup_time",
      {
        user_id: account.userId,
        user_secret: account.userSecret,
        service_type: this.config.defaultServiceType,
      },
      signal,
    );
    const days = Array.isArray(response.data) ? response.data : [];
    for (const day of days) {
      const dayRecord = this.asRecord(day);
      const slots = Array.isArray(dayRecord.slots) ? dayRecord.slots : [];
      const firstSlot = this.asRecord(slots[0]);
      const pickupTime = this.asNumber(dayRecord.pickup_time);
      const pickupTimeRangeId = this.asNumber(firstSlot.pickup_time_range_id);
      const pickupTimeRange = this.asString(firstSlot.pickup_time_range);
      if (pickupTime && pickupTimeRangeId && pickupTimeRange) {
        return { pickupTime, pickupTimeRange, pickupTimeRangeId };
      }
    }
    throw new IntegrationPartnerError("SPX pickup timeslot is unavailable", true, undefined, redactSensitive(response));
  }

  private async post(path: string, payload: unknown, signal: AbortSignal): Promise<SpxResponse> {
    const appId = this.config.appId;
    const appSecret = this.config.appSecret;
    if (!appId || !appSecret) {
      throw new IntegrationPartnerError("SPX app credentials are missing", false);
    }
    const signed = createSpxSignedRequest({ appId, appSecret, payload });
    const response = await fetch(new URL(path, this.config.baseUrl).toString(), {
      body: signed.payloadText,
      headers: signed.headers,
      method: "POST",
      signal,
    });
    const body = await this.readBody(response);
    if (!response.ok) {
      throw new IntegrationPartnerError(
        `SPX returned HTTP ${response.status}`,
        response.status >= 500 || response.status === 429,
        response.status,
        redactSensitive(body),
      );
    }
    const spx = this.asRecord(body) as SpxResponse;
    if (spx.ret_code !== 0) {
      throw new IntegrationPartnerError(
        `SPX returned ret_code ${String(spx.ret_code)}: ${this.asString(spx.message) ?? "unknown error"}`,
        this.isRetryableRetCode(spx.ret_code),
        undefined,
        redactSensitive(spx),
      );
    }
    return spx;
  }

  private extractCreateOrderSuccess(response: SpxResponse, orderCode: string): SpxCreateOrderSuccess {
    const data = this.asRecord(response.data);
    const orders = Array.isArray(data.orders) ? data.orders : Array.isArray(response.data) ? response.data : [];
    const firstOrder = this.asRecord(orders[0] ?? data);
    const trackingNo = this.asString(firstOrder.tracking_no);
    if (!trackingNo) {
      throw new IntegrationPartnerError("SPX create order response is missing tracking_no", true, undefined, redactSensitive(response));
    }
    const estimatedShippingFee = this.asNumber(firstOrder.estimated_shipping_fee);
    const status = this.asString(firstOrder.status);
    const statusCode = this.asString(firstOrder.status_code);
    const trackingLink = this.asString(firstOrder.tracking_link);
    return {
      provider: "spx",
      orderId: this.asString(firstOrder.order_id) ?? orderCode,
      raw: redactSensitive(response),
      trackingNo,
      ...(trackingLink ? { trackingLink } : {}),
      ...(status ? { status } : {}),
      ...(statusCode ? { statusCode } : {}),
      ...(estimatedShippingFee !== null ? { estimatedShippingFee: String(estimatedShippingFee) } : {}),
    };
  }

  private assertConfigured(): void {
    if (!this.hasAppCredentials()) {
      throw new IntegrationPartnerError("SPX app credentials are missing", false);
    }
    const missingSender = [
      ["SPX_SENDER_NAME", this.config.senderName],
      ["SPX_SENDER_PHONE", this.config.senderPhone],
      ["SPX_SENDER_STATE", this.config.senderState],
      ["SPX_SENDER_CITY", this.config.senderCity],
      ["SPX_SENDER_DISTRICT", this.config.senderDistrict],
      ["SPX_SENDER_DETAIL_ADDRESS", this.config.senderDetailAddress],
    ].filter(([, value]) => !value);
    if (missingSender.length > 0) {
      throw new IntegrationPartnerError(
        `SPX sender configuration is missing: ${missingSender.map(([name]) => name).join(", ")}`,
        false,
      );
    }
  }

  private hasAppCredentials(): boolean {
    return Boolean(this.config.appId && this.config.appSecret);
  }

  private async accountCredentials(): Promise<SpxAccountCredentials> {
    const credentials = this.getCredentials ? await this.getCredentials() : null;
    if (credentials) {
      return credentials;
    }
    if (this.config.userId && this.config.userSecret) {
      return {
        userId: this.config.userId,
        userSecret: this.config.userSecret,
      };
    }
    throw new IntegrationPartnerError("SPX user account credentials are missing", false);
  }

  private isRetryableRetCode(retCode: unknown): boolean {
    if (typeof retCode !== "number") {
      return true;
    }
    return retCode >= 50000 || retCode === 429;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
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
