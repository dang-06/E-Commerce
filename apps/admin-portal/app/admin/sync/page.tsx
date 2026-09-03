'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MetricCard } from '@/components/shared/MetricCard'
import { PhoneMask } from '@/components/shared/PhoneMask'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, AlertCircle, CheckCircle2, KeyRound, ExternalLink } from 'lucide-react'
import { IntegrationLog, SpxAccount, SpxShipmentListItem } from '@/lib/types'
import { getErrorMessage, integrationService } from '@/lib/services/api-service'
import { formatVietnameseDateTimeWithDay } from '@/lib/utils/vietnamese'

export default function SyncPage() {
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [spxAccounts, setSpxAccounts] = useState<SpxAccount[]>([])
  const [spxShipments, setSpxShipments] = useState<SpxShipmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Record<string, 'connected' | 'degraded' | 'disconnected'>>({})
  const [spxPhone, setSpxPhone] = useState('')
  const [spxEmail, setSpxEmail] = useState('')
  const [spxSaving, setSpxSaving] = useState(false)
  const [spxMessage, setSpxMessage] = useState('')
  const [spxError, setSpxError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [logsData, statusData, accountsData, shipmentsData] = await Promise.all([
          integrationService.getLogs(),
          integrationService.getIntegrationStatus(),
          integrationService.getSpxAccounts(),
          integrationService.getSpxShipments(),
        ])
        setLogs(logsData)
        setStatus(statusData)
        setSpxAccounts(accountsData)
        setSpxShipments(shipmentsData)
      } catch (e) {
        console.error('Failed to load sync data:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const failedCount = logs.filter((l) => l.status === 'failed').length
  const activeSpxAccount = spxAccounts.find((account) => account.isActive)

  const refreshSpxAccounts = async () => {
    setSpxAccounts(await integrationService.getSpxAccounts())
  }

  const refreshSpxShipments = async () => {
    setSpxShipments(await integrationService.getSpxShipments())
  }

  const createSpxAccount = async () => {
    setSpxSaving(true)
    setSpxMessage('')
    setSpxError('')
    try {
      const account = await integrationService.createSpxAccount({
        phone: spxPhone,
        ...(spxEmail.trim() ? { email: spxEmail.trim() } : {}),
      })
      setSpxMessage(`Đã tạo và xác thực tài khoản SPX user_id ${account.userId}.`)
      setSpxPhone('')
      setSpxEmail('')
      await refreshSpxAccounts()
    } catch (error) {
      setSpxError(getErrorMessage(error))
    } finally {
      setSpxSaving(false)
    }
  }

  const verifySpxAccount = async (id: string) => {
    setSpxSaving(true)
    setSpxMessage('')
    setSpxError('')
    try {
      const account = await integrationService.verifySpxAccount(id)
      setSpxMessage(`SPX user_id ${account.userId} hợp lệ.`)
      await refreshSpxAccounts()
    } catch (error) {
      setSpxError(getErrorMessage(error))
    } finally {
      setSpxSaving(false)
    }
  }

  const activateSpxAccount = async (id: string) => {
    setSpxSaving(true)
    setSpxMessage('')
    setSpxError('')
    try {
      const account = await integrationService.activateSpxAccount(id)
      setSpxMessage(`Đã chọn SPX user_id ${account.userId} làm tài khoản active.`)
      await refreshSpxAccounts()
    } catch (error) {
      setSpxError(getErrorMessage(error))
    } finally {
      setSpxSaving(false)
    }
  }

  const columns: ColumnDef<IntegrationLog>[] = [
    {
      accessorKey: 'integration',
      header: 'Hệ thống',
      cell: ({ row }) => {
        const names: Record<string, string> = {
          best: 'BEST Express',
          google_sheet: 'Google Sheet',
          pancake: 'Pancake',
          spx: 'SPX',
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

  const spxShipmentColumns: ColumnDef<SpxShipmentListItem>[] = [
    {
      accessorKey: 'orderCode',
      header: 'Đơn hàng',
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.orderId}`} className="font-mono text-sm font-semibold text-primary hover:underline">
          {row.original.orderCode}
        </Link>
      ),
    },
    {
      accessorKey: 'trackingNo',
      header: 'Mã vận đơn',
      cell: ({ row }) => {
        if (!row.original.trackingNo) {
          return <span className="text-xs text-muted-foreground">Chưa có</span>
        }
        return row.original.trackingLink ? (
          <a
            href={row.original.trackingLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-primary hover:underline"
          >
            {row.original.trackingNo}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="font-mono text-sm font-semibold">{row.original.trackingNo}</span>
        )
      },
    },
    {
      accessorKey: 'recipientName',
      header: 'Người nhận',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm font-medium">{row.original.recipientName}</p>
          <PhoneMask phone={row.original.recipientPhone} />
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái SPX',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm">{row.original.status ?? 'Chưa có trạng thái'}</p>
          {row.original.statusCode ? <p className="font-mono text-xs text-muted-foreground">{row.original.statusCode}</p> : null}
        </div>
      ),
    },
    {
      accessorKey: 'actualShippingFee',
      header: 'Phí SPX',
      cell: ({ row }) => {
        const amount = row.original.actualShippingFee ?? row.original.estimatedShippingFee
        return amount === null ? <span className="text-xs text-muted-foreground">Chưa có</span> : <MoneyDisplay amount={amount} />
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Cập nhật',
      cell: ({ row }) => <span className="text-xs">{formatVietnameseDateTimeWithDay(row.original.updatedAt)}</span>,
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
      <div className="grid gap-4 md:grid-cols-4">
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
        <MetricCard
          label="SPX"
          value={status.spx === 'degraded' ? 'Cần kiểm tra' : status.spx === 'connected' ? 'Kết nối' : 'Chưa có dữ liệu'}
          variant={status.spx === 'degraded' ? 'warning' : status.spx === 'connected' ? 'success' : 'default'}
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

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <KeyRound className="h-5 w-5" />
              Tài khoản SPX
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo user_id và user_secret bằng API SPX, sau đó hệ thống lưu secret đã mã hóa để worker tạo vận đơn.
            </p>
          </div>
          {activeSpxAccount ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Active: <span className="font-mono">{activeSpxAccount.userId}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,260px)_auto]">
          <Input
            placeholder="Số điện thoại SPX"
            value={spxPhone}
            onChange={(event) => {
              setSpxPhone(event.target.value)
            }}
          />
          <Input
            placeholder="Email tùy chọn"
            value={spxEmail}
            onChange={(event) => {
              setSpxEmail(event.target.value)
            }}
          />
          <Button
            disabled={spxSaving || spxPhone.trim().length < 8}
            onClick={() => {
              void createSpxAccount()
            }}
          >
            Tạo tài khoản SPX
          </Button>
        </div>

        {spxMessage ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {spxMessage}
          </p>
        ) : null}
        {spxError ? (
          <div className="mt-3 flex gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="whitespace-pre-wrap">{spxError}</p>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {spxAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có tài khoản SPX nào được lưu.</p>
          ) : (
            spxAccounts.map((account) => (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{account.phone}</span>
                    {account.email ? <span className="text-muted-foreground">{account.email}</span> : null}
                    {account.isActive ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">user_id: {account.userId}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verify: {account.verifiedAt ? formatVietnameseDateTimeWithDay(account.verifiedAt) : 'Chưa xác thực'}
                  </p>
                  {account.lastError ? <p className="mt-1 text-xs text-rose-700">{account.lastError}</p> : null}
                </div>
                <div className="flex gap-2">
                  {!account.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={spxSaving}
                      onClick={() => {
                        void activateSpxAccount(account.id)
                      }}
                    >
                      Đặt active
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={spxSaving}
                    onClick={() => {
                      void verifySpxAccount(account.id)
                    }}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Đơn đã tạo ở SPX</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi mã vận đơn, trạng thái giao hàng và phí SPX đã lưu trong hệ thống.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              void refreshSpxShipments()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : (
          <DataTable columns={spxShipmentColumns} data={spxShipments} pageSize={10} />
        )}
      </div>

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
