'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { PhoneMask } from '@/components/shared/PhoneMask'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, FileUp, Save, X } from 'lucide-react'
import { EligibleCustomer } from '@/lib/types'
import { eligibleCustomerService, getErrorMessage } from '@/lib/services/api-service'
import { formatVietnameseDate } from '@/lib/utils/vietnamese'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<EligibleCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newSourceCustomerId, setNewSourceCustomerId] = useState('')
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await eligibleCustomerService.getCustomers()
        setCustomers(data)
      } catch (e) {
        console.error('Failed to load customers:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadCustomers()
  }, [])

  const filteredCustomers = customers.filter((c) => c.phone.includes(searchTerm))

  const handleCreateCustomer = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    void createCustomer()
  }

  const createCustomer = async () => {
    setSavingCustomer(true)
    setCustomerError('')
    setCustomerMessage('')

    try {
      const created = await eligibleCustomerService.createCustomer({
        eligibilityReason: 'manual',
        phone: newPhone,
        sourceCustomerId: newSourceCustomerId.trim() || undefined,
      })
      setCustomers((current) => [created, ...current.filter((customer) => customer.id !== created.id)])
      setNewPhone('')
      setNewSourceCustomerId('')
      setShowAddForm(false)
      setCustomerMessage('Đã thêm khách ưu đãi.')
    } catch (error) {
      setCustomerError(getErrorMessage(error))
    } finally {
      setSavingCustomer(false)
    }
  }

  const columns: ColumnDef<EligibleCustomer>[] = [
    {
      accessorKey: 'phone',
      header: 'Số điện thoại',
      cell: ({ row }) => <PhoneMask phone={row.original.phone} />,
    },
    {
      accessorKey: 'source',
      header: 'Nguồn',
      cell: ({ row }) => {
        const sources: Record<string, string> = {
          manual: 'Thủ công',
          excel: 'Excel',
          google_sheet: 'Google Sheet',
          pancake: 'Pancake',
          best: 'BEST Express',
        }
        return <span className="text-sm">{sources[row.original.source]}</span>
      },
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ row }) => <span className="text-sm">{row.original.reason}</span>,
    },
    {
      accessorKey: 'usageCount',
      header: 'Đã dùng / Giới hạn',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.usageCount}/{row.original.usageLimit}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold text-foreground">
          <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true"></span>
          {row.original.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
        </span>
      ),
    },
    {
      accessorKey: 'importedAt',
      header: 'Ngày nhập',
      cell: ({ row }) => <span className="text-sm">{formatVietnameseDate(row.original.importedAt)}</span>,
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Khách ưu đãi' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Khách hàng ưu đãi</h1>
          <p className="mt-1 text-muted-foreground">Quản lý danh sách khách hàng được hưởng ưu đãi 25,000 ₫</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/customers/import">
            <Button variant="outline" className="gap-2">
              <FileUp className="h-4 w-4" />
              Nhập danh sách
            </Button>
          </Link>
          <Button
            className="gap-2"
            onClick={() => {
              setShowAddForm((value) => !value)
              setCustomerError('')
              setCustomerMessage('')
            }}
          >
            <Plus className="h-4 w-4" />
            Thêm khách
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={handleCreateCustomer}>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Số điện thoại</Label>
              <Input
                id="customer-phone"
                placeholder="0901234567"
                value={newPhone}
                onChange={(event) => {
                  setNewPhone(event.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-source-id">Mã khách/Nguồn</Label>
              <Input
                id="customer-source-id"
                placeholder="CRM-1001"
                value={newSourceCustomerId}
                onChange={(event) => {
                  setNewSourceCustomerId(event.target.value)
                }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="gap-2" disabled={savingCustomer}>
                <Save className="h-4 w-4" />
                {savingCustomer ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowAddForm(false)
                  setCustomerError('')
                }}
                aria-label="Đóng form thêm khách"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      {customerMessage && <p className="text-sm font-medium text-emerald-700">{customerMessage}</p>}
      {customerError && <p className="text-sm font-medium text-rose-700">{customerError}</p>}

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm kiếm theo số điện thoại..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : (
        <DataTable columns={columns} data={filteredCustomers} pageSize={15} />
      )}
    </div>
  )
}
