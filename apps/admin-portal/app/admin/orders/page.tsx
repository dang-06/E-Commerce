'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PhoneMask } from '@/components/shared/PhoneMask'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Download } from 'lucide-react'
import { Order } from '@/lib/types'
import { orderService } from '@/lib/services/api-service'
import { formatVietnameseDate } from '@/lib/utils/vietnamese'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await orderService.getOrders()
        setOrders(data)
      } catch (e) {
        console.error('Failed to load orders:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadOrders()
  }, [])

  const filteredOrders = orders.filter((o) =>
    o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone.includes(searchTerm)
  )

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'code',
      header: 'Mã đơn hàng',
      cell: ({ row }) => <span className="font-mono font-semibold text-primary">{row.original.code}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Ngày tạo',
      cell: ({ row }) => <span className="text-sm">{formatVietnameseDate(row.original.date)}</span>,
    },
    {
      accessorKey: 'recipientName',
      header: 'Tên khách',
      cell: ({ row }) => row.original.recipientName,
    },
    {
      accessorKey: 'phone',
      header: 'Điện thoại',
      cell: ({ row }) => <PhoneMask phone={row.original.phone} />,
    },
    {
      accessorKey: 'total',
      header: 'Tổng tiền',
      cell: ({ row }) => <MoneyDisplay amount={row.original.total} highlight />,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge type="order" status={row.original.status} />,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Thanh toán',
      cell: ({ row }) => <StatusBadge type="payment" status={row.original.paymentStatus} />,
    },
    {
      accessorKey: 'syncStatus',
      header: 'Đồng bộ',
      cell: ({ row }) => <StatusBadge type="sync" status={row.original.syncStatus} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Đơn hàng' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Đơn hàng</h1>
          <p className="mt-1 text-muted-foreground">Quản lý tất cả đơn hàng của cửa hàng</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Xuất Excel
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm kiếm theo mã đơn, tên khách hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : (
        <DataTable columns={columns} data={filteredOrders} pageSize={15} />
      )}
    </div>
  )
}
