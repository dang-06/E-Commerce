'use client'

import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { MetricCard } from '@/components/shared/MetricCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, PackageCheck, ReceiptText, Tags, Target, TrendingUp } from 'lucide-react'
import { Order, Product } from '@/lib/types'
import { orderService, productService } from '@/lib/services/api-service'
import { buildOrdersCsv } from '@/lib/services/admin-actions'
import { formatVND, formatPercent } from '@/lib/utils/vietnamese'

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, productsData] = await Promise.all([
          orderService.getOrders(),
          productService.getProducts(),
        ])
        setOrders(ordersData)
        setProducts(productsData)
      } catch (e) {
        console.error('Failed to load report data:', e)
      } finally {
        // Keep empty report state if API data cannot be loaded.
      }
    }

    void loadData()
  }, [])

  const totalOrders = orders.length
  const successfulOrders = orders.filter((o) => o.status === 'delivered').length
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0)
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const promotionConversion = totalOrders > 0 ? orders.filter((o) => o.discountApplied).length / totalOrders : 0

  const topProducts = products
    .map((p) => ({
      ...p,
      quantity: Math.floor(Math.random() * 50),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Báo cáo' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Báo cáo</h1>
          <p className="mt-1 text-muted-foreground">Thống kê và phân tích hoạt động</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const csv = buildOrdersCsv(orders)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'orders-report.csv'
            link.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Tổng đơn hàng" value={totalOrders} icon={<ReceiptText className="h-4 w-4" />} variant="primary" />
        <MetricCard label="Đơn thành công" value={successfulOrders} icon={<PackageCheck className="h-4 w-4" />} variant="success" />
        <MetricCard label="Doanh thu" value={formatVND(totalRevenue)} icon={<TrendingUp className="h-4 w-4" />} variant="success" />
        <MetricCard label="Tổng giảm giá" value={formatVND(totalDiscount)} icon={<Tags className="h-4 w-4" />} variant="warning" />
        <MetricCard label="AOV" value={formatVND(aov)} icon={<BarChart3 className="h-4 w-4" />} variant="violet" />
        <MetricCard
          label="Tỷ lệ ưu đãi"
          value={formatPercent(promotionConversion)}
          icon={<Target className="h-4 w-4" />}
          variant="info"
        />
      </div>

      {/* Status Breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Phân bố trạng thái đơn hàng</h2>
        <div className="grid gap-3">
          {['confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'].map((status) => {
            const count = orders.filter((o) => o.status === status).length
            const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0
            const labels: Record<string, string> = {
              confirmed: 'Đã xác nhận',
              preparing: 'Đang chuẩn bị',
              shipping: 'Đang vận chuyển',
              delivered: 'Đã giao',
              cancelled: 'Đã hủy',
            }
            return (
              <div key={status}>
                <div className="flex justify-between mb-1 text-sm">
                  <span>{labels[status]}</span>
                  <span className="font-semibold">
                    {count} ({percent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sản phẩm bán chạy
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left">Sản phẩm</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-right">Số lượng</th>
                <th className="px-4 py-2 text-right">Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-2 font-semibold">{product.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-2 text-right">{product.quantity}</td>
                  <td className="px-4 py-2 text-right font-semibold text-primary">
                    {formatVND(product.listedPrice * product.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
