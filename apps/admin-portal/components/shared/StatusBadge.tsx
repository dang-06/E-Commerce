import { Badge } from '@/components/ui/badge'
import { OrderStatus, PaymentStatus, SyncStatus } from '@/lib/types'

const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  confirmed: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  preparing: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  shipping: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  delivered:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
  returned:
    'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200',
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
  unpaid: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  refunded: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-200',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Hoàn tiền',
}

const syncStatusColors: Record<SyncStatus, string> = {
  pending: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-200',
  processing: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  failed: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
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
    <Badge variant="outline" className={`gap-1.5 rounded-md px-2 ${colors} ${className ?? ''}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true"></span>
      {label}
    </Badge>
  )
}
