import { IntegrationLog, SyncStatus } from '@/lib/types'

const syncStatuses: SyncStatus[] = ['pending', 'processing', 'success', 'failed']
const integrations: ('google_sheet' | 'pancake' | 'best')[] = [
  'google_sheet',
  'pancake',
  'best',
]

function generateMockIntegrationLogs(count: number): IntegrationLog[] {
  const logs: IntegrationLog[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const minutesAgo = Math.floor(Math.random() * 1440) // Last 24 hours
    const date = new Date(now)
    date.setMinutes(date.getMinutes() - minutesAgo)

    const status = syncStatuses[Math.floor(Math.random() * syncStatuses.length)]
    const integration = integrations[Math.floor(Math.random() * integrations.length)]

    const log: IntegrationLog = {
      id: `log_${i + 1}`,
      integration,
      orderCode: `ORD${String(Math.floor(Math.random() * 100000) + 1).padStart(6, '0')}`,
      action: 'Đồng bộ đơn hàng',
      status,
      attempts: Math.floor(Math.random() * 4) + 1,
      externalId: status === 'success' ? `EXT${i}` : undefined,
      lastError:
        status === 'failed'
          ? 'Timeout kết nối hoặc API không phản hồi'
          : undefined,
      nextRetry: status === 'failed' ? new Date(date.getTime() + 3600000) : undefined,
      createdAt: date,
      updatedAt: date,
    }

    logs.push(log)
  }

  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const mockIntegrationLogs: IntegrationLog[] = generateMockIntegrationLogs(25)
