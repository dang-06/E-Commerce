import { AuditLog } from '@/lib/types'

const actions = [
  'Tạo mới',
  'Cập nhật',
  'Xóa',
  'Duyệt dơn hàng',
  'Hủy đơn hàng',
  'Thay đổi trạng thái',
  'Thêm ghi chú',
  'Xuất báo cáo',
  'Nhập dữ liệu',
  'Đồng bộ hệ thống',
]

const entityTypes = ['Đơn hàng', 'Sản phẩm', 'Khách hàng', 'Cấu hình', 'Tài khoản']

function generateMockAuditLogs(count: number): AuditLog[] {
  const logs: AuditLog[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const minutesAgo = Math.floor(Math.random() * 2880) // Last 48 hours
    const date = new Date(now)
    date.setMinutes(date.getMinutes() - minutesAgo)

    const log: AuditLog = {
      id: `audit_${i + 1}`,
      userId: Math.random() > 0.5 ? 'user_admin' : 'user_operator',
      userName: Math.random() > 0.5 ? 'Quản lý cửa hàng' : 'Nhân viên kinh doanh',
      action: actions[Math.floor(Math.random() * actions.length)],
      entityType: entityTypes[Math.floor(Math.random() * entityTypes.length)],
      entityId: `entity_${Math.floor(Math.random() * 1000)}`,
      changes: {
        status: 'pending -> confirmed',
        updatedAt: date.toISOString(),
      },
      ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      device: Math.random() > 0.5 ? 'Chrome/Desktop' : 'Safari/iPad',
      createdAt: date,
    }

    logs.push(log)
  }

  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const mockAuditLogs: AuditLog[] = generateMockAuditLogs(50)
