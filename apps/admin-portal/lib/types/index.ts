// User & Auth
export type UserRole = 'admin' | 'operator'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
}

// Product
export interface Product {
  id: string
  sku: string
  slug: string
  name: string
  shortDescription: string
  description: string
  listedPrice: number
  discountAmount: number
  image: string
  category: string
  stock?: number
  isPromotionEligible: boolean
  isActive: boolean
  visibility: 'visible' | 'hidden'
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// Order Status
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed'

// Order
export interface OrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  price: number
  discount: number
}

export interface Order {
  id: string
  code: string
  date: Date
  recipientName: string
  phone: string
  address: string
  items: OrderItem[]
  subtotal: number
  discount: number
  discountApplied: boolean
  shipping: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  syncStatus: SyncStatus
  notes: string
  pancakeOrderId?: string
  shippingId?: string
  externalSyncId?: string
  lastSyncAttempt?: Date
  syncError?: string
  createdAt: Date
  updatedAt: Date
}

// Eligible Customer
export interface EligibleCustomer {
  id: string
  phone: string
  source: 'manual' | 'excel' | 'google_sheet' | 'pancake' | 'best'
  reason: string
  status: 'active' | 'inactive'
  usageCount: number
  usageLimit: number
  lastOrderDate?: Date
  importedAt: Date
  createdAt: Date
}

// Integration
export type IntegrationType = 'google_sheet' | 'pancake' | 'best'

export interface IntegrationLog {
  id: string
  integration: IntegrationType
  orderCode: string
  action: string
  status: SyncStatus
  attempts: number
  externalId?: string
  lastError?: string
  nextRetry?: Date
  requestData?: Record<string, any>
  responseData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Audit Log
export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, any>
  ipAddress?: string
  device?: string
  createdAt: Date
}

// Settings
export interface PromotionSettings {
  name: string
  discountAmount: number
  startDate: Date
  endDate: Date
  usageLimit: number
  maxQtyPerOrder: number
  eligibleProductIds: string[]
  isActive: boolean
}

export interface ShippingSettings {
  fixedFee: number
  freeShippingThreshold: number
  addressBased?: Record<string, number>
}

export interface OrderSettings {
  codePrefix: string
  defaultStatus: OrderStatus
  supportedPaymentMethods: string[]
}

export interface IntegrationSettings {
  pancake?: {
    configured: boolean
    apiKey?: string
  }
  googleSheet?: {
    configured: boolean
    spreadsheetId?: string
  }
  bestExpress?: {
    configured: boolean
    apiKey?: string
  }
}

export interface AppSettings {
  promotion: PromotionSettings
  shipping: ShippingSettings
  orders: OrderSettings
  integrations: IntegrationSettings
}
