'use client'

import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { MetricCard } from '@/components/shared/MetricCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, ShoppingCart, Users, AlertCircle, BarChart3 } from 'lucide-react'
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
        // Dashboard cards keep their zero state if the mock API is unavailable.
      }
    }

    void loadStats()
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tổng quan</h1>
        <p className="mt-1 text-muted-foreground">Xem tóm tắt hoạt động của cửa hàng</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Đơn hôm nay"
          value={stats.todayOrders}
          icon="📦"
          variant={stats.todayOrders > 0 ? 'primary' : 'default'}
        />
        <MetricCard
          label="Doanh thu hôm nay"
          value={formatVND(stats.todayRevenue)}
          icon="💰"
          variant="success"
        />
        <MetricCard
          label="Khách ưu đãi"
          value={stats.eligibleUsers}
          icon="👥"
          variant="default"
        />
        <MetricCard
          label="Đơn chờ xác nhận"
          value={stats.pendingOrders}
          icon="⏳"
          variant={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Đồng bộ thất bại"
          value={stats.failedSyncs}
          icon="⚠️"
          variant={stats.failedSyncs > 0 ? 'error' : 'default'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Thao tác nhanh</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Button variant="outline" className="flex flex-col h-auto py-4">
                <ShoppingCart className="h-5 w-5 mb-2" />
                <span className="text-xs">Tạo đơn</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4">
                <Users className="h-5 w-5 mb-2" />
                <span className="text-xs">Nhập khách</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4">
                <TrendingUp className="h-5 w-5 mb-2" />
                <span className="text-xs">Báo cáo</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4">
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="text-xs">Thống kê</span>
              </Button>
            </div>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Hoạt động gần đây</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                  <p className="text-sm text-foreground">Đơn hàng ORD{String(i).padStart(6, '0')} được tạo</p>
                  <span className="text-xs text-muted-foreground ml-auto">2 giờ trước</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Trạng thái hệ thống</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Google Sheet</span>
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Pancake</span>
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">BEST Express</span>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          {stats.failedSyncs > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Có {stats.failedSyncs} đồng bộ thất bại</p>
                  <p className="text-xs text-amber-800 mt-1">Nhấn Retry để thử lại</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
