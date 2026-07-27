import type { Product, ProductAttribute, ProductColorVariant, ProductReviewSample } from "@/lib/types";

export type FieldErrors = Record<string, string>;

interface SheetFormInput {
  isActive: boolean;
  orderMappingText: string;
  phoneColumn: string;
  sheetUrl: string;
  worksheetName: string;
}

interface BannerFormInput {
  bannerButtonText: string;
  bannerEyebrow: string;
  bannerImageUrl: string;
  bannerSubtitle: string;
  bannerTitle: string;
  catalogTitle: string;
  logoImageUrl: string;
  logoText: string;
}

export interface ProductValidationInput {
  category: string;
  colorVariants: ProductColorVariant[];
  description: string;
  detailImageUrls: string[];
  discountAmount: string | number;
  image: string;
  introVideoUrls: string[];
  listedPrice: string | number;
  minimumOrderQuantity: string | number;
  name: string;
  packagingAttributes?: ProductAttribute[];
  productAttributes: ProductAttribute[];
  qualityCertifications?: ProductAttribute[];
  returnPolicy: string;
  reviewCount?: string | number;
  reviewImageUrls: string[];
  reviewRating?: string | number;
  reviewSample: ProductReviewSample;
  reviewTags?: ProductAttribute[];
  sellerName: string;
  sellerPrimaryCategory: string;
  sellerYears?: string | number;
  shippingLeadTime: string;
  shippingOrigin: string;
  shortDescription: string;
  sku: string;
  slug: string;
  stock?: string | number;
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const colorPattern = /^#[0-9a-f]{6}$/i;
const phonePattern = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;

export function collectFieldErrorMessages(errors: FieldErrors): string[] {
  return Array.from(new Set(Object.values(errors).filter(Boolean)));
}

export function validateLoginForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  return errors;
}

export function validateCustomerForm(phone: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedPhone = phone.replace(/\s/g, "");

  if (!normalizedPhone) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!phonePattern.test(normalizedPhone)) {
    errors.phone = "Số điện thoại Việt Nam không hợp lệ.";
  }

  return errors;
}

export function validateBannerForm(form: BannerFormInput): FieldErrors {
  const errors: FieldErrors = {};

  requireText(errors, "logoText", form.logoText, "Vui lòng nhập text logo.");
  requireText(errors, "bannerTitle", form.bannerTitle, "Vui lòng nhập tiêu đề banner.");
  requireText(errors, "bannerSubtitle", form.bannerSubtitle, "Vui lòng nhập mô tả banner.");
  requireText(errors, "bannerButtonText", form.bannerButtonText, "Vui lòng nhập text nút banner.");
  requireText(errors, "catalogTitle", form.catalogTitle, "Vui lòng nhập tiêu đề catalog.");
  validateOptionalAssetUrl(errors, "logoImageUrl", form.logoImageUrl, "URL ảnh logo không hợp lệ.");
  validateOptionalAssetUrl(errors, "bannerImageUrl", form.bannerImageUrl, "URL ảnh banner không hợp lệ.");

  return errors;
}

export function validateSheetForm(purpose: "eligible_customers" | "orders", form: SheetFormInput): FieldErrors {
  const errors: FieldErrors = {};

  if (form.isActive) {
    requireText(errors, `${purpose}.sheetUrl`, form.sheetUrl, "Vui lòng nhập link Google Sheet khi đang kích hoạt.");
  }

  if (form.sheetUrl.trim() && !isGoogleSheetUrl(form.sheetUrl)) {
    errors[`${purpose}.sheetUrl`] = "Link Google Sheet phải bắt đầu bằng https://docs.google.com/spreadsheets/.";
  }

  if (purpose === "eligible_customers" && form.isActive) {
    requireText(errors, "eligible_customers.phoneColumn", form.phoneColumn, "Vui lòng nhập cột chứa số điện thoại.");
  }

  if (purpose === "orders" && form.orderMappingText.trim()) {
    try {
      const parsed = JSON.parse(form.orderMappingText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        errors["orders.orderMappingText"] = "Mapping cột đơn hàng phải là JSON object.";
      }
    } catch {
      errors["orders.orderMappingText"] = "Mapping cột đơn hàng chưa đúng JSON.";
    }
  }

  return errors;
}

