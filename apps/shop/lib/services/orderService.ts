import type { Order, CheckoutFormData, CartItem } from '@/lib/types'
import { generateOrderCode } from '@/lib/utils'

/**
 * Mock Order Service
 * Replace with real API calls when backend is ready
 */

export interface CreateOrderPayload {
  phone: string
  items: CartItem[]
  formData: CheckoutFormData
  subtotal: number
  discount: number
  shippingFee: number
  total: number
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  // Simulate network delay and validation
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // MOCK: Create order with generated code
  // In production, replace with:
  // const response = await fetch('/api/orders', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // })
  // const data = await response.json()
  // if (!response.ok) throw new Error(data.message)
  // return data.order

  const orderCode = generateOrderCode(Math.floor(Math.random() * 9999))
  const orderId = `ORD${Date.now()}`

  const order: Order = {
    id: orderId,
    code: orderCode,
    phone: payload.phone,
    recipientName: payload.formData.recipientName,
    recipientPhone: payload.formData.recipientPhone,
    province: payload.formData.province,
    district: payload.formData.district,
    ward: payload.formData.ward,
    address: payload.formData.address,
    notes: payload.formData.notes,
    items: payload.items.map((item) => ({
      productId: item.productId,
      productName: `Product ${item.productId}`,
      productImage: '/products/placeholder.png',
      listedPrice: 0,
      promotionalPrice: 0,
      quantity: item.quantity,
    })),
    subtotal: payload.subtotal,
    discount: payload.discount,
    shippingFee: payload.shippingFee,
    total: payload.total,
    paymentMethod: payload.formData.paymentMethod,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return order
}

export async function getOrder(orderId: string): Promise<Order | null> {
  // MOCK: Fetch order details
  // In production, replace with:
  // const response = await fetch(`/api/orders/${orderId}`)
  // return response.json()

  // Simulate not found for demo purposes
  return null
}
