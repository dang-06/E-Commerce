import { Order, OrderStatus, PaymentStatus, SyncStatus } from '@/lib/types'

const statuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'shipping',
  'delivered',
  'cancelled',
  'returned',
]
const paymentStatuses: PaymentStatus[] = ['unpaid', 'paid', 'refunded']
const syncStatuses: SyncStatus[] = ['pending', 'syncing', 'success', 'failed']

const phoneNumbers = [
  '0901234567',
  '0912345678',
  '0923456789',
  '0934567890',
  '0945678901',
  '0956789012',
  '0967890123',
  '0978901234',
  '0989012345',
  '0990123456',
  '0901111111',
  '0912222222',
  '0923333333',
  '0934444444',
  '0945555555',
  '0956666666',
  '0967777777',
  '0978888888',
  '0989999999',
  '0991111111',
]

const names = [
  'Nguyễn Văn A',
  'Trần Thị B',
  'Phạm Văn C',
  'Hoàng Thị D',
  'Đỗ Văn E',
  'Vũ Thị F',
  'Bùi Văn G',
  'Dương Thị H',
  'Tạ Văn I',
  'Trương Thị J',
  'Lê Văn K',
  'Ngô Thị L',
  'Tây Văn M',
  'Đặng Thị N',
  'Kiều Văn O',
  'Mai Thị P',
  'Phan Văn Q',
  'Quân Thị R',
  'Rồng Văn S',
  'Sâm Thị T',
]

const addresses = [
  '123 Nguyễn Huệ, Quận 1, TP.HCM',
  '456 Trần Hưng Đạo, Quận 5, TP.HCM',
  '789 Lê Lai, Quận 1, TP.HCM',
  '321 Hai Bà Trưng, Hà Nội',
  '654 Phố Huế, Hà Nội',
  '987 Đường Lê Duẩn, TP.HCM',
  '111 Sư Vạn Hạnh, Quận 10, TP.HCM',
  '222 Đồng Khởi, Quận 1, TP.HCM',
  '333 Rạch Kiến, Quận 3, TP.HCM',
  '444 Bến Chương Dương, Quận 1, TP.HCM',
  '555 Trịnh Công Sơn, Quận 4, TP.HCM',
  '666 Mạc Đỉnh Chi, Quận 3, TP.HCM',
  '777 Trần Quang Khải, Quận 1, TP.HCM',
  '888 Ngô Gia Tự, Quận 10, TP.HCM',
  '999 Hồ Hùng Anh, Quận 1, TP.HCM',
  '101 Tôn Thất Tùng, Quận 1, TP.HCM',
  '202 Calmette, Quận 1, TP.HCM',
  '303 Trần Minh Dũng, Quận 1, TP.HCM',
  '404 Tây Sơn, Quận 1, TP.HCM',
  '505 Lê Anh Xuân, Quận 1, TP.HCM',
]

function generateMockOrders(count: number): Order[] {
  const orders: Order[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)

    const phone = phoneNumbers[i % phoneNumbers.length]
    const name = names[i % names.length]
    const address = addresses[i % addresses.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
    const syncStatus = syncStatuses[Math.floor(Math.random() * syncStatuses.length)]

    const subtotal = Math.floor(Math.random() * 40000000) + 5000000
    const discountApplied = Math.random() > 0.6
    const discount = discountApplied ? 25000 : 0
    const shipping = Math.floor(Math.random() * 300000) + 30000
    const total = subtotal - discount + shipping

    const order: Order = {
      id: `order_${i + 1}`,
      code: `ORD${String(i + 1).padStart(6, '0')}`,
      date,
      recipientName: name,
      phone,
      address,
      items: [
        {
          id: `item_${i}_1`,
          productId: `prod_${(i % 9) + 1}`,
          productName: 'Sản phẩm mẫu',
          sku: `SKU${i}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Math.floor(Math.random() * 30000000) + 1000000,
          discount: 0,
        },
      ],
      subtotal,
      discount,
      discountApplied,
      shipping,
      total,
      status,
      paymentStatus,
      syncStatus,
      notes: Math.random() > 0.7 ? 'Ghi chú bổ sung cho đơn hàng' : '',
      pancakeOrderId: Math.random() > 0.5 ? `PANCAKE${i}` : undefined,
      shippingId: Math.random() > 0.4 ? `SHIP${i}` : undefined,
      externalSyncId: syncStatus === 'success' ? `EXT${i}` : undefined,
      lastSyncAttempt: daysAgo < 5 ? new Date(date.getTime() + Math.random() * 86400000) : undefined,
      syncError:
        syncStatus === 'failed' ? 'Lỗi kết nối tới server đồng bộ' : undefined,
      createdAt: date,
      updatedAt: date,
    }

    orders.push(order)
  }

  return orders
}

export const mockOrders: Order[] = generateMockOrders(35)
