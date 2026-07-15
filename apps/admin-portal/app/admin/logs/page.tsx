'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download } from 'lucide-react'
import { AuditLog } from '@/lib/types'
import { auditLogService } from '@/lib/services/api-service'
import { formatVietnameseDateTimeWithDay } from '@/lib/utils/vietnamese'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await auditLogService.getLogs()
        setLogs(data)
      } catch (e) {
        console.error('Failed to load audit logs:', e)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const filteredLogs = logs.filter((l) =>
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Thời gian',
      cell: ({ row }) => (
        <span className="text-sm">{formatVietnameseDateTimeWithDay(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'Người dùng',
      cell: ({ row }) => <span className="font-semibold">{row.original.userName}</span>,
    },
    {
      accessorKey: 'action',
      header: 'Thao tác',
      cell: ({ row }) => <span className="text-sm">{row.original.action}</span>,
    },
    {
      accessorKey: 'entityType',
      header: 'Loại thực thể',
      cell: ({ row }) => <span className="text-xs bg-muted px-2 py-1 rounded">{row.original.entityType}</span>,
    },
    {
      accessorKey: 'entityId',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.entityId}</span>,
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.ipAddress}</span>,
    },
    {
      accessorKey: 'device',
      header: 'Thiết bị',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.device}</span>,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Nhật ký hoạt động' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nhật ký hoạt động</h1>
          <p className="mt-1 text-muted-foreground">Ghi lại tất cả các hoạt động của người dùng</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm kiếm theo thao tác hoặc người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : (
        <DataTable columns={columns} data={filteredLogs} pageSize={15} />
      )}
    </div>
  )
}
