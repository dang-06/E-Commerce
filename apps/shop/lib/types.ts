export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductColorVariant {
  id: string;
  name: string;
  colorCode: string | null;
  imageUrl: string;
  sku: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listedPrice: string;
  stockQuantity: number | null;
  isPromotionEligible: boolean;
  discountAmount: string;
  isActive: boolean;
  sortOrder: number;
  images: ProductImage[];
  colorVariants: ProductColorVariant[];
}

export interface SiteSettings {
  bannerButtonText: string;
  bannerEyebrow: string;
  bannerImageUrl: string | null;
  bannerSubtitle: string;
  bannerTitle: string;
  logoImageUrl: string | null;
  logoText: string;
  updatedAt: string;
}

export interface PromotionCheckResult {
  eligible: boolean;
  promotionToken?: string;
  expiresAt?: string;
}

export interface PromotionSession {
  phone: string;
  eligible: boolean;
  promotionToken?: string;
  expiresAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface RecipientForm {
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  note: string;
}

export interface OrderResult {
  status: "created" | "duplicate";
  orderCode: string;
  createdAt: string;
  totalQuantity: number;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
}

export interface OrderQuote {
  status: "quoted";
  idempotencyKey: string;
  expiresAt: string;
  totalQuantity: number;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
}
