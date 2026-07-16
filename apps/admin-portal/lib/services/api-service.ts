'use client'

import { getStoredAuth } from '@/lib/services/auth'
import {
  AuditLog,
  EligibleCustomer,
  GoogleSheetConfig,
  GoogleSheetConfigs,
  GoogleSheetPurpose,
  IntegrationLog,
  Order,
  Product,
} from '@/lib/types'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message)
  }
}

interface ApiProduct {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  listedPrice: string
  stockQuantity: number | null
  isPromotionEligible: boolean
  discountAmount: string
  isActive: boolean
  sortOrder: number
  colorVariants: ApiProductColorVariant[]
  createdAt: string
  updatedAt: string
}

interface ApiProductColorVariant {
  id: string
  name: string
  colorCode: string | null
  imageUrl: string
  sku: string | null
  sortOrder: number
}

interface ApiProductImageUpload {
  imageUrl: string
  publicId: string
  width: number | null
  height: number | null
  format: string | null
}

interface ApiOrderLine {
  productId: string
  sku: string
  productName: string
  listedPrice: string
  discountPerItem: string
  finalUnitPrice: string
  quantity: number
}

interface ApiOrder {
  id: string
  orderCode: string
  createdAt: string
  updatedAt: string
  recipientName: string
  recipientPhone: string
  address: string
  province: string
  district: string
  ward: string
  subtotal: string
  discountAmount: string
  shippingFee: string
  totalAmount: string
  isPromotionApplied: boolean
  orderStatus: string
  paymentStatus: string
  syncStatus: string
  note: string | null
  pancakeOrderId: string | null
  shippingOrderId: string | null
  items: ApiOrderLine[]
}

interface ApiEligibleCustomer {
  id: string
  phoneMasked: string
  source: string
  eligibilityReason: string
  successfulOrderAt: string | null
  usageCount: number
  usageLimit: number | null
  isActive: boolean
  importedAt: string
  createdAt: string
}

