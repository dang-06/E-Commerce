// User & Auth
export type UserRole = "admin" | "operator";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Product
export interface ProductColorVariant {
  id?: string;
  name: string;
  colorCode: string;
  imageUrl: string;
  sku?: string;
  sortOrder: number;
}

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface ProductReviewSample {
  buyerName: string;
  buyerAvatarUrl: string;
  purchasedSummary: string;
  content: string;
  imageBadge: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  listedPrice: number;
  discountAmount: number;
  image: string;
  productAttributes: ProductAttribute[];
  detailImageUrls: string[];
  introVideoUrls: string[];
  sellerName: string;
  sellerYears?: number;
  sellerPrimaryCategory: string;
  minimumOrderQuantity: number;
  shippingOrigin: string;
  shippingLeadTime: string;
  returnPolicy: string;
  reviewRating?: number;
  reviewCount?: number;
  reviewTags: ProductAttribute[];
  reviewImageUrls: string[];
  reviewSample: ProductReviewSample;
  qualityCertifications: ProductAttribute[];
  packagingAttributes: ProductAttribute[];
  category: string;
  stock?: number;
  isPromotionEligible: boolean;
  isActive: boolean;
  visibility: "visible" | "hidden";
  sortOrder: number;
  colorVariants: ProductColorVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  bannerButtonText: string;
  bannerEyebrow: string;
  bannerImageUrl: string | null;
  bannerSubtitle: string;
  bannerTitle: string;
  catalogTitle: string;
  contactUrl: string;
  logoImageUrl: string | null;
  logoText: string;
  updatedAt: Date;
}

// Order Status
export type OrderStatus =
  "pending" | "confirmed" | "preparing" | "shipping" | "delivered" | "cancelled" | "returned";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type SyncStatus = "pending" | "processing" | "success" | "failed";

// Order
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
}

export interface Order {
  id: string;
  code: string;
  date: Date;
  recipientName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountApplied: boolean;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  syncStatus: SyncStatus;
  notes: string;
  pancakeOrderId?: string;
  shippingId?: string;
  shipments: ShippingShipment[];
  externalSyncId?: string;
  lastSyncAttempt?: Date;
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingEvent {
  id: string;
  eventType: string;
  statusCode: string | null;
  occurredAt: Date | null;
  receivedAt: Date;
}

export interface ShippingShipment {
  id: string;
  provider: string;
  trackingNo: string | null;
  trackingLink: string | null;
  batchNo: string | null;
  consignmentNo: string | null;
  statusCode: string | null;
  status: string | null;
  awbLink: string | null;
  awbExpiresAt: Date | null;
  estimatedShippingFee: number | null;
  actualShippingFee: number | null;
  chargeableWeight: string | null;
  updatedAt: Date;
  events: ShippingEvent[];
}

// Eligible Customer
export interface EligibleCustomer {
  id: string;
  phone: string;
  source: "manual" | "excel" | "google_sheet" | "pancake" | "best" | "spx";
  reason: string;
  status: "active" | "inactive";
  usageCount: number;
  usageLimit: number;
  lastOrderDate?: Date;
  importedAt: Date;
  createdAt: Date;
}

// Integration
export type IntegrationType = "google_sheet" | "pancake" | "best" | "spx";

export interface IntegrationLog {
  id: string;
  integration: IntegrationType;
  orderCode: string;
  action: string;
  status: SyncStatus;
  attempts: number;
  externalId?: string;
  lastError?: string;
  nextRetry?: Date;
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpxAccount {
  id: string;
  phone: string;
  email: string | null;
  userId: string;
  isActive: boolean;
  verifiedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  estimatedShippingFee: number | null;
  actualShippingFee: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  device?: string;
  createdAt: Date;
}

// Settings
export interface PromotionSettings {
  name: string;
  discountAmount: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  maxQtyPerOrder: number;
  eligibleProductIds: string[];
  isActive: boolean;
}

export interface ShippingSettings {
  fixedFee: number;
  freeShippingThreshold: number;
  addressBased?: Record<string, number>;
}

export interface OrderSettings {
  codePrefix: string;
  defaultStatus: OrderStatus;
  supportedPaymentMethods: string[];
}

export interface IntegrationSettings {
  pancake?: {
    configured: boolean;
    apiKey?: string;
  };
  googleSheet?: {
    configured: boolean;
    spreadsheetId?: string;
  };
  bestExpress?: {
    configured: boolean;
    apiKey?: string;
  };
}

export type GoogleSheetPurpose = "eligible_customers" | "orders";

export interface GoogleSheetConfig {
  id: string;
  purpose: GoogleSheetPurpose;
  sheetUrl: string;
  spreadsheetId: string;
  worksheetName: string | null;
  phoneColumn: string | null;
  orderMapping: Record<string, unknown> | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleSheetConfigs {
  eligibleCustomers: GoogleSheetConfig | null;
  orders: GoogleSheetConfig | null;
}

export interface AppSettings {
  promotion: PromotionSettings;
  shipping: ShippingSettings;
  orders: OrderSettings;
  integrations: IntegrationSettings;
}
