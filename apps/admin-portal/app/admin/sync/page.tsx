'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { IntegrationLog } from '@/lib/types'
import { integrationService } from '@/lib/services/api-service'
import { formatVietnameseDateTimeWithDay } from '@/lib/utils/vietnamese'

export default function SyncPage() {
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Record<string, 'connected' | 'degraded' | 'disconnected'>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const [logsData, statusData] = await Promise.all([
          integrationService.getLogs(),
          integrationService.getIntegrationStatus(),
        ])
        setLogs(logsData)
        setStatus(statusData)
      } catch (e) {
        console.error('Failed to load sync data:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const failedCount = logs.filter((l) => l.status === 'failed').length

  const columns: ColumnDef<IntegrationLog>[] = [
    {
      accessorKey: 'integration',
      header: 'Hệ thống',
      cell: ({ row }) => {
        const names: Record<string, string> = {
          google_sheet: 'Google Sheet',
          pancake: 'Pancake',
          best: 'BEST Express',
        }
        return <span className="font-semibold">{names[row.original.integration]}</span>
      },
    },
    {
      accessorKey: 'orderCode',
      header: 'Đơn hàng',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.orderCode}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Thao tác',
      cell: ({ row }) => <span className="text-sm">{row.original.action}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Kết quả',
      cell: ({ row }) => <StatusBadge type="sync" status={row.original.status} />,
    },
    {
      accessorKey: 'attempts',
      header: 'Lần thử',
      cell: ({ row }) => <span className="text-sm">{row.original.attempts}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ row }) => <span className="text-xs">{formatVietnameseDateTimeWithDay(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        row.original.status === 'failed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Retry lỗi đồng bộ này?')) {
                void integrationService.retrySync(row.original.id)
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Đồng bộ' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Giám sát đồng bộ</h1>
        <p className="mt-1 text-muted-foreground">Quản lý việc đồng bộ đơn hàng với các hệ thống bên ngoài</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Google Sheet"
          value={status.google_sheet === 'connected' ? 'Kết nối' : 'Ngắt kết nối'}
          variant={status.google_sheet === 'connected' ? 'success' : 'default'}
        />
        <MetricCard
          label="Pancake"
          value={status.pancake === 'connected' ? 'Kết nối' : 'Ngắt kết nối'}
          variant={status.pancake === 'connected' ? 'violet' : 'default'}
        />
        <MetricCard
          label="BEST Express"
          value={status.best === 'degraded' ? 'Cần kiểm tra' : 'Kết nối'}
          variant={status.best === 'degraded' ? 'warning' : 'default'}
        />
      </div>

      {/* Alerts */}
      {failedCount > 0 && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-700 dark:text-rose-200" />
          <div>
            <p className="font-semibold">Có {failedCount} lần đồng bộ cần xử lý</p>
            <p className="mt-1 text-sm text-rose-800 dark:text-rose-200/80">Nhấn nút Retry để thử lại các lần đồng bộ thất bại.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Input placeholder="Tìm kiếm mã đơn hàng..." className="max-w-sm" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : (
        <DataTable columns={columns} data={logs} pageSize={15} />
      )}
    </div>
  )
}
