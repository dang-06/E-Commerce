export interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string | null;
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
}

export interface PromotionCheckResult {
  eligible: boolean;
  promotionToken?: string;
  expiresAt?: string;
}

export interface PromotionSession {
  phone: string;
  promotionToken: string;
  expiresAt: string;
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
  orderCode: string;
  createdAt: string;
}
