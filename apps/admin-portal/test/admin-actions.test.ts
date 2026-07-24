import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductsCsv,
  buildOrdersCsv,
  canPerformAction,
  maskPhone,
  parseCustomerImportPreview,
} from "../lib/services/admin-actions";
import type { Order, Product } from "../lib/types";

void test("admin/operator permissions protect sensitive actions", () => {
  assert.equal(canPerformAction("admin", "product:delete"), true);
  assert.equal(canPerformAction("operator", "product:delete"), false);
  assert.equal(canPerformAction("operator", "order:update"), true);
  assert.equal(canPerformAction(null, "order:update"), false);
});

void test("phone masking hides full phone numbers in exports and lists", () => {
  assert.equal(maskPhone("0901234567"), "090****567");
  assert.equal(maskPhone("123"), "***");
});

void test("customer import preview reports row-level errors", () => {
  const rows = parseCustomerImportPreview("0901234567,VIP\n12345,Sai");
  assert.deepEqual(
    rows.map((row) => row.valid),
    [true, false],
  );
  assert.equal(rows[1]?.line, 2);
  assert.equal(rows[1]?.error, "Số điện thoại không hợp lệ");
  assert.equal(rows[0]?.sourceCustomerId, "VIP");
});

void test("order report export masks phone and omits raw secrets", () => {
  const order: Order = {
    id: "order_1",
    code: "OD001",
    date: new Date("2026-07-15T00:00:00.000Z"),
    recipientName: "Nguyen Van A",
    phone: "0901234567",
    address: "1 Le Loi",
    items: [],
    subtotal: 100000,
    discount: 25000,
    discountApplied: true,
    shipping: 0,
    total: 75000,
    status: "pending",
    paymentStatus: "unpaid",
    syncStatus: "failed",
    notes: "",
    createdAt: new Date("2026-07-15T00:00:00.000Z"),
    updatedAt: new Date("2026-07-15T00:00:00.000Z"),
  };
  const csv = buildOrdersCsv([order]);
  assert.match(csv, /090\*\*\*\*567/);
  assert.doesNotMatch(csv, /0901234567/);
  assert.doesNotMatch(csv.toLowerCase(), /authorization|secret|token/);
});

void test("product sheet export includes extended 1688 detail attributes", () => {
  const product: Product = {
    id: "product_1",
    sku: "SKU-1688",
    slug: "que-nhuom-toc",
    name: "Que nhuộm tóc",
    shortDescription: "Sản phẩm mẫu",
    description: "Mô tả dài",
    listedPrice: 2000,
    discountAmount: 0,
    image: "https://cdn.example.com/product.jpg",
    productAttributes: [{ label: "Thương hiệu", value: "Han zini" }],
    detailImageUrls: ["https://cdn.example.com/detail.jpg"],
    sellerName: "Công ty TNHH Công nghệ",
    sellerYears: 3,
    sellerPrimaryCategory: "Sản phẩm chăm sóc tóc",
    minimumOrderQuantity: 3,
    shippingOrigin: "Sán Đầu, Quảng Đông",
    shippingLeadTime: "Giao hàng trong vòng 48 giờ",
    returnPolicy: "Miễn phí vận chuyển trả hàng",
    reviewRating: 4.4,
    reviewCount: 70,
    reviewTags: [{ label: "Chất lượng khá tốt", value: "8" }],
    reviewImageUrls: ["https://cdn.example.com/review.jpg"],
    qualityCertifications: [{ label: "Số đăng ký", value: "2025056915" }],
    packagingAttributes: [{ label: "Khối lượng (g)", value: "70" }],
    category: "hair-care",
    stock: 71319,
    isPromotionEligible: true,
    isActive: true,
    visibility: "visible",
    sortOrder: 1,
    colorVariants: [
      {
        id: "variant_1",
        name: "Màu đen tự nhiên",
        colorCode: "#111111",
        imageUrl: "https://cdn.example.com/variant.jpg",
        sortOrder: 1,
      },
    ],
    createdAt: new Date("2026-07-24T00:00:00.000Z"),
    updatedAt: new Date("2026-07-24T00:00:00.000Z"),
  };
  const csv = buildProductsCsv([product]);
  assert.match(csv, /seller_name/);
  assert.match(csv, /minimum_order_quantity/);
  assert.match(csv, /quality_certifications/);
  assert.match(csv, /packaging_attributes/);
  assert.match(csv, /Công ty TNHH Công nghệ/);
  assert.match(csv, /Sán Đầu, Quảng Đông/);
});
