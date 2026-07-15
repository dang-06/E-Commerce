/**
 * Core type definitions for Vietnamese e-commerce platform
 */

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  image: string
  listedPrice: number
  category: string
  inStock: boolean
  relatedProductIds?: string[]
}

export interface CartItem {
  productId: string
  quantity: number
  addedAt: number
}

export interface PromotionStatus {
  phone: string
  isEligible: boolean
  checkedAt: number
  discountPerUnit: number
}

export interface Order {
  id: string
  code: string
  phone: string
  recipientName: string
  recipientPhone: string
  province: string
  district: string
  ward: string
  address: string
  notes?: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  paymentMethod: 'cod' | 'bank'
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: number
  updatedAt: number
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  listedPrice: number
  promotionalPrice: number
  quantity: number
}

export interface CheckoutFormData {
  recipientName: string
  recipientPhone: string
  province: string
  district: string
  ward: string
  address: string
  notes?: string
  paymentMethod: 'cod' | 'bank'
}

export interface VietnamLocation {
  code: string
  name: string
}

export interface District extends VietnamLocation {
  provinceCode: string
}

export interface Ward extends VietnamLocation {
  districtCode: string
}
