'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { MetricCard } from '@/components/shared/MetricCard'
import { Card } from '@/components/ui/card'
import { AlertCircle, ArrowRight, BarChart3, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { dashboardService } from '@/lib/services/api-service'
import { formatVND } from '@/lib/utils/vietnamese'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    eligibleUsers: 0,
    pendingOrders: 0,
    failedSyncs: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardService.getStats()
        setStats(data)
      } catch (e) {
        console.error('Failed to load stats:', e)
      } finally {
        // Dashboard cards keep their zero state if the API is unavailable.
      }
    }

    void loadStats()
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={[{ label: 'Tổng quan' }]} />

      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tổng quan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn hàng, khách ưu đãi và trạng thái vận hành.</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-ring"
        >
          Xem đơn hàng
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Đơn hôm nay"
          value={stats.todayOrders}
          icon={<Package className="h-4 w-4" />}
          variant={stats.todayOrders > 0 ? 'primary' : 'info'}
        />
        <MetricCard
          label="Doanh thu hôm nay"
          value={formatVND(stats.todayRevenue)}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <MetricCard
          label="Khách ưu đãi"
          value={stats.eligibleUsers}
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
        <MetricCard
          label="Đơn chờ xác nhận"
          value={stats.pendingOrders}
          icon={<ShoppingCart className="h-4 w-4" />}
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Thao tác nhanh</h2>
                <p className="mt-1 text-sm text-muted-foreground">Đi tới các luồng vận hành dùng thường xuyên.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickAction href="/admin/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Xử lý đơn hàng" />
              <QuickAction
                href="/admin/customers/import"
                icon={<Users className="h-4 w-4" />}
                label="Nhập khách ưu đãi"
                tone="emerald"
              />
              <QuickAction
                href="/admin/products/new"
                icon={<Package className="h-4 w-4" />}
                label="Thêm sản phẩm"
                tone="violet"
              />
              <QuickAction href="/admin/reports" icon={<BarChart3 className="h-4 w-4" />} label="Xem báo cáo" tone="amber" />
            </div>
          </Card> 

          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground">Việc cần chú ý</h2>
            <div className="mt-4 divide-y">
              <StatusRow
                href="/admin/orders"
                label="Đơn chờ xác nhận"
                value={`${stats.pendingOrders} đơn`}
                tone={stats.pendingOrders > 0 ? 'warning' : 'default'}
              />
              <StatusRow
                href="/admin/sync"
                label="Đồng bộ cần kiểm tra"
                value={`${stats.failedSyncs} job`}
                tone={stats.failedSyncs > 0 ? 'warning' : 'default'}
              />
              <StatusRow href="/admin/customers" label="Khách ưu đãi đang lưu" value={`${stats.eligibleUsers} khách`} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground">Trạng thái hệ thống</h2>
            <div className="mt-4 space-y-3">
              {[
                ['API', 'Đang hoạt động'],
                ['Database', 'Đang hoạt động'],
                ['Admin Portal', 'Đang hoạt động'],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-sm text-foreground">{label}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-foreground" aria-hidden="true"></span>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-foreground">Kiểm tra định kỳ</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Xem lại cấu hình Google Sheet và upload ảnh trước các đợt chạy khuyến mãi.
                </p>
              </div>
            </div>
          </Card> 
        </div>
      </div>
    </div>
  )
}

const quickActionToneStyles = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
}

function QuickAction({
  href,
  icon,
  label,
  tone = 'sky',
}: {
  href: string
  icon: React.ReactNode
  label: string
  tone?: keyof typeof quickActionToneStyles
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between gap-3 rounded-md border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:outline-ring"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${quickActionToneStyles[tone]}`} aria-hidden="true">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

function StatusRow({
  href,
  label,
  tone = 'default',
  value,
}: {
  href: string
  label: string
  tone?: 'default' | 'warning'
  value: string
}) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-foreground">
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`size-2 shrink-0 rounded-full ${tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
          aria-hidden="true"
        ></span>
        <span className="truncate text-foreground">{label}</span>
      </span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{value}</span>
    </Link>
  )
}