interface ApiIntegrationJob {
  id: string
  orderCode: string
  integration: string
  action: string
  status: string
  attemptCount: number
  nextRetryAt: string | null
  externalId: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

interface ApiAuditLog {
  id: string
  adminId: string | null
  adminName: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface ApiGoogleSheetConfig {
  id: string
  purpose: GoogleSheetPurpose
  sheetUrl: string
  spreadsheetId: string
  worksheetName: string | null
  phoneColumn: string | null
  orderMapping: Record<string, unknown> | null
  isActive: boolean
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

interface ApiGoogleSheetConfigs {
  eligibleCustomers: ApiGoogleSheetConfig | null
  orders: ApiGoogleSheetConfig | null
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth()
  const headers = new Headers(init.headers)
  if (!(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json')
  }
  if (auth?.token) {
    headers.set('authorization', `Bearer ${auth.token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })
  if (!response.ok) {
    const body = await readResponseBody(response)
    throw new ApiRequestError(extractApiErrorMessage(body, response.status), response.status, body)
  }
  return (await response.json()) as T
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function extractApiErrorMessage(body: unknown, status: number): string {
  if (!body || typeof body !== 'object') {
    return `API request failed: ${status}`
  }
  const candidate = body as { message?: unknown; error?: unknown }
  if (Array.isArray(candidate.message)) {
    return candidate.message.filter((item): item is string => typeof item === 'string').join('\n')
  }
  if (typeof candidate.message === 'string') {
    return candidate.message
  }
  if (typeof candidate.error === 'string') {
    return candidate.error
  }
  return `API request failed: ${status}`
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

export const productService = {
  async getProducts(): Promise<Product[]> {
    return (await requestJson<ApiProduct[]>('/admin/products')).map(toProduct)
  },

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts()
    return products.find((product) => product.id === id) ?? null
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return toProduct(
      await requestJson<ApiProduct>('/admin/products', {
        body: JSON.stringify(toProductPayload(product)),
        method: 'POST',
      }),
    )
  },

  async uploadProductImage(file: File): Promise<ApiProductImageUpload> {
    const form = new FormData()
    form.set('file', file)
    return requestJson<ApiProductImageUpload>('/admin/products/images', {
      body: form,
      method: 'POST',
    })
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    return toProduct(
      await requestJson<ApiProduct>(`/admin/products/${id}`, {
        body: JSON.stringify(toProductPayload(updates)),
        method: 'PATCH',
      }),
    )
  },

  async deleteProduct(id: string): Promise<boolean> {
    await requestJson<ApiProduct>(`/admin/products/${id}`, { method: 'DELETE' })
    return true
  },
}

export const orderService = {
  async getOrders(): Promise<Order[]> {
    return (await requestJson<ApiOrder[]>('/admin/orders')).map(toOrder)
  },

  async getOrderById(id: string): Promise<Order | null> {
    return toOrder(await requestJson<ApiOrder>(`/admin/orders/${id}`))
  },

  async getOrderByCode(code: string): Promise<Order | null> {
    const orders = await this.getOrders()
    return orders.find((order) => order.code === code) ?? null
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (!updates.status) {
      return this.getOrderById(id)
    }
    return toOrder(
      await requestJson<ApiOrder>(`/admin/orders/${id}/status`, {
        body: JSON.stringify({ status: toApiOrderStatus(updates.status) }),
        method: 'PATCH',
      }),
    )
  },

  async addOrderNote(id: string): Promise<Order | null> {
    return this.getOrderById(id)
  },
}

export const eligibleCustomerService = {
  async getCustomers(): Promise<EligibleCustomer[]> {
    return (await requestJson<ApiEligibleCustomer[]>('/admin/eligible-customers')).map(toEligibleCustomer)
  },

  async getCustomerByPhone(phone: string): Promise<EligibleCustomer | null> {
    const customers = await this.getCustomers()
    return customers.find((customer) => customer.phone.includes(phone)) ?? null
  },

  async importFile(file: File): Promise<{ imported: number; updated: number; duplicates: number; errors: number }> {
    const form = new FormData()
    form.set('file', file)
    form.set('source', 'import')
    form.set('eligibilityReason', 'imported')
    const result = await requestJson<{ success: number; updated: number; invalid: number; duplicate: number }>(
      '/admin/eligible-customers/import',
      { body: form, method: 'POST' },
    )
    return {
      imported: result.success,
      updated: result.updated,
      duplicates: result.duplicate,
      errors: result.invalid,
    }
  },

  async updateCustomer(id: string, updates: Partial<EligibleCustomer>): Promise<EligibleCustomer | null> {
    return toEligibleCustomer(
      await requestJson<ApiEligibleCustomer>(`/admin/eligible-customers/${id}/status`, {
        body: JSON.stringify({ isActive: updates.status === 'active' }),
        method: 'PATCH',
      }),
    )
  },
}

export const integrationService = {
  async getLogs(): Promise<IntegrationLog[]> {
    return (await requestJson<ApiIntegrationJob[]>('/admin/integrations')).map(toIntegrationLog)
  },

  async retrySync(logId: string): Promise<boolean> {
    await requestJson<ApiIntegrationJob>(`/admin/integrations/${logId}/retry`, { method: 'POST' })
    return true
  },

  async retrySyncSelected(logIds: string[]): Promise<{ succeeded: number; failed: number }> {
    const results = await Promise.allSettled(logIds.map((id) => this.retrySync(id)))
    return {
      failed: results.filter((result) => result.status === 'rejected').length,
      succeeded: results.filter((result) => result.status === 'fulfilled').length,
    }
  },

  async getIntegrationStatus(): Promise<Record<string, 'connected' | 'degraded' | 'disconnected'>> {
    const logs = await this.getLogs()
    return {
      best: statusForIntegration(logs, 'best'),
      google_sheet: statusForIntegration(logs, 'google_sheet'),
      pancake: statusForIntegration(logs, 'pancake'),
    }
  },

  async getGoogleSheetConfigs(): Promise<GoogleSheetConfigs> {
    const configs = await requestJson<ApiGoogleSheetConfigs>('/admin/integrations/google-sheets')
    return {
      eligibleCustomers: configs.eligibleCustomers ? toGoogleSheetConfig(configs.eligibleCustomers) : null,
      orders: configs.orders ? toGoogleSheetConfig(configs.orders) : null,
    }
  },

  async saveGoogleSheetConfig(
    purpose: GoogleSheetPurpose,
    payload: {
      sheetUrl: string
      worksheetName?: string
      phoneColumn?: string
      orderMapping?: Record<string, unknown>
      isActive?: boolean
    },
  ): Promise<GoogleSheetConfig> {
    return toGoogleSheetConfig(
      await requestJson<ApiGoogleSheetConfig>(`/admin/integrations/google-sheets/${purpose}`, {
        body: JSON.stringify(payload),
        method: 'PUT',
      }),
    )
  },
}

export const auditLogService = {
  async getLogs(): Promise<AuditLog[]> {
    return (await requestJson<ApiAuditLog[]>('/admin/audit-logs')).map(toAuditLog)
  },

  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    return (await this.getLogs()).filter((log) => log.userId === userId)
  },

  async getLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return (await this.getLogs()).filter((log) => log.entityType === entityType && log.entityId === entityId)
  },
}

export const dashboardService = {
  async getStats(): Promise<{
    todayOrders: number
    todayRevenue: number
    eligibleUsers: number
    pendingOrders: number
    failedSyncs: number
  }> {
    const [orders, customers, logs] = await Promise.all([
      orderService.getOrders(),
      eligibleCustomerService.getCustomers(),
      integrationService.getLogs(),
    ])
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = orders.filter((order) => order.createdAt >= today)
    return {
      eligibleUsers: customers.filter((customer) => customer.status === 'active').length,
      failedSyncs: logs.filter((log) => log.status === 'failed').length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
    }
  },

  async getRecentOrders(limit = 10): Promise<Order[]> {
    return (await orderService.getOrders()).slice(0, limit)
  },

  async getTopProducts(limit = 5): Promise<Product[]> {
    return (await productService.getProducts())
      .sort((left, right) => (right.stock ?? 0) - (left.stock ?? 0))
      .slice(0, limit)
  },
}

function toProduct(product: ApiProduct): Product {
  const description = product.description ?? ''
  return {
    category: '',
    colorVariants: product.colorVariants.map((variant) => ({
      id: variant.id,
      colorCode: variant.colorCode ?? '',
      imageUrl: variant.imageUrl,
      name: variant.name,
      sku: variant.sku ?? undefined,
      sortOrder: variant.sortOrder,
    })),
    createdAt: new Date(product.createdAt),
    description,
    discountAmount: Number(product.discountAmount),
    id: product.id,
    image: product.imageUrl ?? '',
    isActive: product.isActive,
    isPromotionEligible: product.isPromotionEligible,
    listedPrice: Number(product.listedPrice),
    name: product.name,
    shortDescription: description.slice(0, 120),
    sku: product.sku,
    slug: product.slug,
    sortOrder: product.sortOrder,
    stock: product.stockQuantity ?? undefined,
    updatedAt: new Date(product.updatedAt),
    visibility: product.isActive ? 'visible' : 'hidden',
  }
}

function toProductPayload(product: Partial<Product>): Record<string, unknown> {
  return {
    ...(product.sku !== undefined ? { sku: product.sku } : {}),
    ...(product.name !== undefined ? { name: product.name } : {}),
    ...(product.slug !== undefined ? { slug: product.slug } : {}),
    ...(product.description !== undefined ? { description: product.description } : {}),
    ...(product.image !== undefined && product.image ? { imageUrl: product.image } : {}),
    ...(product.listedPrice !== undefined ? { listedPrice: product.listedPrice } : {}),
    ...(product.stock !== undefined ? { stockQuantity: product.stock } : {}),
    ...(product.isPromotionEligible !== undefined ? { isPromotionEligible: product.isPromotionEligible } : {}),
    ...(product.discountAmount !== undefined ? { discountAmount: product.discountAmount } : {}),
    ...(product.isActive !== undefined ? { isActive: product.isActive } : {}),
    ...(product.sortOrder !== undefined ? { sortOrder: product.sortOrder } : {}),
    ...(product.colorVariants !== undefined
      ? {
          colorVariants: product.colorVariants
            .filter((variant) => variant.name.trim() && variant.imageUrl.trim())
            .map((variant) => {
              const colorCode = variant.colorCode.trim()
              const sku = variant.sku?.trim()
              return {
                ...(colorCode ? { colorCode } : {}),
                imageUrl: variant.imageUrl.trim(),
                name: variant.name.trim(),
                ...(sku ? { sku } : {}),
                sortOrder: variant.sortOrder,
              }
            }),
        }
      : {}),
  }
}

function toOrder(order: ApiOrder): Order {
  return {
    address: `${order.address}, ${order.ward}, ${order.district}, ${order.province}`,
    code: order.orderCode,
    createdAt: new Date(order.createdAt),
    date: new Date(order.createdAt),
    discount: Number(order.discountAmount),
    discountApplied: order.isPromotionApplied,
    externalSyncId: undefined,
    id: order.id,
    items: order.items.map((item, index) => ({
      discount: Number(item.discountPerItem),
      id: `${order.id}-${index}`,
      price: Number(item.finalUnitPrice),
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      sku: item.sku,
    })),
    notes: order.note ?? '',
    pancakeOrderId: order.pancakeOrderId ?? undefined,
    paymentStatus: toUiPaymentStatus(order.paymentStatus),
    phone: order.recipientPhone,
    recipientName: order.recipientName,
    shipping: Number(order.shippingFee),
    shippingId: order.shippingOrderId ?? undefined,
    status: toUiOrderStatus(order.orderStatus),
    subtotal: Number(order.subtotal),
    syncStatus: toUiSyncStatus(order.syncStatus),
    total: Number(order.totalAmount),
    updatedAt: new Date(order.updatedAt),
  }
}

function toEligibleCustomer(customer: ApiEligibleCustomer): EligibleCustomer {
  return {
    createdAt: new Date(customer.createdAt),
    id: customer.id,
    importedAt: new Date(customer.importedAt),
    lastOrderDate: customer.successfulOrderAt ? new Date(customer.successfulOrderAt) : undefined,
    phone: customer.phoneMasked,
    reason: customer.eligibilityReason,
    source: toUiCustomerSource(customer.source),
    status: customer.isActive ? 'active' : 'inactive',
    usageCount: customer.usageCount,
    usageLimit: customer.usageLimit ?? 0,
  }
}

function toIntegrationLog(job: ApiIntegrationJob): IntegrationLog {
  return {
    action: job.action,
    attempts: job.attemptCount,
    createdAt: new Date(job.createdAt),
    externalId: job.externalId ?? undefined,
    id: job.id,
    integration: toUiIntegration(job.integration),
    lastError: job.lastError ?? undefined,
    nextRetry: job.nextRetryAt ? new Date(job.nextRetryAt) : undefined,
    orderCode: job.orderCode,
    status: toUiSyncStatus(job.status),
    updatedAt: new Date(job.updatedAt),
  }
}

function toAuditLog(log: ApiAuditLog): AuditLog {
  return {
    action: log.action,
    changes: log.metadata ?? undefined,
    createdAt: new Date(log.createdAt),
    entityId: log.entityId ?? '',
    entityType: log.entityType,
    id: log.id,
    userId: log.adminId ?? 'system',
    userName: log.adminName,
  }
}

function toGoogleSheetConfig(config: ApiGoogleSheetConfig): GoogleSheetConfig {
  return {
    ...config,
    createdAt: new Date(config.createdAt),
    lastSyncAt: config.lastSyncAt ? new Date(config.lastSyncAt) : null,
    updatedAt: new Date(config.updatedAt),
  }
}

function toUiOrderStatus(status: string): Order['status'] {
  const map: Record<string, Order['status']> = {
    cancelled: 'cancelled',
    confirmed: 'confirmed',
    delivered: 'delivered',
    failed: 'cancelled',
    pending: 'pending',
    processing: 'preparing',
    shipped: 'shipping',
  }
  return map[status] ?? 'pending'
}

function toApiOrderStatus(status: Order['status']): string {
  const map: Record<Order['status'], string> = {
    cancelled: 'cancelled',
    confirmed: 'confirmed',
    delivered: 'delivered',
    pending: 'pending',
    preparing: 'processing',
    returned: 'cancelled',
    shipping: 'shipped',
  }
  return map[status]
}

function toUiPaymentStatus(status: string): Order['paymentStatus'] {
  if (status === 'paid') return 'paid'
  if (status === 'refunded') return 'refunded'
  return 'unpaid'
}

function toUiSyncStatus(status: string): Order['syncStatus'] {
  if (status === 'success' || status === 'processing' || status === 'pending') return status
  return 'failed'
}

function toUiCustomerSource(source: string): EligibleCustomer['source'] {
  const map: Record<string, EligibleCustomer['source']> = {
    best: 'best',
    import: 'excel',
    manual: 'manual',
    pancake: 'pancake',
    sheet: 'google_sheet',
  }
  return map[source] ?? 'manual'
}

function toUiIntegration(integration: string): IntegrationLog['integration'] {
  if (integration === 'sheet') return 'google_sheet'
  if (integration === 'best') return 'best'
  return 'pancake'
}

function statusForIntegration(
  logs: IntegrationLog[],
  integration: IntegrationLog['integration'],
): 'connected' | 'degraded' | 'disconnected' {
  const scoped = logs.filter((log) => log.integration === integration)
  if (scoped.length === 0) return 'disconnected'
  if (scoped.some((log) => log.status === 'failed')) return 'degraded'
  return 'connected'
}
