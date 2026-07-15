import { EligibleCustomer } from '@/lib/types'

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
  '0901212121',
  '0912343434',
  '0923454545',
  '0934565656',
  '0945676767',
  '0956787878',
  '0967898989',
  '0978909090',
  '0989101010',
  '0990202020',
  '0901303030',
  '0912404040',
  '0923505050',
  '0934606060',
  '0945707070',
]

const sources: Array<'manual' | 'excel' | 'google_sheet' | 'pancake' | 'best'> = [
  'manual',
  'excel',
  'google_sheet',
  'pancake',
  'best',
]

const reasons = [
  'Khách hàng VIP',
  'Mua lần đầu',
  'Khách hàng cũ',
  'Tham gia chương trình khuyến mãi',
  'Bạn bè giới thiệu',
  'Khách hàng tập đoàn',
  'Hợp tác kinh doanh',
  'Ưu đãi mùa',
]

function generateMockCustomers(count: number): EligibleCustomer[] {
  const customers: EligibleCustomer[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90)
    const importedAt = new Date(now)
    importedAt.setDate(importedAt.getDate() - daysAgo)

    const lastOrderDaysAgo = Math.floor(Math.random() * 60)
    const lastOrderDate = new Date(now)
    lastOrderDate.setDate(lastOrderDate.getDate() - lastOrderDaysAgo)

    const customer: EligibleCustomer = {
      id: `cust_${i + 1}`,
      phone: phoneNumbers[i % phoneNumbers.length],
      source: sources[Math.floor(Math.random() * sources.length)],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      usageCount: Math.floor(Math.random() * 12),
      usageLimit: 12,
      lastOrderDate: Math.random() > 0.3 ? lastOrderDate : undefined,
      importedAt,
      createdAt: importedAt,
    }

    customers.push(customer)
  }

  return customers
}

export const mockEligibleCustomers: EligibleCustomer[] = generateMockCustomers(35)
