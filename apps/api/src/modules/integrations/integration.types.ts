import type { IntegrationAction, IntegrationName, IntegrationStatus } from "@prisma/client";

export type PartnerOperation = "createOrder" | "updateOrder" | "getOrderStatus" | "healthCheck";

export interface IntegrationOrderItemSnapshot {
  sku: string;
  productName: string;
  listedPrice: string;
  discountPerItem: string;
  finalUnitPrice: string;
  quantity: number;
  lineSubtotal: string;
  lineDiscount: string;
  lineTotal: string;
}

export interface IntegrationOrderSnapshot {
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneMasked: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  totalQuantity: number;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
  paymentMethod: string;
  note: string | null;
  items: IntegrationOrderItemSnapshot[];
}

export interface IntegrationJobContext {
  id: string;
  integration: IntegrationName;
  action: IntegrationAction;
  attemptCount: number;
  externalId: string | null;
  order: IntegrationOrderSnapshot;
}

export interface IntegrationAdapterResult {
  externalId: string;
  responsePayload?: unknown;
  alreadyCreated?: boolean;
}

export class IntegrationPartnerError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly statusCode?: number,
    readonly responsePayload?: unknown,
  ) {
    super(message);
  }
}

export interface IntegrationAdapter {
  readonly integration: IntegrationName;
  createOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult>;
  updateOrder(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult>;
  getOrderStatus?(job: IntegrationJobContext, signal: AbortSignal): Promise<IntegrationAdapterResult>;
  healthCheck?(signal: AbortSignal): Promise<boolean>;
}

export interface ClaimedIntegrationJob extends IntegrationJobContext {
  rawId: bigint;
  rawOrderId: bigint;
}

export interface IntegrationJobListItem {
  id: string;
  orderCode: string;
  integration: IntegrationName;
  action: IntegrationAction;
  status: IntegrationStatus;
  attemptCount: number;
  nextRetryAt: Date | null;
  externalId: string | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
