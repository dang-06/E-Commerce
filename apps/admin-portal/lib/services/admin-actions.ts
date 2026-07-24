import type { Order, Product, ProductAttribute, UserRole } from "../types";

export type AdminAction =
  | "product:create"
  | "product:update"
  | "product:delete"
  | "customer:import"
  | "customer:update"
  | "order:update"
  | "integration:retry"
  | "report:export";

const adminOnlyActions = new Set<AdminAction>([
  "product:create",
  "product:delete",
  "customer:import",
  "integration:retry",
  "report:export",
]);

export function canPerformAction(role: UserRole | null, action: AdminAction): boolean {
  if (!role) {
    return false;
  }
  if (adminOnlyActions.has(action)) {
    return role === "admin";
  }
  return true;
}

export function maskPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 7) {
    return "***";
  }
  return `${normalized.slice(0, 3)}****${normalized.slice(-3)}`;
}

export interface ImportPreviewRow {
  line: number;
  phone: string;
  sourceCustomerId: string;
  valid: boolean;
  error?: string;
}

export function parseCustomerImportPreview(content: string): ImportPreviewRow[] {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .filter(
      ({ line, index }) =>
        index !== 0 || !/^"?\s*(phone|sdt|số điện thoại|so dien thoai)\s*"?\s*[,;\t]/i.test(line),
    )
    .map(({ line, index }) => {
      const [phone = "", sourceCustomerId = ""] = line
        .split(delimiter)
        .map((value) => value.trim().replace(/^"|"$/g, ""));
      const normalized = phone.replace(/[\s.-]/g, "").replace(/^\+?84/, "0");
      const valid = /^0\d{9}$/.test(normalized);
      return {
        line: index + 1,
        phone: normalized || phone,
        sourceCustomerId,
        valid,
        ...(valid ? {} : { error: "Số điện thoại không hợp lệ" }),
      };
    });
}

export function buildEligibleCustomersSampleCsv(): string {
  const header = ["phone", "sourceCustomerId"];
  const rows = [
    ["0901234567", "CRM-1001"],
    ["0912345678", "CRM-1002"],
  ];
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildOrdersCsv(orders: Order[]): string {
  const header = [
    "order_code",
    "created_at",
    "recipient_name",
    "phone_masked",
    "status",
    "sync_status",
    "subtotal",
    "discount",
    "shipping",
    "total",
  ];
  const rows = orders.map((order) => [
    order.code,
    order.createdAt.toISOString(),
    order.recipientName,
    maskPhone(order.phone),
    order.status,
    order.syncStatus,
    String(order.subtotal),
    String(order.discount),
    String(order.shipping),
    String(order.total),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildProductsCsv(products: Product[]): string {
  const header = [
    "sku",
    "slug",
    "name",
    "short_description",
    "description",
    "listed_price",
    "discount_amount",
    "stock",
    "is_active",
    "is_promotion_eligible",
    "sort_order",
    "image_url",
    "color_variants",
    "product_attributes",
    "detail_image_urls",
    "seller_name",
    "seller_years",
    "seller_primary_category",
    "minimum_order_quantity",
    "shipping_origin",
    "shipping_lead_time",
    "return_policy",
    "review_rating",
    "review_count",
    "review_tags",
    "review_image_urls",
    "quality_certifications",
    "packaging_attributes",
  ];
  const rows = products.map((product) => [
    product.sku,
    product.slug,
    product.name,
    product.shortDescription,
    product.description,
    String(product.listedPrice),
    String(product.discountAmount),
    product.stock === undefined ? "" : String(product.stock),
    product.isActive ? "true" : "false",
    product.isPromotionEligible ? "true" : "false",
    String(product.sortOrder),
    product.image,
    jsonCell(product.colorVariants),
    attributeCell(product.productAttributes),
    jsonCell(product.detailImageUrls),
    product.sellerName,
    product.sellerYears === undefined ? "" : String(product.sellerYears),
    product.sellerPrimaryCategory,
    String(product.minimumOrderQuantity),
    product.shippingOrigin,
    product.shippingLeadTime,
    product.returnPolicy,
    product.reviewRating === undefined ? "" : String(product.reviewRating),
    product.reviewCount === undefined ? "" : String(product.reviewCount),
    attributeCell(product.reviewTags),
    jsonCell(product.reviewImageUrls),
    attributeCell(product.qualityCertifications),
    attributeCell(product.packagingAttributes),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function attributeCell(attributes: ProductAttribute[]): string {
  return jsonCell(
    attributes.map((attribute) => ({ label: attribute.label, value: attribute.value })),
  );
}

function jsonCell(value: unknown): string {
  return JSON.stringify(value);
}

function csvCell(value: string): string {
  if (/["\n,]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
