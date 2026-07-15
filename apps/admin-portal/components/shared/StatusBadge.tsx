import { Badge } from '@/components/ui/badge'
import { OrderStatus, PaymentStatus, SyncStatus } from '@/lib/types'

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-amber-100 text-amber-800',
  shipping: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
}

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipping: 'Đang vận chuyển',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  returned: 'Hoàn hàng',
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Hoàn tiền',
}

const syncStatusColors: Record<SyncStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const syncStatusLabels: Record<SyncStatus, string> = {
  pending: 'Chưa đồng bộ',
  processing: 'Đang xử lý',
  success: 'Thành công',
  failed: 'Thất bại',
}

interface StatusBadgeProps {
  type: 'order' | 'payment' | 'sync'
  status: OrderStatus | PaymentStatus | SyncStatus
  className?: string
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let colors = ''
  let label = ''

  if (type === 'order') {
    colors = orderStatusColors[status as OrderStatus]
    label = orderStatusLabels[status as OrderStatus]
  } else if (type === 'payment') {
    colors = paymentStatusColors[status as PaymentStatus]
    label = paymentStatusLabels[status as PaymentStatus]
  } else {
    colors = syncStatusColors[status as SyncStatus]
    label = syncStatusLabels[status as SyncStatus]
  }

  return (
    <Badge variant="secondary" className={`${colors} ${className ?? ''}`}>
      {label}
    </Badge>
  )
}
