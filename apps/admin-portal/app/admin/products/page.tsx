'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { DataTable } from '@/components/shared/DataTable'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Product } from '@/lib/types'
import { productService } from '@/lib/services/api-service'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await productService.getProducts()
        setProducts(data)
      } catch (e) {
        console.error('Failed to load products:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadProducts()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.sku}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Tên sản phẩm',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.shortDescription}</p>
        </div>
      ),
    },
    {
      accessorKey: 'listedPrice',
      header: 'Giá gốc',
      cell: ({ row }) => <MoneyDisplay amount={row.original.listedPrice} />,
    },
    {
      accessorKey: 'discountAmount',
      header: 'Giảm giá ưu đãi',
      cell: ({ row }) => (
        row.original.discountAmount > 0 ? (
          <span className="text-primary font-semibold">
            -{row.original.discountAmount.toLocaleString('vi-VN')} ₫
          </span>
        ) : (
          <span className="text-muted-foreground">Không</span>
        )
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Tồn kho',
      cell: ({ row }) => (
        <span className={(row.original.stock ?? 0) > 20 ? 'text-green-600' : 'text-amber-600'}>
          {row.original.stock ?? 'Chưa cấu hình'}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge
          type="order"
          status={row.original.isActive ? 'confirmed' : 'cancelled'}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/admin/products/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              if (window.confirm('Ẩn sản phẩm này? Sản phẩm có đơn sẽ không bị xóa cứng.')) {
                void productService.deleteProduct(row.original.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Sản phẩm' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sản phẩm</h1>
          <p className="mt-1 text-muted-foreground">Quản lý danh sách sản phẩm của cửa hàng</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm kiếm theo tên hoặc SKU..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); }}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
      ) : (
        <DataTable columns={columns} data={filteredProducts} pageSize={15} />
      )}
    </div>
  )
}
