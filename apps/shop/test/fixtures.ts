import type { Product, RecipientForm } from "../lib/types";

export function sampleProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "1",
    sku: "SKU-1",
    name: "Sản phẩm kiểm thử",
    slug: "san-pham-kiem-thu",
    description: "Mô tả sản phẩm",
    imageUrl: null,
    productAttributes: [],
    detailImageUrls: [],
    sellerName: null,
    sellerYears: null,
    sellerPrimaryCategory: null,
    minimumOrderQuantity: 1,
    shippingOrigin: null,
    shippingLeadTime: null,
    returnPolicy: null,
    reviewRating: null,
    reviewCount: null,
    reviewTags: [],
    reviewImageUrls: [],
    qualityCertifications: [],
    packagingAttributes: [],
    listedPrice: "99000",
    stockQuantity: null,
    isPromotionEligible: true,
    discountAmount: "25000",
    isActive: true,
    sortOrder: 1,
    images: [],
    colorVariants: [],
    ...overrides,
  };
}

export function validRecipient(overrides: Partial<RecipientForm> = {}): RecipientForm {
  return {
    recipientName: "Nguyen Van A",
    recipientPhone: "0901234567",
    province: "TP HCM",
    district: "Quan 1",
    ward: "Ben Nghe",
    address: "1 Nguyen Hue",
    note: "",
    ...overrides,
  };
}
