import { mockProducts } from '@/lib/mock-data/products'
import { mockOrders } from '@/lib/mock-data/orders'
import { mockEligibleCustomers } from '@/lib/mock-data/eligible-customers'
import { mockIntegrationLogs } from '@/lib/mock-data/integration-logs'
import { mockAuditLogs } from '@/lib/mock-data/audit-logs'
import { EligibleCustomer, IntegrationLog, Order, Product, AuditLog } from '@/lib/types'

/**
 * Product Service
 */
export const productService = {
  async getProducts(): Promise<Product[]> {
    await delay(500)
    return [...mockProducts]
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay(300)
    return mockProducts.find((p) => p.id === id) || null
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    await delay(500)
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    return newProduct
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await delay(500)
    const product = mockProducts.find((p) => p.id === id)
    if (!product) return null
    return { ...product, ...updates, updatedAt: new Date() }
  },

  async deleteProduct(id: string): Promise<boolean> {
    await delay(500)
    return true
  },
}

/**
 * Order Service
 */
export const orderService = {
  async getOrders(): Promise<Order[]> {
    await delay(500)
    return [...mockOrders].sort((a, b) => b.date.getTime() - a.date.getTime())
  },

  async getOrderById(id: string): Promise<Order | null> {
    await delay(300)
    return mockOrders.find((o) => o.id === id) || null
  },

  async getOrderByCode(code: string): Promise<Order | null> {
    await delay(300)
    return mockOrders.find((o) => o.code === code) || null
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    await delay(500)
    const order = mockOrders.find((o) => o.id === id)
    if (!order) return null
    return { ...order, ...updates, updatedAt: new Date() }
  },

  async addOrderNote(id: string, note: string): Promise<Order | null> {
    await delay(300)
    const order = mockOrders.find((o) => o.id === id)
    if (!order) return null
    return { ...order, notes: note, updatedAt: new Date() }
  },
}

/**
 * Eligible Customer Service
 */
export const eligibleCustomerService = {
  async getCustomers(): Promise<EligibleCustomer[]> {
    await delay(500)
    return [...mockEligibleCustomers].sort((a, b) => b.importedAt.getTime() - a.importedAt.getTime())
  },

  async getCustomerByPhone(phone: string): Promise<EligibleCustomer | null> {
    await delay(300)
    return mockEligibleCustomers.find((c) => c.phone === phone) || null
  },

  async addCustomer(customer: Omit<EligibleCustomer, 'id' | 'createdAt'>): Promise<EligibleCustomer> {
    await delay(500)
    return {
      ...customer,
      id: `cust_${Date.now()}`,
      createdAt: new Date(),
    }
  },

  async importCustomers(
    customers: Array<Omit<EligibleCustomer, 'id' | 'createdAt'>>
  ): Promise<{ imported: number; duplicates: number; errors: number }> {
    await delay(1500)
    return {
      imported: Math.floor(customers.length * 0.8),
      duplicates: Math.floor(customers.length * 0.15),
      errors: Math.floor(customers.length * 0.05),
    }
  },

  async updateCustomer(id: string, updates: Partial<EligibleCustomer>): Promise<EligibleCustomer | null> {
    await delay(300)
    const customer = mockEligibleCustomers.find((c) => c.id === id)
    if (!customer) return null
    return { ...customer, ...updates }
  },
}

/**
 * Integration Service
 */
export const integrationService = {
  async getLogs(): Promise<IntegrationLog[]> {
    await delay(500)
    return [...mockIntegrationLogs]
  },

  async retrySync(logId: string): Promise<boolean> {
    await delay(1000)
    return true
  },

  async retrySyncSelected(logIds: string[]): Promise<{ succeeded: number; failed: number }> {
    await delay(1500)
    return {
      succeeded: logIds.length,
      failed: 0,
    }
  },

  async getIntegrationStatus(): Promise<Record<string, 'connected' | 'degraded' | 'disconnected'>> {
    await delay(300)
    return {
      google_sheet: 'connected',
      pancake: 'connected',
      best: 'degraded',
    }
  },
}

/**
 * Audit Log Service
 */
export const auditLogService = {
  async getLogs(): Promise<AuditLog[]> {
    await delay(500)
    return [...mockAuditLogs]
  },

  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    await delay(500)
    return mockAuditLogs.filter((l) => l.userId === userId)
  },

  async getLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    await delay(500)
    return mockAuditLogs.filter((l) => l.entityType === entityType && l.entityId === entityId)
  },
}

/**
 * Dashboard Stats Service
 */
export const dashboardService = {
  async getStats(): Promise<{
    todayOrders: number
    todayRevenue: number
    eligibleUsers: number
    pendingOrders: number
    failedSyncs: number
  }> {
    await delay(500)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayOrders = mockOrders.filter((o) => o.date >= today).length
    const todayRevenue = mockOrders
      .filter((o) => o.date >= today)
      .reduce((sum, o) => sum + o.total, 0)

    return {
      todayOrders,
      todayRevenue,
      eligibleUsers: mockEligibleCustomers.filter((c) => c.status === 'active').length,
      pendingOrders: mockOrders.filter((o) => o.status === 'pending').length,
      failedSyncs: mockIntegrationLogs.filter((l) => l.status === 'failed').length,
    }
  },

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    await delay(500)
    return [...mockOrders]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
  },

  async getTopProducts(limit: number = 5): Promise<Product[]> {
    await delay(500)
    return [...mockProducts].sort((a, b) => b.stock! - a.stock!).slice(0, limit)
  },
}

/**
 * Helper function to simulate API delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