export function validateProductForm(form: ProductValidationInput): FieldErrors {
  const errors: FieldErrors = {};

  requireText(errors, "name", form.name, "Vui lòng nhập tên sản phẩm.");
  requireText(errors, "sku", form.sku, "Vui lòng nhập SKU.");
  requireText(errors, "slug", form.slug, "Vui lòng nhập slug.");
  if (form.slug.trim() && !slugPattern.test(form.slug.trim())) {
    errors.slug = "Slug chỉ dùng chữ thường, số và dấu gạch ngang.";
  }

  validateRequiredMoney(errors, "listedPrice", form.listedPrice, "Giá niêm yết phải lớn hơn 0.");
  validateNonNegativeNumber(errors, "discountAmount", form.discountAmount, "Giảm giá không được âm.");
  validateOptionalAssetUrl(errors, "image", form.image, "URL ảnh sản phẩm không hợp lệ.");
  validateIntegerRange(errors, "minimumOrderQuantity", form.minimumOrderQuantity, 1, 9999, "Số lượng đặt tối thiểu phải từ 1 đến 9,999.");
  validateIntegerRange(errors, "sellerYears", form.sellerYears, 0, 100, "Số năm hoạt động phải từ 0 đến 100.");
  validateNumberRange(errors, "reviewRating", form.reviewRating, 0, 5, "Điểm đánh giá phải từ 0 đến 5.");
  validateIntegerRange(errors, "reviewCount", form.reviewCount, 0, 999999, "Số đánh giá phải là số nguyên không âm.");
  validateIntegerRange(errors, "stock", form.stock, 0, 999999, "Tồn kho phải là số nguyên không âm.");

  validateAttributeRows(errors, "productAttributes", form.productAttributes, "Thông số sản phẩm");
  validateUrlList(errors, "detailImageUrls", form.detailImageUrls, "Ảnh mô tả");
  validateUrlList(errors, "reviewImageUrls", form.reviewImageUrls, "Ảnh đánh giá");
  validateUrlList(errors, "introVideoUrls", form.introVideoUrls, "Video giới thiệu");
  if (form.introVideoUrls.filter(Boolean).length > 2) {
    errors.introVideoUrls = "Mỗi sản phẩm chỉ được lưu tối đa 2 video giới thiệu.";
  }

  validateOptionalAssetUrl(
    errors,
    "reviewBuyerAvatarUrl",
    form.reviewSample.buyerAvatarUrl,
    "URL avatar người mua không hợp lệ.",
  );

  form.colorVariants.forEach((variant, index) => {
    const hasAnyValue = Boolean(variant.name.trim() || variant.imageUrl.trim() || variant.sku?.trim());
    if (!hasAnyValue) return;
    if (!variant.name.trim()) {
      errors[`colorVariants.${index}.name`] = `Màu ${index + 1}: vui lòng nhập tên màu.`;
    }
    if (!variant.imageUrl.trim()) {
      errors[`colorVariants.${index}.imageUrl`] = `Màu ${index + 1}: vui lòng nhập hoặc tải ảnh màu.`;
    } else if (!isAssetUrl(variant.imageUrl)) {
      errors[`colorVariants.${index}.imageUrl`] = `Màu ${index + 1}: URL ảnh màu không hợp lệ.`;
    }
    if (variant.colorCode && !colorPattern.test(variant.colorCode)) {
      errors[`colorVariants.${index}.colorCode`] = `Màu ${index + 1}: mã màu phải có dạng #RRGGBB.`;
    }
  });

  return errors;
}

export function toProductValidationInput(product: Product): ProductValidationInput {
  return {
    category: product.category,
    colorVariants: product.colorVariants,
    description: product.description,
    detailImageUrls: product.detailImageUrls,
    discountAmount: product.discountAmount,
    image: product.image,
    introVideoUrls: product.introVideoUrls,
    listedPrice: product.listedPrice,
    minimumOrderQuantity: product.minimumOrderQuantity,
    name: product.name,
    packagingAttributes: product.packagingAttributes,
    productAttributes: product.productAttributes,
    qualityCertifications: product.qualityCertifications,
    returnPolicy: product.returnPolicy,
    reviewCount: product.reviewCount,
    reviewImageUrls: product.reviewImageUrls,
    reviewRating: product.reviewRating,
    reviewSample: product.reviewSample,
    reviewTags: product.reviewTags,
    sellerName: product.sellerName,
    sellerPrimaryCategory: product.sellerPrimaryCategory,
    sellerYears: product.sellerYears,
    shippingLeadTime: product.shippingLeadTime,
    shippingOrigin: product.shippingOrigin,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    stock: product.stock,
  };
}

function requireText(errors: FieldErrors, field: string, value: string, message: string): void {
  if (!value.trim()) {
    errors[field] = message;
  }
}

function validateRequiredMoney(errors: FieldErrors, field: string, value: string | number, message: string): void {
  const amount = toNumber(value);
  if (amount === null || amount <= 0) {
    errors[field] = message;
  }
}

function validateNonNegativeNumber(errors: FieldErrors, field: string, value: string | number, message: string): void {
  if (value === "") return;
  const amount = toNumber(value);
  if (amount === null || amount < 0) {
    errors[field] = message;
  }
}

function validateNumberRange(
  errors: FieldErrors,
  field: string,
  value: string | number | undefined,
  min: number,
  max: number,
  message: string,
): void {
  if (value === "" || value === undefined) return;
  const amount = toNumber(value);
  if (amount === null || amount < min || amount > max) {
    errors[field] = message;
  }
}

function validateIntegerRange(
  errors: FieldErrors,
  field: string,
  value: string | number | undefined,
  min: number,
  max: number,
  message: string,
): void {
  if (value === "" || value === undefined) return;
  const amount = toNumber(value);
  if (amount === null || !Number.isInteger(amount) || amount < min || amount > max) {
    errors[field] = message;
  }
}

function validateAttributeRows(errors: FieldErrors, field: string, rows: ProductAttribute[], label: string): void {
  rows.forEach((row, index) => {
    if (!row.label.trim() && !row.value.trim()) return;
    if (!row.label.trim() || !row.value.trim()) {
      errors[`${field}.${index}`] = `${label} dòng ${index + 1}: cần nhập đủ tên và giá trị.`;
    }
  });
}

function validateOptionalAssetUrl(errors: FieldErrors, field: string, value: string, message: string): void {
  if (value.trim() && !isAssetUrl(value)) {
    errors[field] = message;
  }
}

function validateUrlList(errors: FieldErrors, field: string, values: string[], label: string): void {
  values.forEach((value, index) => {
    if (value.trim() && !isAssetUrl(value)) {
      errors[`${field}.${index}`] = `${label} ${index + 1}: URL không hợp lệ.`;
    }
  });
}

function isGoogleSheetUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "docs.google.com" && url.pathname.startsWith("/spreadsheets/");
  } catch {
    return false;
  }
}

function isAssetUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("/")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
